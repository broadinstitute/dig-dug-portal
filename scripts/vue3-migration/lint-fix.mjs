// Applies ESLint's autofix, for the rules whose fix is valid on Vue 2.7 only, ahead of Vue 3. Run it from the
// repo root:
//
//   npm run codemod:lint-fix -- --rule <id> [--rule <id> ...] --dry-run     # report only
//   npm run codemod:lint-fix -- --rule <id> [--rule <id> ...]               # write the fixes
//   npm run codemod:lint-fix -- --rule <id> --root <dir>                    # another checkout (a portal branch)
//
// ESLint does the fixing, with the lint of the ratchet (`eslint-vue3.cjs`, through `vue3-eslint.mjs`). Only the
// rules named with `--rule` are fixed, and only rules in `SAFE_ON_VUE2`: a rule whose fix writes Vue 3-only
// syntax (`v-model:arg` for `.sync`, `beforeUnmount` for `beforeDestroy`, no `.native`) is refused with exit 2,
// so the tree keeps running on Vue 2.7.
//
//   - `vue/no-deprecated-slot-attribute`: `<template slot="x" slot-scope="s">` becomes `<template v-slot:x="s">`
//     (Vue 2.6+). ESLint converts only a `<template>` directly inside a component, with a slot name of word
//     characters and `-`, and no other template for the same slot; any other stays as it is, and stays counted.
//     Its fix takes the element's `slot-scope` along, so the next rule has little left to fix.
//   - `vue/no-deprecated-slot-scope-attribute`: a `slot-scope="s"` with no `slot` beside it becomes `v-slot="s"`.
//   - `vue/no-deprecated-data-object-declaration`: `data: { ... }` on a root instance or component becomes
//     `data: () => ({ ... })`.
//
// Every output is ESLint's own splice of the original text: bytes outside the fix, line endings and
// indentation included, stay as they were, and nothing is reformatted. The only change to a fix is made in
// `shouldFix`, before ESLint applies it: the slot fix's text is trimmed (no stray space or blank line where
// `slot-scope` was removed), and the data fix is written as an arrow function around the object's own text.
//
// All outputs are computed in memory first, and each is checked again before anything is written:
//   - a `.vue` file may not have an SFC parser error (`vue/compiler-sfc`, compared by message, as a
//     multiset) that the original did not have;
//   - any file (`.vue` and `.js`) may not have a fatal parse error in ESLint's own last pass over the fixed
//     text. That is the re-lint check for `.js` files: ESLint lints each fixed output again, with the parser
//     that read the original, and reports a file that no longer parses as a message with no rule.
//   A file that fails is listed under Failed, and then nothing at all is written in that run, a dry run
//   included (a real run would write nothing). Files with nothing to fix are never touched, and a second run
//   changes nothing.
//
// The report is markdown on stdout: the findings per rule before and after, the failures, and the files
// changed (or, in a dry run, that would change). A file ESLint cannot parse has no findings it can show, so
// those count as `fatal` in the table, before and after.
//
// ESLint plugins resolve from this repo, so `--root` may be a checkout without `node_modules`.
//
// Exit codes: 0 done, 1 a file failed (a fixed file failed the re-parse, or a write failed), 2 usage error
// (no `--rule`, a rule outside `SAFE_ON_VUE2`, a root without a `src/` folder).
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseSfc } from 'vue/compiler-sfc';
import { countByRule } from './ratchet.mjs';
import { code, failure, hasSrc } from './register-components.mjs';
import { byCodeUnit } from './register-write.mjs';
import { vue3Linter } from './vue3-eslint.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/lint-fix.mjs --rule <id> [--rule <id> ...] [--root <dir>] [--dry-run]';

/** The rules whose ESLint fix writes syntax that Vue 2.7 runs as it does today. */
export const SAFE_ON_VUE2 = new Set([
  'vue/no-deprecated-slot-attribute',
  'vue/no-deprecated-slot-scope-attribute',
  'vue/no-deprecated-data-object-declaration',
]);

const SLOT_RULE = 'vue/no-deprecated-slot-attribute';
const DATA_RULE = 'vue/no-deprecated-data-object-declaration';
// What ESLint's data-object fix wraps around the object's own text (it inserts both ends, which ESLint merges).
const FUNCTION_OPEN = 'function() {\nreturn ';
const FUNCTION_CLOSE = ';\n}';

