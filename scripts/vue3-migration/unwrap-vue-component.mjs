// Removes the global registration of components ahead of Vue 3 (phase 2 of the registration codemods).
// Run it from the repo root, after `register-components` has registered every tag locally:
//
//   npm run codemod:unwrap-vue-component -- --dry-run        # report only
//   npm run codemod:unwrap-vue-component                     # write the changes
//   npm run codemod:unwrap-vue-component -- --root <dir>     # another checkout (a portal branch)
//
// `export default Vue.component("name", { ... })` registers the component globally and exports its
// constructor. Vue 3's compat build treats `Vue.component` differently, and once every file registers
// what it uses (`register-components.mjs`), the global registration is dead weight. This turns the call
// into `export default { name: "name", ... }`, removes the alias statements `Vue.component("name",
// Identifier);`, and drops `import Vue from "vue"` where nothing else uses `Vue`.
//
// What changes, per file (`unwrapSource`):
//   - `Vue.component(id, def)` in Vue 2 sets `def.name = def.name || id`, so a missing `name` is added as
//     the first property (`name: "id",`), an equal `name` is left, and a different one is kept and noted
//     `name-mismatch` (the runtime already used it).
//   - An alias statement is removed with its line. One whose result is used (assigned, exported, inside a
//     function) is left alone and noted `alias-in-use`.
//   - `import Vue from "vue"` goes when no other `Vue` reference is left in the script (found with the
//     Babel AST: a comment, a string, `this.Vue` and `{ Vue: 1 }` are not references). The other
//     specifiers of `import Vue, { x } from "vue"` stay. A file with nothing to unwrap keeps its import.
//   - Every change is a text splice; bytes outside the splices stay as they were, and inserted lines use
//     the file's indentation (`register-write.mjs`) and line ending.
//
// Ruling R2: phase 2 must not start before phase 1 is complete. `run` lints the tree (`undefinedTags`),
// plans the registrations as `register-components` does, and writes only when every finding is a `self`
// entry (a recursive component naming itself). Otherwise the report says why, nothing is written and the
// exit code is 1, a dry run included. The report is markdown on stdout: totals, the phase 1 check, the
// notes per file, failures, analysis errors, a lint failure, and the files changed (or, in a dry run, the
// files that would change).
//
//   - A changed file is parsed again before it is written (ruling R7a, as `register-components`): no SFC
//     error the original did not already have, and every script block through Babel without error
//     recovery. A file that fails, or that has a shape the codemod will not guess at (a comment inside the
//     call, a definition that is not exported, a `<script setup>`), is listed under Failed and not written.
//   - Errors found while scanning the tree and a failed lint block every write: the phase 1 check relies
//     on them.
//   - Files with nothing to change are never touched. A second run changes nothing.
//
// ESLint plugins resolve from this repo, so `--root` may be a checkout without `node_modules`.
//
// Exit codes: 0 done, 1 phase 1 is incomplete, a file failed, the scan had errors or the lint failed,
// 2 usage error.
import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { analyzeSources, isLookup, isVueComponentCall, pageEntries, readSources, scriptSetupFiles, walk } from './component-graph.mjs';
import { analysisErrorLine, assertParses, cell, code, failure, hasSrc, oneLine, parseArgs, parseStrict } from './register-components.mjs';
import { REASONS, planRegistrations, undefinedTags } from './register-plan.mjs';
import { addFirstProperty, byCodeUnit, indentUnit, isBlank, keyName, soleScript, splice } from './register-write.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/unwrap-vue-component.mjs [--dry-run] [--root <dir>]';
// What the report shows for a figure that needs the lint step, when that step failed.
const NOT_AVAILABLE = 'n/a';
const NOT_COMPUTED = 'Not computed: the lint step failed.';
// How many findings that block the run the report lists (the totals count them all).
const LISTED = 20;

/** Every note `unwrapSource` can give, in the order the report lists them. */
const NOTES = ['name-mismatch', 'alias-in-use'];
const NOTE_MEANING = {
  'name-mismatch': 'the component already has a `name` that is not its id; it is kept, as Vue 2 used it already.',
  'alias-in-use': 'the result of `Vue.component("id", Identifier)` is used, so the call is left in place.',
};

/**
 * Why a finding blocks the run, in report order: `unregistered` is a tag the registration planner can
 * place (phase 1 has not written it yet); the others are the planner's own reasons, `self` aside.
 */
const BLOCKING_REASONS = ['unregistered', ...REASONS.filter((reason) => reason !== 'self')];

