import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareRenders, renderOf, run } from './compare-render.mjs';

const SCRIPT = fileURLToPath(new URL('./compare-render.mjs', import.meta.url));

// ---- renderOf -------------------------------------------------------------------------------

test('renderOf treats &lt; and a bare < in text alike', () => {
  const bare = renderOf('<p>a < b</p>');
  const entity = renderOf('<p>a &lt; b</p>');
  assert.deepEqual(bare.errors, []);
  assert.deepEqual(entity.errors, []);
  assert.equal(bare.render, entity.render);
  assert.deepEqual(bare.staticRenderFns, entity.staticRenderFns);
});

test('renderOf sees a real change', () => {
  assert.notEqual(renderOf('<p>a</p>').render, renderOf('<p>b</p>').render);
});

test('renderOf returns the render function and the static ones as separate function sources', () => {
  const { render, staticRenderFns, errors } = renderOf('<div><p>static</p><p>{{ x }}</p></div>');
  assert.deepEqual(errors, []);
  assert.match(render, /^function render\(\)\{/);
  assert.match(render, /_vm\.x/);
  assert.equal(staticRenderFns.length, 0);

  const hoisted = renderOf('<div><p>static</p></div>');
  assert.match(hoisted.render, /_vm\._m\(0\)/);
  assert.equal(hoisted.staticRenderFns.length, 1);
  assert.match(hoisted.staticRenderFns[0], /^function \(\)\{/);
  assert.match(hoisted.staticRenderFns[0], /static/);
});

test('renderOf reports compile errors as plain strings', () => {
  const { errors } = renderOf('<p>a</p><p>b</p>');
  assert.equal(errors.length, 1);
  assert.equal(typeof errors[0], 'string');
  assert.match(errors[0], /exactly one root element/);
});

test('renderOf keeps asset paths in the render, so a changed src is a change', () => {
  assert.notEqual(renderOf('<div><img src="./a.png"></div>').staticRenderFns[0], renderOf('<div><img src="./b.png"></div>').staticRenderFns[0]);
});

// ---- compareRenders -------------------------------------------------------------------------

test('compareRenders lists the parts that differ, and nothing for equal results', () => {
  const a = renderOf('<p>a</p>');
  assert.deepEqual(compareRenders(a, renderOf('<p>a</p>')), []);
  assert.deepEqual(compareRenders(a, renderOf('<p>b</p>')).map(({ label }) => label), ['render']);

  const hoistedA = renderOf('<div><p>a</p></div>');
  const hoistedB = renderOf('<div><p>b</p></div>');
  assert.deepEqual(compareRenders(hoistedA, hoistedB).map(({ label }) => label), ['static render functions']);

  const broken = renderOf('<p>a</p><p>b</p>');
  assert.ok(compareRenders(a, broken).map(({ label }) => label).includes('compile errors'));
});

// ---- the CLI --------------------------------------------------------------------------------

/** Runs `git` in `cwd`, for building the temp repository. Only local config is set; global git config is never touched. */
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

const writeIn = (root, file, contents) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), contents);
};

/** An SFC with `template` (the text between `<template>` and `</template>`, or null for no template block). */
const sfc = (template) => `${template === null ? '' : `<template>${template}</template>\n`}<script>\nexport default { name: "T" };\n</script>\n`;

let root;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'compare-render-'));
  git(root, 'init', '-q');
  git(root, 'config', 'user.email', 'compare-render@example.invalid');
  git(root, 'config', 'user.name', 'compare-render test');
  git(root, 'config', 'commit.gpgsign', 'false');
  writeIn(root, 'src/Unchanged.vue', sfc('<div><p>a</p></div>'));
  writeIn(root, 'src/Edited.vue', sfc('<p>a</p>'));
  writeIn(root, 'src/Entity.vue', sfc('<p>a < b</p>'));
  writeIn(root, 'src/Emptied.vue', sfc(''));
  writeIn(root, 'src/Gone.vue', sfc('<p>gone</p>'));
  git(root, 'add', '.');
  git(root, 'commit', '-q', '-m', 'base');

  writeIn(root, 'src/Edited.vue', sfc('<p>b</p>'));
  writeIn(root, 'src/Entity.vue', sfc('<p>a &lt; b</p>'));
  // What Task 6 does to an empty template: the block goes, a render function takes over.
  writeIn(root, 'src/Emptied.vue', sfc(null));
  rmSync(join(root, 'src/Gone.vue'));
  writeIn(root, 'src/Added.vue', sfc('<p>new</p>'));
});

