// Guards the tree that `page-setup.mjs` converted. A merge can undo part of it without a conflict, and a production
// build says nothing:
//   - a page written elsewhere mounts itself, so it never loads `pageSetup.js`: no Bootstrap stylesheets, and `b-*`
//     tags that nothing registers;
//   - a file that lost `import Vue from "vue"` gets a `Vue.set(...)` from a branch where the import is still there. It
//     throws a ReferenceError when it runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSources, scriptBlocks } from './component-graph.mjs';
import { programPath, setupTree } from './page-setup.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const RUN = 'run `npm run codemod:page-setup`';

/** The names whose import `page-setup.mjs` can drop -> the import to bring back. */
const IMPORTS = {
  Vue: 'import Vue from "vue";',
  Vuex: 'import Vuex from "vuex";',
  VueCookies: 'import VueCookies from "vue-cookies";',
  BootstrapVue: 'import { BootstrapVue } from "bootstrap-vue";',
  BootstrapVueIcons: 'import { BootstrapVueIcons } from "bootstrap-vue";',
  IconsPlugin: 'import { IconsPlugin } from "bootstrap-vue";',
};
const MENTIONED = new RegExp(`\\b(?:${Object.keys(IMPORTS).join('|')})\\b`);

/** What `page-setup.mjs` would still change under `root`, or leaves to a person, one line per file. */
function unconverted(root) {
  const { failed, unresolved, changed } = setupTree({ root, dryRun: true });
  return [
    ...failed.map(({ file, message }) => `${file}: ${message}; fix it, then ${RUN}`),
    ...unresolved.map(({ file, reason }) => `${file}: ${reason}; convert it by hand (Unresolved in scripts/vue3-migration/README.md)`),
    ...changed.map((file) => `${file}: ${RUN}`),
  ];
}

/** The names of `IMPORTS` that the files under `root` use without binding them, one line per file and name. */
function unboundNames(root) {
  const lines = [];
  for (const [file, source] of readSources(root)) {
    // Only the scopes decide; the text saves parsing a file that mentions none of them.
    if (!MENTIONED.test(source)) continue;
    const errors = [];
    for (const { content, startLine } of scriptBlocks(file, source, errors)) {
      let globals;
      try {
        ({ globals } = programPath(content).program.scope);
      } catch (error) {
        errors.push(error);
        continue;
      }
      for (const [name, line] of Object.entries(IMPORTS)) {
        if (name in globals) lines.push(`${file}:${globals[name].loc.start.line + startLine - 1}: uses ${name} without importing it; add \`${line}\``);
      }
    }
    for (const { message } of errors) lines.push(`${file}: does not parse: ${message}`);
  }
  return lines;
}

const assertNone = (lines) => assert.ok(lines.length === 0, `\n${lines.join('\n')}`);

test('page-setup.mjs has nothing left to convert', () => {
  assertNone(unconverted(repoRoot));
});

test('no file uses Vue, or a plugin of pageSetup.js, that it does not import', () => {
  assertNone(unboundNames(repoRoot));
});

// ---- the checks can fail ------------------------------------------------------------------------

const text = (...lines) => `${lines.join('\n')}\n`;
const component = (...script) => text('<template>', '    <div />', '</template>', '', '<script>', ...script, '</script>');

/** A tree with nothing to report. */
const CONVERTED = {
  'src/utils/pageSetup.js': text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);', 'export function mountPage() {}'),
  'src/views/Page/main.js': text('import { mountPage } from "@/utils/pageSetup";', 'import Template from "./Template.vue";', 'import store from "./store.js";', '', '// @vue/component', 'mountPage(Template, { store });'),
  'src/views/Page/store.js': text('import Vuex from "vuex";', '', 'export default new Vuex.Store({});'),
  'src/views/Page/Template.vue': component('export default {};'),
};