const emptyCounts = () => ({ unwrapped: 0, namesInserted: 0, aliasesRemoved: 0, importsRemoved: 0 });

/**
 * What the text of `text` needs to remove `node` (a statement): its whole line, line break included, when
 * nothing else is on it, else the statement alone.
 */
function statementRemoval(text, node) {
  const lineStart = text.lastIndexOf('\n', node.start - 1) + 1;
  const lineBreak = text.indexOf('\n', node.end);
  const lineEndAt = lineBreak === -1 ? text.length : lineBreak;
  if (isBlank(text.slice(lineStart, node.start)) && isBlank(text.slice(node.end, lineEndAt))) {
    return { start: lineStart, end: lineBreak === -1 ? text.length : lineBreak + 1, text: '' };
  }
  return { start: node.start, end: node.end, text: '' };
}

/**
 * Whether the script refers to `name` anywhere but at `binding`, the import's own identifier. Only a
 * member name (`this.Vue`) and a non-computed property or method name (`{ Vue: 1 }`, `Vue() {}`) are not
 * references; any other `Vue` counts, a shadowing declaration too, since an import kept wrongly is
 * harmless and one dropped wrongly is not.
 */
function isReferenced(program, name, binding) {
  let found = false;
  walk(program, (node, parent) => {
    if (found || node === binding || (node.type !== 'Identifier' && node.type !== 'JSXIdentifier') || node.name !== name) return;
    const isMemberName = parent?.property === node && !parent.computed;
    const isKey = parent?.key === node && !parent.computed && !parent.shorthand;
    if (!isMemberName && !isKey) found = true;
  });
  return found;
}

/** The edit that removes `import Vue from "vue"` (or just its default specifier), or null when `Vue` is still used. */
function vueImportRemoval(text, parseText) {
  const ast = parseText(text);
  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration' || node.source.value !== 'vue') continue;
    const specifier = node.specifiers.find(({ type, local }) => type === 'ImportDefaultSpecifier' && local.name === 'Vue');
    if (!specifier) continue;
    if (isReferenced(ast.program, 'Vue', specifier.local)) return null;
    if (node.specifiers.length === 1) return statementRemoval(text, node);
    // `Vue, { x }`: the default specifier and its comma go. A comment in between is left to a person.
    const comma = /\s*,\s*/y;
    comma.lastIndex = specifier.end;
    return comma.test(text) ? { start: specifier.start, end: comma.lastIndex, text: '' } : null;
  }
  return null;
}

/**
 * The unwrapped text of one script (`raw`), with the notes and counts. `startLine` is the line of the file
 * that `raw` starts on, for messages. `fail` throws.
 */
function unwrapScript(raw, eol, startLine, fail) {
  const parseText = (text, what = 'the <script>') => {
    try {
      return parseStrict(text);
    } catch (error) {
      return fail(`${what} does not parse: ${error.message}`);
    }
  };
  const ast = parseText(raw);
  const { body } = ast.program;
  const where = (node) => `line ${node.loc.start.line + startLine - 1}`;
  const inComment = (from, to) => ast.comments.some((comment) => comment.start >= from && comment.end <= to);
  const edits = [];
  const notes = [];
  const counts = emptyCounts();

  walk(ast.program, (node, parent) => {
    if (node.type !== 'CallExpression' || !isVueComponentCall(node) || isLookup(node)) return;
    const [id, component, ...rest] = node.arguments;
    if (id?.type !== 'StringLiteral' || !component || rest.length > 0) {
      fail(`${where(node)}: \`Vue.component(...)\` needs a string literal and a component, and nothing else`);
    }

    if (component.type === 'Identifier') {
      if (parent.type === 'ExpressionStatement' && body.includes(parent)) {
        edits.push(statementRemoval(raw, parent));
        counts.aliasesRemoved++;
      } else {
        notes.push('alias-in-use');
      }
      return;
    }
    if (component.type !== 'ObjectExpression' || parent.type !== 'ExportDefaultDeclaration') {
      fail(`${where(node)}: \`Vue.component("${id.value}", ...)\` is not \`export default Vue.component("name", { ... })\` or an alias statement`);
    }

    // The wrapper is the text before and after the options object.
    if (inComment(node.start, component.start) || inComment(component.end, node.end)) {
      fail(`${where(node)}: a comment inside \`Vue.component(...)\` would be deleted with the wrapper; move it out first`);
    }
    edits.push({ start: node.start, end: component.start, text: '' }, { start: component.end, end: node.end, text: '' });
    counts.unwrapped++;

    const name = component.properties.filter((property) => keyName(property) === 'name').at(-1);
    if (name === undefined) {
      const lines = (indent) => `${indent}name: ${JSON.stringify(id.value)},`;
      edits.push(addFirstProperty(raw, component, lines, indentUnit(raw, component), eol));
      counts.namesInserted++;
    } else if (name.type !== 'ObjectProperty' || name.value.type !== 'StringLiteral' || name.value.value !== id.value) {
      notes.push('name-mismatch');
    }
  });

  if (edits.length === 0) return { text: raw, changed: false, notes, counts };
  let text = splice(raw, edits);
  // `Vue` is looked for in the unwrapped text, so the references the edits removed do not count.
  const removal = vueImportRemoval(text, (changed) => parseText(changed, 'the unwrapped <script>'));
  if (removal) {
    text = splice(text, [removal]);
    counts.importsRemoved = 1;
  }
  return { text, changed: true, notes, counts };
}

