// Writes the spaces that Vue 3 would drop at the edge of an element as `{{ " " }}`, ahead of Vue 3. Run it from the
// repo root:
//
//   npm run codemod:explicit-spaces -- --dry-run        # report only
//   npm run codemod:explicit-spaces                     # write the spaces
//   npm run codemod:explicit-spaces -- --root <dir>     # another checkout (a portal branch)
//
// Whitespace at the start or end of an element, beside an interpolation, is one space on Vue 2.7 and nothing on
// Vue 3, so "up 3.06" would run together as "up3.06". An interpolation of a space is the same text on both. Where
// it is needed is `lostSpaces` (`semantics-scan.mjs`), the test that the `inlineSpaces` count of
// `npm run tool:semantics-scan` uses. Some of its places would look the same without the space; there the
// interpolation changes nothing.
//
// Only the whitespace itself is replaced, by `{{ " " }}`. When it holds a line break, it moves inside the braces,
// so that every line of the file, and its indentation, stays where it is:
//
//   <span>                  <span>{{
//       {{ x }}      ->         " " }}{{ x }}{{ " "
//   </span>                 }}</span>
//
// Anywhere else the line break would be a second space: Vue 2.7 and Vue 3 both keep whitespace between two
// interpolations, and 2.7 also keeps it at the edge of the element. Inside the braces it is part of the expression.
//
// A place where Vue 2.7 renders no space today, or where the interpolation would change anything else it renders,
// is not edited. It is listed under Left, and `npm run tool:semantics-scan` still counts it. The one known cause is
// a comment between the whitespace and the interpolation: it cuts the text in two, and 2.7 drops a whitespace-only
// piece at the edge of an element.
//
// Only the template block of a `.vue` file is edited. Every change is a text splice at a position from the parser:
// bytes outside it stay as they were, line endings (LF or CRLF) included, and nothing is reformatted.
//
// Every changed file is checked before anything is written: no SFC error the original did not have, the text
// outside the template block as it was, and the template compiled by Vue 2.7 without errors to the same render, the
// added interpolations read as the spaces they are (see `renderWithSpaces`). A file that fails, or whose template
// does not compile on 2.7 to begin with, is listed under Failed, and then nothing at all is written in that run, a
// dry run included (a real run would write nothing). A second run changes nothing.
//
// The report is markdown on stdout: the totals, each element with the sides it gets a space on, what is left,
// failures, and the files changed (or, in a dry run, that would change).
//
// With `NODE_ENV=production` the 2.7 compiler collects no errors, so the codemod refuses to run.
//
// Exit codes: 0 done (what is left is reported, not a failure), 1 a file failed (it did not pass the checks, or a
// write failed), 2 usage error (bad arguments, a root without a `src/` folder, `NODE_ENV=production`).
import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from 'vue/compiler-sfc';
import vueEslintParser from 'vue-eslint-parser';
import { renderOf } from './compare-render.mjs';
import { readSources } from './component-graph.mjs';
import { cell, code, failure, hasSrc, parseArgs } from './register-components.mjs';
import { byCodeUnit, splice } from './register-write.mjs';
import { lostSpaces } from './semantics-scan.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/explicit-spaces.mjs [--root <dir>] [--dry-run]';

/** Whitespace with a line break in it, as the source has it: an entity (`&#32;`) is not code and cannot move into the braces. */
const LINE_BREAK = /^[\t\f ]*[\r\n][\t\r\n\f ]*$/;

/** The hash at the end of a compiled `_u([ ...slots ], null, false, <hash>)`. */
const SLOTS_HASH = /,null,false,\d+\)/g;

/** The interpolation that replaces the whitespace `raw` on `side` of an element; a line break stays next to the tag. */
function spaceFor(raw, side) {
  const inside = LINE_BREAK.test(raw) ? raw : ' ';
  return side === 'leading' ? `{{${inside}" " }}` : `{{ " "${inside}}}`;
}

