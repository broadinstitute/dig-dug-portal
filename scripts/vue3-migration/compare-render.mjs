// Proves that an edit to a `<template>` leaves what Vue 2.7 renders unchanged. Paths resolve against `--root`
// (default: this repo), so it runs from anywhere:
//
//   npm run tool:compare-render -- --base <ref> <file.vue> [<file.vue> ...]
//   npm run tool:compare-render -- --base origin/dev/vue3 --root <dir> src/components/Thing.vue
//
// For each file it compiles the `<template>` as it is at `<ref>` (`git show <ref>:<path>`) and as it is in the
// working tree, and compares the two compiled results: the `render` function and the `staticRenderFns`. Each file
// is `same` or `differs`; for a difference the report shows both sides.
//
// A template that does not compile has no render: `compileTemplate` replaces it with a stub, the same for every
// such template, so comparing stubs would call two different broken templates `same`. A side with compile errors
// is never `same`: the file is `differs`, and the report shows that side's errors, not the stub.
//
// The compile matches the build: `compileTemplate` from `vue/compiler-sfc`, which is what vue-loader 15.10 calls
// on Vue 2.7, with the options Vue CLI 4 gives it (`whitespace: "condense"`, `transformAssetUrls`). The template
// block is read with the SFC parser the build uses, so it is deindented the same way.
//
// `compileTemplate` returns a script, not separate pieces:
//
//   var render = function render(){...}
//   var staticRenderFns = [function (){...}, ...]
//   render._withStripped = true
//
// Nothing is run. The script is parsed with Babel, and the source text of the `render` initializer and of each
// element of the `staticRenderFns` array is cut out by position, so the strings are exactly what the compiler wrote.
//
// A file that exists on one side only, or has no `<template>` on one side (Task 6 turns three empty templates into a
// `render()` option), is `differs` with a note. A file on neither side is a usage error. Files are paths under
// `--root` (default: this repo).
//
// With `NODE_ENV=production` the 2.7 compiler collects no errors, so the tool refuses to run (exit 2) instead of
// passing templates that do not compile.
//
// The report is markdown on stdout, usage errors go to stderr. Nothing is written to disk.
//
// Exit codes: 0 every file is the same, 1 some file differs, 2 usage error (bad arguments, an unknown ref, a file on
// neither side, git not usable, `NODE_ENV=production`).
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { parse as parseBabel } from '@babel/parser';
import { compileTemplate, parse as parseSfc } from 'vue/compiler-sfc';
import { cell, code, failure } from './register-components.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/compare-render.mjs --base <ref> [--root <dir>] <file.vue> [<file.vue> ...]';

/** The most `git show` may print for one file. */
const MAX_BUFFER = 64 * 1024 * 1024;

// ---- compile -------------------------------------------------------------------------------

/** Splits the script `compileTemplate` returns into the source of `render` and of each static render function. */
function splitCompiled(script) {
  const { program } = parseBabel(script, { sourceType: 'module' });
  let render;
  let staticRenderFns;
  for (const statement of program.body) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const { id, init } of statement.declarations) {
      if (id.type !== 'Identifier') continue;
      if (id.name === 'render') render = script.slice(init.start, init.end);
      if (id.name === 'staticRenderFns' && init?.type === 'ArrayExpression') {
        staticRenderFns = init.elements.map(({ start, end }) => script.slice(start, end));
      }
    }
  }
  if (render === undefined || staticRenderFns === undefined) {
    throw new Error('the compiled template has no `var render` and `var staticRenderFns` to split out');
  }
  return { render, staticRenderFns };
}

/**
 * What Vue 2.7 compiles the template source `source` to (the text between `<template>` and `</template>`).
 *
 * When `errors` is not empty the template did not compile, and `render` is not its render: `compileTemplate` swaps
 * in the stub `function () {}` (and `staticRenderFns` is `[]`), the same for every such template. Check `errors`
 * before trusting `render`.
 * @param {string} source
 * @param {{ filename?: string }} [options]
 * @returns {{ render: string, staticRenderFns: string[], errors: string[] }}
 */
export function renderOf(source, { filename = 'template.vue' } = {}) {
  const compiled = compileTemplate({
    source,
    filename,
    prettify: false,
    transformAssetUrls: true,
    compilerOptions: { whitespace: 'condense' },
  });
  const errors = compiled.errors.map((error) => (typeof error === 'string' ? error : error.msg));
  return { ...splitCompiled(compiled.code), errors };
}

