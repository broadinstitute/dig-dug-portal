import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparePages, main, pageCss, parseArgs } from './compare-css.mjs';

const SCRIPT = fileURLToPath(new URL('./compare-css.mjs', import.meta.url));

let root;
let counter = 0;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'compare-css-'));
});

after(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes `files` (path -> text) into a new directory and returns it. */
function site(files) {
  const dir = join(root, `site-${counter++}`);
  mkdirSync(dir, { recursive: true });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

/** A page that links each stylesheet, the way Vue CLI writes them. */
const page = (...hrefs) => `<!DOCTYPE html><html><head>${hrefs.map((href) => `<link href="${href}" rel="stylesheet">`).join('')}</head><body></body></html>`;

const statusOf = (results, name) => results.find((result) => result.page === name)?.status;

// ---- comparePages ---------------------------------------------------------------------------

test('same text in the same order is same', () => {
  const files = { 'a.html': page('/css/one.css', '/css/two.css'), 'css/one.css': 'a{color:red}', 'css/two.css': 'b{color:blue}\n' };
  const results = comparePages(site(files), site(files));
  assert.deepEqual(results, [{ page: 'a.html', status: 'same' }]);
});

test('the same text split into other files is same', () => {
  const base = site({ 'a.html': page('/css/chunk-vendors.css'), 'css/chunk-vendors.css': 'a{color:red}b{color:blue}' });
  const head = site({ 'a.html': page('/css/chunk-vendors.css', '/css/chunk-common.css'), 'css/chunk-vendors.css': 'a{color:red}', 'css/chunk-common.css': 'b{color:blue}' });
  assert.deepEqual(comparePages(base, head), [{ page: 'a.html', status: 'same' }]);
});

test('the same rules in another order is reordered', () => {
  const base = site({
    'files.html': page('/css/one.css', '/css/two.css'),
    'css/one.css': 'a{color:red}',
    'css/two.css': 'b{color:blue}',
    'rules.html': page('/css/both.css'),
    'css/both.css': 'a{color:red}\n@media (min-width:1px){b{color:blue}}\n',
  });
  const head = site({
    'files.html': page('/css/two.css', '/css/one.css'),
    'css/one.css': 'a{color:red}',
    'css/two.css': 'b{color:blue}',
    'rules.html': page('/css/both.css'),
    'css/both.css': '@media (min-width:1px){b{color:blue}}\na{color:red}\n',
  });
  const results = comparePages(base, head);
  assert.equal(statusOf(results, 'files.html'), 'reordered');
  assert.equal(statusOf(results, 'rules.html'), 'reordered');
});

test('a changed declaration differs', () => {
  const base = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}b{color:blue}' });
  const head = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}b{color:green}' });
  assert.deepEqual(comparePages(base, head), [{ page: 'a.html', status: 'differs' }]);
});

test('a rule dropped or repeated differs, not reordered', () => {
  const base = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}b{color:blue}' });
  const dropped = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}' });
  const repeated = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}b{color:blue}b{color:blue}' });
  assert.equal(comparePages(base, dropped)[0].status, 'differs');
  assert.equal(comparePages(base, repeated)[0].status, 'differs');
});

test('different spacing between rules in the same order differs, not reordered', () => {
  const base = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}\nb{color:blue}' });
  const head = site({ 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}b{color:blue}' });
  assert.equal(comparePages(base, head)[0].status, 'differs');
});

test('a page missing from one side is missing', () => {
  const both = { 'css/one.css': 'a{color:red}', 'shared.html': page('/css/one.css') };
  const base = site({ ...both, 'only-base.html': page('/css/one.css'), 'nested/only-base.html': page('/css/one.css') });
  const head = site({ ...both, 'only-head.html': page('/css/one.css') });
  assert.deepEqual(comparePages(base, head), [
    { page: 'nested/only-base.html', status: 'missing' },
    { page: 'only-base.html', status: 'missing' },
    { page: 'only-head.html', status: 'missing' },
    { page: 'shared.html', status: 'same' },
  ]);
});

