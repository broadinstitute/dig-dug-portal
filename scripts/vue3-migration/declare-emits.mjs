// Declares the events each component emits, ahead of Vue 3. Run it from the repo root:
//
//   npm run codemod:declare-emits -- --dry-run        # report only
//   npm run codemod:declare-emits                     # write the `emits` options
//   npm run codemod:declare-emits -- --root <dir>     # another checkout (a portal branch)
//
// Vue 2.7 ignores the `emits` option. Vue 3 uses it: a listener for an event that the component does not declare
// is also bound to the component's root element, so a native-named event (`click`, `input`) fires twice. The lint
// rule `vue/require-explicit-emits` finds every `$emit("name")` of a component, in its script and its template,
// that its `emits` option does not declare (a name that is not a string literal is invisible to it, see Check by
// hand). For each file with findings this adds the missing names, spelled as emitted (`click`,
// `update:regionViewArea`, `toggle-star-variant`), in the order of the lint messages (source order).
//
//   - No `emits` option: `emits: ["a", "b"],` goes on the line after `props`, else after `components`, else after
//     `name`, else it is the first property. One line when that line is at most 100 characters long (a tab counts
//     as one), else one name per line with trailing commas, indented one step in.
//   - An `emits` array: the names it lacks are appended before the `]`, one per line when the array is.
//
// Every change is a text splice at a position found by the SFC parser and Babel (`register-write.mjs`): bytes
// outside it stay as they were, the file keeps its line endings (LF or CRLF), and nothing is reformatted.
//
// A file it will not edit is listed under Unresolved, with its names and why, and is not written: an object-form
// `emits`, a `.js` file, a script without `export default { ... }` (or one with a spread in it), a property that
// shares its line with other code, a `<script setup>`. Those are for a person. Unresolved files do not change
// the exit code, and the next run reports them again.
//
// Every changed file is parsed again before anything is written (no SFC error the original did not have, every
// script block through Babel without error recovery, as `register-components.mjs` does). A file that fails is
// listed under Failed, and then nothing at all is written in that run, a dry run included (a real run would write
// nothing). A second run changes nothing.
//
// The report is markdown on stdout: the totals (the findings, and the files they are in), what is unresolved, the
// `$emit` calls to check by hand, failures, and the files changed (or, in a dry run, that would change).
//
//   - Check by hand: a `$emit(` whose first argument is not a string literal (`this.$emit(eventData.event_name)`).
//     The lint cannot see it, so nothing declares it; a person finds what it can emit. This is a text scan of every
//     file the lint reads, so a hit can be inside a comment.
//
// ESLint plugins resolve from this repo, so `--root` may be a checkout without `node_modules`.
//
// Exit codes: 0 done (unresolved files are reported, not failures), 1 a file failed (it did not parse again, or a
// write failed), 2 usage error or the lint could not run.
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { assertParses, cell, code, failure, hasSrc, oneLine, parseArgs, parseStrict } from './register-components.mjs';
import { addFirstProperty, addPropertyAfter, byCodeUnit, extendList, indentUnit, keyName, soleScript, splice } from './register-write.mjs';
import { vue3Linter } from './vue3-eslint.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/declare-emits.mjs [--root <dir>] [--dry-run]';

const RULE = 'vue/require-explicit-emits';
/** The message of the rule for a component with an `emits` option (eslint-plugin-vue 9.17.0); the name is in quotes. */
const MISSING = /^The "(.*)" event has been triggered but not declared on `emits` option\.$/s;

/** Longest line, in characters, that `emits: ["a", "b"],` may be before it is split one name to a line. */
const MAX_LINE = 100;
/** Longest first argument the Check by hand table shows. */
const SHOWN = 80;

/**
 * The event names in the messages of `vue/require-explicit-emits` for one file: unique, in message order. A
 * message that is not "The "<name>" event has been triggered but not declared on `emits` option." (a
 * `<script setup>` component says `defineEmits`) has no name here.
 * @param {{ message: string }[]} messages
 * @returns {string[]}
 */
export function emittedNames(messages) {
  const names = [];
  for (const { message } of messages) {
    const name = MISSING.exec(message)?.[1];
    if (name !== undefined && !names.includes(name)) names.push(name);
  }
  return names;
}

/** What `declareEmits` throws for a shape it will not edit; the message is the reason. */
class Unresolved extends Error {}
const unresolve = (reason) => {
  throw new Unresolved(reason);
};

const quote = (name) => JSON.stringify(name);