/** How the report shows a result of `renderOf`: its errors if it has any (its `render` is then a stub), else its render. */
const viewOf = (result) => (result.errors.length > 0 ? { errors: result.errors } : { code: result.render });

/**
 * The parts in which two results of `renderOf` differ, each `{ label, base, head }` with the two sides as the report
 * shows them (`{ code }` or `{ errors }`); none when the results are equal. A result with compile errors is never
 * equal to anything, itself included: its `render` is the compiler's stub, which says nothing about the template.
 */
export function compareRenders(base, head) {
  if (base.errors.length > 0 || head.errors.length > 0) {
    return [{ label: 'compile errors', base: viewOf(base), head: viewOf(head) }];
  }
  const parts = [];
  if (base.render !== head.render) parts.push({ label: 'render', base: { code: base.render }, head: { code: head.render } });
  const fns = (result) => ({ code: result.staticRenderFns.map((fn, i) => `// staticRenderFns[${i}]\n${fn}`).join('\n') || '(none)' });
  if (JSON.stringify(base.staticRenderFns) !== JSON.stringify(head.staticRenderFns)) {
    parts.push({ label: 'static render functions', base: fns(base), head: fns(head) });
  }
  return parts;
}

// ---- reading the two sides -----------------------------------------------------------------

/**
 * One side of a file: `{ kind: 'missing' }`, `{ kind: 'no-template' }`, `{ kind: 'failed', message }`, or
 * `{ kind: 'compiled', ...renderOf }`.
 */
function sideOf(source, file) {
  if (source === null) return { kind: 'missing' };
  const { template } = parseSfc({ source, filename: file });
  if (!template) return { kind: 'no-template' };
  try {
    return { kind: 'compiled', ...renderOf(template.content, { filename: file }) };
  } catch (error) {
    return { kind: 'failed', message: failure(file, error).message };
  }
}

/** The text of `file` in the working tree under `root`, or null when it is not there. */
function readWorkingTree(root, file) {
  try {
    return readFileSync(resolve(root, file), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'EISDIR') return null;
    throw error;
  }
}

/** Runs git in `root`; the result of `spawnSync`. Throws when git cannot be started. */
function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (result.error) throw new Error(`cannot run git: ${result.error.message}`);
  return result;
}

/** The text of `file` at `ref`, or null when the commit has no such file. `file` is a path under `root`. */
function readAtRef(root, ref, file) {
  const result = git(root, ['show', `${ref}:./${file}`]);
  return result.status === 0 ? result.stdout : null;
}

// ---- comparing a file ----------------------------------------------------------------------

/** Why `side` has no render to compare, for the notes (`no <template> in working tree`); null for a side that compiled. */
function problemOf(side, where) {
  if (side.kind === 'missing') return `not in ${where}`;
  if (side.kind === 'no-template') return `no \`<template>\` in ${where}`;
  if (side.kind === 'failed') return `compile failed in ${where}: ${side.message}`;
  return null;
}

const hasErrors = (side) => side.kind === 'compiled' && side.errors.length > 0;

/**
 * Compares the two sides of one file. Only two sides that compiled without errors can be `same`: a template with
 * errors has no render (see `renderOf`), so it is `differs` even when the other side is the same text.
 * @returns {{ same: boolean, note: string, parts: { label: string, base: object, head: object }[] }} each side of a
 *   part is `{ code }`, `{ errors }` or `{ note }`
 */
function compareSides(base, head, ref) {
  if (base.kind === 'no-template' && head.kind === 'no-template') {
    return { same: true, note: 'no `<template>` on either side', parts: [] };
  }
  const sides = [[base, ref], [head, 'working tree']];
  if (sides.every(([side]) => side.kind === 'compiled' && !hasErrors(side))) {
    const parts = compareRenders(base, head);
    return { same: parts.length === 0, note: parts.map(({ label }) => label).join(', '), parts };
  }
  // Not comparable. Show each side as its render, its errors or the reason it has none.
  const view = (side, place) => (side.kind === 'compiled' ? viewOf(side) : { note: problemOf(side, place) });
  const errored = sides.filter(([side]) => hasErrors(side)).map(([, place]) => place);
  const problems = [errored.length > 0 ? `compile errors in ${errored.join(' and ')}` : null, ...sides.map(([side, place]) => problemOf(side, place))];
  return {
    same: false,
    note: problems.filter(Boolean).join('; '),
    parts: [{ label: errored.length > 0 ? 'compile errors' : 'render', base: view(base, ref), head: view(head, 'working tree') }],
  };
}