/**
 * ESLint's `fix` predicate for `wanted` rules: true for a message whose rule is wanted, which is then fixed.
 * Two rules have their fix reshaped first. Both reshapes depend on how ESLint 8.57.1's
 * `SourceCodeFixer.applyFixes` works: it calls the predicate with the problem object (only for a problem that
 * has a fix) and then applies that same `problem.fix`, so a change to `problem.fix.text` made here is what gets
 * written. Check both again when ESLint is upgraded; the tests for them fail if the mechanism changes.
 *
 * `vue/no-deprecated-slot-attribute`: the fix text is trimmed. ESLint merges the rule's two edits (replace
 * `slot`, remove `slot-scope`) into one fix, and the merged text keeps the whitespace that stood between and
 * around the two attributes: ` ` after `v-slot:a="s"`, a newline and indent after one that sat on its own
 * line, a leading ` ` when `slot-scope` came first. Trimmed, the attributes close up and no space or blank
 * line is left behind.
 *
 * `vue/no-deprecated-data-object-declaration`: ESLint's text `function() {\nreturn <object>;\n}` becomes
 * `() => (<object>)`, with `<object>` the original text, so its lines keep their indentation (ESLint's form
 * puts `return` in column 0 and leaves the object's lines under-indented). The arrow form is safe because
 * Vue 2.7 calls `data` with the instance as `this` and as the argument, and the original expression ran once,
 * before any instance existed, so it can use neither: a module-level object literal gives every instance the
 * same shape as before. (An arrow function also keeps the surrounding `this`, where `function` would give it the
 * instance.) Only a text that is exactly that prefix, a non-empty body and that suffix is rewritten; for any
 * other the predicate returns false, so the finding stays and nothing half-rewritten is applied.
 */
export function shouldFix(message, wanted) {
  if (!wanted.has(message.ruleId)) return false;
  if (message.ruleId === SLOT_RULE) message.fix.text = message.fix.text.trim();
  if (message.ruleId === DATA_RULE) {
    const { text } = message.fix;
    const hasBody = text.length > FUNCTION_OPEN.length + FUNCTION_CLOSE.length;
    if (!hasBody || !text.startsWith(FUNCTION_OPEN) || !text.endsWith(FUNCTION_CLOSE)) return false;
    message.fix.text = `() => (${text.slice(FUNCTION_OPEN.length, -FUNCTION_CLOSE.length)})`;
  }
  return true;
}

const unsafeMessage = (rule) =>
  `${rule} is not safe on Vue 2.7: its fix writes Vue 3-only syntax, or it has none. Allowed: ${[...SAFE_ON_VUE2].sort(byCodeUnit).join(', ')}`;

/**
 * @param {string[]} argv
 * @returns {{ rules: string[], dryRun: boolean, root: string | undefined }}
 * @throws {Error} on an unknown option, a positional argument, or `--rule` or `--root` without a value
 */
export function parseArgs(argv) {
  const { values } = parseNodeArgs({
    args: argv,
    options: { rule: { type: 'string', multiple: true }, 'dry-run': { type: 'boolean' }, root: { type: 'string' } },
    allowPositionals: false,
  });
  return { rules: values.rule ?? [], dryRun: values['dry-run'] === true, root: values.root };
}

/** The findings of `rules` in `results`, one count per rule (0 when none), and `fatal` when a file did not parse. */
function countRules(results, rules) {
  const seen = countByRule(results);
  const counts = Object.fromEntries([...rules].sort(byCodeUnit).map((rule) => [rule, seen[rule] ?? 0]));
  if (seen.fatal) counts.fatal = seen.fatal;
  return counts;
}

/** The messages of `after` that `before` did not have, counting repeats. */
function addedErrors(before, after) {
  const known = new Map();
  for (const message of before) known.set(message, (known.get(message) ?? 0) + 1);
  return after.filter((message) => {
    const left = known.get(message) ?? 0;
    known.set(message, left - 1);
    return left <= 0;
  });
}

const sfcErrors = (source, file) => parseSfc({ source, filename: file }).errors;

/**
 * Throws when ESLint's fixed text for `file` (`result.output`) is worse than the original text `before`:
 * ESLint cannot parse it any more (its last pass over the fixed text reports a fatal message), or, for a
 * `.vue` file, the SFC parser reports an error the original did not have.
 */
function assertStillParses(file, before, result) {
  const fatal = result.messages.find((message) => message.fatal);
  if (fatal) throw new Error(`ESLint can no longer parse it: ${fatal.message}`);
  if (!file.endsWith('.vue')) return;
  const added = addedErrors(sfcErrors(before, file), sfcErrors(result.output, file));
  if (added.length > 0) throw new Error(`the SFC parser reports: ${added.join('; ')}`);
}

