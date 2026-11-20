// Registers the components each file uses, explicitly, ahead of Vue 3. Run it from the repo root:
//
//   npm run codemod:register-components -- --dry-run        # report only
//   npm run codemod:register-components                     # write the registrations
//   npm run codemod:register-components -- --root <dir>     # another checkout (a portal branch)
//
// Today a template can use `<page-header>` because some `Vue.component("page-header", ...)` call ran
// somewhere in the bundle. Vue 3 wants each file to import and register what it uses. For every tag
// the lint rule `vue/no-undef-components` reports, this finds the component (`register-plan.mjs`)
// and adds `import X from "..."` and `components: { X }` to the file (`register-write.mjs`).
//
// The report is markdown on stdout: totals, the uses that could not be planned (and why), the components
// chosen at run time to check by hand (template `is` bindings and render calls; informational, they do not
// change the exit code), failures, analysis errors, a lint failure, and the files changed (or, in a dry
// run, the files that would change).
//
//   - A changed file is parsed again before it is written: no SFC error that the original did not
//     already have (the Vue 2 SFC parser warns about valid void tags such as `<img>`, so a plain "no
//     errors" would fail files that were fine before), and every script block through Babel without
//     error recovery. A file that fails is not written and is listed under Failed.
//   - Errors found while scanning the tree (a script that does not parse, a `Vue.component` call that
//     cannot be classified) are listed under Analysis errors. A duplicate name could be settled wrongly
//     by partial knowledge, so a real run with any of them writes nothing at all.
//   - ESLint finds the uses, and it cannot lint a tree with a script that does not parse. Then there are
//     no findings and no plan: the totals read `n/a`, the report lists the analysis errors (which name
//     the file and line) and a Lint failed section with ESLint's message, and the exit code is 1. A real
//     run writes nothing.
//   - Files with nothing to add are never touched. A second run changes nothing.
//   - Phase 2 output in the tree (`phase-2-present`): a `.vue` that is already `export default { name: "x",
//     ... }` registers nothing globally, so the uses of `x` cannot be planned safely (a portal-only
//     definition of `x` would look like the only one). Those uses are unresolved, and a real run with any of
//     them writes nothing at all.
//
// Sync-point order, when `master` is merged down into a portal branch (`scripts/vue3-migration/README.md`):
// merge `master` up to its last phase 1 commit; run this, with its hand fixes and gates; then merge phase 2
// and run `unwrap-vue-component`. Run on a tree that already has phase 2, this refuses (`phase-2-present`).
//
// ESLint plugins resolve from this repo, so `--root` may be a checkout without `node_modules`.
//
// Exit codes: 0 done (unresolved uses are reported, not failures), 1 a file failed, the scan had
// errors, the lint failed or phase 2 output is in the tree, 2 usage error.
import { realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseBabel } from '@babel/parser';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { BABEL_OPTIONS, analyzeSources, pageEntries, readSources, scriptSetupFiles } from './component-graph.mjs';
import { REASONS, planRegistrations, undefinedTags } from './register-plan.mjs';
import { applyRegistrations } from './register-write.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/register-components.mjs [--dry-run] [--root <dir>]';
// What the report shows for a figure that needs the lint step, when that step failed.
const NOT_AVAILABLE = 'n/a';
const NOT_COMPUTED = 'Not computed: the lint step failed.';

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * @param {string[]} argv
 * @returns {{ dryRun: boolean, root: string | undefined }}
 * @throws {Error} on an unknown option, a positional argument, or `--root` without a value
 */
export function parseArgs(argv) {
  const { values } = parseNodeArgs({
    args: argv,
    options: { 'dry-run': { type: 'boolean' }, root: { type: 'string' } },
    allowPositionals: false,
  });
  return { dryRun: values['dry-run'] === true, root: values.root };
}

export function hasSrc(root) {
  try {
    return statSync(join(root, 'src')).isDirectory();
  } catch {
    return false;
  }
}

export const parseStrict = (code) => parseBabel(code, { ...BABEL_OPTIONS, errorRecovery: false });

/**
 * Throws when `after`, the new text of `file`, does not parse. A `.js` file is parsed as a module.
 * A `.vue` file must have no SFC error that `before` did not have (errors are compared by message,
 * as a multiset), must still have a script, and each script block must parse without error recovery.
 */
export function assertParses(file, before, after) {
  if (!file.endsWith('.vue')) {
    parseStrict(after);
    return;
  }
  const known = new Map();
  for (const message of parseSfc({ source: before, filename: file }).errors) known.set(message, (known.get(message) ?? 0) + 1);
  const { errors, script, scriptSetup } = parseSfc({ source: after, filename: file });
  const added = errors.filter((message) => {
    const left = known.get(message) ?? 0;
    known.set(message, left - 1);
    return left <= 0;
  });
  if (added.length > 0) throw new Error(`the SFC parser reports: ${added.join('; ')}`);
  if (!script && !scriptSetup) throw new Error('the SFC parser finds no `<script>` block');
  for (const block of [script, scriptSetup]) {
    if (!block) continue;
    try {
      parseStrict(block.content);
    } catch (error) {
      throw new Error(`the \`<script>\` does not parse: ${error.message}`);
    }
  }
}