/**
 * The text of the new `emits` property: `lines(indent)` is `indent` + `emits: ["a", "b"],`, or when that is
 * longer than `MAX_LINE`, one name per line, `unit` further in.
 */
function newProperty(names, unit, eol) {
  const quoted = names.map(quote);
  return (indent) => {
    const single = `${indent}emits: [${quoted.join(', ')}],`;
    if (single.length <= MAX_LINE) return single;
    return [`${indent}emits: [`, ...quoted.map((name) => `${indent}${unit}${name},`), `${indent}],`].join(eol);
  };
}

/** The script's own edits, in the script's coordinates (`raw` is its text); throws `Unresolved`. */
function emitsEdits(raw, names, eol) {
  let ast;
  try {
    ast = parseStrict(raw);
  } catch (error) {
    return unresolve(`the <script> does not parse: ${error.message}`);
  }
  const options = ast.program.body.find(({ type }) => type === 'ExportDefaultDeclaration')?.declaration;
  if (options?.type !== 'ObjectExpression') return unresolve('no `export default { ... }`');
  if (options.properties.some(({ type }) => type === 'SpreadElement')) {
    return unresolve('the options contain a spread, so where `emits` comes from is unclear');
  }
  const unit = indentUnit(raw, options);

  const existing = options.properties.filter((property) => keyName(property) === 'emits');
  if (existing.length > 1) return unresolve(`has ${existing.length} \`emits\` options`);
  if (existing.length === 1) {
    const [emits] = existing;
    const value = emits.type === 'ObjectProperty' ? emits.value : null;
    if (value?.type === 'ObjectExpression') return unresolve('object-form `emits`');
    if (value?.type !== 'ArrayExpression' || !value.elements.every((element) => element?.type === 'StringLiteral')) {
      return unresolve('`emits` is not an array of string literals');
    }
    const declared = new Set(value.elements.map((element) => element.value));
    const missing = names.filter((name) => !declared.has(name));
    return missing.length === 0 ? [] : extendList(raw, emits, missing.map(quote), unit, eol);
  }

  const lines = newProperty(names, unit, eol);
  const propertyNamed = (key) => options.properties.find((property) => keyName(property) === key);
  const anchor = propertyNamed('props') ?? propertyNamed('components') ?? propertyNamed('name');
  if (anchor) {
    const edit = addPropertyAfter(raw, anchor, lines, eol);
    return edit === null ? unresolve('property shares its line') : [edit];
  }
  const [first] = options.properties;
  if (first && !raw.slice(options.start, first.start).includes('\n')) return unresolve('property shares its line');
  return [addFirstProperty(raw, options, lines, unit, eol)];
}

/**
 * Declares `names` in the `emits` option of a `.vue` file's component.
 *
 *  - No `emits` option: `emits: ["a", "b"],` goes after `props`, else after `components`, else after `name`,
 *    else it is the first property. One line when that line is at most 100 characters long, else one name per
 *    line, with trailing commas, indented one step in (the file's own step: a tab, two spaces, ...; four spaces
 *    when the file shows none). A last property without a comma gets one.
 *  - An `emits` array of string literals: the names it lacks are appended.
 *  - Inserted lines use the file's line ending, taken from its first line break. With nothing missing the result
 *    is `{ source, changed: false }`, and a second run changes nothing.
 *
 * A source it will not guess at comes back unchanged with `unresolved` set to the reason: an object-form `emits`
 * (or one that is not an array of string literals, or a second one), a file that is not a `.vue` file, has no
 * `<script>` or has one that is not plain JavaScript (`<script setup>`, `lang="ts"`, `src`, a second block), a
 * script that does not parse, one without `export default { ... }`, options with a spread, and a property that
 * shares its line with other code (`property shares its line`). With no names it returns at once and checks nothing.
 * @param {string} source the file's text
 * @param {string[]} names the events to declare, in the order to write them
 * @param {string} [file] the file's path relative to the repo root: it picks the file type
 * @returns {{ source: string, changed: boolean, unresolved?: string }}
 */