/**
 * What Vue 2.7 compiles the template of `source` to, with every interpolated `" "` read as the text `" "`, so that
 * two templates that differ by the spaces written as interpolations give the same string. The compiler writes an
 * interpolation as `_vm._s(" ")` and a text as `" "` in the same expression, and `_s` of a string is that string.
 * The slots of a component with `v-if` end in a hash of their own compiled code, which is left out: it differs when
 * that code does, and the code itself is compared.
 * @throws {Error} when the template does not compile without errors
 */
function renderWithSpaces(source, file) {
  const { template } = parseSfc({ source, filename: file });
  if (!template) throw new Error('the SFC parser finds no `<template>` block');
  const { render, staticRenderFns, errors } = renderOf(template.content, { filename: file });
  if (errors.length > 0) throw new Error(`the template does not compile on Vue 2.7: ${errors.join('; ')}`);
  return JSON.stringify([render, ...staticRenderFns].map((fn) => fn.replaceAll('_vm._s(" ")', '" "').replace(SLOTS_HASH, ')')));
}

/** The text of `source` outside its template block. */
function outsideTemplate(source, file) {
  const { start, end } = parseSfc({ source, filename: file }).template;
  return [source.slice(0, start), source.slice(end)];
}

/**
 * A space: the element's position (line from 1, column from 0) and tag, and the side of it.
 * @typedef {{ line: number, column: number, tag: string, side: 'leading' | 'trailing' }} Place
 */

/**
 * Writes the spaces Vue 3 would drop in the template of the `.vue` file `source` as interpolations (see the top of
 * this file).
 * @param {string} source
 * @param {string} file the file's name, for the parsers
 * @returns {{ source: string, added: Place[], left: Place[] }} `added` and `left` in document order; `left` are the
 *   places where the interpolation would change what Vue 2.7 renders, not edited
 * @throws {Error} when the file or its template does not parse, or the template does not compile on Vue 2.7
 */
export function addSpaces(source, file) {
  // `parser: false`: the script is not needed.
  const body = vueEslintParser.parseForESLint(source, { parser: false, ecmaVersion: 2022, sourceType: 'module', filePath: file }).ast.templateBody;
  const places = body ? lostSpaces(body) : [];
  if (places.length === 0) return { source, added: [], left: [] };

  const before = renderWithSpaces(source, file);
  const edits = [];
  const added = [];
  const left = [];
  for (const { element, side, blank } of places) {
    const [start, end] = blank.range;
    const edit = { start, end, text: spaceFor(source.slice(start, end), side) };
    const sameOn27 = renderWithSpaces(splice(source, [edit]), file) === before;
    if (sameOn27) edits.push(edit);
    (sameOn27 ? added : left).push({ ...element.loc.start, tag: element.rawName, side });
  }
  return { source: splice(source, edits), added, left };
}

/** Throws when `after`, the new text of `file`, differs from `before` by more than spaces written as interpolations. */
function assertOnlySpaces(file, before, after) {
  const errorsOf = (source) => parseSfc({ source, filename: file }).errors;
  const known = errorsOf(before);
  const added = errorsOf(after).filter((message) => !known.includes(message));
  if (added.length > 0) throw new Error(`the SFC parser reports: ${added.join('; ')}`);
  if (renderWithSpaces(after, file) !== renderWithSpaces(before, file)) throw new Error('the new template renders something else on Vue 2.7');
  if (outsideTemplate(after, file).join('\0') !== outsideTemplate(before, file).join('\0')) throw new Error('it changed outside its template');
}

/**
 * Adds the spaces to the `.vue` files under `<root>/src`, and writes them unless `dryRun`.
 *
 * Returns
 *  - `added` and `left`: every space added and every place left, as in `addSpaces`, with its `file`;
 *  - `planned`: how many files have a space to add;
 *  - `changed`: the files (relative to `root`, sorted) written, or in a dry run the files a real run would write.
 *    Empty when any file failed its checks;
 *  - `failures`: `{ file, message }` of the files that failed, sorted. A file fails when it does not parse or does
 *    not pass its checks, in which case nothing is written at all, or when its write throws, in which case the
 *    other files are still written.
 */
