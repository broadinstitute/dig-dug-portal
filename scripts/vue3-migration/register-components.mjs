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
// The report is markdown on stdout: totals, the uses that could not be planned (and why), failures,
// analysis errors, and the files changed (or, in a dry run, the files that would change).
//
//   - A changed file is parsed again before it is written: no SFC error that the original did not
//     already have (the Vue 2 SFC parser warns about valid void tags such as `<img>`, so a plain "no
//     errors" would fail files that were fine before), and every script block through Babel without
//     error recovery. A file that fails is not written and is listed under Failed.
//   - Errors found while scanning the tree (a script that does not parse, a `Vue.component` call that
//     cannot be classified) are listed under Analysis errors. A duplicate name could be settled wrongly
//     by partial knowledge, so a real run with any of them writes nothing at all.
//   - Files with nothing to add are never touched. A second run changes nothing.
//
// ESLint plugins resolve from this repo, so `--root` may be a checkout without `node_modules`.
//
// Exit codes: 0 done (unresolved uses are reported, not failures), 1 a file failed or the scan had
// errors, 2 usage error.
import { realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseBabel } from '@babel/parser';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { BABEL_OPTIONS, analyzeSources, pageEntries, readSources, scriptSetupFiles } from './component-graph.mjs';
import { planRegistrations, undefinedTags } from './register-plan.mjs';
import { applyRegistrations } from './register-write.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/register-components.mjs [--dry-run] [--root <dir>]';
const REASONS = ['no-registration', 'ambiguous', 'self', 'cycle', 'script-setup'];

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

function hasSrc(root) {
  try {
    return statSync(join(root, 'src')).isDirectory();
  } catch {
    return false;
  }
}

const parseStrict = (code) => parseBabel(code, { ...BABEL_OPTIONS, errorRecovery: false });

/**
 * Throws when `after`, the new text of `file`, does not parse. A `.js` file is parsed as a module.
 * A `.vue` file must have no SFC error that `before` did not have (errors are compared by message,
 * as a multiset), must still have a script, and each script block must parse without error recovery.
 */
function assertParses(file, before, after) {
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

const oneLine = (text) => String(text).replace(/\s+/g, ' ').trim();
const cell = (text) => text.replaceAll('|', '\\|');
const code = (text) => `\`${text}\``;

function renderReport({ dryRun, writing, findings, plan, changes, written, failures, analysisErrors }) {
  const entries = changes.reduce((sum, { entries: count }) => sum + count, 0);
  const lines = [
    `# Register components${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Findings | ${findings} |`,
    `| Files to change | ${changes.length} |`,
    `| Entries | ${entries} |`,
    `| Unresolved | ${plan.unresolved.length} |`,
  ];
  for (const reason of REASONS) {
    const count = plan.unresolved.filter((item) => item.reason === reason).length;
    if (count > 0) lines.push(`| Unresolved: ${reason} | ${count} |`);
  }

  lines.push('', '## Unresolved', '');
  if (plan.unresolved.length === 0) {
    lines.push('None.');
  } else {
    lines.push('| file:line | tag | reason | candidates |', '| --- | --- | --- | --- |');
    for (const { file, line, tag, reason, candidates = [] } of plan.unresolved) {
      lines.push(`| ${cell(code(`${file}:${line}`))} | ${cell(code(tag))} | ${reason} | ${cell(candidates.map(code).join(', '))} |`);
    }
  }

  if (failures.length > 0) {
    lines.push('', '## Failed', '');
    for (const { file, message } of failures) lines.push(`- ${code(file)}: ${message}`);
  }

  if (analysisErrors.length > 0) {
    lines.push('', '## Analysis errors', '');
    for (const { file, line, kind, message } of analysisErrors) {
      lines.push(`- ${code(line === undefined ? file : `${file}:${line}`)} (${kind}): ${oneLine(message)}`);
    }
    if (!dryRun) lines.push('', 'Nothing was written: with these errors a duplicate name could be settled wrongly.');
  }

  lines.push('', writing ? '## Changed files' : '## Files that would change', '');
  const files = writing ? written : changes.map(({ file }) => file);
  if (files.length === 0) lines.push('None.');
  for (const file of files) lines.push(`- ${code(file)}`);
  return `${lines.join('\n')}\n`;
}

/**
 * Plans the registrations for the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)` and
 * `apply(source, entries, file)` default to `fs.writeFileSync` and `applyRegistrations`; they are seams
 * for tests. The report goes to `out`, usage errors and a one-line summary of what failed go to `err`.
 *
 * Rejects when ESLint cannot lint the tree (see `undefinedTags`).
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, apply?: typeof applyRegistrations,
 *   out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, write = writeFileSync, apply = applyRegistrations, out = process.stdout, err = process.stderr } = deps;

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
  const uses = await undefinedTags(root);
  const plan = planRegistrations({
    uses,
    registrations,
    imports,
    pages: pageEntries(sources),
    scriptSetupFiles: scriptSetupFiles(sources),
  });

  const changes = [];
  const failures = [];
  const fail = (file, error) => {
    const message = oneLine(error instanceof Error ? error.message : error);
    failures.push({ file, message: message.startsWith(`${file}: `) ? message.slice(file.length + 2) : message });
  };
  for (const [file, entries] of plan.edits) {
    try {
      const before = sources.get(file);
      const result = apply(before, entries, file);
      if (!result.changed) continue;
      assertParses(file, before, result.source);
      changes.push({ file, source: result.source, entries: entries.length });
    } catch (error) {
      fail(file, error);
    }
  }

  // Partial knowledge could settle a duplicate name wrongly, so analysis errors block every write.
  const writing = !options.dryRun && analysisErrors.length === 0;
  const written = [];
  if (writing) {
    for (const { file, source } of changes) {
      try {
        write(join(root, file), source);
        written.push(file);
      } catch (error) {
        fail(file, `write failed: ${error instanceof Error ? error.message : error}`);
      }
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));

  const findings = [...uses.values()].reduce((sum, list) => sum + list.length, 0);
  out.write(renderReport({ dryRun: options.dryRun, writing, findings, plan, changes, written, failures, analysisErrors }));

  if (failures.length > 0) err.write(`register-components: ${failures.length} file(s) failed; see the Failed section of the report\n`);
  if (analysisErrors.length > 0) {
    err.write(`register-components: ${analysisErrors.length} analysis error(s)${options.dryRun ? '' : '; nothing was written'}\n`);
  }
  return failures.length > 0 || analysisErrors.length > 0 ? 1 : 0;
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