export function declareEmits(source, names, file = '<source>') {
  const wanted = [...new Set(names)];
  if (wanted.length === 0) return { source, changed: false };
  try {
    if (!file.endsWith('.vue')) return unresolve('.js file');
    const script = soleScript(source, parseSfc({ source, filename: file }), unresolve);
    if (!script) return unresolve('no <script>');
    const firstBreak = source.indexOf('\n');
    const eol = firstBreak > 0 && source[firstBreak - 1] === '\r' ? '\r\n' : '\n';
    const edits = emitsEdits(source.slice(script.start, script.end), wanted, eol).map((edit) => ({
      start: edit.start + script.start,
      end: edit.end + script.start,
      text: edit.text,
    }));
    return edits.length === 0 ? { source, changed: false } : { source: splice(source, edits), changed: true };
  } catch (error) {
    if (!(error instanceof Unresolved)) throw error;
    return { source, changed: false, unresolved: error.message };
  }
}

/** The text up to where the argument that starts at `from` ends: a `,` or the `)` of the call, outside any string or bracket. */
function argumentEnd(source, from) {
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'" || char === '`') {
      for (i++; i < source.length && source[i] !== char; i++) if (source[i] === '\\') i++;
    } else if ('([{'.includes(char)) {
      depth++;
    } else if (')]}'.includes(char)) {
      if (depth === 0) return i;
      depth--;
    } else if (char === ',' && depth === 0) {
      return i;
    }
  }
  return source.length;
}

// A string literal, or a template literal with nothing to substitute: what the lint rule can read as an event name.
const STATIC_NAME = /^(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\$]|\\.|\$(?!\{))*`)$/s;

/**
 * The `$emit(` calls of `source` (a `.vue` or `.js` file's text) whose first argument is not a string literal or
 * a template literal with no `${}`, which the lint rule cannot read: the line of the call and its first argument
 * (white space collapsed, cut at 80 characters). It is a text scan of the script and the template together, so
 * a match inside a comment is listed too.
 * @param {string} source
 * @returns {{ line: number, argument: string }[]}
 */