/** The lines `check` gives for a tree of `CONVERTED` and `files` (path -> text). */
function linesFor(check, files) {
  const root = mkdtempSync(join(tmpdir(), 'page-setup-tree-'));
  try {
    for (const [file, contents] of Object.entries({ ...CONVERTED, ...files })) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), contents);
    }
    return check(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('a converted tree gives no lines', () => {
  assert.deepEqual(linesFor(unconverted, {}), []);
  assert.deepEqual(linesFor(unboundNames, {}), []);
});

test('a page that mounts itself is a line that says to run the codemod', () => {
  const lines = linesFor(unconverted, {
    'src/views/New/main.js': text('import Vue from "vue";', 'import Template from "./Template.vue";', 'new Vue({ render: (h) => h(Template) }).$mount("#app");'),
    'src/views/New/Template.vue': component('export default {};'),
  });
  assert.deepEqual(lines, [`src/views/New/main.js: ${RUN}`]);
});

test('an install or a stylesheet import that a merge brings back is a line that says to run the codemod', () => {
  const lines = linesFor(unconverted, {
    'src/components/Old.vue': component('import Vue from "vue";', 'import BootstrapVue from "bootstrap-vue";', 'Vue.use(BootstrapVue);', 'export default {};'),
    'src/views/Page/store.js': text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);', 'export default new Vuex.Store({});'),
    'src/views/Page/styles.js': text('import "bootstrap/dist/css/bootstrap.css";'),
  });
  assert.deepEqual(lines, [`src/components/Old.vue: ${RUN}`, `src/views/Page/store.js: ${RUN}`, `src/views/Page/styles.js: ${RUN}`]);
});

test('a file that the codemod leaves to a person is a line with the reason', () => {
  const lines = linesFor(unconverted, { 'src/views/New/main.js': text('import Vue from "vue";', 'new Vue({ el: "#app" });') });
  assert.deepEqual(lines, ['src/views/New/main.js: the options have `el`; convert it by hand (Unresolved in scripts/vue3-migration/README.md)']);
});

test('a file that does not parse is a line, alone: the codemod plans nothing until it does', () => {
  const lines = linesFor(unconverted, {
    'src/components/Broken.vue': component('import Vue from "vue";', 'Vue.use(;'),
    'src/views/Page/store.js': text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);', 'export default new Vuex.Store({});'),
  });
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^src\/components\/Broken\.vue: .+; fix it, then run `npm run codemod:page-setup`$/);
});

for (const [name, line] of Object.entries(IMPORTS)) {
  test(`a use of ${name} without its import is a line that says what to import`, () => {
    const advice = `uses ${name} without importing it; add \`${line}\``;
    assert.deepEqual(linesFor(unboundNames, { 'src/views/Page/store.js': text('export default {', `    run: () => ${name}.set({}, "a", 1),`, '};') }), [
      `src/views/Page/store.js:2: ${advice}`,
    ]);
    assert.deepEqual(linesFor(unboundNames, { 'src/components/A.vue': component('export default {', '    mounted() {', `        use(${name});`, '    },', '};') }), [
      `src/components/A.vue:8: ${advice}`,
    ]);
    assert.deepEqual(linesFor(unboundNames, { 'src/views/Page/store.js': text(line, `use(${name});`) }), []);
  });
}

test('a binding counts only where it is in scope', () => {
  const lines = linesFor(unboundNames, { 'src/a.js': text('export const install = (Vue) => Vue.mixin({});', 'Vue.mixin({});') });
  assert.deepEqual(lines, ['src/a.js:2: uses Vue without importing it; add `import Vue from "vue";`']);
});

test('a name in either script of a component, or assigned and never declared, is a line', () => {
  const twoScripts = text('<template><div /></template>', '<script>', 'export default {};', '</script>', '<script setup>', 'Vue.set({}, "a", 1);', '</script>');
  const lines = linesFor(unboundNames, { 'src/a.js': text('Vuex = {};'), 'src/b.vue': twoScripts });
  assert.deepEqual(lines, [
    'src/a.js:1: uses Vuex without importing it; add `import Vuex from "vuex";`',
    'src/b.vue:6: uses Vue without importing it; add `import Vue from "vue";`',
  ]);
});

test('a name that is bound, or that is not a reference, is no line', () => {
  const lines = linesFor(unboundNames, {
    'src/bound.js': text('import V, { version as Vue } from "vue";', 'const { Vuex } = require("./x");', 'function IconsPlugin() {}', 'use(V, Vue, Vuex, IconsPlugin);'),
    'src/parameter.js': text('export function install(Vue, { VueCookies }) {', '    Vue.mixin({ a: VueCookies });', '}'),
    'src/other.js': text('// Vue.set(a, b, c);', 'window.Vue = 1;', 'export default { Vue: 1, name: "BootstrapVue", [`Vuex`]: this.VueCookies };'),
    'src/template.vue': text('<template><div>{{ Vue }} Vuex</div></template>', '<script>', 'export default {};', '</script>'),
  });
  assert.deepEqual(lines, []);
});

test('a script that does not parse is a line of the name check too', () => {
  const lines = linesFor(unboundNames, { 'src/a.js': text('Vue.set(;') });
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^src\/a\.js: does not parse: /);
});