after(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Runs the CLI in-process against the temp repo; returns the exit code and what it wrote. */
async function cli(...argv) {
  let out = '';
  let err = '';
  const exitCode = await run(argv, { root, out: { write: (text) => (out += text) }, err: { write: (text) => (err += text) } });
  return { exitCode, out, err };
}

test('cli reports differs and exits 1', () => {
  // The real executable, so the exit status and the streams are the process's own.
  const { status, stdout, stderr } = spawnSync(process.execPath, [SCRIPT, '--root', root, '--base', 'HEAD', 'src/Edited.vue'], { encoding: 'utf8' });
  assert.equal(status, 1, stderr);
  assert.match(stdout, /`src\/Edited\.vue` \| differs/);
  assert.match(stdout, /_vm\._v\("a"\)/, 'the base render is shown');
  assert.match(stdout, /_vm\._v\("b"\)/, 'the working-tree render is shown');
  assert.equal(stderr, '');
});

test('cli reports same and exits 0 when the render is unchanged', async () => {
  const { exitCode, out, err } = await cli('--base', 'HEAD', 'src/Unchanged.vue', 'src/Entity.vue');
  assert.equal(exitCode, 0, err);
  assert.match(out, /`src\/Unchanged\.vue` \| same/);
  assert.match(out, /`src\/Entity\.vue` \| same/);
  assert.doesNotMatch(out, /differs/);
});

test('cli exits 1 when any file differs, and lists every file', async () => {
  const { exitCode, out } = await cli('--base', 'HEAD', 'src/Unchanged.vue', 'src/Edited.vue');
  assert.equal(exitCode, 1);
  assert.match(out, /`src\/Unchanged\.vue` \| same/);
  assert.match(out, /`src\/Edited\.vue` \| differs/);
});

test('cli reports a file that lost its <template> as differs, with a note, not a crash', async () => {
  const { exitCode, out, err } = await cli('--base', 'HEAD', 'src/Emptied.vue');
  assert.equal(exitCode, 1, err);
  assert.match(out, /`src\/Emptied\.vue` \| differs \| no `<template>` in working tree/);
  // What 2.7 rendered before: the empty template's root element.
  assert.match(out, /_c\("div"\)/);
});

test('cli reports a file missing on one side as differs, with a note', async () => {
  const gone = await cli('--base', 'HEAD', 'src/Gone.vue');
  assert.equal(gone.exitCode, 1, gone.err);
  assert.match(gone.out, /`src\/Gone\.vue` \| differs \| not in working tree/);

  const added = await cli('--base', 'HEAD', 'src/Added.vue');
  assert.equal(added.exitCode, 1, added.err);
  assert.match(added.out, /`src\/Added\.vue` \| differs \| not in HEAD/);
});

test('cli exits 2 with the usage line for bad arguments', async () => {
  const bad = [
    [], // nothing
    ['src/Edited.vue'], // no --base
    ['--base', 'HEAD'], // no files
    ['--base', 'HEAD', '--bogus', 'src/Edited.vue'], // an option that does not exist
    ['--base', 'no-such-ref', 'src/Edited.vue'], // a ref git does not know
    ['--base', 'HEAD', 'src/Typo.vue'], // a file on neither side
    ['--base', 'HEAD', '../outside.vue'], // a file outside the root
  ];
  for (const argv of bad) {
    const { exitCode, out, err } = await cli(...argv);
    assert.equal(exitCode, 2, JSON.stringify(argv));
    assert.match(err, /usage: node scripts\/vue3-migration\/compare-render\.mjs --base <ref>/, JSON.stringify(argv));
    assert.equal(out, '', JSON.stringify(argv));
  }
});