function spaceTree({ root, dryRun, write, add }) {
  const added = [];
  const left = [];
  const failures = [];
  const outputs = [];
  for (const [file, source] of readSources(root)) {
    if (!file.endsWith('.vue')) continue;
    try {
      const result = add(source, file);
      if (result.source !== source) {
        assertOnlySpaces(file, source, result.source);
        outputs.push({ file, text: result.source });
      }
      added.push(...result.added.map((place) => ({ file, ...place })));
      left.push(...result.left.map((place) => ({ file, ...place })));
    } catch (error) {
      failures.push(failure(file, error));
    }
  }

  // One file that fails its checks stops the run: the others were changed by the same rules.
  const changed = [];
  if (failures.length === 0) {
    for (const { file, text } of outputs) {
      try {
        if (!dryRun) write(join(root, file), text);
        changed.push(file);
      } catch (error) {
        failures.push(failure(file, `write failed: ${error instanceof Error ? error.message : error}`));
      }
    }
  }
  failures.sort((a, b) => byCodeUnit(a.file, b.file));
  return { added, left, planned: outputs.length, changed, failures };
}

const LEFT_NOTE =
  'Vue 2.7 renders no space in these places today, or an interpolation there would change something else it renders, so they are not edited. Look for a comment between the whitespace and the interpolation, and decide by hand.';

/** One row per element, with its sides. */
function elementRows(places) {
  const rows = new Map();
  for (const { file, line, column, tag, side } of places) {
    const key = `${file}:${line}:${column}`;
    if (rows.has(key)) rows.get(key).sides.push(side);
    else rows.set(key, { file, line, tag, sides: [side] });
  }
  return [...rows.values()];
}

function placeTable(rows) {
  if (rows.length === 0) return ['None.'];
  const header = ['| file:line | element | sides |', '| --- | --- | --- |'];
  return [...header, ...rows.map(({ file, line, tag, sides }) => `| ${cell(code(`${file}:${line}`))} | ${cell(code(`<${tag}>`))} | ${sides.join(' and ')} |`)];
}

function renderReport({ dryRun, added, left, planned, changed, failures }) {
  const elements = elementRows(added);
  const lines = [
    `# Explicit spaces${dryRun ? ' (dry run)' : ''}`,
    '',
    '| Total | Count |',
    '| --- | ---: |',
    `| Spaces | ${added.length} |`,
    `| Elements | ${elements.length} |`,
    `| Files to change | ${planned} |`,
    `| Left | ${left.length} |`,
    '',
    '## Spaces',
    '',
    ...placeTable(elements),
    '',
    '## Left',
    '',
  ];
  if (left.length > 0) lines.push(LEFT_NOTE, '');
  lines.push(...placeTable(elementRows(left)));

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
 * Adds the spaces in the tree under `root`, and writes them unless `--dry-run`.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. `write(absPath, contents)` and
 * `add(source, file)` default to `fs.writeFileSync` and `addSpaces`; they are seams for tests. The report goes to
 * `out`, usage errors and a one-line summary of what failed go to `err`.
 *
 * @param {string[]} argv
 * @param {{ root?: string, write?: (path: string, contents: string) => void, add?: typeof addSpaces,
 *   out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, write = writeFileSync, add = addSpaces, out = process.stdout, err = process.stderr } = deps;
  if (process.env.NODE_ENV === 'production') {
    err.write('explicit-spaces: NODE_ENV=production makes the Vue 2.7 compiler drop template compile errors, which the checks need. Unset NODE_ENV, or set it to another value, and run again.\n');
    return 2;
  }

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

  const tree = spaceTree({ root, dryRun: options.dryRun, write, add });
  out.write(renderReport({ dryRun: options.dryRun, ...tree }));

  if (tree.failures.length > 0) {
    const effect = tree.changed.length > 0 ? '' : options.dryRun ? '; a real run would write nothing' : '; nothing was written';
    err.write(`explicit-spaces: ${tree.failures.length} file(s) failed${effect}; see the Failed section of the report\n`);
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