/**
 * Unwraps the `Vue.component` registrations of one file.
 *
 *  - `export default Vue.component("id", { ... })` becomes `export default { name: "id", ... }`: the call
 *    around the options goes, and `name: "id",` is inserted as the first property unless there is a
 *    `name` already (equal: left; different, or not a string literal: kept and noted `name-mismatch`).
 *  - A statement `Vue.component("id", Identifier);` is removed with its line. An alias whose result is
 *    used (assigned, exported, in a function) stays and is noted `alias-in-use`.
 *  - `import Vue from "vue"` is removed when, after those edits, no other `Vue` reference is left in
 *    the script; `import Vue, { x } from "vue"` loses only its default specifier. Only a file that had
 *    something to unwrap is considered.
 *  - `Vue.component("id")` with one argument looks a component up and is left alone.
 *
 * A file without `Vue.component` is returned as it is without being parsed. `file` (relative to the repo
 * root; a name ending in `.js` is a plain script, anything else an SFC) names the file in messages.
 * Throws an `Error` that starts with `<file>: ` for a shape it will not guess at: a comment inside the
 * call (it would be deleted), a `Vue.component` call that is neither of the forms above, a call that is
 * not well formed, a `<script setup>`, a second or a `src` `<script>`, a script that does not parse.
 *
 * `notes` has one entry per occurrence, in source order, also when the file does not change.
 * @param {string} source the file's text
 * @param {string} [file]
 * @returns {{ source: string, changed: boolean, notes: string[],
 *   counts: { unwrapped: number, namesInserted: number, aliasesRemoved: number, importsRemoved: number } }}
 */
export function unwrapSource(source, file = '<source>') {
  const unchanged = (notes = []) => ({ source, changed: false, notes, counts: emptyCounts() });
  if (!/\bVue\s*\.\s*component\b/.test(source)) return unchanged();
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  const firstBreak = source.indexOf('\n');
  const eol = firstBreak > 0 && source[firstBreak - 1] === '\r' ? '\r\n' : '\n';

  let start = 0;
  let end = source.length;
  if (!file.endsWith('.js')) {
    const script = soleScript(source, parseSfc({ source, filename: file }), fail);
    if (!script) return unchanged();
    ({ start, end } = script);
  }
  const result = unwrapScript(source.slice(start, end), eol, source.slice(0, start).split('\n').length, fail);
  if (!result.changed) return unchanged(result.notes);
  return { source: source.slice(0, start) + result.text + source.slice(end), changed: true, notes: result.notes, counts: result.counts };
}

/**
 * Ruling R2: is phase 1 complete? Every finding of the lint (`uses`) must be an unresolved entry of the
 * plan with the reason `self`. A finding that is not in `plan.unresolved` is covered by an entry in
 * `plan.edits`, a registration phase 1 has not written yet: it is `unregistered`.
 * @returns {{ findings: number, blocking: { file: string, line: number, tag: string, reason: string }[] }}
 */
function phaseOneCheck(uses, plan) {
  const reasons = new Map(plan.unresolved.map(({ file, line, tag, reason }) => [`${file}\0${line}\0${tag}`, reason]));
  let findings = 0;
  const blocking = [];
  for (const [file, list] of uses) {
    for (const { tag, line } of list) {
      findings++;
      const reason = reasons.get(`${file}\0${line}\0${tag}`) ?? 'unregistered';
      if (reason !== 'self') blocking.push({ file, line, tag, reason });
    }
  }
  blocking.sort((a, b) => byCodeUnit(a.file, b.file) || a.line - b.line || byCodeUnit(a.tag, b.tag));
  return { findings, blocking };
}