export const oneLine = (text) => String(text).replace(/\s+/g, ' ').trim();
export const cell = (text) => text.replaceAll('|', '\\|');
/** A markdown code span. Text that holds backticks is fenced with one more than its longest run of them. */
export function code(text) {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(([run]) => run.length));
  const pad = longest > 0 ? ' ' : '';
  return `${'`'.repeat(longest + 1)}${pad}${text}${pad}${'`'.repeat(longest + 1)}`;
}
/**
 * A page entry (see `pageEntries`) as the reports name it: its folder under `src/views/`
 * (`src/views/VariantSearch/main.js` -> `VariantSearch`), or for a page anywhere else its folder under
 * `src/` (`src/portals/PanKbase/views/Gene/main.js` -> `portals/PanKbase/views/Gene`).
 */
export const pageName = (entry) => entry.replace(/\/main\.js$/, '').replace(/^src\/(?:views\/)?/, '');

/** A failed file as the reports list it: `error`'s message on one line, without a leading `<file>: `. */
export function failure(file, error) {
  const message = oneLine(error instanceof Error ? error.message : error);
  return { file, message: message.startsWith(`${file}: `) ? message.slice(file.length + 2) : message };
}

/** The lines of the table of uses the planner could not place (`plan.unresolved`), header included. */
export function unresolvedTable(unresolved) {
  const lines = ['| file:line | tag | reason | candidates / pages |', '| --- | --- | --- | --- |'];
  for (const { file, line, tag, reason, candidates = [], pages = [] } of unresolved) {
    const detail = [...candidates, ...pages.map(pageName)].map(code).join(', ');
    lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(tag))} | ${reason} | ${cell(detail)} |`);
  }
  return lines;
}

/** What the Check by hand sections say before their table. */
export const CHECK_BY_HAND =
  'Components chosen at run time: the lint cannot see them, so they are not planned. Once components are no longer registered globally (phase 2), each of these must still find its component, so check them by hand. Listed: every template `is` binding, and every render call (`h`, `createElement`) given a tag name with a `-` or anything but a literal.';

/** The lines of the table of runtime component choices (`RuntimeChoice`, see `analyzeSources`), header included. */
export function checkByHandTable(choices) {
  const lines = ['| file:line | kind | expression |', '| --- | --- | --- |'];
  for (const { file, line, kind, expression } of choices) {
    lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(kind))} | ${cell(code(expression))} |`);
  }
  return lines;
}

/** One analysis error (see `analyzeSources`) as a list item of a report. */
export const analysisErrorLine = ({ file, line, kind, message }) =>
  `- ${code(line === undefined ? file : `${file}:${line}`)} (${kind}): ${oneLine(message)}`;

function renderReport({ dryRun, writing, findings, plan, changes, written, failures, analysisErrors, lintError, phaseTwo, runtimeChoices }) {
  const entries = changes.reduce((sum, { entries: count }) => sum + count, 0);
  const lines = [
    `# Register components${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Findings | ${lintError === null ? findings : NOT_AVAILABLE} |`,
    `| Files to change | ${lintError === null ? changes.length : NOT_AVAILABLE} |`,
    `| Entries | ${lintError === null ? entries : NOT_AVAILABLE} |`,
    `| Unresolved | ${lintError === null ? plan.unresolved.length : NOT_AVAILABLE} |`,
  ];
  for (const reason of REASONS) {
    const count = plan.unresolved.filter((item) => item.reason === reason).length;
    if (count > 0) lines.push(`| Unresolved: ${reason} | ${count} |`);
  }
  lines.push(`| Check by hand | ${runtimeChoices.length} |`);

  lines.push('', '## Unresolved', '');
  if (lintError !== null) {
    lines.push(NOT_COMPUTED);
  } else if (plan.unresolved.length === 0) {
    lines.push('None.');
  } else {
    lines.push(...unresolvedTable(plan.unresolved));
  }

  if (phaseTwo > 0) {
    lines.push(
      '',
      '## Phase 2 present',
      '',
      `${phaseTwo} unresolved uses are \`phase-2-present\`: they name a component that a file already exports as \`export default { name: "...", ... }\` (phase 2 output, or written so by hand), which registers nothing globally. Phase 1 cannot tell from such a tree which component a page loads for the tag, so it writes nothing. Run phase 1 before phase 2 is merged (see "Sync-point order" in \`scripts/vue3-migration/README.md\`), or register these uses by hand.`,
      '',
      dryRun ? 'A real run would write nothing.' : 'Nothing was written.',
    );
  }

  lines.push('', '## Check by hand', '');
  if (runtimeChoices.length === 0) lines.push('None.');
  else lines.push(CHECK_BY_HAND, '', ...checkByHandTable(runtimeChoices));

  if (failures.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failures) lines.push(`- ${code(file)}: ${message}`);
  }

  if (analysisErrors.length > 0) {
    lines.push('', '## Analysis errors', '');
    for (const error of analysisErrors) lines.push(analysisErrorLine(error));
    if (!dryRun) lines.push('', 'Nothing was written: with these errors a duplicate name could be settled wrongly.');
  }

  if (lintError !== null) {
    lines.push('', '## Lint failed', '', 'ESLint could not lint the tree, so there are no findings and nothing could be planned:', '', `- ${lintError}`);
    if (!dryRun) lines.push('', 'Nothing was written.');
  }

  lines.push('', writing ? '## Changed files' : '## Files that would change', '');
  const files = writing ? written : changes.map(({ file }) => file);
  if (lintError !== null) lines.push(NOT_COMPUTED);
  else if (files.length === 0) lines.push('None.');
  for (const file of files) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Everything `run` reports about phase 1 for the tree under `root`, without writing anything:
 *
 *  - `sources`: the tree's `.vue` and `.js` files (see `readSources`);
 *  - `uses`: the undefined-tag uses ESLint found (empty when the lint failed), and `findings` their count;
 *  - `plan`: what `planRegistrations` made of them (`edits` and `unresolved`);
 *  - `changes`: one per file that would change, `{ file, source, entries }` (`source` is its new text);
 *  - `failures`: files whose registrations could not be applied or did not parse again, sorted by file;
 *  - `analysisErrors`: what the scan of the tree found (a script that does not parse, say);
 *  - `runtimeChoices`: the components chosen at run time, for a person to check (see `analyzeSources`);
 *  - `lintError`: the lint's message on one line when ESLint could not lint the tree, else `null`. This
 *    does not reject: the scan's errors are still returned, and `uses` is empty.
 *
 * Throws when `root` has no `src/` folder. `apply(source, entries, file)` and `lint(root)` default to
 * `applyRegistrations` and `undefinedTags`; they are seams for tests.
 * @param {string} root
 * @param {{ apply?: typeof applyRegistrations, lint?: typeof undefinedTags }} [deps]
 */