export function dynamicEmits(source) {
  const found = [];
  for (const match of source.matchAll(/\$emit\s*\(/g)) {
    const from = match.index + match[0].length;
    const argument = source.slice(from, argumentEnd(source, from)).trim();
    if (STATIC_NAME.test(argument)) continue;
    const shown = oneLine(argument);
    found.push({ line: source.slice(0, match.index).split('\n').length, argument: shown.length > SHOWN ? `${shown.slice(0, SHOWN - 3)}...` : shown });
  }
  return found;
}

/**
 * Declares the missing events of the `.js` and `.vue` files under `<root>/src`, and writes them unless `dryRun`.
 *
 * Resolves to
 *  - `findings`: the `vue/require-explicit-emits` findings, and `filesWithFindings` the number of files that have them;
 *  - `changed`: the files (relative to `root`, `/` separators, sorted) written, or in a dry run the files a real run
 *    would write; `outputs` the same with each one's new text, whether or not it was written. Empty `changed` when any
 *    file failed;
 *  - `unresolved`: the files with findings that were not edited, `{ file, names, reason }`, sorted by file;
 *  - `failures`: `{ file, message }`, sorted. A file fails when its new text does not parse again, in which case
 *    nothing is written at all, or when its write throws, in which case the other files are still written;
 *  - `checkByHand`: the `$emit(` calls with a first argument that is not a string literal, `{ file, line, argument }`;
 *  - `unparsed`: the files ESLint could not parse, which have no findings it can show.
 *
 * Rejects when ESLint cannot lint the tree (no file under `src/`). `write(absPath, text)`, `makeLinter(options)` and
 * `declare(source, names, file)` default to `fs.writeFileSync`, `vue3Linter` and `declareEmits`; they are seams for tests.
 * @param {{ root: string, dryRun?: boolean, write?: (path: string, text: string) => void,
 *   makeLinter?: typeof vue3Linter, declare?: typeof declareEmits }} options
 */
export async function declareTree({ root, dryRun = false, write = writeFileSync, makeLinter = vue3Linter, declare = declareEmits }) {
  const cwd = resolve(root);
  const results = await makeLinter({ cwd }).lintFiles(['src']);

  let findings = 0;
  let filesWithFindings = 0;
  const outputs = [];
  const unresolved = [];
  const failures = [];
  const checkByHand = [];
  const unparsed = [];
  for (const result of results) {
    const file = relative(cwd, result.filePath).split(sep).join('/');
    const source = readFileSync(result.filePath, 'utf8');
    for (const { line, argument } of dynamicEmits(source)) checkByHand.push({ file, line, argument });
    if (result.messages.some((message) => message.fatal)) unparsed.push(file);

    const messages = result.messages.filter((message) => message.ruleId === RULE);
    if (messages.length === 0) continue;
    findings += messages.length;
    filesWithFindings++;
    const names = emittedNames(messages);
    if (names.length === 0) {
      unresolved.push({ file, names, reason: 'the lint messages name no event (`<script setup>`, or the rule changed its text)' });
      continue;
    }
    try {
      const declared = declare(source, names, file);
      if (declared.unresolved !== undefined) {
        unresolved.push({ file, names, reason: declared.unresolved });
      } else if (declared.changed) {
        assertParses(file, source, declared.source);
        outputs.push({ file, text: declared.source });
      }
    } catch (error) {
      failures.push(failure(file, error));
    }
  }
  for (const list of [outputs, unresolved, checkByHand]) list.sort((a, b) => byCodeUnit(a.file, b.file) || (a.line ?? 0) - (b.line ?? 0));
  unparsed.sort(byCodeUnit);

  // One file that does not parse after its change stops the run: the others were changed by the same rules.
  const changed = [];
  if (failures.length === 0) {
    for (const { file, text } of outputs) {
      if (dryRun) {
        changed.push(file);
        continue;
      }
      try {
        write(join(cwd, file), text);
        changed.push(file);
      } catch (error) {
        failures.push(failure(file, `write failed: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));
  return { findings, filesWithFindings, changed, outputs, unresolved, failures, checkByHand, unparsed };
}

const BY_HAND_NOTE =
  'The lint rule reads only an event name written as a string literal, so a `$emit(` with any other first argument is not declared. For each, find the events it can emit and add them to that component\'s `emits` by hand. This is a text scan: a match inside a comment is not a call.';

function renderReport({ dryRun, findings, filesWithFindings, outputs, changed, unresolved, failures, checkByHand, unparsed }) {
  const lines = [
    `# Declare emits${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Findings | ${findings} |`,
    `| Files with findings | ${filesWithFindings} |`,
    `| Files to change | ${outputs.length} |`,
    `| Unresolved | ${unresolved.length} |`,
    `| Check by hand | ${checkByHand.length} |`,
  ];
  if (unparsed.length > 0) lines.push(`| Files ESLint could not parse | ${unparsed.length} |`);

  lines.push('', '## Unresolved', '');
  if (unresolved.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| file | events | reason |', '| --- | --- | --- |');
    for (const { file, names, reason } of unresolved) {
      lines.push(`| ${cell(code(file))} | ${cell(names.map(code).join(', '))} | ${cell(reason)} |`);
    }
  }

  lines.push('', '## Check by hand', '');
  if (checkByHand.length === 0) {
    lines.push('None.');
  } else {
    lines.push(BY_HAND_NOTE, '', '| file:line | first argument |', '| --- | --- |');
    for (const { file, line, argument } of checkByHand) lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(argument))} |`);
  }

  if (unparsed.length > 0) {
    lines.push('', '## Not parsed', '', 'ESLint could not parse these files, so their findings are not in the totals:', '');
    for (const file of unparsed) lines.push(`- ${code(file)}`);
  }

  if (failures.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failures) lines.push(`- ${code(file)}: ${message}`);
    if (changed.length === 0) lines.push('', dryRun ? 'A real run would write nothing.' : 'Nothing was written.');
  }

  lines.push('', dryRun ? '## Files that would change' : '## Changed files', '');
  if (changed.length === 0) lines.push('None.');
  for (const file of changed) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Declares the missing events in the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)`,
 * `makeLinter(options)` and `declare(source, names, file)` default to `fs.writeFileSync`, `vue3Linter` and
 * `declareEmits`; they are seams for tests. The report goes to `out`, usage errors, a lint that could not run and
 * a one-line summary of what failed go to `err`.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, makeLinter?: typeof vue3Linter,
 *   declare?: typeof declareEmits, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const {
    root: defaultRoot = repoRoot,
    write = writeFileSync,
    makeLinter = vue3Linter,
    declare = declareEmits,
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

  let tree;
  try {
    tree = await declareTree({ root, dryRun: options.dryRun, write, makeLinter, declare });
  } catch (error) {
    err.write(`declare-emits: the lint failed: ${oneLine(error instanceof Error ? error.message : error)}\n`);
    return 2;
  }
  out.write(renderReport({ dryRun: options.dryRun, ...tree }));

  if (tree.failures.length > 0) {
    const effect = tree.changed.length > 0 ? '' : options.dryRun ? '; a real run would write nothing' : '; nothing was written';
    err.write(`declare-emits: ${tree.failures.length} file(s) failed${effect}; see the Failed section of the report\n`);
    return 1;
  }
  return 0;
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
