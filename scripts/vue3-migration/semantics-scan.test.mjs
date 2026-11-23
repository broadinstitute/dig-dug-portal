import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS, parseArgs, renderReport, run, scan } from './semantics-scan.mjs';

const SCRIPT = fileURLToPath(new URL('./semantics-scan.mjs', import.meta.url));

const lines = (...parts) => parts.join('\n');
/** A `Map` of path -> text, the way `readSources` returns a tree. */
const tree = (files) => new Map(Object.entries(files));
/** The hits of one kind for a tree, as `{ line, text }` (the file is checked where it matters). */
const hitsOf = (kind, files) => scan(tree(files))[kind].map(({ line, text }) => ({ line, text }));
const empty = { structuredClone: [], chartObjects: [], computedParams: [], extraScripts: [], unknownTags: [], inlineSpaces: [] };

let root;
let counter = 0;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'semantics-scan-'));
});

after(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Writes `files` (path -> text) into a new directory and returns it. */
function site(files) {
  const dir = join(root, `site-${counter++}`);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

/** Runs the CLI in process; returns its exit code and what it wrote. */
function runCli(argv, deps = {}) {
  let stdout = '';
  let stderr = '';
  const status = run(argv, { ...deps, out: { write: (text) => (stdout += text) }, err: { write: (text) => (stderr += text) } });
  return { status, stdout, stderr };
}

// ---- structuredClone ----------------------------------------------------------------------

test('structuredClone: a call is a hit, with its line and its arguments', () => {
  const found = scan(
    tree({
      'src/utils/copy.js': lines(
        'export function copy(items) {',
        '  return structuredClone(items.rows);',
        '}',
        'export const again = () => window.structuredClone(items);',
      ),
    }),
  );
  assert.deepEqual(found.structuredClone, [
    { file: 'src/utils/copy.js', line: 2, text: 'structuredClone(items.rows)' },
    { file: 'src/utils/copy.js', line: 4, text: 'window.structuredClone(items)' },
  ]);
});

test('structuredClone: the line is the line in the .vue file, not in its script', () => {
  const found = hitsOf('structuredClone', {
    'src/components/A.vue': lines('<template>', '  <div />', '</template>', '<script>', 'export default {', '  methods: { go() { return structuredClone(this.rows); } },', '};', '</script>'),
  });
  assert.deepEqual(found, [{ line: 6, text: 'structuredClone(this.rows)' }]);
});

test('ignores commented-out code', () => {
  const files = {
    'src/components/VariantSearch.vue': lines(
      '<template>',
      '  <div>',
      '    <p>text <!-- <span> {{ x }}</span> <center>old</center> --></p>',
      '  </div>',
      '</template>',
      '<script>',
      'import c3 from "c3";',
      'export default {',
      '  data() { return { label: "structuredClone(a)" }; },',
      '  computed: {',
      '    // total(vm) { return 1; }',
      '  },',
      '  methods: {',
      '    copy() {',
      '      //this.variantData = structuredClone(this.variants); //copy data',
      '      /* this.chart = c3.generate({}); */',
      '      const note = `structuredClone(a) and c3.generate({})`;',
      '    },',
      '  },',
      '};',
      '</script>',
    ),
  };
  assert.deepEqual(scan(tree(files)), empty);
});

// ---- chartObjects -------------------------------------------------------------------------

test('chartObjects: an object a component stores, found by its import binding', () => {
  const script = lines(
    'import { Network as VisNetwork } from "vis-network";', // 1
    'import { DataSet } from "vis-data";', // 2
    'import { Network } from "./network";', // 3
    'import c3 from "c3";', // 4
    'import * as am4core from "@amcharts/amcharts4/core";', // 5
    'import LocusZoom from "locuszoom";', // 6
    'export default {', // 7
    '  data() {', // 8
    '    return {', // 9
    '      nodes: new DataSet({ queue: true }),', // 10
    '      meta: new Map(),', // 11
    '      deep: { edges: new DataSet() },', // 12
    '    };', // 13
    '  },', // 14
    '  methods: {', // 15
    '    build() {', // 16
    '      this.network = new VisNetwork(box, data, {});', // 17
    '      this.chart = c3.generate({ data: {} });', // 18
    '      this.holder.chart = am4core.create("div", Chart);', // 19
    '      this.plot = LocusZoom.populate("#lz", sources, {});', // 20
    '      this.sources = new LocusZoom.DataSources();', // 21
    '      this.other = new Network();', // 22
    '      this.safe = markRaw(new VisNetwork(box, data, {}));', // 23
    '      const local = c3.generate({});', // 24
    '      this.name = "c3.generate()";', // 25
    '    },', // 26
    '  },', // 27
    '};', // 28
  );
  assert.deepEqual(hitsOf('chartObjects', { 'src/components/G.js': script }), [
    { line: 10, text: 'data(): nodes = new DataSet(...)' },
    { line: 12, text: 'data(): deep.edges = new DataSet(...)' },
    { line: 17, text: 'this.network = new VisNetwork(...)' },
    { line: 18, text: 'this.chart = c3.generate(...)' },
    { line: 19, text: 'this.holder.chart = am4core.create(...)' },
    { line: 20, text: 'this.plot = LocusZoom.populate(...)' },
    { line: 21, text: 'this.sources = new LocusZoom.DataSources(...)' },
  ]);
});

test('chartObjects: data written as an arrow function, a namespace import, and the named create', () => {
  const script = lines(
    'import * as vis from "vis-network/standalone";', // 1
    'import { create } from "@amcharts/amcharts4/core";', // 2
    'export default {', // 3
    '  data: () => ({ graph: new vis.DataSet([]) }),', // 4
    '  mounted() {', // 5
    '    this.chart = create("div");', // 6
    '  },', // 7
    '};', // 8
  );
  assert.deepEqual(hitsOf('chartObjects', { 'src/components/G.js': script }), [
    { line: 4, text: 'data(): graph = new vis.DataSet(...)' },
    { line: 6, text: 'this.chart = create(...)' },
  ]);
});

test('chartObjects: a local name that no import binds is not a chart', () => {
  const script = lines(
    'class Network {}',
    'function generate() {}',
    'export default {',
    '  created() {',
    '    this.network = new Network();',
    '    this.chart = c3.generate({});',
    '  },',
    '};',
  );
  assert.deepEqual(hitsOf('chartObjects', { 'src/components/G.js': script }), []);
});

test('chartObjects: a class from the LocusZoom panels, imported or declared in a panels file', () => {
  const importing = lines(
    'import { LZCredibleVariantsPanel } from "@/components/lz/panels/LocusZoomCredibleSetsPanel";',
    'import { Elsewhere } from "@/components/other/Elsewhere";',
    'export default {',
    '  created() {',
    '    this.credible = new LZCredibleVariantsPanel(1);',
    '    this.elsewhere = new Elsewhere(1);',
    '  },',
    '};',
  );
  const relative = lines('import { LZAssociationsPanel } from "./LocusZoomAssociationsPanel";', 'export default { created() { this.panelClass = new LZAssociationsPanel(1); } };');
  const parent = lines('import { LZPhewasPanel } from "../../components/lz/panels/LocusZoomPhewasPanel";', 'export default { created() { this.panel = new LZPhewasPanel(1); } };');
  const declared = lines('export default { created() { this.panelClass = new LZPanel(1); } };', 'export class LZPanel {}');
  const files = {
    'src/components/lz/LocusZoom.vue': `<script>\n${importing}\n</script>`,
    'src/components/lz/panels/Relative.vue': `<script>\n${relative}\n</script>`,
    'src/views/Region/main.js': parent,
    'src/components/lz/panels/Declared.vue': `<script>\n${declared}\n</script>`,
    'src/components/other/Declared.vue': `<script>\n${declared}\n</script>`,
  };
  const found = scan(tree(files)).chartObjects.map(({ file, line, text }) => `${file}:${line} ${text}`);
  assert.deepEqual(found, [
    'src/components/lz/LocusZoom.vue:6 this.credible = new LZCredibleVariantsPanel(...)',
    'src/components/lz/panels/Declared.vue:2 this.panelClass = new LZPanel(...)',
    'src/components/lz/panels/Relative.vue:3 this.panelClass = new LZAssociationsPanel(...)',
    'src/views/Region/main.js:2 this.panel = new LZPhewasPanel(...)',
  ]);
});

test('chartObjects: what a class stores on this is not component state', () => {
  const script = lines(
    'import c3 from "c3";', // 1
    'export class Holder {', // 2
    '  constructor() { this.chart = c3.generate({}); }', // 3
    '}', // 4
    'export default { created() { this.chart = c3.generate({}); } };', // 5
  );
  assert.deepEqual(hitsOf('chartObjects', { 'src/components/G.js': script }), [{ line: 5, text: 'this.chart = c3.generate(...)' }]);
});

// ---- computedParams -----------------------------------------------------------------------

test('computedParams: a computed function or get with a parameter', () => {
  const script = lines(
    'export default {', // 1
    '  computed: {', // 2
    '    shorthand(vm) { return vm.a; },', // 3
    '    longhand: function (vm, other) { return 1; },', // 4
    '    arrow: (vm) => vm.a,', // 5
    '    pair: {', // 6
    '      get(vm) { return 1; },', // 7
    '      set(value) {},', // 8
    '    },', // 9
    '    namedGet: { get: function (vm) { return 1; } },', // 10
    '    plain() { return this.a; },', // 11
    '    fine: { get() { return 1; }, set(value) {} },', // 12
    '    ...mapGetters(["x"]),', // 13
    '    get accessor() { return 1; },', // 14
    '    set accessor(value) {},', // 15
    '  },', // 16
    '  methods: { run(vm) {} },', // 17
    '};', // 18
  );
  assert.deepEqual(hitsOf('computedParams', { 'src/components/C.js': script }), [
    { line: 3, text: 'shorthand(vm)' },
    { line: 4, text: 'longhand(vm, other)' },
    { line: 5, text: 'arrow(vm)' },
    { line: 7, text: 'pair.get(vm)' },
    { line: 10, text: 'namedGet.get(vm)' },
  ]);
});

// ---- extraScripts -------------------------------------------------------------------------

test('extraScripts: a .vue file with more than one plain script block is one hit', () => {
  const files = {
    'src/components/Two.vue': lines('<template><div /></template>', '<script>', 'export default {};', '</script>', '<script>', 'export const x = 1;', '</script>'),
    'src/components/Three.vue': lines('<script>', 'export default {};', '</script>', '<script>', '</script>', '<script>', '</script>'),
    'src/components/Setup.vue': lines('<script>', 'export default {};', '</script>', '<script setup>', 'const a = 1;', '</script>'),
    'src/components/One.vue': lines('<script>', 'export default {};', '</script>'),
  };
  const found = scan(tree(files)).extraScripts.map(({ file, line, text }) => `${file}:${line} ${text}`);
  assert.deepEqual(found, ['src/components/Three.vue:4 3 <script> blocks', 'src/components/Two.vue:5 2 <script> blocks']);
});

// ---- unknownTags --------------------------------------------------------------------------

test('unknownTags: a real tag that Vue 3 does not know, unless a component has that name', () => {
  const files = {
    'src/components/Old.vue': lines(
      '<template>', // 1
      '  <div>', // 2
      '    <center>x</center>', // 3
      '    <font color="red">y</font>', // 4
      '    <svg><circle r="1" /></svg>', // 5
      '    <page-header />', // 6
      '    <b-badge>z</b-badge>', // 7
      '    <big>big</big>', // 8
      '    <marquee>m</marquee>', // 9
      '  </div>', // 10
      '</template>', // 11
      '<script>',
      'export default { components: { Big } };',
      '</script>',
    ),
    'src/components/Marquee.js': 'import Vue from "vue";\nexport default Vue.component("marquee", {});',
  };
  assert.deepEqual(hitsOf('unknownTags', files), [
    { line: 3, text: '<center>' },
    { line: 4, text: '<font>' },
  ]);
});

// ---- inlineSpaces -------------------------------------------------------------------------

/** A template with `body` in a `<div>`; the first line of `body` is line 3. */
const template = (body) => `<template>\n<div>\n${body}\n</div>\n</template>`;

test('inlineSpaces: a leading or trailing space beside an interpolation, next to inline content', () => {
  const body = lines(
    '<p>total <span> {{ a }}</span></p>', // 3
    '<p><b>{{ a }} </b> and more</p>', // 4
    '<p>{{ a }}<em> {{ b }} </em>{{ c }}</p>', // 5
    '<p><span>{{ a }}</span></p>', // 6
    '<p>total <span> text only</span></p>', // 7
    '<p>total <span> </span></p>', // 8
  );
  assert.deepEqual(hitsOf('inlineSpaces', { 'src/components/S.vue': template(body) }), [
    { line: 3, text: '<span>: leading space' },
    { line: 4, text: '<b>: trailing space' },
    { line: 5, text: '<em>: leading and trailing space' },
  ]);
});

test('an inline space needs inline content beside it', () => {
  const body = lines(
    '<span> {{ alone }}</span>', // 3: nothing beside it
    '<div>block</div><span> {{ afterBlock }}</span>', // 4: a block element before it
    '<span>{{ beforeBlock }} </span><div>block</div>', // 5: a block element after it
    '<table><tr><td><span> {{ inCell }}</span></td></tr></table>', // 6
    '<span v-for="n in list" :key="n"> {{ n }}</span>', // 7: a repeated element is next to itself
    'some text <span> {{ afterText }}</span>', // 8
    '{{ interpolation }}<span> {{ afterInterpolation }}</span>', // 9
    '<a href="#">link</a><span> {{ afterInline }}</span>', // 10
  );
  assert.deepEqual(hitsOf('inlineSpaces', { 'src/components/S.vue': template(body) }), [
    { line: 7, text: '<span>: leading space' },
    { line: 8, text: '<span>: leading space' },
    { line: 9, text: '<span>: leading space' },
    { line: 10, text: '<span>: leading space' },
  ]);
});

test('inlineSpaces: content under pre, v-pre, v-html and v-text is left alone, and so are block elements', () => {
  const body = lines(
    '<pre>text <span> {{ a }}</span></pre>', // 3
    '<div v-pre>text <span> {{ a }}</span></div>', // 4
    '<div v-html="html">text <span> {{ a }}</span></div>', // 5
    '<div v-text="text">text <span> {{ a }}</span></div>', // 6
    '<p>text <span v-html="html"> {{ a }}</span></p>', // 7
    '<section>text <section> {{ a }}</section></section>', // 8
    '<p>text <label> {{ a }}</label></p>', // 9
  );
  assert.deepEqual(hitsOf('inlineSpaces', { 'src/components/S.vue': template(body) }), [{ line: 9, text: '<label>: leading space' }]);
});

// ---- errors, order, report ----------------------------------------------------------------

test('a file that does not parse is listed under errors, and the rest is still scanned', () => {
  const errors = [];
  const found = scan(
    tree({
      'src/a.js': 'export default {',
      'src/b.vue': lines('<template><div /></template>', '<script>', 'export default {', '</script>'),
      'src/c.vue': lines('<template>', '  <p>text <span> {{ a }}</span></p>', '</template>', '<script>', 'export const x = structuredClone(y);', '</script>'),
    }),
    errors,
  );
  assert.deepEqual(
    errors.map(({ file, kind }) => ({ file, kind })),
    [
      { file: 'src/a.js', kind: 'parse' },
      { file: 'src/b.vue', kind: 'parse' },
    ],
  );
  assert.ok(errors.every(({ message }) => typeof message === 'string' && message.length > 0));
  assert.equal(found.structuredClone.length, 1);
  assert.equal(found.inlineSpaces.length, 1);
});

test('a template that is not plain HTML is listed under errors, and a self-closing div is not an error', () => {
  const errors = [];
  scan(
    tree({
      'src/pug.vue': lines('<template lang="pug">', 'div hello', '</template>', '<script>', 'export default {};', '</script>'),
      'src/solidus.vue': lines('<template><div /></template>', '<script>', 'export default {};', '</script>'),
    }),
    errors,
  );
  assert.deepEqual(
    errors.map(({ file, kind }) => ({ file, kind })),
    [{ file: 'src/pug.vue', kind: 'template' }],
  );
});

test('hits come back sorted by file, then line, whatever the order of the sources', () => {
  const found = scan(tree({ 'src/z.js': 'structuredClone(a);\nstructuredClone(b);', 'src/a.js': 'structuredClone(c);' }));
  assert.deepEqual(
    found.structuredClone.map(({ file, line }) => `${file}:${line}`),
    ['src/a.js:1', 'src/z.js:1', 'src/z.js:2'],
  );
});

test('the report has a totals table, each kind with its file list, and an errors section', () => {
  const found = scan(tree({ 'src/a.js': 'structuredClone(a);\nstructuredClone(b);', 'src/b.js': 'structuredClone(c);' }));
  const report = renderReport(found, [{ file: 'src/bad.js', kind: 'parse', message: 'Unexpected token', line: 3 }]);
  assert.match(report, /^# Semantics scan\n/);
  assert.match(report, /\| structuredClone \| 3 \| 2 \|/);
  assert.match(report, /\| extraScripts \| 0 \| 0 \|/);
  assert.match(report, /\| `src\/a\.js:2` \| `structuredClone\(b\)` \|/);
  for (const { key } of KINDS) assert.match(report, new RegExp(`^## ${key}$`, 'm'));
  assert.match(report, /## Errors\n\n- `src\/bad\.js:3` \(parse\): Unexpected token/);
  assert.match(renderReport(empty, []), /## Errors\n\nNone\./);
});

// ---- the command line ---------------------------------------------------------------------

test('parseArgs reads --root and --json, and refuses anything else', () => {
  assert.deepEqual(parseArgs([]), { root: undefined, json: false });
  assert.deepEqual(parseArgs(['--root', '/x', '--json']), { root: '/x', json: true });
  assert.throws(() => parseArgs(['--nope']));
  assert.throws(() => parseArgs(['stray']));
  assert.throws(() => parseArgs(['--root']));
});

test('run prints the report and exits 0 even when it found things, --json prints the hits', () => {
  const dir = site({ 'src/a.js': 'structuredClone(a);', 'src/bad.js': 'export default {' });
  const text = runCli(['--root', dir]);
  assert.equal(text.status, 0);
  assert.match(text.stdout, /\| structuredClone \| 1 \| 1 \|/);
  assert.match(text.stdout, /`src\/bad\.js/);
  const json = runCli(['--root', dir, '--json']);
  assert.equal(json.status, 0);
  const parsed = JSON.parse(json.stdout);
  assert.deepEqual(parsed.structuredClone, [{ file: 'src/a.js', line: 1, text: 'structuredClone(a)' }]);
  assert.deepEqual(Object.keys(parsed), [...KINDS.map(({ key }) => key), 'errors']);
  assert.equal(parsed.errors[0].file, 'src/bad.js');
});

test('run exits 2 on a usage error, on a root without src/, and on a stray argument', () => {
  const noSrc = site({ 'README.md': 'x' });
  for (const argv of [['--nope'], ['--root', noSrc], ['--root', join(root, 'does-not-exist')], ['extra']]) {
    const { status, stderr, stdout } = runCli(argv);
    assert.equal(status, 2, argv.join(' '));
    assert.match(stderr, /usage: /);
    assert.equal(stdout, '');
  }
});

test('the script runs as a command', () => {
  const dir = site({ 'src/a.js': 'structuredClone(a);' });
  const ok = spawnSync(process.execPath, [SCRIPT, '--root', dir], { encoding: 'utf8' });
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /^# Semantics scan\n/);
  const bad = spawnSync(process.execPath, [SCRIPT, '--nope'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
});