/** The Phase 1 check section of the report, as lines. */
function renderPhaseOneCheck({ check, lintError, dryRun }) {
  if (lintError !== null) return [NOT_COMPUTED];
  const { findings, blocking } = check;
  if (blocking.length === 0) {
    if (findings === 0) return ['Complete: no template uses an undefined component tag.'];
    return ['Complete: every undefined-tag finding is a self-reference (a recursive component naming itself).'];
  }
  const lines = [
    'Refused: phase 1 is not complete.',
    `Undefined-tag findings that are not self-references: ${blocking.length} of ${findings}.`,
    'Run `npm run codemod:register-components` for the ones it can place and settle the rest by hand.',
    dryRun ? 'A real run would write nothing.' : 'Nothing was written.',
    '',
    '| Reason | Findings |',
    '| --- | ---: |',
  ];
  for (const reason of BLOCKING_REASONS) {
    const count = blocking.filter((item) => item.reason === reason).length;
    if (count > 0) lines.push(`| ${reason} | ${count} |`);
  }
  lines.push('', '| file:line | tag | reason |', '| --- | --- | --- |');
  for (const { file, line, tag, reason } of blocking.slice(0, LISTED)) {
    lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(tag))} | ${reason} |`);
  }
  if (blocking.length > LISTED) lines.push('', `... and ${blocking.length - LISTED} more.`);
  return lines;
}

function renderReport({ dryRun, writing, check, lintError, changes, written, notes, failures, analysisErrors }) {
  const total = (key) => changes.reduce((sum, { counts }) => sum + counts[key], 0);
  const noteCount = (kind) => notes.reduce((sum, { counts }) => sum + (counts.get(kind) ?? 0), 0);
  const lines = [
    `# Unwrap Vue.component${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Files to change | ${changes.length} |`,
    `| Components unwrapped | ${total('unwrapped')} |`,
    `| Names inserted | ${total('namesInserted')} |`,
    `| Alias statements removed | ${total('aliasesRemoved')} |`,
    `| Vue imports removed | ${total('importsRemoved')} |`,
    `| Notes | ${NOTES.reduce((sum, kind) => sum + noteCount(kind), 0)} |`,
  ];
  for (const kind of NOTES) {
    if (noteCount(kind) > 0) lines.push(`| Notes: ${kind} | ${noteCount(kind)} |`);
  }
  lines.push(
    `| Undefined-tag findings | ${lintError === null ? check.findings : NOT_AVAILABLE} |`,
    `| Not self-references | ${lintError === null ? check.blocking.length : NOT_AVAILABLE} |`,
  );

  lines.push('', '## Phase 1 check', '', ...renderPhaseOneCheck({ check, lintError, dryRun }));

  lines.push('', '## Notes', '');
  if (notes.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| file | note | count |', '| --- | --- | ---: |');
    for (const { file, counts } of notes) {
      for (const kind of NOTES) {
        if (counts.has(kind)) lines.push(`| ${cell(code(file))} | ${kind} | ${counts.get(kind)} |`);
      }
    }
    lines.push('');
    for (const kind of NOTES) {
      if (noteCount(kind) > 0) lines.push(`- ${kind}: ${NOTE_MEANING[kind]}`);
    }
  }

  if (failures.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failures) lines.push(`- ${code(file)}: ${message}`);
  }

  if (analysisErrors.length > 0) {
    lines.push('', '## Analysis errors', '');
    for (const error of analysisErrors) lines.push(analysisErrorLine(error));
    if (!dryRun) lines.push('', 'Nothing was written: the phase 1 check relies on what the scan found.');
  }

  if (lintError !== null) {
    lines.push('', '## Lint failed', '', 'ESLint could not lint the tree, so the phase 1 check could not be made:', '', `- ${lintError}`);
    if (!dryRun) lines.push('', 'Nothing was written.');
  }

  lines.push('', writing ? '## Changed files' : '## Files that would change', '');
  const files = writing ? written : changes.map(({ file }) => file);
  if (files.length === 0) lines.push('None.');
  for (const file of files) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * What unwrapping would do to every file of `sources` (path -> text, see `readSources`), without writing
 * anything and without the phase 1 check of ruling R2: the lint is not run, so this is the count to
 * expect once phase 1 is complete, not a statement that the run would be allowed.
 *
 *  - `changes`: one per file that would change, `{ file, source, counts }` (`source` is its new text);
 *  - `notes`: the files that have notes, `{ file, counts }` (`counts` is a Map from note to occurrences);
 *  - `failures`: files the codemod refuses (a shape it will not guess at) or whose unwrapped text does
 *    not parse again, in file order, each `{ file, message }` without a leading `<file>: `.
 *
 * `unwrap(source, file)` defaults to `unwrapSource`; it is a seam for tests.
 * @param {Map<string, string>} sources
 * @param {{ unwrap?: typeof unwrapSource }} [deps]
 */