test('content hashes in file names do not matter', () => {
  const base = site({ 'a.html': page('/css/chunk-vendors.1a2b3c4d.css'), 'css/chunk-vendors.1a2b3c4d.css': 'a{color:red}' });
  const head = site({ 'a.html': page('/css/chunk-vendors.9f8e7d6c.css'), 'css/chunk-vendors.9f8e7d6c.css': 'a{color:red}' });
  assert.deepEqual(comparePages(base, head), [{ page: 'a.html', status: 'same' }]);
  assert.deepEqual(pageCss(base, page('/css/chunk-vendors.1a2b3c4d.css')).files, ['css/chunk-vendors.css']);
});

test('external and print-only links are ignored', () => {
  const html = `<html><head>
    <link href="/css/one.css" rel="stylesheet">
    <link href="https://cdn.example.org/lib.css" rel="stylesheet">
    <link href="//cdn.example.org/lib2.css" rel="stylesheet">
    <link href="/css/print.css" rel="stylesheet" media="print">
    <link href="/css/one.css" rel="preload" as="style">
    <link href="/css/prefetched.css" rel="prefetch">
    <link href="/js/app.js" rel="preload" as="script">
    <link href="/favicon.png" rel="icon">
  </head></html>`;
  const dir = site({ 'css/one.css': 'a{color:red}' });
  // Nothing is written for print.css, prefetched.css or the CDN files: reading any of them would fail.
  assert.deepEqual(pageCss(dir, html), { files: ['css/one.css'], text: 'a{color:red}' });
});

// ---- scoped ids -----------------------------------------------------------------------------

/** A stylesheet whose rules carry the scoped id `id`: an attribute selector, and a keyframes name with its use. */
const scoped = (id, color = 'red') =>
  `.a[data-v-${id}]{color:${color}}@keyframes spin-data-v-${id}{from{opacity:0}to{opacity:1}}.b[data-v-${id}]{animation:spin-data-v-${id} 1s}`;

const oneSheet = (css) => site({ 'a.html': page('/css/one.css'), 'css/one.css': css });

test('scoped ids do not matter', () => {
  const results = comparePages(oneSheet(scoped('1a2b3c4d')), oneSheet(scoped('9f8e7d6c')));
  assert.deepEqual(results, [{ page: 'a.html', status: 'same' }]);
});

test('scoped ids do not matter when a file has several of them', () => {
  const css = (a, b) => `.a[data-v-${a}]{color:red}.b[data-v-${b}]{color:blue}.c[data-v-${a}] .d[data-v-${b}]{color:green}`;
  assert.equal(comparePages(oneSheet(css('11111111', '22222222')), oneSheet(css('aaaaaaaa', 'bbbbbbbb')))[0].status, 'same');
});

test('a changed declaration next to a changed id is still differs', () => {
  const results = comparePages(oneSheet(scoped('1a2b3c4d', 'red')), oneSheet(scoped('9f8e7d6c', 'blue')));
  assert.deepEqual(results, [{ page: 'a.html', status: 'differs' }]);
});

test('rules are split after the ids are masked, so a reorder with changed ids is reordered', () => {
  const base = oneSheet('.a[data-v-1a2b3c4d]{color:red}.b[data-v-1a2b3c4d]{color:blue}');
  const head = oneSheet('.b[data-v-9f8e7d6c]{color:blue}.a[data-v-9f8e7d6c]{color:red}');
  assert.equal(comparePages(base, head)[0].status, 'reordered');
});

test('only data-v- followed by 8 lowercase hex digits is a scoped id', () => {
  const css = (id) => `.a[data-v-${id}]{color:red}`;
  assert.equal(comparePages(oneSheet(css('1234567')), oneSheet(css('7654321')))[0].status, 'differs');
  assert.equal(comparePages(oneSheet(css('1A2B3C4D')), oneSheet(css('9F8E7D6C')))[0].status, 'differs');
});

// ---- pageCss --------------------------------------------------------------------------------

test('pageCss reads links written without attribute quotes, as the minified production HTML has them', () => {
  const dir = site({ 'css/a.css': 'a{}', 'css/print.css': 'p{}' });
  const html = '<link href=/css/a.css rel=stylesheet><link href=/css/print.css rel=stylesheet media=print><link href=/js/app.js rel=preload as=script>';
  assert.deepEqual(pageCss(dir, html), { files: ['css/a.css'], text: 'a{}' });
});