// ---- report --------------------------------------------------------------------------------

/** A fenced block for `text`, fenced with more backticks than any run in it. */
function fenced(text, language = 'js') {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(([run]) => run.length));
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return [`${fence}${language}`, text, fence].join('\n');
}

/** One side of a part: its code, or its compile errors (never the stub render), or the note that it has nothing. */
function sideLines(title, view) {
  let body = [`_${view.note}_`];
  if (view.code !== undefined) body = [fenced(view.code)];
  if (view.errors !== undefined) body = ['_compile errors:_', '', fenced(view.errors.join('\n'), 'text')];
  return ['', `${title}:`, '', ...body];
}

function renderReport(ref, results) {
  const differing = results.filter(({ same }) => !same);
  const lines = [
    '# Compare render',
    '',
    `Base: ${code(ref)}. Each file's \`<template>\` is compiled by Vue 2.7 at the base and in the working tree.`,
    '',
    '| file | result | detail |',
    '| --- | --- | --- |',
  ];
  for (const { file, same, note } of results) lines.push(`| ${cell(code(file))} | ${same ? 'same' : 'differs'} | ${cell(note)} |`);
  lines.push('', differing.length === 0 ? `All ${results.length} file(s) are the same.` : `${differing.length} of ${results.length} file(s) differ.`);

  if (differing.length > 0) {
    lines.push('', '## Differences');
    for (const { file, parts } of differing) {
      lines.push('', `### ${code(file)}`);
      for (const { label, base, head } of parts) {
        lines.push('', `#### ${label}`, ...sideLines(`Base (${code(ref)})`, base), ...sideLines('Working tree', head));
      }
    }
  }
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

// ---- command line --------------------------------------------------------------------------

/** What `run` throws for a usage error; the message is what the user sees above the usage line. */
class UsageError extends Error {}
const usage = (message) => {
  throw new UsageError(message);
};

/**
 * @param {string[]} argv
 * @returns {{ base: string, root: string | undefined, files: string[] }}
 * @throws {UsageError}
 */
function parseArgs(argv) {
  let parsed;
  try {
    parsed = parseNodeArgs({ args: argv, options: { base: { type: 'string' }, root: { type: 'string' } }, allowPositionals: true });
  } catch (error) {
    return usage(error.message);
  }
  const { base, root } = parsed.values;
  if (base === undefined) usage('--base <ref> is required');
  if (base.startsWith('-')) usage(`${JSON.stringify(base)} is not a git ref`);
  if (parsed.positionals.length === 0) usage('give at least one .vue file');
  return { base, root, files: parsed.positionals };
}

/** `file` (relative to `root`, or absolute and inside it) as a forward-slash path relative to `root`. */
function underRoot(root, file) {
  const path = relative(root, resolve(root, file));
  if (path === '' || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) return usage(`${file} is not a file under ${root}`);
  return path.split(sep).join('/');
}

/**
 * Compares each file's `<template>` at `--base` with the working tree.
 *
 * `root` defaults to the repo root and `--root <dir>` overrides it. The report goes to `out`, usage errors to `err`.
 *
 * @param {string[]} argv
 * @param {{ root?: string, out?: { write: (text: string) => unknown }, err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const { root: defaultRoot = repoRoot, out = process.stdout, err = process.stderr } = deps;
  // With NODE_ENV=production the 2.7 compiler collects no errors, so a template that does not compile would pass.
  if (process.env.NODE_ENV === 'production') {
    err.write('compare-render: NODE_ENV=production makes the Vue 2.7 compiler drop template compile errors, so a template that does not compile would go unseen. Unset NODE_ENV, or set it to another value, and run again.\n');
    return 2;
  }
  try {
    const options = parseArgs(argv);
    const root = resolve(options.root ?? defaultRoot);
    if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) usage(`${root} is not a directory`);
    const ref = options.base;
    if (git(root, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]).status !== 0) {
      usage(`${ref} is not a commit in the git repository at ${root}`);
    }

    const results = options.files.map((arg) => {
      const file = underRoot(root, arg);
      const before = readAtRef(root, ref, file);
      const after = readWorkingTree(root, file);
      if (before === null && after === null) usage(`${file} is neither in ${ref} nor in the working tree`);
      return { file, ...compareSides(sideOf(before, file), sideOf(after, file), ref) };
    });

    out.write(renderReport(ref, results));
    return results.every(({ same }) => same) ? 0 : 1;
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }
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
      process.exitCode = 2;
    },
  );
}