export async function analyzePhaseOne(root, { apply = applyRegistrations, lint = undefinedTags } = {}) {
  const sources = readSources(root);
  const { registrations, imports, errors: analysisErrors, runtimeChoices } = analyzeSources(sources);
  // ESLint cannot lint a script that does not parse. The scan above has already listed that file, so a
  // lint failure is reported beside the analysis errors rather than thrown over them.
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

  const changes = [];
  const failures = [];
  for (const [file, entries] of plan.edits) {
    try {
      const before = sources.get(file);
      const result = apply(before, entries, file);
      if (!result.changed) continue;
      assertParses(file, before, result.source);
      changes.push({ file, source: result.source, entries: entries.length });
    } catch (error) {
      failures.push(failure(file, error));
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));

  const findings = [...uses.values()].reduce((sum, list) => sum + list.length, 0);
  return { sources, uses, findings, plan, changes, failures, analysisErrors, lintError, runtimeChoices };
}

/**
 * Plans the registrations for the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)`,
 * `apply(source, entries, file)` and `lint(root)` default to `fs.writeFileSync`, `applyRegistrations` and
 * `undefinedTags`; they are seams for tests. The report goes to `out`, usage errors and a one-line
 * summary of what failed go to `err`.
 *
 * Does not reject when ESLint cannot lint the tree (a script that does not parse, say): that is a
 * Lint failed section in the report, exit 1, and nothing is written (the figures that need the lint
 * read `n/a`; the analysis errors are still listed).
 *
 * Any `phase-2-present` use (phase 2 output in the tree) is a Phase 2 present section and exit 1, a dry run
 * included; a real run then writes nothing at all.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, apply?: typeof applyRegistrations,
 *   lint?: typeof undefinedTags, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const {
    root: defaultRoot = repoRoot,
    write = writeFileSync,
    apply = applyRegistrations,
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

  const { findings, plan, changes, failures, analysisErrors, lintError, runtimeChoices } = await analyzePhaseOne(root, { apply, lint });

  // Partial knowledge could settle a duplicate name wrongly, so analysis errors block every write, and so
  // does phase 2 output in the tree: a component it unwrapped no longer shows where it is registered.
  const phaseTwo = plan.unresolved.filter(({ reason }) => reason === 'phase-2-present').length;
  const writing = !options.dryRun && analysisErrors.length === 0 && lintError === null && phaseTwo === 0;
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

  out.write(
    renderReport({ dryRun: options.dryRun, writing, findings, plan, changes, written, failures, analysisErrors, lintError, phaseTwo, runtimeChoices }),
  );

  if (failures.length > 0) err.write(`register-components: ${failures.length} file(s) failed; see the Failed section of the report\n`);
  if (analysisErrors.length > 0) {
    err.write(`register-components: ${analysisErrors.length} analysis error(s)${options.dryRun ? '' : '; nothing was written'}\n`);
  }
  if (lintError !== null) err.write(`register-components: the lint step failed${options.dryRun ? '' : '; nothing was written'}\n`);
  if (phaseTwo > 0) {
    const effect = options.dryRun ? 'a real run would write nothing' : 'nothing was written';
    err.write(`register-components: ${phaseTwo} use(s) are phase-2-present; ${effect}\n`);
  }
  return failures.length > 0 || analysisErrors.length > 0 || lintError !== null || phaseTwo > 0 ? 1 : 0;
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