test('pageCss ignores a link that is not a URL, and a data: link', () => {
  const html = '<link href="http://" rel="stylesheet"><link href="data:text/css,a{}" rel="stylesheet">';
  assert.deepEqual(pageCss(site({}), html), { files: [], text: '' });
});

test('pageCss returns the files in link order with their text joined', () => {
  const dir = site({ 'css/b.css': 'b{}', 'css/a.css': 'a{}\n' });
  assert.deepEqual(pageCss(dir, page('/css/b.css', '/css/a.css')), { files: ['css/b.css', 'css/a.css'], text: 'b{}a{}\n' });
});

test('pageCss reads a link whose rel lists stylesheet beside preload and prefetch, over several lines', () => {
  const dir = site({ 'css/mdkp.css': 'a{}' });
  const html = '<link\n  rel="stylesheet preload prefetch"\n  as="style"\n  href="/css/mdkp.css?v=3#top"\n/>';
  assert.deepEqual(pageCss(dir, html).files, ['css/mdkp.css']);
});

test('pageCss skips a link inside an HTML comment', () => {
  const dir = site({ 'css/one.css': 'a{}' });
  const html = '<!-- <link href="/css/gone.css" rel="stylesheet"> --><link href="/css/one.css" rel="stylesheet">';
  assert.deepEqual(pageCss(dir, html).files, ['css/one.css']);
});

test('pageCss resolves a relative link against the page, and keeps a hash that is not 8 hex digits', () => {
  const dir = site({ 'pigean/css/x.css': 'a{}', 'css/y.12345.css': 'b{}' });
  assert.deepEqual(pageCss(dir, page('css/x.css'), 'pigean/index.html').files, ['pigean/css/x.css']);
  assert.deepEqual(pageCss(dir, page('/css/y.12345.css')).files, ['css/y.12345.css']);
});

test('pageCss throws for a linked local file that does not exist', () => {
  const dir = site({});
  assert.throws(() => pageCss(dir, page('/css/gone.css')), /css\/gone\.css/);
});

// ---- never silently same --------------------------------------------------------------------

test('a linked file missing on both sides is not same', () => {
  const files = { 'a.html': page('/css/gone.css') };
  const [result] = comparePages(site(files), site(files));
  assert.equal(result.status, 'differs');
  assert.match(result.problems.join('\n'), /base.*css\/gone\.css/);
  assert.match(result.problems.join('\n'), /head.*css\/gone\.css/);
});

test('a stylesheet that does not parse is not same, even when both sides are equal', () => {
  const files = { 'a.html': page('/css/bad.css'), 'css/bad.css': 'a{color:red' };
  const [result] = comparePages(site(files), site(files));
  assert.equal(result.status, 'differs');
  assert.match(result.problems.join('\n'), /css\/bad\.css:1:1: Unclosed block/);
});

test('a stylesheet that ends in an inline source map comment still parses', () => {
  const files = { 'a.html': page('/css/one.css'), 'css/one.css': 'a{color:red}\n/*# sourceMappingURL=data:application/json;charset=utf-8,%7B%7D */' };
  assert.deepEqual(comparePages(site(files), site(files)), [{ page: 'a.html', status: 'same' }]);
});

test('a page with no stylesheets on either side is same', () => {
  const files = { 'a.html': '<html><head></head></html>' };
  assert.deepEqual(comparePages(site(files), site(files)), [{ page: 'a.html', status: 'same' }]);
});

test('comparePages finds nested pages, and the pages of both directories', () => {
  const nested = { 'pigean/index.html': page('/css/one.css'), 'css/one.css': 'a{}' };
  const results = comparePages(site(nested), site({ ...nested, 'cvdi/phenotype.html': page('/css/one.css') }));
  assert.deepEqual(results.map(({ page: name }) => name), ['cvdi/phenotype.html', 'pigean/index.html']);
});

// ---- the CLI --------------------------------------------------------------------------------

function run(argv) {
  let out = '';
  let err = '';
  const exitCode = main(argv, { out: { write: (text) => (out += text) }, err: { write: (text) => (err += text) } });
  return { exitCode, out, err };
}