export function analyzePhaseTwo(sources, { unwrap = unwrapSource } = {}) {
  const changes = [];
  const notes = [];
  const failures = [];
  for (const [file, before] of sources) {
    try {
      const result = unwrap(before, file);
      if (result.notes.length > 0) {
        const counts = new Map();
        for (const kind of result.notes) counts.set(kind, (counts.get(kind) ?? 0) + 1);
        notes.push({ file, counts });
      }
      if (!result.changed) continue;
      assertParses(file, before, result.source);
      changes.push({ file, source: result.source, counts: result.counts });
    } catch (error) {
      failures.push(failure(file, error));
    }
  }
  return { changes, notes, failures };
}

/**
 * Unwraps the `Vue.component` registrations of the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)`,
 * `unwrap(source, file)` and `lint(root)` default to `fs.writeFileSync`, `unwrapSource` and
 * `undefinedTags`; they are seams for tests. The report goes to `out`, usage errors and a one-line
 * summary of what failed go to `err`.
 *
 * Nothing is written, and the exit code is 1 (a dry run too), unless phase 1 is complete (ruling R2:
 * every finding of `undefinedTags` is a `self` entry of `planRegistrations`), the scan has no errors and
 * the lint worked. Does not reject when ESLint cannot lint the tree: that is a Lint failed section.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, unwrap?: typeof unwrapSource,
 *   lint?: typeof undefinedTags, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const {
    root: defaultRoot = repoRoot,
    write = writeFileSync,
    unwrap = unwrapSource,
    lint = undefinedTags,
    out = process.stdout,
    err = process.stderr,
  } = deps;

  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  const root = resolve(options.root ?? defaultRoot);
  if (!hasSrc(root)) {
    err.write(`${root} is not a directory with a src/ folder\n${USAGE}\n`);
    return 2;
  }

  const sources = readSources(root);
  const { registrations, imports, errors: analysisErrors } = analyzeSources(sources);
  let uses = new Map();
  let lintError = null;
  try {
    uses = await lint(root);
  } catch (error) {
    lintError = oneLine(error instanceof Error ? error.message : error);
  }
  const plan = planRegistrations({
    uses,
    registrations,
    imports,
    pages: pageEntries(sources),
    scriptSetupFiles: scriptSetupFiles(sources),
  });
  const check = phaseOneCheck(uses, plan);

  const { changes, notes, failures } = analyzePhaseTwo(sources, { unwrap });

  const refused = lintError === null && check.blocking.length > 0;
  const writing = !options.dryRun && analysisErrors.length === 0 && lintError === null && !refused;
  const written = [];
  if (writing) {
    for (const { file, source } of changes) {
      try {
        write(join(root, file), source);
        written.push(file);
      } catch (error) {
        failures.push(failure(file, `write failed: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));

  out.write(renderReport({ dryRun: options.dryRun, writing, check, lintError, changes, written, notes, failures, analysisErrors }));

  const nothingWritten = options.dryRun ? '' : '; nothing was written';
  if (failures.length > 0) err.write(`unwrap-vue-component: ${failures.length} file(s) failed; see the Failed section of the report\n`);
  if (analysisErrors.length > 0) err.write(`unwrap-vue-component: ${analysisErrors.length} analysis error(s)${nothingWritten}\n`);
  if (lintError !== null) err.write(`unwrap-vue-component: the lint step failed${nothingWritten}\n`);
  if (refused) {
    const count = `${check.blocking.length} of ${check.findings}`;
    const effect = options.dryRun ? '; a real run would write nothing' : nothingWritten;
    err.write(`unwrap-vue-component: phase 1 is not complete (undefined-tag findings that are not self-references: ${count})${effect}\n`);
  }
  return failures.length > 0 || analysisErrors.length > 0 || lintError !== null || refused ? 1 : 0;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

// Run the CLI only when executed directly, so tests can import `run`.
if (isMain()) {
  run(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
