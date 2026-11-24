import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS, parseArgs, readBuildConfig, renderReport, run, scan } from './nocompat-scan.mjs';

const SCRIPT = fileURLToPath(new URL('./nocompat-scan.mjs', import.meta.url));

const lines = (...parts) => parts.join('\n');
/** A `Map` of path -> text, the way `readSources` returns a tree. */
const tree = (files) => new Map(Object.entries(files));
/** A tree plus a page entry (`src/main.js`) that imports every other file, so that all of them are reachable. */
const reached = (files) =>
  tree({ ...files, 'src/main.js': Object.keys(files).filter((f) => f.startsWith('src/')).map((f) => `import "@/${f.slice(4)}";`).join('\n') });
/** The hits of one kind for a tree whose files are all reachable, as `{ line, text }`. */
const hitsOf = (kind, files, options) => scan(reached(files), options).hits[kind].map(({ line, text }) => ({ line, text }));
/** A component file with the given `<template>` and `<script>` body. */
const component = (template, script = 'export default { name: "A" };') => lines('<template>', ...template.split('\n'), '</template>', '<script>', script, '</script>');

let root;
let counter = 0;

before(() => {
  root = mkdtempSync(join(tmpdir(), 'nocompat-scan-'));
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

// ---- scope: entries, reachable files, imports it cannot resolve -----------------------------------

test('scope: only the files an entry under the prefix reaches are scanned, and they are counted', () => {
  const files = {
    'src/portals/P/views/A/main.js': 'import "@/portals/P/a.js";',
    'src/portals/P/a.js': 'export const a = (vm) => vm.$set(vm.x, "k", 1);',
    'src/portals/Q/views/B/main.js': 'import "@/portals/Q/b.js";',
    'src/portals/Q/b.js': 'export const b = (vm) => vm.$set(vm.x, "k", 1);',
    'src/unused.js': 'export const c = (vm) => vm.$set(vm.x, "k", 1);',
  };
  const found = scan(tree(files), { entries: ['src/portals/P/'] });
  assert.deepEqual(found.scope.entries, ['src/portals/P/views/A/main.js']);
  assert.deepEqual(found.scope.files, ['src/portals/P/a.js', 'src/portals/P/views/A/main.js']);
  assert.equal(found.scope.total, 5);
  assert.deepEqual(found.hits.setDelete.map(({ file }) => file), ['src/portals/P/a.js']);
  // Without a prefix every entry counts.
  assert.deepEqual(scan(tree(files)).scope.entries, ['src/portals/P/views/A/main.js', 'src/portals/Q/views/B/main.js']);
  assert.equal(scan(tree(files)).hits.setDelete.length, 2);
});

test('scope: a prefix names a folder, with or without the trailing slash, and two prefixes add up', () => {
  const files = {
    'src/portals/P/views/A/main.js': '',
    'src/portals/PanKbase/views/A/main.js': '',
    'src/views/Gene/main.js': '',
  };
  assert.deepEqual(scan(tree(files), { entries: ['src/portals/P'] }).scope.entries, ['src/portals/P/views/A/main.js']);
  assert.deepEqual(scan(tree(files), { entries: ['src/portals/P/', 'src/views/Gene'] }).scope.entries, [
    'src/portals/P/views/A/main.js',
    'src/views/Gene/main.js',
  ]);
});

test('scope: a prefix that matches no entry is an error, not a quiet zero', () => {
  const found = scan(tree({ 'src/views/Gene/main.js': '' }), { entries: ['src/portals/Nope/'] });
  assert.deepEqual(found.scope.entries, []);
  assert.deepEqual(found.errors.map(({ kind, message }) => ({ kind, message })), [{ kind: 'scope', message: 'no page entry (main.js) under src/portals/Nope/' }]);
});

test('scope: static, dynamic and required imports are edges', () => {
  const files = {
    'src/main.js': lines('import "./a.js";', 'const b = () => import("./b.js");', 'const c = require("./c.js");', 'export * from "./d.js";', 'export { e } from "./e.js";'),
    'src/a.js': '',
    'src/b.js': '',
    'src/c.js': '',
    'src/d.js': '',
    'src/e.js': '',
    'src/f.js': '',
  };
  assert.deepEqual(scan(tree(files)).scope.files, ['src/a.js', 'src/b.js', 'src/c.js', 'src/d.js', 'src/e.js', 'src/main.js']);
});

test('scope: an import with a static prefix and a variable part reaches every file that fits, and is listed', () => {
  const files = {
    'src/main.js': lines('const load = (n) => import(`@/views/${n}.vue`);', 'const f = (n) => require("./pages/" + n + ".js");'),
    'src/views/A.vue': '<template><div /></template>',
    'src/views/B.vue': '<template><div /></template>',
    'src/views/C.js': '',
    'src/pages/x.js': '',
    'src/pages/y.vue': '<template><div /></template>',
    'src/other.js': '',
  };
  const found = scan(tree(files));
  assert.deepEqual(found.scope.files, ['src/main.js', 'src/pages/x.js', 'src/views/A.vue', 'src/views/B.vue']);
  assert.deepEqual(
    found.dynamic.map(({ file, line, pattern, matched }) => ({ file, line, pattern, matched })),
    [
      { file: 'src/main.js', line: 1, pattern: '@/views/*.vue', matched: ['src/views/A.vue', 'src/views/B.vue'] },
      { file: 'src/main.js', line: 2, pattern: './pages/*.js', matched: ['src/pages/x.js'] },
    ],
  );
  assert.deepEqual(found.unresolved, []);
});

test('scope: require.context is an edge to the files it matches', () => {
  const files = {
    'src/main.js': 'const ctx = require.context("./parts", true, /\\.vue$/);',
    'src/parts/A.vue': '<template><div /></template>',
    'src/parts/deep/B.vue': '<template><div /></template>',
    'src/parts/C.js': '',
  };
  const found = scan(tree(files));
  assert.deepEqual(found.scope.files, ['src/main.js', 'src/parts/A.vue', 'src/parts/deep/B.vue']);
  assert.equal(found.dynamic[0].pattern, 'require.context("./parts", recursive, /\\.vue$/)');
  const flat = scan(tree({ ...files, 'src/main.js': 'require.context("./parts", false, /\\.vue$/);' }));
  assert.deepEqual(flat.scope.files, ['src/main.js', 'src/parts/A.vue']);
});

test('unresolved: a local import that finds no file is listed, with its line and kind; packages and assets are not', () => {
  const files = {
    'src/main.js': lines(
      'import "./missing.js";', // 1
      'import x from "@/nope/x.vue";', // 2
      'import "vue";', // 3
      'import "@scope/pkg/dist/a.css";', // 4
      'import "./style.css";', // 5
      'const y = () => import("../up.js");', // 6
      'const z = require("./gone");', // 7
    ),
    'src/style.css': '.a { color: red; }',
  };
  const found = scan(tree(files), { assets: new Map([['src/style.css', '.a { color: red; }']]) });
  assert.deepEqual(
    found.unresolved.map(({ file, line, specifier, kind }) => ({ file, line, specifier, kind })),
    [
      { file: 'src/main.js', line: 1, specifier: './missing.js', kind: 'import' },
      { file: 'src/main.js', line: 2, specifier: '@/nope/x.vue', kind: 'import' },
      { file: 'src/main.js', line: 6, specifier: '../up.js', kind: 'dynamic import' },
      { file: 'src/main.js', line: 7, specifier: './gone', kind: 'require' },
    ],
  );
});

test('unresolved: an import whose path is not a string, or has no static prefix, is listed as dynamic', () => {
  const files = { 'src/main.js': lines('const a = (n) => import(n);', 'const b = (n) => require(`${n}.js`);', 'const c = (n) => import(`@/x/${n}`);') };
  const found = scan(tree(files));
  assert.deepEqual(
    found.unresolved.map(({ line, specifier, kind, why }) => ({ line, specifier, kind, why })),
    [
      { line: 1, specifier: 'n', kind: 'dynamic import', why: 'the path is not a string' },
      { line: 2, specifier: '`${n}.js`', kind: 'require', why: 'no static prefix to look under' },
      { line: 3, specifier: '`@/x/${n}`', kind: 'dynamic import', why: 'no file matches @/x/*' },
    ],
  );
});

test('unresolved: only the reachable files are looked at', () => {
  const files = { 'src/main.js': 'import "./a.js";', 'src/a.js': '', 'src/orphan.js': 'import "./nothing.js";' };
  assert.deepEqual(scan(tree(files)).unresolved, []);
});

test('errors: a file that does not parse is listed, and the rest of the tree is still scanned', () => {
  const files = {
    'src/main.js': 'import "./bad.js"; import "./good.js";',
    'src/bad.js': 'const = ;',
    'src/good.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);',
  };
  const found = scan(tree(files));
  assert.equal(found.hits.setDelete.length, 1);
  assert.equal(found.errors.length, 1);
  assert.equal(found.errors[0].file, 'src/bad.js');
  assert.equal(found.errors[0].kind, 'parse');
});

test('errors: a template that is not plain HTML is listed, a self-closing div is not an error', () => {
  const found = scan(
    reached({
      'src/components/Pug.vue': '<template lang="pug">\ndiv\n</template>\n<script>export default {};</script>',
      'src/components/Ok.vue': '<template><div /></template>\n<script>export default {};</script>',
    }),
  );
  assert.deepEqual(found.errors.map(({ file, kind }) => ({ file, kind })), [{ file: 'src/components/Pug.vue', kind: 'template' }]);
});

// ---- the command ---------------------------------------------------------------------------------

test('parseArgs reads --root, --entries (more than once) and --json, and refuses anything else', () => {
  assert.deepEqual(parseArgs([]), { root: undefined, entries: [], config: undefined, json: false });
  assert.deepEqual(parseArgs(['--root', '/x', '--entries', 'src/a/', '--entries', 'src/b', '--json']), { root: '/x', entries: ['src/a/', 'src/b'], config: undefined, json: true });
  assert.throws(() => parseArgs(['--nope']));
  assert.throws(() => parseArgs(['stray']));
  assert.throws(() => parseArgs(['--root']));
});

test('run prints the report and exits 0 even when it found things; --json prints the data', () => {
  const dir = site({
    'src/views/A/main.js': 'import "@/c.js";',
    'src/c.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);',
  });
  const text = runCli(['--root', dir]);
  assert.equal(text.status, 0);
  assert.match(text.stdout, /^# No-compat scan/);
  assert.match(text.stdout, /\| setDelete \|/);
  assert.match(text.stdout, /src\/c\.js:1/);
  const json = runCli(['--root', dir, '--json']);
  assert.equal(json.status, 0);
  const data = JSON.parse(json.stdout);
  assert.equal(data.hits.setDelete.length, 1);
  assert.deepEqual(data.scope.entries, ['src/views/A/main.js']);
  assert.ok(Array.isArray(data.errors) && Array.isArray(data.unresolved) && Array.isArray(data.packages));
  const scoped = runCli(['--root', dir, '--entries', 'src/views/Nope/']);
  assert.equal(scoped.status, 0);
  assert.match(scoped.stdout, /no page entry/);
});

test('run exits 2 on a usage error, on a root without src/, and on a stray argument', () => {
  const usage = runCli(['--bogus']);
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage: node scripts\/vue3-migration\/nocompat-scan\.mjs/);
  const empty = runCli(['--root', site({ 'readme.md': 'x' })]);
  assert.equal(empty.status, 2);
  assert.match(empty.stderr, /src\//);
  assert.equal(runCli(['extra']).status, 2);
});

test('the script runs as a command', () => {
  const dir = site({ 'src/views/A/main.js': 'import "@/c.js";', 'src/c.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);' });
  const result = spawnSync(process.execPath, [SCRIPT, '--root', dir, '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).hits.setDelete.length, 1);
  assert.equal(spawnSync(process.execPath, [SCRIPT, '--bogus'], { encoding: 'utf8' }).status, 2);
});

test('the report has a totals table with every kind, then each kind with its hits, the scope and the errors', () => {
  const found = scan(reached({ 'src/c.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);' }));
  const report = renderReport(found);
  assert.match(report, /^# No-compat scan\n/);
  for (const { key } of KINDS) assert.match(report, new RegExp(`\\| ${key} \\|`), key);
  assert.match(report, /\| `src\/c\.js:1` \| `vm\.\$set\(vm\.a, 1, 2\)` \|/);
  assert.match(report, /\n## setDelete\n/);
  assert.match(report, /\n## Errors\n\nNone\.\n/);
  assert.match(report, /\n## Unresolved imports\n/);
});

// ---- script: the instance --------------------------------------------------------------------------------------------

/** `{ line, text, note }` of the hits of one kind. */
const notesOf = (kind, files, options) => scan(reached(files), options).hits[kind].map(({ line, text, note }) => ({ line, text, note }));

test('setDelete: $set and $delete on an instance, an alias of this and the global Vue; map.delete, strings and comments are not', () => {
  const found = hitsOf('setDelete', {
    'src/components/a.js': lines(
      'import Vue from "vue";', // 1
      'export default {', // 2
      '  methods: {', // 3
      '    add(k) { this.$set(this.items, k, 1); },', // 4
      '    drop(k) { this.$delete(this.items, k); },', // 5
      '    alias(k) { const that = this; that.$set(that.items, k, 2); },', // 6
      '    glob(k) { Vue.set(this.items, k, 3); Vue.delete(this.items, k); },', // 7
      '    root(k) { this.$root.$set(this.$root.state, k, 4); },', // 8
      '    near(k) {', // 9
      '      this.map.delete(k); this.set.add(k); store.set(k, 1); items.delete(k);', // 10
      '      // this.$set(a, b, c)', // 11
      '      const s = "this.$set(a, b, c)"; const t = `Vue.delete(a, b)`;', // 12
      '    },', // 13
      '  },', // 14
      '};', // 15
    ),
  });
  assert.deepEqual(found, [
    { line: 4, text: 'this.$set(this.items, k, 1)' },
    { line: 5, text: 'this.$delete(this.items, k)' },
    { line: 6, text: 'that.$set(that.items, k, 2)' },
    { line: 7, text: 'Vue.set(this.items, k, 3)' },
    { line: 7, text: 'Vue.delete(this.items, k)' },
    { line: 8, text: 'this.$root.$set(this.$root.state, k, 4)' },
  ]);
});

test('setDelete: a Vue that is not the global one is not Vue, and the named set and del of vue are hits', () => {
  assert.deepEqual(hitsOf('setDelete', { 'src/a.js': 'import Vue from "./other.js";\nVue.set(a, b, c);', 'src/other.js': 'export default {};' }), []);
  assert.deepEqual(hitsOf('setDelete', { 'src/a.js': 'import V from "vue";\nV.set(a, b, c);' }), [{ line: 2, text: 'V.set(a, b, c)' }]);
  assert.deepEqual(hitsOf('setDelete', { 'src/a.js': 'import { nextTick, set, del as remove } from "vue";' }), [{ line: 1, text: 'import { nextTick, set, del as remove } from "vue";' }]);
  assert.deepEqual(hitsOf('setDelete', { 'src/a.js': 'import { nextTick, markRaw } from "vue";' }), []);
  assert.deepEqual(hitsOf('setDelete', { 'src/a.js': 'Vue.set(a, b, c);' }), [{ line: 1, text: 'Vue.set(a, b, c)' }]);
});

test('eventBus: $on, $off and $once, with what they are called on; mitt, jQuery and a plain on are not', () => {
  const found = notesOf('eventBus', {
    'src/utils/eventBus.js': 'import Vue from "vue";\nconst EventBus = new Vue();\nexport default EventBus;',
    'src/components/a.js': lines(
      'import EventBus from "@/utils/eventBus.js";', // 1
      'import mitt from "mitt";', // 2
      'export default {', // 3
      '  created() {', // 4
      '    EventBus.$on("ALERT", this.push);', // 5
      '    EventBus.$off("ALERT", this.push);', // 6
      '    this.$once("done", this.finish);', // 7
      '    this.$root.$on("x", this.f);', // 8
      '    this.$parent.$off("y");', // 9
      '    this.$refs.child.$on("z", this.g);', // 10
      '    const vm = this; vm.$on("w", this.h);', // 11
      '    other.$on("q", this.i);', // 12
      '    const emitter = mitt(); emitter.on("a", f); emitter.off("a", f);', // 13
      '    $("#x").on("click", f); window.addEventListener("resize", f); stream.once("end", f);', // 14
      '  },', // 15
      '};', // 16
    ),
  });
  assert.deepEqual(found, [
    { line: 5, text: 'EventBus.$on("ALERT", this.push)', note: 'on: bus EventBus (new Vue() in src/utils/eventBus.js)' },
    { line: 6, text: 'EventBus.$off("ALERT", this.push)', note: 'on: bus EventBus (new Vue() in src/utils/eventBus.js)' },
    { line: 7, text: 'this.$once("done", this.finish)', note: 'on: the component' },
    { line: 8, text: 'this.$root.$on("x", this.f)', note: 'on: $root' },
    { line: 9, text: 'this.$parent.$off("y")', note: 'on: $parent' },
    { line: 10, text: 'this.$refs.child.$on("z", this.g)', note: 'on: a ref (this.$refs.child)' },
    { line: 11, text: 'vm.$on("w", this.h)', note: 'on: the component' },
    { line: 12, text: 'other.$on("q", this.i)', note: 'on: other' },
  ]);
});

test('emitOnOther: $emit on a bus, $root or $parent is a note; the component\'s own $emit and other emitters are not', () => {
  const found = notesOf('emitOnOther', {
    'src/utils/eventBus.js': 'import Vue from "vue";\nexport default new Vue();',
    'src/components/a.js': lines(
      'import EventBus from "@/utils/eventBus.js";', // 1
      'export default {', // 2
      '  methods: {', // 3
      '    go() {', // 4
      '      EventBus.$emit("ALERT", 1);', // 5
      '      this.$root.$emit("bv::show::modal", "m");', // 6
      '      this.$parent.$emit("x");', // 7
      '      this.$emit("own"); const vm = this; vm.$emit("own2");', // 8
      '      emitter.emit("a"); socket.$emit("b");', // 9
      '    },', // 10
      '  },', // 11
      '};', // 12
    ),
  });
  assert.deepEqual(found, [
    { line: 5, text: 'EventBus.$emit("ALERT", 1)', note: 'on: bus EventBus (new Vue() in src/utils/eventBus.js)' },
    { line: 6, text: 'this.$root.$emit("bv::show::modal", "m")', note: 'on: $root' },
    { line: 7, text: 'this.$parent.$emit("x")', note: 'on: $parent' },
    { line: 9, text: 'socket.$emit("b")', note: 'on: other' },
  ]);
});

test('children, listeners, scopedSlots: the members that are gone, not look-alikes, strings or comments', () => {
  const files = {
    'src/a.js': lines(
      'export default {', // 1
      '  methods: {', // 2
      '    go() {', // 3
      '      const kids = this.$children; const first = vm.$children[0];', // 4
      '      const l = this.$listeners; const s = this.$scopedSlots.default;', // 5
      '      const near = this.children + this.listeners + this.scopedSlots + this.$slots;', // 6
      '      // this.$children', // 7
      '      const text = "$children $listeners $scopedSlots";', // 8
      '    },', // 9
      '  },', // 10
      '};', // 11
    ),
  };
  assert.deepEqual(hitsOf('children', files), [
    { line: 4, text: 'this.$children' },
    { line: 4, text: 'vm.$children[0]' },
  ]);
  assert.deepEqual(hitsOf('listeners', files), [{ line: 5, text: 'this.$listeners' }]);
  assert.deepEqual(hitsOf('scopedSlots', files), [{ line: 5, text: 'this.$scopedSlots.default' }]);
});

test('destroyMount: $destroy and $mount on an instance; app.mount, a chart.destroy and the DOM are not', () => {
  const found = hitsOf('destroyMount', {
    'src/a.js': lines(
      'const tip = new Ctor();', // 1
      'tip.$mount(document.createElement("div"));', // 2
      'this.$destroy();', // 3
      'app.mount("#app"); chart.destroy(); app.unmount(); el.remove(); this.destroyed = true;', // 4
    ),
  });
  assert.deepEqual(found, [
    { line: 2, text: 'tip.$mount(document.createElement("div"))' },
    { line: 3, text: 'this.$destroy()' },
  ]);
});

test('removedInternals: $vnode, $createElement, $isServer and _uid on the component; _uid of a plain object is not', () => {
  const found = hitsOf('removedInternals', {
    'src/a.js': lines(
      'export default {', // 1
      '  computed: {', // 2
      '    id() { return `x-${this._uid}`; },', // 3
      '    node() { return this.$vnode.data; },', // 4
      '    el() { return this.$createElement("div"); },', // 5
      '    ssr() { return this.$isServer; },', // 6
      '    row() { return row._uid + this.uid + this.vnode; },', // 7
      '  },', // 8
      '};', // 9
    ),
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), ['3: this._uid', '4: this.$vnode.data', '5: this.$createElement("div")', '6: this.$isServer']);
});

test('hookEvents: a hook: listener on $on or $once; other event names are not', () => {
  const found = hitsOf('hookEvents', {
    'src/a.js': lines(
      'export default {', // 1
      '  mounted() {', // 2
      '    this.$once("hook:beforeDestroy", this.stop);', // 3
      '    this.$on(`hook:destroyed`, this.stop);', // 4
      '    this.$on("hooks", this.f); this.$on("a:hook:b", this.f); this.$emit("hook:x");', // 5
      '  },', // 6
      '};', // 7
    ),
  });
  assert.deepEqual(found, [
    { line: 3, text: 'this.$once("hook:beforeDestroy", this.stop)' },
    { line: 4, text: 'this.$on(`hook:destroyed`, this.stop)' },
  ]);
});

test('destroyHooks: beforeDestroy and destroyed in a component, a mixin and Vue.extend; a method, a flag and strings are not', () => {
  const found = hitsOf('destroyHooks', {
    'src/a.js': lines(
      'export default {', // 1
      '  data() { return { destroyed: false }; },', // 2
      '  beforeDestroy() { this.stop(); },', // 3
      '  destroyed: function () { this.x = 1; },', // 4
      '  methods: { destroyed() {}, beforeDestroy() {} },', // 5
      '};', // 6
    ),
    'src/mixins/m.js': 'export default {\n  beforeDestroy: [cleanup],\n};',
    'src/b.js': lines('import Vue from "vue";', 'export const C = Vue.extend({', '  destroyed() {},', '});', 'const s = "beforeDestroy"; // destroyed() {}'),
  });
  assert.deepEqual(found, [
    { line: 3, text: 'beforeDestroy() { this.stop(); }' },
    { line: 4, text: 'destroyed: function () { this.x = 1; }' },
    { line: 3, text: 'destroyed() {}' },
    { line: 2, text: 'beforeDestroy: [cleanup]' },
  ]);
});

test('attrsUse and slotsAccess: notes on $attrs and $slots; plain attrs and slots are not', () => {
  const files = {
    'src/a.js': lines(
      'export default {', // 1
      '  computed: {', // 2
      '    all() { return { ...this.$attrs, a: this.$attrs.title }; },', // 3
      '    has() { return !!this.$slots.default && this.$slots.header.length; },', // 4
      '    near() { return this.attrs + this.slots; },', // 5
      '  },', // 6
      '};', // 7
    ),
  };
  assert.deepEqual(hitsOf('attrsUse', files), [
    { line: 3, text: 'this.$attrs' },
    { line: 3, text: 'this.$attrs.title' },
  ]);
  assert.deepEqual(hitsOf('slotsAccess', files), [
    { line: 4, text: 'this.$slots.default' },
    { line: 4, text: 'this.$slots.header.length' },
  ]);
});

// ---- script: the global Vue --------------------------------------------------------------------------------------------

test('vueImport: the default import of vue, a require of it and a build under vue/dist; named imports and other modules are not', () => {
  const found = hitsOf('vueImport', {
    'src/a.js': 'import Vue from "vue";',
    'src/b.js': "import Vue, { shallowRef } from 'vue';",
    'src/c.js': 'const Vue = require("vue");',
    'src/d.js': 'import Vue from "vue/dist/vue.esm.js";',
    'src/e.js': 'import { markRaw, nextTick } from "vue";\nimport * as V from "vue";\nimport Vue from "./vue-like.js";\nimport VueCookies from "vue-cookies";',
    'src/vue-like.js': 'export default {};',
  });
  assert.deepEqual(found.map(({ text }) => text), ['import Vue from "vue";', "import Vue, { shallowRef } from 'vue';", 'require("vue")', 'import Vue from "vue/dist/vue.esm.js";']);
});

test('vueExtend and newVue: Vue.extend, new Vue and new of what Vue.extend returned; $.extend, new Map and new VueRouter are not', () => {
  const files = {
    'src/a.js': lines(
      'import Vue from "vue";', // 1
      'import VueRouter from "vue-router";', // 2
      'const Ctor = Vue.extend(Tip);', // 3
      'const tip = new Ctor();', // 4
      'const bus = new Vue();', // 5
      'const app = new Vue({ render: (h) => h(Page) });', // 6
      '$.extend(a, b); _.extend(a, b); new Map(); new VueRouter({}); new Date();', // 7
    ),
  };
  assert.deepEqual(hitsOf('vueExtend', files), [{ line: 3, text: 'Vue.extend(Tip)' }]);
  assert.deepEqual(hitsOf('newVue', files), [
    { line: 4, text: 'new Ctor()' },
    { line: 5, text: 'new Vue()' },
    { line: 6, text: 'new Vue({ render: (h) => h(Page) })' },
  ]);
});

test('vueObservable, vueRegister, vueNextTick, vuePrototype, vueOther: each member of the global Vue; app.component and $nextTick are not', () => {
  const files = {
    'src/a.js': lines(
      'import Vue from "vue";', // 1
      'Vue.observable({ a: 1 });', // 2
      'Vue.component("x-y", Comp); Vue.use(Plugin); Vue.mixin({}); Vue.directive("d", {}); Vue.filter("f", fn);', // 3
      'await Vue.nextTick(); Vue.nextTick(() => 1);', // 4
      'Vue.prototype.$http = http;', // 5
      'const v = Vue.version; Vue.compile(t); Vue.util.warn();', // 6
      'app.component("x", Comp); app.use(Plugin); this.$nextTick(f); Foo.prototype.bar = 1; nextTick(f);', // 7
    ),
    'src/b.js': 'Vue.nextTick(f);',
    'src/c.js': 'import Vue from "./other.js";\nVue.nextTick(f);\nVue.use(x);',
    'src/other.js': 'export default {};',
  };
  assert.deepEqual(hitsOf('vueObservable', files), [{ line: 2, text: 'Vue.observable({ a: 1 })' }]);
  assert.deepEqual(hitsOf('vueRegister', files).map(({ text }) => text), [
    'Vue.component("x-y", Comp)',
    'Vue.use(Plugin)',
    'Vue.mixin({})',
    'Vue.directive("d", {})',
    'Vue.filter("f", fn)',
  ]);
  assert.deepEqual(hitsOf('vueNextTick', files), [
    { line: 4, text: 'Vue.nextTick()' },
    { line: 4, text: 'Vue.nextTick(() => 1)' },
    { line: 1, text: 'Vue.nextTick(f)' },
  ]);
  assert.deepEqual(hitsOf('vuePrototype', files), [{ line: 5, text: 'Vue.prototype.$http = http' }]);
  assert.deepEqual(hitsOf('vueOther', files), [
    { line: 6, text: 'Vue.version' },
    { line: 6, text: 'Vue.compile(t)' },
    { line: 6, text: 'Vue.util.warn()' },
  ]);
});

test('vueConfig and keyCodes: Vue.config and its keyCodes; app.config is not', () => {
  const files = {
    'src/a.js': lines(
      'import Vue from "vue";', // 1
      'Vue.config.productionTip = false;', // 2
      'Vue.config.errorHandler = (e) => log(e);', // 3
      'Vue.config.keyCodes.f1 = 112;', // 4
      'Vue.config.keyCodes = { up: 38 };', // 5
      'app.config.errorHandler = f; config.keyCodes = {};', // 6
    ),
  };
  assert.deepEqual(hitsOf('vueConfig', files), [
    { line: 2, text: 'Vue.config.productionTip = false' },
    { line: 3, text: 'Vue.config.errorHandler = (e) => log(e)' },
  ]);
  assert.deepEqual(hitsOf('keyCodes', files), [
    { line: 4, text: 'Vue.config.keyCodes.f1 = 112' },
    { line: 5, text: 'Vue.config.keyCodes = { up: 38 }' },
  ]);
});

// ---- script: component options -----------------------------------------------------------------------------------------

test('filtersOption, modelOption, functional: options of a component; the same keys of a plain object are not', () => {
  const files = {
    'src/a.js': lines(
      'export default {', // 1
      '  functional: true,', // 2
      '  model: { prop: "checked", event: "change" },', // 3
      '  filters: { cap(v) { return v; }, low: (v) => v },', // 4
      '  props: ["a"],', // 5
      '};', // 6
      'const chart = { filters: [], model: { a: 1 }, functional: true };', // 7
    ),
    'src/b.js': 'const config = { filters: { a: 1 }, model: {}, functional: false, methods: [] };',
    'src/c.js': 'export default {\n  methods: { go() {} },\n  filters: { f() {} },\n};',
  };
  assert.deepEqual(hitsOf('functional', files), [{ line: 2, text: 'functional: true' }]);
  assert.deepEqual(hitsOf('modelOption', files), [{ line: 3, text: 'model: { prop: "checked", event: "change" }' }]);
  assert.deepEqual(hitsOf('filtersOption', files), [
    { line: 4, text: 'filters: { cap(v) { return v; }, low: (v) => v }' },
    { line: 3, text: 'filters: { f() {} }' },
  ]);
});

test('renderFunction: render(h), render with createElement and JSX; a render with no parameter and one of a class are not', () => {
  const files = {
    'src/a.js': lines(
      'export default {', // 1
      '  render(h) { return h("div"); },', // 2
      '};', // 3
    ),
    'src/b.js': 'export default {\n  methods: {},\n  render: (createElement) => createElement("p"),\n};',
    'src/c.js': 'export default {\n  methods: {},\n  render() { return this.$slots.default; },\n};',
    'src/d.js': 'export default {\n  methods: {},\n  render() { return <div class="a">x</div>; },\n};',
    'src/e.js': 'class Chart { render(ctx) { return ctx; } }\nconst v = { render(ctx) { return ctx; } };',
  };
  assert.deepEqual(hitsOf('renderFunction', files).map(({ line, text }) => `${line}: ${text}`), [
    '2: render(h) { return h("div"); }',
    '3: render: (createElement) => createElement("p")',
    '3: <div class="a">x</div>',
  ]);
});

test('propDefaultThis: a prop default that uses this; an arrow, a factory and a nested function are not', () => {
  const found = hitsOf('propDefaultThis', {
    'src/a.js': lines(
      'export default {', // 1
      '  props: {', // 2
      '    a: { type: Object, default() { return { n: this.b }; } },', // 3
      '    b: { type: Object, default: function () { return this.c; } },', // 4
      '    c: { type: Object, default: () => ({}) },', // 5
      '    d: { type: Array, default() { return []; } },', // 6
      '    e: { type: Function, default() { return function () { return this; }; } },', // 7
      '    f: String,', // 8
      '  },', // 9
      '  methods: {},', // 10
      '};', // 11
    ),
  });
  assert.deepEqual(found, [
    { line: 3, text: 'a: default() { return { n: this.b }; }' },
    { line: 4, text: 'b: default: function () { return this.c; }' },
  ]);
});

test('dataObject: data as an object in a component or a root; a function, an array and a plain object are not', () => {
  const found = hitsOf('dataObject', {
    'src/a.js': lines(
      'export default {', // 1
      '  data: { a: 1 },', // 2
      '  methods: {},', // 3
      '};', // 4
    ),
    'src/b.js': 'new Vue({ el: "#a", data: { b: 1 } });',
    'src/c.js': 'export default {\n  methods: {},\n  data() { return { x: 1 }; },\n};\nexport const d = { methods: {}, data: () => ({}) };',
    'src/d.js': 'const series = { name: "s", data: [1, 2] };\nconst chart = { data: { x: 1 } };',
  });
  assert.deepEqual(found, [{ line: 2, text: 'data: { a: 1 }' }, { line: 1, text: 'data: { b: 1 }' }]);
});

test('directiveHooks: the Vue 2 hook names of a directive, local or with Vue.directive; the Vue 3 names are not', () => {
  const found = hitsOf('directiveHooks', {
    'src/a.js': lines(
      'export default {', // 1
      '  directives: {', // 2
      '    focus: { inserted(el) { el.focus(); }, unbind() {} },', // 3
      '    old: { bind(el) {}, componentUpdated() {}, update() {} },', // 4
      '    fine: { mounted(el) {}, beforeUnmount() {} },', // 5
      '    short: function (el) {},', // 6
      '  },', // 7
      '};', // 8
    ),
    'src/b.js': 'Vue.directive("d", { bind(el) {} });\nVue.directive("e", { mounted(el) {} });',
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), ['3: focus: inserted, unbind', '4: old: bind, componentUpdated, update', '1: d: bind']);
});

test('inheritAttrs: inheritAttrs: false is a note; true is not', () => {
  const found = hitsOf('inheritAttrs', { 'src/a.js': 'export default {\n  inheritAttrs: false,\n  methods: {},\n};', 'src/b.js': 'export default {\n  inheritAttrs: true,\n  methods: {},\n};' });
  assert.deepEqual(found, [{ line: 2, text: 'inheritAttrs: false' }]);
});

test('emitInput: $emit("input") on the component; other names and other emitters are not', () => {
  const found = hitsOf('emitInput', {
    'src/a.js': lines(
      'export default {', // 1
      '  methods: {', // 2
      '    go(v) {', // 3
      '      this.$emit("input", v); this.$emit(`input`, v);', // 4
      '      const vm = this; vm.$emit("input");', // 5
      '      this.$emit("update:modelValue", v); this.$emit("inputs"); emitter.emit("input"); this.$emit(name);', // 6
      '    },', // 7
      '  },', // 8
      '};', // 9
    ),
  });
  assert.deepEqual(found, [
    { line: 4, text: 'this.$emit("input", v)' },
    { line: 4, text: 'this.$emit(`input`, v)' },
    { line: 5, text: 'vm.$emit("input")' },
  ]);
});

test('emitsMissing: a native event name emitted and not declared in emits; a declared one, a custom name and a dynamic name are not', () => {
  const found = notesOf('emitsMissing', {
    'src/components/a.js': lines(
      'export default {', // 1
      '  methods: {', // 2
      '    go() { this.$emit("click"); this.$emit("custom"); this.$emit(name); },', // 3
      '  },', // 4
      '};', // 5
    ),
    'src/components/b.js': 'export default {\n  emits: ["click", "change"],\n  methods: { go() { this.$emit("click"); this.$emit("change"); this.$emit("input"); } },\n};',
    'src/components/c.js': 'export default {\n  emits: { click: null, change: (v) => true },\n  methods: { go() { this.$emit("click"); this.$emit("change", 1); } },\n};',
  });
  assert.deepEqual(found, [
    { line: 3, text: 'this.$emit("click")', note: 'no emits option' },
    { line: 3, text: 'this.$emit("input")', note: 'emits does not list "input"' },
  ]);
});

test('watchArrays: a watcher of an array without deep, with whether the file changes the array in place', () => {
  const found = notesOf('watchArrays', {
    'src/a.js': lines(
      'export default {', // 1
      '  props: { rows: Array, columns: { type: Array, default: () => [] }, size: Number },', // 2
      '  data() { return { items: [], list: new Array(), count: 0, other: [] }; },', // 3
      '  watch: {', // 4
      '    items() { this.draw(); },', // 5
      '    list: { handler() { this.draw(); }, immediate: true },', // 6
      '    other: { handler() {}, deep: true },', // 7
      '    count() {}, size() {},', // 8
      '    rows(v) {}, columns: "redraw",', // 9
      '  },', // 10
      '  methods: {', // 11
      '    add(x) { this.items.push(x); this.list[0] = 1; this.$set(this.columns, 0, x); },', // 12
      '    again() { this.items.splice(0, 1); this.other.pop(); },', // 13
      '  },', // 14
      '};', // 15
    ),
  });
  assert.deepEqual(found, [
    { line: 5, text: 'watch items (data array, no deep)', note: 'changed in place at line 12 (push), 13 (splice)' },
    { line: 6, text: 'watch list (data array, no deep)', note: 'changed in place at line 12 (index assignment)' },
    { line: 9, text: 'watch rows (prop array, no deep)', note: 'no in-place change seen in this file' },
    { line: 9, text: 'watch columns (prop array, no deep)', note: 'changed in place at line 12 ($set)' },
  ]);
});

test('bvInstance: $bvModal, $bvToast and a bv:: event name in a script; look-alikes, comments and prose are not', () => {
  const found = hitsOf('bvInstance', {
    'src/a.js': lines(
      'export default {', // 1
      '  methods: {', // 2
      '    go() {', // 3
      '      this.$bvModal.show("m"); this.$bvToast.toast("hi", { title: "x" });', // 4
      '      this.$root.$emit("bv::show::modal", "m");', // 5
      '      this.$root.$on("bv::modal::hidden", f);', // 6
      '      const near = this.$bv + "bv:" + "bvModal"; // this.$bvModal.hide()', // 7
      '      const note = "see bv:: in the docs";', // 8
      '    },', // 9
      '  },', // 10
      '};', // 11
    ),
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), [
    '4: this.$bvModal.show("m")',
    '4: this.$bvToast.toast("hi", { title: "x" })',
    '5: "bv::show::modal"',
    '6: "bv::modal::hidden"',
  ]);
});

test('bvImports: an import of bootstrap-vue, its stylesheet and its icons; another package is not', () => {
  const found = hitsOf('bvImports', {
    'src/a.js': lines(
      'import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";', // 1
      'import "bootstrap-vue/dist/bootstrap-vue.css";', // 2
      'import { BTable } from "bootstrap-vue/src/components/table";', // 3
      'import "bootstrap/dist/css/bootstrap.css";', // 4
      'import x from "vue-bootstrap";', // 5
      'const m = require("bootstrap-vue");', // 6
    ),
  });
  assert.deepEqual(found.map(({ line }) => line), [1, 2, 3, 6]);
});

test('bvDomQuery: a selector that names a BootstrapVue class or id in a script; an ordinary class is not', () => {
  const found = hitsOf('bvDomQuery', {
    'src/a.js': lines(
      'document.querySelector(".b-table th");', // 1
      'el.closest("table.b-table"); $("#__BVID__12 .bv-no-focus-ring");', // 2
      'document.querySelector(".table"); el.classList.add("b-table-custom"); const tag = "b-table"; ', // 3
      '// document.querySelector(".b-skeleton")', // 4
    ),
  });
  assert.deepEqual(found, [
    { line: 1, text: '".b-table th"' },
    { line: 2, text: '"table.b-table"' },
    { line: 2, text: '"#__BVID__12 .bv-no-focus-ring"' },
  ]);
});

// ---- template ---------------------------------------------------------------------------------------------------------

/** A tree with one component, `A.vue`, whose template is `template` (it starts at line 2 of the file). */
const one = (template, script) => ({ 'src/components/A.vue': component(template, script) });

test('native: .native on a listener, with other modifiers; a plain listener, a comment and text are not', () => {
  const found = hitsOf(
    'native',
    one(
      lines(
        '<div>', // 2
        '  <comp @click.native="go" />', // 3
        '  <comp @click="go" />', // 4
        '  <b-button v-on:keyup.native.prevent="x"></b-button>', // 5
        '  <!-- <comp @click.native="old" /> -->', // 6
        '  <p>@click.native="text"</p>', // 7
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '<comp @click.native="go">' },
    { line: 5, text: '<b-button v-on:keyup.native.prevent="x">' },
  ]);
});

test('sync: .sync on a bound prop; a plain binding is not', () => {
  const found = hitsOf('sync', one(lines('<div>', '  <comp :title.sync="t" v-bind:open.sync="o" :plain="p" />', '</div>')));
  assert.deepEqual(found, [
    { line: 3, text: '<comp :title.sync="t">' },
    { line: 3, text: '<comp v-bind:open.sync="o">' },
  ]);
});

test('keyCodeModifier: a numeric key code; a key name is not', () => {
  const found = hitsOf('keyCodeModifier', one(lines('<div>', '  <input @keyup.13="go" @keyup.enter="go" @keydown.ctrl.65="s" @keydown.page-down="p">', '</div>')));
  assert.deepEqual(found, [
    { line: 3, text: '<input @keyup.13="go">' },
    { line: 3, text: '<input @keydown.ctrl.65="s">' },
  ]);
});

test('oldSlotSyntax: slot and slot-scope attributes; v-slot, # and a <slot> outlet are not', () => {
  const found = hitsOf(
    'oldSlotSyntax',
    one(
      lines(
        '<comp>', // 2
        '  <template slot="head">a</template>', // 3
        '  <template slot-scope="p">{{ p }}</template>', // 4
        '  <span slot="foot">b</span>', // 5
        '  <template v-slot:body="p">c</template>', // 6
        '  <template #cell(name)="d">d</template>', // 7
        '  <slot name="slot"></slot>', // 8
        '</comp>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '<template slot="head">' },
    { line: 4, text: '<template slot-scope="p">' },
    { line: 5, text: '<span slot="foot">' },
  ]);
});

test('templateFilters: a filter in an interpolation or a binding; || and a string are not', () => {
  const found = hitsOf(
    'templateFilters',
    one(
      lines(
        '<div>', // 2
        '  <p>{{ price | currency }}</p>', // 3
        '  <p :title="name | upper | trim(2)">{{ a || b }} {{ "x | y" }}</p>', // 4
        '  <!-- {{ c | d }} -->', // 5
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '{{ price | currency }}' },
    { line: 4, text: '<p :title="name | upper | trim(2)">' },
  ]);
});

test('vModelComponent: v-model on a component with the child\'s contract; on a native element or a BootstrapVue component it is not', () => {
  const found = notesOf('vModelComponent', {
    'src/components/Parent.vue': component(
      lines(
        '<div>', // 2
        '  <child-a v-model="a" />', // 3
        '  <child-b v-model.trim="b" />', // 4
        '  <child-c v-model="c" />', // 5
        '  <child-d v-model="d" />', // 6
        '  <vue-typeahead-bootstrap v-model="q" />', // 7
        '  <component :is="which" v-model="w" />', // 8
        '  <input v-model="x"><select v-model="y"></select><textarea v-model="z"></textarea>', // 9
        '  <b-form-input v-model="f" /><b-pagination v-model="g" />', // 10
        '  <missing-one v-model="m" />', // 11
        '</div>',
      ),
      lines(
        'import ChildA from "./ChildA.vue";',
        'import ChildB from "./ChildB.vue";',
        'import ChildC from "./ChildC.vue";',
        'import ChildD from "./ChildD.vue";',
        'import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";',
        'export default { components: { ChildA, ChildB, ChildC, ChildD, VueTypeaheadBootstrap } };',
      ),
    ),
    'src/components/ChildA.vue': component('<input>', 'export default { props: ["value"], methods: { go(v) { this.$emit("input", v); } } };'),
    'src/components/ChildB.vue': component('<input>', 'export default { props: { checked: Boolean }, model: { prop: "checked", event: "change" }, emits: ["change"] };'),
    'src/components/ChildC.vue': component('<input>', 'export default { props: ["modelValue"], emits: ["update:modelValue"] };'),
    'src/components/ChildD.vue': component('<input>', 'export default { props: ["label"] };'),
  });
  assert.deepEqual(found, [
    { line: 3, text: '<child-a v-model="a">', note: 'src/components/ChildA.vue: value + input (Vue 2 contract)' },
    { line: 4, text: '<child-b v-model.trim="b">', note: 'src/components/ChildB.vue: checked + change (model option)' },
    { line: 5, text: '<child-c v-model="c">', note: 'src/components/ChildC.vue: modelValue + update:modelValue' },
    { line: 6, text: '<child-d v-model="d">', note: 'src/components/ChildD.vue: no value or modelValue prop' },
    { line: 7, text: '<vue-typeahead-bootstrap v-model="q">', note: 'package vue-typeahead-bootstrap' },
    { line: 8, text: '<component :is="which" v-model="w">', note: 'dynamic component' },
    { line: 11, text: '<missing-one v-model="m">', note: 'component not found' },
  ]);
});

test('inlineTemplate, functionalTemplate, templateNoDirective, isOnElement: each of them; look-alikes are not', () => {
  const files = {
    'src/components/A.vue': lines(
      '<template functional>', // 1
      '  <div>', // 2
      '    <comp inline-template><b>x</b></comp>', // 3
      '    <template><i>bare</i></template>', // 4
      '    <template v-if="a">1</template><template v-else>2</template><template v-for="i in l">3</template>', // 5
      '    <template #x>4</template><template v-slot:y>5</template><template slot="z">6</template>', // 6
      '    <table><tr is="row-item"></tr><tr :is="\'row-item\'"></tr><tr is="vue:row-item"></tr></table>', // 7
      '    <component is="x" /><component :is="y" /><comp is="z" />', // 8
      '  </div>', // 9
      '</template>', // 10
      '<script>export default {};</script>', // 11
    ),
  };
  assert.deepEqual(hitsOf('functionalTemplate', files), [{ line: 1, text: '<template functional>' }]);
  assert.deepEqual(hitsOf('inlineTemplate', files), [{ line: 3, text: '<comp inline-template>' }]);
  assert.deepEqual(hitsOf('templateNoDirective', files), [{ line: 4, text: '<template>' }]);
  assert.deepEqual(hitsOf('isOnElement', files), [
    { line: 7, text: '<tr is="row-item">' },
    { line: 7, text: '<tr :is="\'row-item\'">' },
  ]);
});

test('vForRef: a ref in a v-for, on the element or below it; a ref outside a loop and a function ref are not', () => {
  const found = notesOf(
    'vForRef',
    one(
      lines(
        '<div>', // 2
        '  <span ref="one"></span>', // 3
        '  <ul>', // 4
        '    <li v-for="i in items" :key="i" ref="rows"><b ref="inner"></b></li>', // 5
        '    <li v-for="i in items" :key="i" :ref="el => keep(el)"></li>', // 6
        '  </ul>', // 7
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 5, text: '<li ref="rows">', note: 'inside v-for="i in items"' },
    { line: 5, text: '<b ref="inner">', note: 'inside v-for="i in items"' },
  ]);
});

test('ifWithFor: v-if on the element that has v-for; a v-if inside the loop or on its template is not', () => {
  const found = hitsOf(
    'ifWithFor',
    one(
      lines(
        '<ul>', // 2
        '  <li v-for="i in items" v-if="i.ok" :key="i.id">{{ i }}</li>', // 3
        '  <li v-if="a" v-for="i in more">{{ i }}</li>', // 4
        '  <template v-for="i in items"><li v-if="i.ok">{{ i }}</li></template>', // 5
        '  <li v-for="i in items"><b v-if="i.ok">x</b></li>', // 6
        '</ul>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '<li v-for="i in items" v-if="i.ok">' },
    { line: 4, text: '<li v-if="a" v-for="i in more">' },
  ]);
});

test('bindObjectOrder: v-bind="obj" after an explicit attribute is a note; before it, alone or with $listeners it is not', () => {
  const found = hitsOf(
    'bindObjectOrder',
    one(
      lines(
        '<div>', // 2
        '  <comp class="a" v-bind="obj" />', // 3
        '  <comp v-bind="obj" class="a" />', // 4
        '  <comp v-bind="obj" />', // 5
        '  <comp :a="1" v-bind="obj" />', // 6
        '  <comp :a="1" v-bind="$listeners" />', // 7
        '  <comp :key="k" ref="r" v-bind="obj" />', // 8
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '<comp class="a" v-bind="obj">' },
    { line: 6, text: '<comp :a="1" v-bind="obj">' },
  ]);
});

test('attrCoercion: a bound aria-, data- or unknown attribute on a plain element, and the enumerated ones; known and literal ones are not', () => {
  const found = notesOf(
    'attrCoercion',
    one(
      lines(
        '<div>', // 2
        '  <div :aria-hidden="hidden" :data-id="id" :contenteditable="edit" :draggable="drag" :spellcheck="s" :foo="bar" :data-no="false"></div>', // 3
        '  <div :disabled="x" :title="t" :class="c" :id="i" :data-x="\'a\'" :data-y="1" :aria-label="`l`" :checked="on"></div>', // 4
        '  <svg><path :d="p" :fill-opacity="o" /></svg>', // 5
        '  <comp :aria-hidden="x" :foo="y" />', // 6
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found, [
    { line: 3, text: '<div :aria-hidden="hidden">', note: 'aria-*: false is kept as "false" on Vue 3' },
    { line: 3, text: '<div :data-id="id">', note: 'data-*: false is kept as "false" on Vue 3' },
    { line: 3, text: '<div :contenteditable="edit">', note: 'enumerated attribute: null and undefined remove it on Vue 3 (Vue 2 wrote "false")' },
    { line: 3, text: '<div :draggable="drag">', note: 'enumerated attribute: null and undefined remove it on Vue 3 (Vue 2 wrote "false")' },
    { line: 3, text: '<div :spellcheck="s">', note: 'enumerated attribute: null and undefined remove it on Vue 3 (Vue 2 wrote "false")' },
    { line: 3, text: '<div :foo="bar">', note: 'unknown attribute: false is kept as "false" on Vue 3' },
    { line: 3, text: '<div :data-no="false">', note: 'data-*: bound to false (kept as "false" on Vue 3)' },
    { line: 4, text: '<div :checked="on">', note: 'checked on a <div>: an attribute there, not a property' },
  ]);
});

test('multiRoot and fallthroughMultiRoot: a component with several roots, and a parent that passes it class or listeners', () => {
  const files = {
    'src/components/Many.vue': lines('<template>', '  <div>a</div>', '  <div>b</div>', '</template>', '<script>', 'export default { name: "Many", props: ["label"], emits: ["go"] };', '</script>'),
    'src/components/One.vue': component('<div>a</div>', 'export default { name: "One" };'),
    'src/components/Chain.vue': component('<div v-if="a">a</div>\n<div v-else>b</div>', 'export default { name: "Chain" };'),
    'src/components/Mixed.vue': component('text <b>x</b>', 'export default { name: "Mixed" };'),
    'src/components/Parent.vue': component(
      lines(
        '<div>', // 2
        '  <many class="x" label="l" @go="g" @click="c" :title="t" />', // 3
        '  <many label="l" @go="g" />', // 4
        '  <one class="x" @click="c" />', // 5
        '</div>',
      ),
      'import Many from "./Many.vue";\nimport One from "./One.vue";\nexport default { components: { Many, One } };',
    ),
  };
  assert.deepEqual(
    scan(reached(files)).hits.multiRoot.map(({ file, line, text }) => ({ file, line, text })),
    [
      { file: 'src/components/Many.vue', line: 2, text: '2 root nodes' },
      { file: 'src/components/Mixed.vue', line: 2, text: '2 root nodes' },
    ],
  );
  assert.deepEqual(notesOf('fallthroughMultiRoot', files), [{ line: 3, text: '<many class="x" @click="c" :title="t">', note: 'src/components/Many.vue has several roots; class, @click, :title are not props or emits' }]);
});

test('listeners, attrsUse, slotsAccess, scopedSlots, hookEvents, setDelete, bvInstance in a template; look-alikes and strings are not', () => {
  const files = one(
    lines(
      '<div>', // 2
      '  <child v-bind="$listeners" v-on="$listeners" v-bind:x="$attrs.x" />', // 3
      '  <p v-if="$slots.default">{{ $scopedSlots.foo({}) }}</p>', // 4
      '  <comp @hook:beforeDestroy="stop" v-on:hook:mounted="start" @hooks="x" />', // 5
      '  <button @click="$set(row, \'open\', true)">x</button>', // 6
      '  <button @click="$bvModal.show(\'m\')">x</button><a @click="$root.$emit(\'bv::show::modal\', \'m\')">y</a>', // 7
      '  <i :title="\'$listeners\'">{{ listeners }}{{ foo.$listeners2 }}</i>', // 8
      '</div>',
    ),
  );
  assert.deepEqual(hitsOf('listeners', files), [
    { line: 3, text: '<child v-bind="$listeners">' },
    { line: 3, text: '<child v-on="$listeners">' },
  ]);
  assert.deepEqual(hitsOf('attrsUse', files), [{ line: 3, text: '<child v-bind:x="$attrs.x">' }]);
  assert.deepEqual(hitsOf('slotsAccess', files), [{ line: 4, text: '<p v-if="$slots.default">' }]);
  assert.deepEqual(hitsOf('scopedSlots', files), [{ line: 4, text: '{{ $scopedSlots.foo({}) }}' }]);
  assert.deepEqual(hitsOf('hookEvents', files), [
    { line: 5, text: '<comp @hook:beforeDestroy="stop">' },
    { line: 5, text: '<comp v-on:hook:mounted="start">' },
  ]);
  assert.deepEqual(hitsOf('setDelete', files), [{ line: 6, text: '<button @click="$set(row, \'open\', true)">' }]);
  assert.deepEqual(hitsOf('bvInstance', files), [
    { line: 7, text: '<button @click="$bvModal.show(\'m\')">' },
    { line: 7, text: '<a @click="$root.$emit(\'bv::show::modal\', \'m\')">' },
  ]);
});

test('transitionClasses: the -enter and -leave classes in a style and the enter-class attributes; the -active, -to and -from ones are not', () => {
  const files = {
    'src/components/A.vue': lines(
      '<template>', // 1
      '  <div>', // 2
      '    <transition name="fade" enter-class="a" leave-active-class="b"><p /></transition>', // 3
      '    <transition-group tag="ul" leave-class="c"><li /></transition-group>', // 4
      '  </div>', // 5
      '</template>', // 6
      '<script>export default {};</script>', // 7
      '<style scoped lang="scss">', // 8
      '.fade-enter, .fade-leave { opacity: 0; }', // 9
      '.fade-enter-active, .fade-leave-active, .v-enter-to, .list-leave-to, .x-enter-from { transition: 1s; }', // 10
      '.list { .v-leave { color: red; } &.slide-enter { top: 0; } }', // 11
      '.enter, .leaves, .fade-entered { color: red; }', // 12
      '/* .old-enter { } */', // 13
      '</style>', // 14
    ),
  };
  assert.deepEqual(hitsOf('transitionClasses', files), [
    { line: 3, text: '<transition enter-class="a">' },
    { line: 4, text: '<transition-group leave-class="c">' },
    { line: 9, text: '.fade-enter, .fade-leave' },
    { line: 11, text: '.v-leave' },
    { line: 11, text: '&.slide-enter' },
  ]);
});

test('transitionGroupTag: a transition-group with no tag; one with a tag and a transition are not', () => {
  const found = hitsOf('transitionGroupTag', one(lines('<div>', '  <transition-group name="x"><i key="1" /></transition-group>', '  <transition-group tag="ul"><i key="1" /></transition-group>', '  <transition name="y"><i /></transition>', '  <TransitionGroup><i key="2" /></TransitionGroup>', '</div>')));
  assert.deepEqual(found, [
    { line: 3, text: '<transition-group name="x">' },
    { line: 6, text: '<TransitionGroup>' },
  ]);
});

test('scopedDeep: >>>, /deep/ and ::v-deep in a scoped style; :deep(), ::v-deep(...) and an unscoped style are not', () => {
  const files = {
    'src/components/A.vue': lines(
      '<template><div /></template>', // 1
      '<script>export default {};</script>', // 2
      '<style scoped>', // 3
      '.a >>> .b { color: red; }', // 4
      '.a /deep/ .b { color: red; }', // 5
      '.a ::v-deep .b { color: red; }', // 6
      '.a :deep(.b), .c ::v-deep(.d) { color: red; }', // 7
      '</style>', // 8
      '<style>', // 9
      '.a >>> .b { color: red; }', // 10
      '</style>', // 11
    ),
  };
  assert.deepEqual(hitsOf('scopedDeep', files), [
    { line: 4, text: '.a >>> .b' },
    { line: 5, text: '.a /deep/ .b' },
    { line: 6, text: '.a ::v-deep .b' },
  ]);
});

// ---- BootstrapVue -----------------------------------------------------------------------------------------------------

test('bvTags: every b-* and B* tag is a hit, also through is; an own component of that name, b and other tags are not', () => {
  const files = {
    'src/components/A.vue': component(
      lines(
        '<div>', // 2
        '  <b-table :items="rows" small />', // 3
        '  <BCard title="x"></BCard>', // 4
        '  <b-icon-plus-circle-fill /><BIconX />', // 5
        '  <component is="b-modal" /><component :is="\'b-alert\'" />', // 6
        '  <b>bold</b><bar-chart /><b-own />', // 7
        '</div>',
      ),
      'import BOwn from "./BOwn.vue";\nexport default { components: { BOwn } };',
    ),
    'src/components/BOwn.vue': component('<i />', 'export default { name: "BOwn" };'),
  };
  assert.deepEqual(
    hitsOf('bvTags', files).map(({ line, text }) => `${line}: ${text}`),
    [
      '3: <b-table :items="rows" small>',
      '4: <BCard title="x">',
      '5: <b-icon-plus-circle-fill>',
      '5: <BIconX>',
      '6: <component is="b-modal">',
      '6: <component :is="\'b-alert\'">',
    ],
  );
  assert.deepEqual(scan(reached(files)).bvTags.map(({ tag }) => tag), ['b-alert', 'b-card', 'b-icon-plus-circle-fill', 'b-icon-x', 'b-modal', 'b-table']);
});

test('bvTags: the table says what each tag is used with: props, events, v-model, slots, refs, fallthrough and dynamic parts', () => {
  const found = scan(
    reached({
      'src/components/A.vue': component(
        lines(
          '<div>', // 2
          '  <b-table :items="rows" :fields="fields" small hover head-variant="dark" :per-page="10" :currentPage="page" v-model="visible" ref="table" class="t" style="x" id="tbl" aria-label="a" data-k="1" @row-clicked="go" @filtered.native="n" v-bind="opts" v-bind:sortBy.sync="sort" v-on="handlers" :[dynamic]="v">', // 3
          '    <template #cell(name)="{ item, value }">{{ value }} {{ item.x }}</template>', // 4
          '    <template v-slot:head(id)="data">{{ data.label }}</template>', // 5
          '    <template #[slotName]="s">x</template>', // 6
          '    <template slot="row-details" slot-scope="row">{{ row.item }}</template>', // 7
          '    <b-spinner slot="empty" />', // 8
          '  </b-table>', // 9
          '  <b-table :items="b" v-bind="other.config" v-show="ok"><p>rows</p></b-table>', // 10
          '  <b-pagination v-model.number="page" :total-rows="n" per-page="5" size="sm" @input="go" />', // 11
          '</div>',
        ),
        lines(
          'export default {',
          '  data() { return { opts: { striped: true, "foot-clone": true } }; },',
          '  methods: { go() { this.$refs.table.refresh(); this.$refs.table.clearSelected(); this.$refs.table.refresh(); } },',
          '};',
        ),
      ),
    }),
  ).bvTags;
  const table = found.find(({ tag }) => tag === 'b-table');
  assert.equal(table.uses, 2);
  assert.deepEqual(table.files, [{ file: 'src/components/A.vue', uses: 2 }]);
  const prop = (name) => table.props.find((entry) => entry.name === name);
  assert.deepEqual({ ...prop('items') }, { name: 'items', uses: 2, forms: ['bound'], written: [], via: [], kinds: ['expression'], files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('small') }, { name: 'small', uses: 1, forms: ['flag'], written: [], via: [], kinds: [], files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('head-variant') }, { name: 'head-variant', uses: 1, forms: ['string'], written: [], via: [], kinds: [], values: ['dark'], files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('current-page') }, { name: 'current-page', uses: 1, forms: ['bound'], written: ['currentPage'], via: [], kinds: ['expression'], files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('sort-by') }, { name: 'sort-by', uses: 1, forms: ['bound'], written: ['sortBy'], via: [], kinds: ['expression'], sync: 1, files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('striped') }, { name: 'striped', uses: 1, forms: [], written: [], via: ['v-bind object'], kinds: [], files: ['src/components/A.vue'] });
  assert.deepEqual({ ...prop('foot-clone') }, { name: 'foot-clone', uses: 1, forms: [], written: [], via: ['v-bind object'], kinds: [], files: ['src/components/A.vue'] });
  assert.equal(table.props.some(({ name }) => ['class', 'style', 'id', 'ref', 'row-clicked', 'v-model'].includes(name)), false);
  assert.deepEqual(table.events, [
    { name: 'filtered', uses: 1, native: 1, files: ['src/components/A.vue'] },
    { name: 'row-clicked', uses: 1, native: 0, files: ['src/components/A.vue'] },
  ]);
  assert.deepEqual(table.models, [
    { kind: 'v-model', name: null, modifiers: [], uses: 1, files: ['src/components/A.vue'] },
    { kind: 'sync', name: 'sort-by', modifiers: [], uses: 1, files: ['src/components/A.vue'] },
  ]);
  assert.deepEqual(
    table.slots.map(({ name, uses, names, scope, syntax }) => ({ name, uses, names, scope, syntax })),
    [
      { name: '[dynamic]', uses: 1, names: ['slotName'], scope: [], syntax: 'v-slot' },
      { name: 'cell(*)', uses: 1, names: ['cell(name)'], scope: ['item', 'value'], syntax: 'v-slot' },
      { name: 'default', uses: 1, names: ['default'], scope: [], syntax: 'implicit' },
      { name: 'empty', uses: 1, names: ['empty'], scope: [], syntax: 'slot' },
      { name: 'head(*)', uses: 1, names: ['head(id)'], scope: ['label'], syntax: 'v-slot' },
      { name: 'row-details', uses: 1, names: ['row-details'], scope: ['item'], syntax: 'slot' },
    ],
  );
  assert.deepEqual(table.refs, [{ name: 'table', uses: 1, files: ['src/components/A.vue'], methods: [{ name: 'clearSelected', uses: 1 }, { name: 'refresh', uses: 2 }] }]);
  assert.deepEqual(table.fallthrough, { class: 1, style: 1, id: 1, attrs: 2, nativeListeners: 1 });
  assert.deepEqual(table.directives, [{ name: 'v-show', uses: 1, files: ['src/components/A.vue'] }]);
  assert.deepEqual(
    table.dynamic.map(({ kind, text }) => ({ kind, text })),
    [
      { kind: 'fields', text: ':fields="fields"' },
      { kind: 'v-on object', text: 'v-on="handlers"' },
      { kind: 'dynamic prop', text: ':[dynamic]="v"' },
      { kind: 'v-bind object', text: 'v-bind="other.config"' },
    ],
  );
  const pagination = found.find(({ tag }) => tag === 'b-pagination');
  assert.deepEqual(pagination.models, [{ kind: 'v-model', name: null, modifiers: ['number'], uses: 1, files: ['src/components/A.vue'] }]);
  assert.deepEqual(pagination.props.map(({ name, forms }) => `${name}:${forms}`), ['per-page:string', 'size:string', 'total-rows:bound']);
  assert.deepEqual(pagination.events, [{ name: 'input', uses: 1, native: 0, files: ['src/components/A.vue'] }]);
});

test('bvDirectives: v-b-* with its argument, modifiers and value, and the tags it is on; other directives are not', () => {
  const found = scan(
    reached({
      'src/components/A.vue': component(
        lines(
          '<div>', // 2
          '  <span v-b-tooltip.hover.top="\'Tip\'">a</span>', // 3
          '  <b-button v-b-tooltip.hover title="x" v-b-modal.my-modal v-b-toggle:sidebar></b-button>', // 4
          '  <p v-show="a" v-tooltip="b" v-custom:arg.mod="c">b</p>', // 5
          '</div>',
        ),
      ),
    }),
  );
  assert.deepEqual(found.hits.bvDirectives.map(({ line, text }) => `${line}: ${text}`), [
    '3: <span v-b-tooltip.hover.top="\'Tip\'">',
    '4: <b-button v-b-tooltip.hover>',
    '4: <b-button v-b-modal.my-modal>',
    '4: <b-button v-b-toggle:sidebar>',
  ]);
  assert.deepEqual(found.bvDirectives.map(({ name, arg, modifiers, uses, tags, values }) => ({ name, arg, modifiers, uses, tags, values })), [
    { name: 'v-b-modal', arg: null, modifiers: ['my-modal'], uses: 1, tags: ['b-button'], values: [] },
    { name: 'v-b-toggle', arg: 'sidebar', modifiers: [], uses: 1, tags: ['b-button'], values: [] },
    { name: 'v-b-tooltip', arg: null, modifiers: ['hover', 'top'], uses: 1, tags: ['span'], values: ["'Tip'"] },
    { name: 'v-b-tooltip', arg: null, modifiers: ['hover'], uses: 1, tags: ['b-button'], values: [] },
  ]);
});

test('bvRefs: a method called on the ref of a BootstrapVue component, from the script or the template; other refs are not', () => {
  const found = notesOf('bvRefs', {
    'src/components/A.vue': component(
      lines(
        '<div>', // 2
        '  <b-modal ref="modal" id="m"></b-modal><b-table ref="table" /><input ref="field">', // 3
        '  <button @click="$refs.modal.show()">open</button>', // 4
        '</div>',
      ),
      lines(
        'export default {', // 6
        '  methods: {', // 7
        '    open() { this.$refs.modal.show(); this.$refs.table.refresh(); },', // 8
        '    focus() { this.$refs.field.focus(); const t = this.$refs.table; this.$refs.gone.hide(); this.$refs[name].x(); },', // 9
        '  },', // 10
        '};', // 11
      ),
    ),
  });
  assert.deepEqual(found, [
    { line: 4, text: '<button @click="$refs.modal.show()">', note: 'ref "modal" is <b-modal>' },
    { line: 10, text: 'this.$refs.modal.show()', note: 'ref "modal" is <b-modal>' },
    { line: 10, text: 'this.$refs.table.refresh()', note: 'ref "table" is <b-table>' },
    { line: 11, text: 'this.$refs.table', note: 'ref "table" is <b-table>' },
    { line: 11, text: 'this.$refs.gone.hide()', note: 'ref "gone" is not in this file\'s template' },
    { line: 11, text: 'this.$refs[name].x()', note: 'dynamic ref name; this file has BootstrapVue refs: modal, table' },
  ]);
});

test('bvCss: a selector that targets a BootstrapVue class or id, in a style block and in an imported stylesheet; Bootstrap\'s own are not', () => {
  const files = {
    'src/main.js': 'import "./theme.css";\nimport "./components/A.vue";',
    'src/components/A.vue': lines(
      '<template><div /></template>', // 1
      '<script>export default {};</script>', // 2
      '<style>', // 3
      '.b-table { color: red; }', // 4
      'table.b-table > thead th, .b-skeleton { color: red; }', // 5
      '[id^="__BVID__"] .bv-no-focus-ring { outline: 0; }', // 6
      '.table .btn .modal .b .bar .brand-x #b-x-nope { color: red; }', // 7
      '/* .b-old { } */ a[href$=".b-nope"] { color: red; }', // 8
      '.custom { .b-form-btn-label-control { display: none; } }', // 9
      '#__BVID__12 { top: 0; }', // 10
      '[class*="b-calendar"], [class^="bv-"] { top: 0; }', // 11
      '</style>', // 12
    ),
  };
  const found = scan(tree(files), { assets: new Map([['src/theme.css', '.b-icon { width: 1em; }\n.card { top: 0; }\n']]) });
  assert.deepEqual(found.hits.bvCss.map(({ file, line, text }) => `${file}:${line}: ${text}`), [
    'src/components/A.vue:4: .b-table',
    'src/components/A.vue:5: table.b-table > thead th, .b-skeleton',
    'src/components/A.vue:6: [id^="__BVID__"] .bv-no-focus-ring',
    'src/components/A.vue:9: .b-form-btn-label-control',
    'src/components/A.vue:10: #__BVID__12',
    'src/components/A.vue:11: [class*="b-calendar"], [class^="bv-"]',
    'src/theme.css:1: .b-icon',
  ]);
});

// ---- packages ---------------------------------------------------------------------------------------------------------------

const MANIFESTS = {
  'vue-cookies': { version: '1.8.6', dependencies: {}, peerDependencies: {}, importsVue: false },
  vuex: { version: '3.6.2', dependencies: {}, peerDependencies: { vue: '^2.0.0' }, importsVue: false },
  'portal-vue': { version: '2.1.7', dependencies: {}, peerDependencies: { vue: '^2.5.17' }, importsVue: false },
  'vue-codemirror': { version: '4.0.6', dependencies: { codemirror: '^5.41.0' }, peerDependencies: {}, importsVue: false },
  'chart.js': { version: '3.9.1', dependencies: {}, peerDependencies: {}, importsVue: false },
  jquery: { version: '3.7.1', dependencies: {}, peerDependencies: {}, importsVue: false },
  wrapper: { version: '1.0.0', dependencies: {}, peerDependencies: { vue: '>=2.6 <4' }, importsVue: false },
  gadget: { version: '2.0.0', dependencies: {}, peerDependencies: {}, importsVue: true },
  'router-like': { version: '3.0.0', dependencies: { 'vue-router': '^3.0.0' }, peerDependencies: {}, importsVue: false },
  vue: { version: '3.5.45', dependencies: {}, peerDependencies: {}, importsVue: false },
  bootstrap: { version: '4.6.2', dependencies: {}, peerDependencies: {}, importsVue: false },
};
const manifest = (name) => MANIFESTS[name] ?? null;

test('packages: every package the reachable files import that depends on Vue, with its importers; the others are marked', () => {
  const found = scan(
    reached({
      'src/a.js': lines(
        'import VueCookies from "vue-cookies";', // 1
        'import Vuex, { mapState } from "vuex";', // 2
        'import { Chart } from "chart.js";', // 3
        'const portal = require("portal-vue");', // 4
        'const lazy = () => import("vue-codemirror/src/index.js");', // 5
        'import "@scope/vue-thing/dist/style.css";', // 6
        'import "jquery";', // 7
        'import wrapper from "wrapper"; import gadget from "gadget"; import router from "router-like";', // 8
        'import { markRaw, nextTick } from "vue";', // 9
      ),
      'src/b.js': 'import VueCookies from "vue-cookies";\nimport { mapState } from "vuex";\nexport * from "jquery";',
      'src/unused.js': 'export {};',
    }),
    { manifest },
  );
  const byName = Object.fromEntries(found.packages.map((entry) => [entry.name, entry]));
  assert.deepEqual(
    found.packages.map(({ name, dependsOnVue }) => `${name}:${dependsOnVue}`),
    [
      '@scope/vue-thing:true',
      'chart.js:false',
      'gadget:true',
      'jquery:false',
      'portal-vue:true',
      'router-like:true',
      'vue:true',
      'vue-codemirror:true',
      'vue-cookies:true',
      'vuex:true',
      'wrapper:true',
    ],
  );
  assert.deepEqual(byName['vue-cookies'].importers.map(({ file, line, imports }) => `${file}:${line} ${imports}`), ['src/a.js:1 default', 'src/b.js:1 default']);
  assert.deepEqual(byName.vuex.importers.map(({ file, line, imports }) => `${file}:${line} ${imports}`), ['src/a.js:2 default,mapState', 'src/b.js:2 mapState']);
  assert.deepEqual(byName.vuex, { name: 'vuex', version: '3.6.2', installed: true, dependsOnVue: true, signals: ['name', 'peer vue ^2.0.0'], admitsVue3: false, importers: byName.vuex.importers });
  assert.deepEqual(byName['portal-vue'].importers.map(({ kind }) => kind), ['require']);
  assert.deepEqual(byName['vue-codemirror'].importers.map(({ kind, specifier }) => `${kind} ${specifier}`), ['dynamic import vue-codemirror/src/index.js']);
  assert.deepEqual({ installed: byName['@scope/vue-thing'].installed, signals: byName['@scope/vue-thing'].signals, version: byName['@scope/vue-thing'].version }, { installed: false, signals: ['name'], version: null });
  assert.deepEqual(byName.wrapper.signals, ['peer vue >=2.6 <4']);
  assert.equal(byName.wrapper.admitsVue3, true);
  assert.deepEqual(byName.gadget.signals, ['imports vue']);
  assert.deepEqual(byName['router-like'].signals, ['depends on vue-router']);
  assert.deepEqual(byName.vue.signals, ['is vue']);
  assert.deepEqual(byName.vue.importers.map(({ imports }) => imports), [['markRaw', 'nextTick']]);
  assert.deepEqual(byName.jquery.importers.map(({ file, kind }) => `${file} ${kind}`), ['src/a.js import', 'src/b.js export from']);
  assert.equal(byName.jquery.signals.length, 0);
  assert.equal(byName['chart.js'].admitsVue3, null);
});

test('packages: without a manifest reader a package is Vue-dependent by its name only, and its install state is unknown', () => {
  const found = scan(reached({ 'src/a.js': 'import VueCookies from "vue-cookies";\nimport _ from "lodash";\nimport x from "bootstrap-vue";' }));
  assert.deepEqual(found.packages.map(({ name, dependsOnVue, installed }) => `${name}:${dependsOnVue}:${installed}`), ['bootstrap-vue:true:null', 'lodash:false:null', 'vue-cookies:true:null']);
});

test('packages: a package that is imported but not installed is listed as unresolved', () => {
  const found = scan(reached({ 'src/a.js': 'import x from "not-there";\nimport y from "vue-cookies";' }), { manifest });
  assert.deepEqual(found.unresolved.map(({ file, line, specifier, why }) => `${file}:${line} ${specifier} ${why}`), ['src/a.js:1 not-there package is not installed']);
});

test('packages: a stylesheet imports a package with ~ and a file with a path; the file is read, a missing one is unresolved', () => {
  const files = {
    'src/components/A.vue': lines(
      '<template><div /></template>', // 1
      '<script>export default {};</script>', // 2
      '<style lang="scss">', // 3
      '@import "~bootstrap/scss/bootstrap";', // 4
      '@import "./vars";', // 5
      '@import url("./other.css");', // 6
      '@import "./gone.scss";', // 7
      '@import url(https://fonts.example.org/x.css);', // 8
      '@use "sass:math";', // 9
      '</style>', // 10
    ),
  };
  const assets = new Map([
    ['src/components/_vars.scss', '.b-table { color: red; }\n@import "./nested";'],
    ['src/components/_nested.scss', '.bv-no-focus-ring { outline: 0; }'],
    ['src/components/other.css', '.b-icon { width: 1em; }'],
  ]);
  const found = scan(reached(files), { assets, manifest });
  assert.deepEqual(found.hits.bvCss.map(({ file, line, text }) => `${file}:${line} ${text}`), [
    'src/components/_nested.scss:1 .bv-no-focus-ring',
    'src/components/_vars.scss:1 .b-table',
    'src/components/other.css:1 .b-icon',
  ]);
  assert.deepEqual(found.unresolved.map(({ file, line, specifier, kind }) => `${file}:${line} ${kind} ${specifier}`), ['src/components/A.vue:7 style import ./gone.scss']);
  assert.deepEqual(found.packages.map(({ name, importers }) => `${name} ${importers.map(({ file, line, kind }) => `${file}:${line} ${kind}`)}`), ['bootstrap src/components/A.vue:4 style import']);
});

// ---- found on the real tree ---------------------------------------------------------------------------------------------------

test('renderFunction: a render-only object that a component registers, or whose first parameter is h, is a component; another object is not', () => {
  const found = hitsOf('renderFunction', {
    'src/components/A.vue': lines(
      '<template><div /></template>', // 1
      '<script>', // 2
      'const Listener = {', // 3
      '  render(createElement) { return createElement("div", this.$scopedSlots.default()); },', // 4
      '};', // 5
      'const Row = { render(h) { return h("tr"); } };', // 6
      'const Plain = { render(ctx) { return ctx; } };', // 7
      'const Unregistered = { render(context) { return context; } };', // 8
      'export default { components: { Listener, Plain } };', // 9
      '</script>', // 10
    ),
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), ['4: render(createElement) { return createElement("div", this.$scopedSlots.default()); }', '6: render(h) { return h("tr"); }', '7: render(ctx) { return ctx; }']);
});

test('modelOption: an export default of a plain module with a model key is not a component; with a second option key it is', () => {
  assert.deepEqual(hitsOf('modelOption', { 'src/utils/trapi.js': 'export default {\n  utils: {},\n  model: { a: 1 },\n};' }), []);
  assert.deepEqual(hitsOf('modelOption', { 'src/components/c.js': 'export default {\n  props: ["a"],\n  model: { prop: "a", event: "b" },\n};' }), [{ line: 3, text: 'model: { prop: "a", event: "b" }' }]);
  assert.deepEqual(hitsOf('modelOption', { 'src/components/C.vue': component('<div />', 'export default { model: { prop: "a", event: "b" } };') }).length, 1);
});

test('bvRefs: the refs of a child (this.$refs.m.$refs.x) are the child\'s own, not another access of this file\'s refs', () => {
  const found = notesOf('bvRefs', {
    'src/components/A.vue': component(
      lines('<div>', '  <b-modal ref="m" />', '</div>'),
      lines('export default {', '  methods: { go() { this.$refs.m.$refs.footer.focus(); this.$root.$refs.other.x(); } },', '};'),
    ),
  });
  assert.deepEqual(found, [{ line: 8, text: 'this.$refs.m.$refs.footer.focus()', note: 'ref "m" is <b-modal>' }]);
});

test('attrCoercion: a value that cannot be false (a string, a string ternary, a concatenation, String(x)) is not listed; a boolean can be', () => {
  const found = hitsOf(
    'attrCoercion',
    one(
      lines(
        '<div>', // 2
        '  <b :aria-selected="a ? \'true\' : \'false\'" :aria-label="x ? \'a\' : null" :aria-describedby="id + \'-d\'" :data-n="String(n)" :data-m="n.toString()" :data-k="a || \'z\'"></b>', // 3
        '  <b :aria-hidden="open" :aria-expanded="a === b" :data-x="a && \'x\'" :data-y="!ok" :data-z="item.flag"></b>', // 4
        '</div>',
      ),
    ),
  );
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), [
    '4: <b :aria-hidden="open">',
    '4: <b :aria-expanded="a === b">',
    '4: <b :data-x="a && \'x\'">',
    '4: <b :data-y="!ok">',
    '4: <b :data-z="item.flag">',
  ]);
});

test('styles: a root-absolute import is a file under public/, read when it is there and unresolved when it is not', () => {
  const files = {
    'src/components/A.vue': lines('<template><div /></template>', '<script>export default {};</script>', '<style>', '@import url("/css/table.css");', '@import "/css/none.css";', '</style>'),
  };
  const assets = new Map([['public/css/table.css', '.b-table { color: red; }']]);
  const found = scan(reached(files), { assets });
  assert.deepEqual(found.hits.bvCss.map(({ file, line, text }) => `${file}:${line} ${text}`), ['public/css/table.css:1 .b-table']);
  assert.deepEqual(found.unresolved.map(({ file, line, specifier, why }) => `${file}:${line} ${specifier} ${why}`), ['src/components/A.vue:5 /css/none.css no such file under public/']);
});

// ---- the report's tables --------------------------------------------------------------------------------------------------

test('the report has the BootstrapVue specification per tag, the directives, and the packages that depend on Vue', () => {
  const found = scan(
    reached({
      'src/components/A.vue': component(
        lines(
          '<div>',
          '  <b-table :items="rows" small head-variant="dark" ref="t" v-model="v" @row-clicked="go" class="x">',
          '    <template #cell(name)="{ item }">{{ item }}</template>',
          '  </b-table>',
          '  <span v-b-tooltip.hover="\'Tip\'">a</span>',
          '</div>',
        ),
        'import VueCookies from "vue-cookies";\nexport default { methods: { go() { this.$refs.t.refresh(); } } };',
      ),
    }),
    { manifest },
  );
  const report = renderReport(found);
  assert.match(report, /\n## BootstrapVue components\n/);
  assert.match(report, /\| `b-table` \| 1 \| 1 \| `b-table` \|/);
  assert.match(report, /\n### b-table\n/);
  assert.match(report, /\| `items` \| 1 \| 1 \| bound \|/);
  assert.match(report, /\| `head-variant` \| 1 \| 1 \| string \|(?: *\|){3} `dark` \|/);
  assert.match(report, /\| `row-clicked` \| 1 \| 1 \| 0 \|/);
  assert.match(report, /\| `cell\(\*\)` \| 1 \| 1 \| `cell\(name\)` \| `item` \| v-slot \|/);
  assert.match(report, /\| `t` \| 1 \| 1 \| `refresh` \(1\) \|/);
  assert.match(report, /\n## BootstrapVue directives\n/);
  assert.match(report, /\| `v-b-tooltip` \| {2}\| `hover` \| 1 \| 1 \| `span` \| `'Tip'` \|/);
  assert.match(report, /\n## Packages that depend on Vue\n/);
  assert.match(report, /\| `vue-cookies` \| 1\.8\.6 \| name \| not said \| `src\/components\/A\.vue:\d+` \(default\) \|/);
});

test('the json has the same data as the report: the scope, the hits, the tables, the unresolved imports and the errors', () => {
  const found = scan(reached({ 'src/a.js': 'import Vue from "vue";' }));
  assert.deepEqual(Object.keys(found), ['scope', 'hits', 'bvTags', 'bvDirectives', 'bvCalls', 'packages', 'dynamic', 'unresolved', 'errors']);
  assert.deepEqual(Object.keys(found.hits), KINDS.map(({ key }) => key));
});

// ---- what is chosen at run time ----------------------------------------------------------------------------------------------

test('dynamicComponent: <component :is> with a value that is not a string and render calls with a name that is not a string; literals and own calls of h are not', () => {
  const files = {
    'src/components/A.vue': component(
      lines(
        '<div>', // 2
        '  <component :is="tab.component" /><component :is="kind" v-model="x" /><component is="plain" /><component :is="\'literal\'" />', // 3
        '  <tr :is="row"></tr>', // 4
        '</div>',
      ),
      lines(
        'import { h } from "vue";', // 6
        'export default {', // 7
        '  render(createElement) { return createElement(this.tag, [createElement("b-card"), createElement("p")]); },', // 8
        '  methods: { go(a) { return h(a.component); } },', // 9
        '};', // 10
      ),
    ),
    'src/utils/draw.js': 'const h = (x) => x * 2;\nexport const f = (n) => h(n);',
  };
  const found = hitsOf('dynamicComponent', files);
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), [
    '3: <component :is="tab.component">',
    '3: <component :is="kind">',
    '10: createElement(this.tag, [createElement("b-card"), createElement("p")])',
    '11: h(a.component)',
  ]);
  assert.deepEqual(hitsOf('bvTags', files), [{ line: 10, text: 'createElement("b-card")' }]);
  assert.deepEqual(scan(reached(files)).bvTags.map(({ tag, uses, spellings }) => ({ tag, uses, spellings })), [{ tag: 'b-card', uses: 1, spellings: ['render call'] }]);
});

test('bvTags: the ids a BootstrapVue component is given, which $bvModal.show and v-b-modal name', () => {
  const found = scan(reached({ 'src/components/A.vue': component(lines('<div>', '  <b-modal id="donor-modal" /><b-modal :id="modalId" /><b-modal id="donor-modal" />', '</div>')) })).bvTags;
  assert.deepEqual(found[0].ids, [':modalId', 'donor-modal']);
  assert.deepEqual(found[0].fallthrough, { class: 0, style: 0, id: 3, attrs: 0, nativeListeners: 0 });
});

test('dynamicComponent: a choice between strings is read, and a BootstrapVue name in it is a use of that component', () => {
  const files = one(lines('<div>', "  <component :is=\"open ? 'span' : 'a'\" /><component :is=\"wide ? 'b-badge' : 'span'\" />", '</div>'));
  assert.deepEqual(hitsOf('dynamicComponent', files), []);
  assert.deepEqual(scan(reached(files)).bvTags.map(({ tag, uses, spellings }) => ({ tag, uses, spellings })), [{ tag: 'b-badge', uses: 1, spellings: ['component is'] }]);
});

test('comments and strings are never hits: the patterns written in them, in a script, a template and a style, find nothing', () => {
  const found = scan(
    reached({
      'src/a.js': lines(
        '// this.$set(a, b, c); this.$on("x", f); Vue.extend({}); new Vue(); this.$children; this.$listeners; Vue.nextTick();', // 1
        '/* beforeDestroy() {} destroyed() {} filters: {} model: {} functional: true render(h) {} */', // 2
        'const text = "this.$set(a, b, c) Vue.use(X) this.$bvModal.show(1) b-table $refs.modal.show()";', // 3
        'const tpl = `<b-table v-b-tooltip @click.native="x" slot-scope="p">{{ a | f }}</b-table>`;', // 4
        'export default { methods: { go() { return "$emit(\'click\')"; } } };', // 5
      ),
      'src/components/A.vue': lines(
        '<template>', // 1
        '  <div>', // 2
        '    <!-- <b-table v-b-tooltip.hover @click.native="x" slot="s">{{ a | f }}</b-table> <template><i /></template> -->', // 3
        '    <p>b-table @click.native slot-scope $listeners {{ "x | y" }} {{ "$set(a)" }} {{ \'<b-table>\' }}</p>', // 4
        '  </div>', // 5
        '</template>', // 6
        '<script>', // 7
        '// Vue.component("x", {}); this.$destroy(); inheritAttrs: false', // 8
        'export default { name: "A" };', // 9
        '</script>', // 10
        '<style>', // 11
        '/* .b-table { } .fade-enter { } */', // 12
        '.plain { content: ".b-table .fade-leave"; }', // 13
        '</style>', // 14
      ),
    }),
  );
  const hits = Object.entries(found.hits).filter(([, list]) => list.length > 0);
  assert.deepEqual(hits.map(([kind, list]) => `${kind}: ${list.map(({ file, line, text }) => `${file}:${line} ${text}`)}`), []);
  assert.deepEqual(found.errors, []);
  assert.deepEqual(found.bvTags, []);
});

test('a private class member, a computed member and optional chains are read without a crash and without a hit', () => {
  const found = scan(
    reached({
      'src/a.js': lines(
        'class Store { #items = []; add(x) { this.#items.push(x); return this.#items?.length; } }', // 1
        'const a = obj[key]; const b = obj?.[key]?.x; const c = fn?.(1); const d = this["$set"];', // 2
        'export default { methods: { go() { this?.$refs?.m?.show?.(); this["$destroy"](); } } };', // 3
      ),
    }),
  );
  assert.deepEqual(found.errors, []);
  assert.deepEqual(found.hits.setDelete.map(({ line, text }) => `${line}: ${text}`), ['2: this["$set"]']);
  assert.deepEqual(found.hits.destroyMount.map(({ line, text }) => `${line}: ${text}`), ['3: this["$destroy"]()']);
  assert.deepEqual(found.hits.bvRefs.map(({ line, text }) => `${line}: ${text}`), ["3: this?.$refs?.m?.show?.()"]);
});

test('scope: --entries can name a file that is no main.js, a root of its own (for what a build alias brings in)', () => {
  const files = {
    'src/views/A/main.js': 'import "@/a.js";',
    'src/a.js': '',
    'src/components/typeahead/T.vue': component('<div />', 'import "../util.js";\nexport default { beforeDestroy() {} };'),
    'src/components/util.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);',
  };
  const found = scan(tree(files), { entries: ['src/views/A/', 'src/components/typeahead/T.vue'] });
  assert.deepEqual(found.scope.entries, ['src/components/typeahead/T.vue', 'src/views/A/main.js']);
  assert.deepEqual(found.scope.files, ['src/a.js', 'src/components/typeahead/T.vue', 'src/components/util.js', 'src/views/A/main.js']);
  assert.equal(found.hits.setDelete.length, 1);
  assert.equal(found.hits.destroyHooks.length, 1);
  assert.deepEqual(found.errors, []);
});

test('bindObjectOrder: a <slot> outlet passes its v-bind object as slot props, whatever stands before it', () => {
  const found = hitsOf('bindObjectOrder', one(lines('<div>', '  <slot name="item" v-bind="{ data, html }"></slot>', '  <comp name="item" v-bind="props" />', '</div>')));
  assert.deepEqual(found, [{ line: 4, text: '<comp name="item" v-bind="props">' }]);
});

// ---- fix round 1: the build config -------------------------------------------------------------------------------------------

/** A build config like the portals': a `pages` object changed by condition, an alias, and code that must never run. */
const configText = (marker) =>
  lines(
    'let pages = {', // 1
    '  index: { entry: "src/views/A/main.js", template: "public/index.html", filename: "index.html" },', // 2
    '  page404: { entry: "src/views/404/main.js", template: "src/portals/P/index.html" },', // 3
    '  start: { entry: "src/portals/P/start.js" },', // 4
    '};', // 5
    'if (process.env.EXTRA) pages.extra = { entry: "src/views/Extra/main.js" };', // 6
    'if (process.env.SLIM) delete pages.page404;', // 7
    `require("fs").writeFileSync(${JSON.stringify(marker)}, "the config was run");`, // 8
    'module.exports = {', // 9
    '  chainWebpack: (config) => {', // 10
    '    config.resolve.alias.set("vue$", require.resolve("../src/utils/vueCompat.js"));', // 11
    '    config.resolve.alias.set("typeahead$", require.resolve("../src/components/T.vue"));', // 12
    '    config.resolve.alias.set("vuex$", "vuex/dist/vuex.esm-bundler.js");', // 13
    '    config.resolve.alias.set("@lib", require.resolve("../src/lib"));', // 14
    '  },', // 15
    '  pages,', // 16
    '};', // 17
  );

test('readBuildConfig: the pages, the pages a condition adds or removes, and the aliases, read without running the config', () => {
  const marker = join(root, `marker-${counter++}.txt`);
  const found = readBuildConfig(configText(marker), 'configs/vue.config.P.js');
  assert.deepEqual(found.errors, []);
  assert.deepEqual(found.pages.map(({ name, entry, template }) => `${name} ${entry} ${template ?? ''}`), [
    'index src/views/A/main.js public/index.html',
    'page404 src/views/404/main.js src/portals/P/index.html',
    'start src/portals/P/start.js ',
    'extra src/views/Extra/main.js ',
  ]);
  assert.deepEqual(found.conditional, ['line 6: pages.extra is added', 'line 7: pages.page404 is deleted']);
  assert.deepEqual(found.aliases, [
    { key: 'vue', exact: true, to: 'src/utils/vueCompat.js', local: true },
    { key: 'typeahead', exact: true, to: 'src/components/T.vue', local: true },
    { key: 'vuex', exact: true, to: 'vuex/dist/vuex.esm-bundler.js', local: false },
    { key: '@lib', exact: false, to: 'src/lib', local: true },
  ]);
  assert.equal(existsSync(marker), false, 'the config was executed');
});

test('readBuildConfig: a config with no pages that can be read is an error, not an empty list', () => {
  assert.deepEqual(readBuildConfig('module.exports = { pages: buildPages() };', 'c.js').errors.map(({ kind }) => kind), ['config']);
  assert.deepEqual(readBuildConfig('module.exports = {', 'c.js').errors.map(({ kind }) => kind), ['config']);
  assert.deepEqual(readBuildConfig('module.exports = { outputDir: "x" };', 'c.js').errors.map(({ kind }) => kind), ['config']);
  assert.deepEqual(readBuildConfig('module.exports = { pages: { a: { entry: "src/main.js" } } };', 'c.js').pages.map(({ entry }) => entry), ['src/main.js']);
});

test('scope: --config alone scans the pages the build config names (a page outside a folder included); --entries adds to them', () => {
  const files = {
    'src/views/A/main.js': 'import "@/a.js";',
    'src/a.js': 'export const a = (vm) => vm.$set(vm.a, 1, 2);',
    'src/views/404/main.js': 'import "@/n.js";',
    'src/n.js': 'export const n = (vm) => vm.$delete(vm.a, 1);',
    'src/portals/P/start.js': 'import "@/s.js";',
    'src/s.js': 'export const s = (vm) => vm.$children;',
    'src/views/B/main.js': 'import "@/b.js";',
    'src/b.js': 'export const b = (vm) => vm.$listeners;',
    'src/views/Extra/main.js': '',
  };
  const config = { path: 'configs/vue.config.P.js', source: configText(join(root, `marker-${counter++}.txt`)) };
  const only = scan(tree(files), { config });
  assert.deepEqual(only.scope.entries, ['src/portals/P/start.js', 'src/views/404/main.js', 'src/views/A/main.js', 'src/views/Extra/main.js']);
  assert.deepEqual(only.scope.config.conditional, ['line 6: pages.extra is added', 'line 7: pages.page404 is deleted']);
  assert.equal(only.scope.config.path, 'configs/vue.config.P.js');
  assert.deepEqual(only.hits.setDelete.map(({ file }) => file), ['src/a.js', 'src/n.js']);
  assert.equal(only.hits.children.length, 1);
  assert.equal(only.hits.listeners.length, 0);
  const both = scan(tree(files), { config, entries: ['src/views/B/'] });
  assert.equal(both.hits.listeners.length, 1);
  assert.equal(both.scope.entries.length, 5);
  // The entries alone are what they were.
  assert.equal(scan(tree(files), { entries: ['src/views/B/'] }).scope.entries.length, 1);
});

test('scope: a page the build config names that is no file is an error', () => {
  const config = { path: 'c.js', source: 'module.exports = { pages: { a: { entry: "src/views/A/main.js" }, gone: { entry: "src/views/Gone/main.js" } } };' };
  const found = scan(tree({ 'src/views/A/main.js': '' }), { config });
  assert.deepEqual(found.scope.entries, ['src/views/A/main.js']);
  assert.deepEqual(found.errors.map(({ kind, message }) => ({ kind, message })), [{ kind: 'scope', message: 'the build config c.js names the page entry src/views/Gone/main.js, which is no file' }]);
});

test('aliases: a package the build config replaces by a file of ours is followed to that file and marked; the compat shim of vue is marked, not followed', () => {
  const files = {
    'src/main.js': 'import T from "typeahead";\nimport Vue from "vue";\nimport x from "@lib/util.js";',
    'src/components/T.vue': component('<div />', 'export default { beforeDestroy() {} };'),
    'src/utils/vueCompat.js': 'export default {};',
    'src/lib/util.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);',
  };
  const config = { path: 'configs/vue.config.P.js', source: configText(join(root, `marker-${counter++}.txt`)) };
  const found = scan(tree(files), { config: { ...config, source: config.source.replace('src/views/A/main.js', 'src/main.js') } });
  assert.deepEqual(found.scope.files, ['src/components/T.vue', 'src/lib/util.js', 'src/main.js']);
  assert.equal(found.hits.destroyHooks.length, 1);
  assert.equal(found.hits.setDelete.length, 1);
  const byName = Object.fromEntries(found.packages.map((entry) => [entry.name, entry]));
  assert.equal(byName.typeahead.alias, 'src/components/T.vue');
  assert.equal(byName.vue.alias, 'src/utils/vueCompat.js (not followed)');
  assert.equal(byName['@lib'], undefined);
  assert.deepEqual(found.unresolved, []);
});

test('the command: --config is read from the root, a file that cannot be read is a usage error', () => {
  const dir = site({
    'configs/vue.config.P.js': 'module.exports = { pages: { a: { entry: "src/views/A/main.js" } } };',
    'src/views/A/main.js': 'import "@/c.js";',
    'src/views/B/main.js': 'import "@/d.js";',
    'src/c.js': 'export const f = (vm) => vm.$set(vm.a, 1, 2);',
    'src/d.js': 'export const g = (vm) => vm.$children;',
  });
  const json = JSON.parse(runCli(['--root', dir, '--config', 'configs/vue.config.P.js', '--json']).stdout);
  assert.deepEqual(json.scope.entries, ['src/views/A/main.js']);
  assert.equal(json.scope.config.path, 'configs/vue.config.P.js');
  assert.match(runCli(['--root', dir, '--config', 'configs/vue.config.P.js']).stdout, /Scope: build config `configs\/vue\.config\.P\.js`/);
  const missing = runCli(['--root', dir, '--config', 'configs/none.js']);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /cannot read/);
  assert.deepEqual(parseArgs(['--config', 'c.js', '--entries', 'src/a/']), { root: undefined, entries: ['src/a/'], config: 'c.js', json: false });
});

// ---- fix round 1: a listener with a native event name that lands on the root element ------------------------------------------------

test('rootListener: @change, @click and @input on a component whose emits lacks them, an inline or render-only one included; a declared one, a custom name and a plain element are not', () => {
  const files = {
    'src/components/A.vue': component(
      lines(
        '<div>', // 2
        '  <EventListener @change="go" @custom="x"><input /></EventListener>', // 3
        '  <child @click="a" @update:x="b" @input="c" />', // 4
        '  <declared @change="d" @click.native="e" /><input @change="n" /><b-form-input @input="m" />', // 5
        '  <missing-one @change="m" /><package-one @input="p" /><component :is="which" @change="w" />', // 6
        '  <child v-on="{ change: go, custom: x }" />', // 7
        '</div>',
      ),
      lines(
        'import Child from "./Child.vue";', // 8
        'import Declared from "./Declared.vue";', // 9
        'import PackageOne from "some-package";', // 10
        'const EventListener = { render(h) { return h("div"); } };', // 11
        'export default { emits: ["change"], components: { EventListener, Child, Declared, PackageOne } };', // 12
      ),
    ),
    'src/components/Child.vue': component('<i />', 'export default { props: ["a"], methods: { go() { this.$emit("click"); } } };'),
    'src/components/Declared.vue': component('<i />', 'export default { emits: ["change", "click"] };'),
  };
  const found = scan(reached(files)).hits.rootListener.map(({ line, text, note }) => ({ line, text, note }));
  assert.deepEqual(found, [
    { line: 3, text: '<EventListener @change="go">', note: 'src/components/A.vue: no emits option' },
    { line: 4, text: '<child @click="a">', note: 'src/components/Child.vue: no emits option; it also $emits "click"' },
    { line: 4, text: '<child @input="c">', note: 'src/components/Child.vue: no emits option' },
    { line: 6, text: '<missing-one @change="m">', note: 'component not found' },
    { line: 6, text: '<package-one @input="p">', note: 'package some-package: its emits are not read' },
    { line: 6, text: '<component :is="which" @change="w">', note: 'dynamic component' },
    { line: 7, text: '<child v-on="{ change: go, custom: x }">', note: 'src/components/Child.vue: no emits option' },
  ]);
});

test('rootListener: emits that lists other events does not list this one; props with onChange takes it', () => {
  const files = {
    'src/components/A.vue': component('<div>\n  <one @change="a" @click="b" /><two @change="c" />\n</div>', 'import One from "./One.vue";\nimport Two from "./Two.vue";\nexport default { components: { One, Two } };'),
    'src/components/One.vue': component('<i />', 'export default { emits: ["click"] };'),
    'src/components/Two.vue': component('<i />', 'export default { props: { onChange: Function } };'),
  };
  assert.deepEqual(notesOf('rootListener', files), [{ line: 3, text: '<one @change="a">', note: 'src/components/One.vue: emits does not list "change"' }]);
});

test('rootListener: h(Component, { on: { change } }) in a render function; a string tag and a custom event are not', () => {
  const files = {
    'src/components/A.vue': component(
      '<div />',
      lines(
        'import { h } from "vue";', // 8
        'import Child from "./Child.vue";', // 9
        'export default {', // 10
        '  methods: {', // 11
        '    a() { return h(Child, { on: { change: this.go, custom: this.x } }); },', // 12
        '    b() { return h("input", { on: { change: this.go } }); },', // 13
        '    c() { return h(Child, { on: { custom: this.x } }); },', // 14
        '  },', // 15
        '};', // 16
      ),
    ),
    'src/components/Child.vue': component('<i />', 'export default {};'),
  };
  assert.deepEqual(notesOf('rootListener', files), [{ line: 9, text: 'h(Child, { on: { change: this.go, custom: this.x } })', note: 'src/components/Child.vue: no emits option' }]);
});

test('rootListener: a package that the build config replaces by a component of ours is read as that component', () => {
  const files = {
    'src/main.js': 'import "@/components/A.vue";',
    'src/components/A.vue': component('<div><typeahead @input="a" @focus="b" /></div>', 'import Typeahead from "typeahead";\nexport default { components: { Typeahead } };'),
    'src/components/T.vue': component('<input />', 'export default { emits: ["input"] };'),
  };
  const source = 'module.exports = { chainWebpack: (config) => { config.resolve.alias.set("typeahead$", require.resolve("../src/components/T.vue")); }, pages: { a: { entry: "src/main.js" } } };';
  const found = scan(tree(files), { config: { path: 'configs/c.js', source } }).hits.rootListener;
  assert.deepEqual(found.map(({ line, text, note }) => ({ line, text, note })), [{ line: 2, text: '<typeahead @focus="b">', note: 'src/components/T.vue: emits does not list "focus"' }]);
});

// ---- fix round 1: what our own b-table has to read ----------------------------------------------------------------------------------

const TABLE_FILES = {
  'src/components/A.vue': component(
    lines(
      '<div>', // 2
      '  <b-table :items="rows" :fields="fields" detail-key="_rowKey" :tbody-tr-class="rowClass" :sort-compare="cmp" :filter-function="(r) => true" table-class="x" @row-clicked="row => toggle(row._showDetails)" />', // 3
      '  <b-table :fields="computedFields" :items="b" :tbody-tr-class="computedClass" :thead-tr-class="\'plain\'" />', // 4
      '  <b-table :fields="[\'a\', \'b\']" :items="[]" />', // 5
      '  <b-table :fields="makeFields()" :items="rows" />', // 6
      '  <b-table :fields="imported" :items="other.rows" />', // 7
      '</div>',
    ),
    lines(
      'import { imported } from "./fields.js";', // 9
      'const SHARED = [{ key: "g", label: "G", formatter: "fmt" }];', // 10
      'export default {', // 11
      '  data() {', // 12
      '    return {', // 13
      '      rows: [],', // 14
      '      fields: [{ key: "name", label: "Name", sortable: true }, { key: "p", label: "P", formatter: (v) => v, tdClass: "x", thStyle: { width: "1px" }, class: ["a"] }, "plain", ...SHARED],', // 15
      '    };', // 16
      '  },', // 17
      '  computed: {', // 18
      '    computedFields() { return [{ key: "c", label: "C", variant: "info" }]; },', // 19
      '    computedClass() { return (item) => ""; },', // 20
      '  },', // 21
      '  methods: {', // 22
      '    rowClass(item) { return ""; },', // 23
      '    cmp(a, b) { return 0; },', // 24
      '    makeFields() { return this.base.map((key) => ({ key })); },', // 25
      '    open(item) { this.$set(item, "_showDetails", true); item._rowVariant = "danger"; return { _cellVariants: { a: "x" }, name: 1 }; },', // 26
      '  },', // 27
      '};', // 28
    ),
  ),
  'src/components/fields.js': 'export const imported = [{ key: "i", label: "I", isRowHeader: true }];',
};

test('bvTags: the field definitions a b-table is given, from data, computed, constants and imports; what cannot be read is dynamic', () => {
  const table = scan(reached(TABLE_FILES)).bvTags.find(({ tag }) => tag === 'b-table');
  assert.equal(table.fieldDefs.definitions, 5);
  assert.equal(table.fieldDefs.strings, 3);
  assert.deepEqual(
    table.fieldDefs.keys.map(({ key, uses, kinds }) => `${key} ${uses} ${kinds}`),
    ['class 1 array', 'formatter 2 function,string', 'isRowHeader 1 boolean', 'key 5 string', 'label 5 string', 'sortable 1 boolean', 'tdClass 1 string', 'thStyle 1 object', 'variant 1 string'],
  );
  assert.deepEqual(table.fieldDefs.keys.find(({ key }) => key === 'key').files, ['src/components/A.vue', 'src/components/fields.js']);
  assert.deepEqual(table.dynamic.map(({ kind, line, text }) => `${kind} ${line} ${text}`), ['fields 6 :fields="makeFields()"']);
});

test('bvTags: whether a bound prop is a function, from a method, an arrow, a computed, data, a literal or a constant', () => {
  const table = scan(reached(TABLE_FILES)).bvTags.find(({ tag }) => tag === 'b-table');
  const kinds = Object.fromEntries(table.props.map(({ name, kinds: list }) => [name, list]));
  assert.deepEqual(kinds['tbody-tr-class'], ['computed', 'function']);
  assert.deepEqual(kinds['sort-compare'], ['function']);
  assert.deepEqual(kinds['filter-function'], ['function']);
  assert.deepEqual(kinds['thead-tr-class'], ['string']);
  assert.deepEqual(kinds.items, ['array', 'data', 'expression']);
  assert.deepEqual(kinds.fields, ['array', 'computed', 'constant', 'data', 'expression']);
  assert.deepEqual(kinds['table-class'], []);
});

test('bvTags: the special item keys of a b-table, where they are written, and the key detail-key names', () => {
  const table = scan(reached(TABLE_FILES)).bvTags.find(({ tag }) => tag === 'b-table');
  assert.deepEqual(
    table.itemKeys.map(({ key, uses, how, files }) => `${key} ${uses} ${how} ${files}`),
    [
      '_cellVariants 1 property src/components/A.vue',
      '_rowKey 1 detail-key src/components/A.vue',
      '_rowVariant 1 member src/components/A.vue',
      '_showDetails 2 member,string src/components/A.vue',
    ],
  );
});

// ---- fix round 1: the calls of $bvToast, $bvModal and the bv:: events ---------------------------------------------------------------

test('bvCalls: every call of $bvToast and $bvModal and every bv:: event, with the arguments and the whole option list', () => {
  const long = 'x'.repeat(150);
  const found = scan(
    reached({
      'src/components/A.vue': component(
        lines('<div>', '  <button @click="$bvModal.hide(\'donor-modal\')">x</button>', '</div>'),
        lines(
          'export default {', // 8
          '  methods: {', // 9
          '    go(message, alert) {', // 10
          `      this.$bvToast.toast(message, { id: alert.id, variant: "danger", title: \`\${alert.type}: ${long}\`, autoHideDelay: this.delay, solid: true, noAutoHide: !!alert.sticky, ...rest });`, // 11
          '      this.$bvToast.hide(alert.id);', // 12
          '      this.$bvModal.show("donor-modal"); this.$bvModal.show(name);', // 13
          '      this.$bvModal.msgBoxConfirm("Sure?", { title: "x", okVariant: "danger" }).then((ok) => ok);', // 14
          '      this.$root.$emit("bv::show::modal", "m", "#btn");', // 15
          '      this.$bvToast.toast("fixed", options);', // 16
          '    },', // 17
          '  },', // 18
          '};', // 19
        ),
      ),
    }),
  ).bvCalls;
  assert.deepEqual(
    found.map(({ line, call, args }) => `${line} ${call} ${args.join(' | ')}`),
    [
      '3 $bvModal.hide \'donor-modal\'',
      '10 this.$bvToast.toast message',
      '11 this.$bvToast.hide alert.id',
      '12 this.$bvModal.show "donor-modal"',
      '12 this.$bvModal.show name',
      '13 this.$bvModal.msgBoxConfirm "Sure?"',
      '14 this.$root.$emit "bv::show::modal" | "m" | "#btn"',
      '15 this.$bvToast.toast "fixed" | options',
    ],
  );
  const toast = found.find(({ line }) => line === 10);
  assert.deepEqual(toast.options.map(({ key }) => key), ['id', 'variant', 'title', 'autoHideDelay', 'solid', 'noAutoHide', '...']);
  assert.equal(toast.options.find(({ key }) => key === 'title').value, `\`\${alert.type}: ${long}\``);
  assert.equal(toast.options.find(({ key }) => key === 'noAutoHide').value, '!!alert.sticky');
  assert.deepEqual(found.find(({ line }) => line === 13).options.map(({ key, value }) => `${key}=${value}`), ['title="x"', 'okVariant="danger"']);
  assert.equal(found.find(({ line }) => line === 11).options, null);
  assert.equal(found.find(({ line }) => line === 15).options, null);
});

test('bvCalls: the report has a table of them with the whole text of each option', () => {
  const long = 'y'.repeat(200);
  const found = scan(reached({ 'src/a.js': `export default { methods: { go() { this.$bvToast.toast("m", { title: "${long}", variant: "info" }); } } };` }));
  const report = renderReport(found);
  assert.match(report, /\n## BootstrapVue calls\n/);
  assert.match(report, new RegExp(`\\| \`src/a\\.js:1\` \\| \`this\\.\\$bvToast\\.toast\` \\| \`"m"\` \\| title: \`"${long}"\`; variant: \`"info"\` \\|`));
});

// ---- fix round 1: the Bootstrap classes that BootstrapVue renders ----------------------------------------------------------------

test('bsCss: a selector on a Bootstrap class that BootstrapVue renders (page-link, btn-*, modal-*, table-sm...) is a note; BootstrapVue\'s own and other classes are not', () => {
  const files = {
    'src/components/A.vue': lines(
      '<template><div /></template>', // 1
      '<script>export default {};</script>', // 2
      '<style>', // 3
      '.pagination .page-link { color: red; }', // 4
      '.modal-footer .btn-primary, .tooltip-inner { color: red; }', // 5
      'table.table-sm td, .dropdown-menu > .dropdown-item { color: red; }', // 6
      '.nav-tabs .nav-link, .tab-content, .tab-pane { color: red; }', // 7
      '.toast-header, .alert-danger, .badge-pill, .card-body { color: red; }', // 8
      '.b-table { color: red; }', // 9
      '.plain, .btnx, .my-card, .tabs, .tooltips { color: red; }', // 10
      '.row .col-md-4, .container { color: red; }', // 11
      '</style>', // 12
    ),
  };
  const found = notesOf('bsCss', files);
  assert.deepEqual(found, [
    { line: 4, text: '.pagination .page-link', note: '.pagination, .page-link' },
    { line: 5, text: '.modal-footer .btn-primary, .tooltip-inner', note: '.modal-footer, .btn-primary, .tooltip-inner' },
    { line: 6, text: 'table.table-sm td, .dropdown-menu > .dropdown-item', note: '.table-sm, .dropdown-menu, .dropdown-item' },
    { line: 7, text: '.nav-tabs .nav-link, .tab-content, .tab-pane', note: '.nav-tabs, .nav-link, .tab-content, .tab-pane' },
    { line: 8, text: '.toast-header, .alert-danger, .badge-pill, .card-body', note: '.toast-header, .alert-danger, .badge-pill, .card-body' },
  ]);
  assert.equal(hitsOf('bvCss', files).length, 1);
});

// ---- fix round 1: the smaller things ------------------------------------------------------------------------------------------------

test('asyncComponent: a function in components or in Vue.component is a functional component on Vue 3, not an async one; a component object and a name are not', () => {
  const found = hitsOf('asyncComponent', {
    'src/a.js': lines(
      'import Vue from "vue";', // 1
      'import Plain from "./Plain.vue";', // 2
      'Vue.component("lazy", () => import("./Lazy.vue"));', // 3
      'export default {', // 4
      '  components: {', // 5
      '    Chunk: () => import("./Chunk.vue"),', // 6
      '    Old: (resolve) => require(["./Old.vue"], resolve),', // 7
      '    Fn: function () { return import("./Fn.vue"); },', // 8
      '    Plain,', // 9
      '    Inline: { render(h) { return h("i"); } },', // 10
      '  },', // 11
      '};', // 12
    ),
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), [
    '3: Vue.component("lazy", () => import("./Lazy.vue"))',
    '6: Chunk: () => import("./Chunk.vue")',
    '7: Old: (resolve) => require(["./Old.vue"], resolve)',
    '8: Fn: function () { return import("./Fn.vue"); }',
  ]);
});

test('dataMerge: a data key that holds an object in the component and in a mixin is merged deeply on Vue 2 and replaced on Vue 3', () => {
  const files = {
    'src/mixins/m.js': 'export default {\n  data() { return { filters: { a: 1 }, count: 0, list: [] }; },\n};',
    'src/components/A.vue': component(
      '<div />',
      lines(
        'import M from "../mixins/m.js";', // 5
        'export default {', // 6
        '  mixins: [M],', // 7
        '  data() { return { filters: { b: 2 }, count: 1, list: [1], other: {} }; },', // 8
        '};', // 9
      ),
    ),
  };
  assert.deepEqual(notesOf('dataMerge', files), [{ line: 8, text: 'filters', note: 'object in both: Vue 2 merges them, Vue 3 keeps the component\'s; the mixin is src/mixins/m.js' }]);
});

test('directiveHooks: a directive object that is imported, or a constant of the file, is read where it is written', () => {
  const files = {
    'src/directives/focus.js': 'export default {\n  inserted(el) { el.focus(); },\n  unbind() {},\n};',
    'src/directives/fine.js': 'export default {\n  mounted(el) {},\n};',
    'src/components/A.vue': component(
      '<div />',
      lines(
        'import focus from "../directives/focus.js";', // 5
        'import fine from "../directives/fine.js";', // 6
        'const localDef = { bind() {}, update() {} };', // 7
        'export default { directives: { focus, fine, local: localDef } };', // 8
      ),
    ),
    'src/b.js': 'import focus from "./directives/focus.js";\nVue.directive("again", focus);',
  };
  // The definition is one object, reported once, under the name of the first registration scanned (`again` of b.js sorts first).
  const found = scan(reached(files)).hits.directiveHooks.map(({ file, line, text }) => `${file}:${line} ${text}`);
  assert.deepEqual(found, ['src/components/A.vue:7 local: bind, update', 'src/directives/focus.js:1 again: inserted, unbind']);
});

test('the blocks with a src: a script is scanned as the file it names, a style is read, a template is reported', () => {
  const files = {
    'src/components/A.vue': lines('<template src="./a.html"></template>', '<script src="./a.js"></script>', '<style src="./a.css"></style>', '<style src="./gone.css"></style>'),
    'src/components/a.js': 'export default { beforeDestroy() {} };',
  };
  const found = scan(reached(files), { assets: new Map([['src/components/a.css', '.b-table { color: red; }']]) });
  assert.deepEqual(found.hits.destroyHooks.map(({ file }) => file), ['src/components/a.js']);
  assert.deepEqual(found.hits.bvCss.map(({ file, line }) => `${file}:${line}`), ['src/components/a.css:1']);
  assert.deepEqual(found.unresolved.map(({ file, line, specifier, kind }) => `${file}:${line} ${kind} ${specifier}`), ['src/components/A.vue:4 style import ./gone.css']);
  assert.deepEqual(found.errors.map(({ file, line, kind, message }) => `${file}:${line} ${kind} ${message}`), [
    'src/components/A.vue:1 template <template src="./a.html"> is not read',
    'src/components/A.vue:2 src <script src="./a.js"> is scanned as the file it names: its component is not joined to this template (refs, emits, data)',
  ]);
});

test('parentAccess: $parent in a script or a template is a note (what it reaches depends on how deep the component sits); parent is not', () => {
  const found = hitsOf(
    'parentAccess',
    one(lines('<div>', '  <p>{{ $parent.title }}</p>', '</div>'), 'export default { methods: { go() { return this.$parent.value + this.$parent.$parent.x + this.parent; } } };'),
  );
  assert.deepEqual(found, [
    { line: 3, text: '{{ $parent.title }}' },
    { line: 7, text: 'this.$parent.value' },
    { line: 7, text: 'this.$parent.$parent.x' },
  ]);
});

test('aliases of Vue: const V = Vue and the parameter of install are the global Vue', () => {
  const found = hitsOf('vueRegister', {
    'src/a.js': lines(
      'import Vue from "vue";', // 1
      'const V = Vue;', // 2
      'V.use(Plugin);', // 3
      'export default { install(Inst) { Inst.component("a", {}); }, other(Nope) { Nope.use(x); } };', // 4
    ),
  });
  assert.deepEqual(found.map(({ line, text }) => `${line}: ${text}`), ['3: V.use(Plugin)', '4: Inst.component("a", {})']);
});

test('parentAccess: the note says how many levels up it reaches; a page template\'s $parent.fields is read from the main.js beside it', () => {
  const found = notesOf('parentAccess', one(lines('<div>', '  <p>{{ $parent.title }}</p>', '</div>'), 'export default { methods: { go() { return this.$parent.$parent.x; } } };'));
  assert.deepEqual(found.map(({ note }) => note), ['depth 1', 'depth 2']);
  const table = scan(
    reached({
      'src/views/P/main.js': 'import Template from "./Template.vue";\nmountPage(Template, { data() { return { columns: [{ key: "a", label: "A" }] }; }, computed: { more() { return [{ key: "b", label: "B", sortable: true }]; } } });',
      'src/views/P/Template.vue': component('<div><b-table :fields="$parent.columns" :items="[]" /><b-table :fields="$parent.more" :items="[]" /><b-table :fields="$parent.nope" :items="[]" /></div>'),
    }),
  ).bvTags.find(({ tag }) => tag === 'b-table');
  assert.equal(table.fieldDefs.definitions, 2);
  assert.deepEqual(table.dynamic.map(({ text }) => text), [':fields="$parent.nope"']);
});

test('the report marks a package that the build config replaces: listed as replaced, not as a Vue 2 package; the compat shim of vue stays in the table, marked', () => {
  const files = {
    'src/main.js': 'import T from "typeahead-pkg";\nimport Vue from "vue";',
    'src/components/T.vue': component('<div />'),
    'src/utils/vueCompat.js': 'export default {};',
  };
  const source = 'module.exports = { chainWebpack: (c) => { c.resolve.alias.set("vue$", require.resolve("../src/utils/vueCompat.js")); c.resolve.alias.set("typeahead-pkg$", require.resolve("../src/components/T.vue")); }, pages: { a: { entry: "src/main.js" } } };';
  const report = renderReport(scan(tree(files), { config: { path: 'configs/c.js', source } }));
  assert.match(report, /\n## Build config\n/);
  assert.match(report, /\| `typeahead-pkg\$` \| `src\/components\/T\.vue` \| followed: the file is scanned as ours \|/);
  assert.match(report, /\| `vue\$` \| `src\/utils\/vueCompat\.js` \| the compat shim: not followed \|/);
  assert.match(report, /Replaced by an alias of the build config \(not the package\): `typeahead-pkg` -> `src\/components\/T\.vue`\./);
  assert.match(report, /\n\| `vue` \| .* \| is vue \|/);
  assert.doesNotMatch(report, /\n\| `typeahead-pkg` \|/);
});