/**
 * Fixes `rules` in the `.js` and `.vue` files under `<root>/src`, and writes them unless `dryRun`.
 *
 * Resolves to
 *  - `before` and `after`: the findings per rule (every rule asked for is present, 0 when none), as the lint
 *    counts them before and after the fixes, plus `fatal` for files ESLint cannot parse, when there are any;
 *  - `changed`: the files (relative to `root`, `/` separators, sorted) written, or in a dry run the files a real
 *    run would write. Empty when any file failed;
 *  - `failed`: the files that failed, sorted, and `failures` the same with each one's message
 *    (`{ file, message }`). A file fails when its fixed text does not parse again, in which case nothing is
 *    written at all, or when its write throws, in which case the other files are still written.
 *
 * Throws when a rule is outside `SAFE_ON_VUE2`, or when ESLint cannot lint the tree (no file under `src/`).
 * `write(absPath, text)` and `makeLinter(options)` default to `fs.writeFileSync` and `vue3Linter`; they are
 * seams for tests.
 * @param {{ root: string, rules: Iterable<string>, dryRun?: boolean,
 *   write?: (path: string, text: string) => void, makeLinter?: typeof vue3Linter }} options
 */
export async function fixTree({ root, rules, dryRun = false, write = writeFileSync, makeLinter = vue3Linter }) {
  const wanted = new Set(rules);
  for (const rule of wanted) if (!SAFE_ON_VUE2.has(rule)) throw new Error(unsafeMessage(rule));

  const cwd = resolve(root);
  const before = countRules(await makeLinter({ cwd }).lintFiles(['src']), wanted);
  const results = await makeLinter({ cwd, fix: (message) => shouldFix(message, wanted) }).lintFiles(['src']);
  const after = countRules(results, wanted);

  const outputs = [];
  const failures = [];
  for (const result of results) {
    if (result.output === undefined) continue;
    const original = readFileSync(result.filePath, 'utf8');
    if (result.output === original) continue;
    const file = relative(cwd, result.filePath).split(sep).join('/');
    try {
      assertStillParses(file, original, result);
      outputs.push({ file, text: result.output });
    } catch (error) {
      failures.push(failure(file, error));
    }
  }
  outputs.sort((a, b) => byCodeUnit(a.file, b.file));

  // One file that does not parse after its fix stops the run: the others were fixed by the same rules.
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
  return { before, after, changed, failed: failures.map(({ file }) => file), failures };
}

function renderReport({ dryRun, rules, before, after, changed, failures }) {
  const lines = [`# Lint fix${dryRun ? ' (dry run)' : ''}`, '', '| Rule | Before | After |', '| --- | ---: | ---: |'];
  for (const rule of [...rules].sort(byCodeUnit)) lines.push(`| ${code(rule)} | ${before[rule]} | ${after[rule]} |`);
  if ((before.fatal ?? 0) + (after.fatal ?? 0) > 0) lines.push(`| fatal | ${before.fatal ?? 0} | ${after.fatal ?? 0} |`);

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
 * Fixes the rules named by `--rule` in the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)` and
 * `makeLinter(options)` default to `fs.writeFileSync` and `vue3Linter`; they are seams for tests. The report
 * goes to `out`, usage errors and a one-line summary of what failed go to `err`. Rejects when ESLint cannot lint
 * the tree at all (the CLI prints the message and exits 1).
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, makeLinter?: typeof vue3Linter,
 *   out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, write = writeFileSync, makeLinter = vue3Linter, out = process.stdout, err = process.stderr } = deps;

  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  if (options.rules.length === 0) {
    err.write(`no --rule given: name each rule to fix\n${USAGE}\n`);
    return 2;
  }
  const unsafe = options.rules.find((rule) => !SAFE_ON_VUE2.has(rule));
  if (unsafe !== undefined) {
    err.write(`${unsafeMessage(unsafe)}\n${USAGE}\n`);
    return 2;
  }
  const root = resolve(options.root ?? defaultRoot);
  if (!hasSrc(root)) {
    err.write(`${root} is not a directory with a src/ folder\n${USAGE}\n`);
    return 2;
  }

  const { before, after, changed, failures } = await fixTree({ root, rules: options.rules, dryRun: options.dryRun, write, makeLinter });
  out.write(renderReport({ dryRun: options.dryRun, rules: new Set(options.rules), before, after, changed, failures }));

  if (failures.length > 0) {
    const effect = changed.length > 0 ? '' : options.dryRun ? '; a real run would write nothing' : '; nothing was written';
    err.write(`lint-fix: ${failures.length} file(s) failed${effect}; see the Failed section of the report\n`);
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