test('parseArgs defaults to dist-baseline and dist', () => {
  assert.deepEqual(parseArgs([]), { base: 'dist-baseline', head: 'dist' });
  assert.deepEqual(parseArgs(['--base', 'a', '--head', 'b']), { base: 'a', head: 'b' });
  assert.throws(() => parseArgs(['--bogus']));
  assert.throws(() => parseArgs(['positional']));
  assert.throws(() => parseArgs(['--base']));
});

test('main exits 0 when every page is same and says so', () => {
  const files = { 'a.html': page('/css/one.css'), 'css/one.css': 'a{}' };
  const { exitCode, out, err } = run(['--base', site(files), '--head', site(files)]);
  assert.equal(exitCode, 0);
  assert.match(out, /1 page/);
  assert.match(out, /all same/i);
  assert.equal(err, '');
});

test('main exits 1 and names each page that is not same, with the files on both sides', () => {
  const base = site({ 'a.html': page('/css/one.css', '/css/two.css'), 'b.html': page('/css/one.css'), 'css/one.css': 'a{}', 'css/two.css': 'b{}', 'c.html': page('/css/one.css') });
  const head = site({ 'a.html': page('/css/two.css', '/css/one.css'), 'b.html': page('/css/one.css'), 'css/one.css': 'a{}', 'css/two.css': 'b{}' });
  const { exitCode, out } = run(['--base', base, '--head', head]);
  assert.equal(exitCode, 1);
  assert.match(out, /`a\.html`.*reordered/);
  assert.match(out, /head: `css\/two\.css`, `css\/one\.css`/);
  assert.match(out, /base: `css\/one\.css`, `css\/two\.css`/);
  assert.match(out, /`c\.html`.*missing/);
  assert.doesNotMatch(out, /`b\.html`/);
});

test('main exits 2 for a bad option or a directory that does not exist', () => {
  const dir = site({ 'a.html': page() });
  assert.equal(run(['--nope']).exitCode, 2);
  const missing = run(['--base', join(root, 'nope'), '--head', dir]);
  assert.equal(missing.exitCode, 2);
  assert.match(missing.err, /nope/);
  assert.match(missing.err, /usage:/);
});

test('main exits 2 when neither directory has a page, so an empty comparison is not a pass', () => {
  const { exitCode, err } = run(['--base', site({ 'css/one.css': 'a{}' }), '--head', site({})]);
  assert.equal(exitCode, 2);
  assert.match(err, /no \.html/);
});

// A process that can read any file (root) cannot make one unreadable.
const canReadUnreadable = (() => {
  const path = join(tmpdir(), `compare-css-probe-${process.pid}`);
  writeFileSync(path, 'x', { mode: 0o000 });
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  } finally {
    rmSync(path, { force: true });
  }
})();

test('main exits 2 with the error message, not 1 with a stack trace, when a page cannot be read', { skip: canReadUnreadable }, () => {
  const files = { 'a.html': page('/css/one.css'), 'b.html': page('/css/one.css'), 'css/one.css': 'a{}' };
  const base = site(files);
  const head = site(files);
  chmodSync(join(head, 'b.html'), 0o000);
  const { exitCode, out, err } = run(['--base', base, '--head', head]);
  assert.equal(exitCode, 2);
  assert.equal(out, '');
  assert.match(err, /EACCES.*b\.html/);
  assert.doesNotMatch(err, /\n\s+at /);

  const spawned = spawnSync(process.execPath, [SCRIPT, '--base', base, '--head', head], { encoding: 'utf8' });
  assert.equal(spawned.status, 2);
  assert.doesNotMatch(spawned.stderr, /\n\s+at /);
});

test('the CLI runs as a script', () => {
  const files = { 'a.html': page('/css/one.css'), 'css/one.css': 'a{}' };
  const ok = spawnSync(process.execPath, [SCRIPT, '--base', site(files), '--head', site(files)], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  const bad = spawnSync(process.execPath, [SCRIPT, '--base', site(files), '--head', site({ ...files, 'css/one.css': 'a{color:red}' })], { encoding: 'utf8' });
  assert.equal(bad.status, 1, bad.stderr);
  assert.equal(spawnSync(process.execPath, [SCRIPT, '--wat'], { encoding: 'utf8' }).status, 2);
});
