import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { mountEntry, pagePlugins, run, setupTree, stripPlugins } from './page-setup.mjs';

/** Source text from lines: every file in this test ends with a newline. */
const text = (...lines) => `${lines.join('\n')}\n`;
const crlf = (source) => source.replace(/\n/g, '\r\n');

/** A component file whose script is `script` (lines). */
const component = (...script) => text('<template>', '    <div />', '</template>', '', '<script>', ...script, '</script>');

const FILE = 'src/components/Thing.vue';
const STORE = 'src/views/Thing/store.js';
const ENTRY = 'src/views/Thing/main.js';

/** Strips `source`, checks that nothing was refused and that stripping the result again removes nothing. */
function stripped(source, file = FILE) {
  const result = stripPlugins(source, file);
  assert.equal(result.unresolved, undefined, result.unresolved);
  const again = stripPlugins(result.source, file);
  assert.deepEqual(again.removed, [], 'a second run removes nothing');
  assert.equal(again.source, result.source);
  return result;
}

/** The text of a store or entry after stripping. */
const strippedText = (source, file = STORE) => stripped(source, file).source;

/** Mounts `source`, which must resolve, and checks that mounting the result again changes nothing. */
function mounted(source, file = ENTRY) {
  const result = mountEntry(source, file);
  assert.equal(result.unresolved, undefined, result.unresolved);
  assert.deepEqual(mountEntry(result.source, file), { source: result.source });
  return result.source;
}

/** Why `mountEntry` leaves `source` to a person. */
function unresolved(source, file = ENTRY) {
  const result = mountEntry(source, file);
  assert.deepEqual(Object.keys(result), ['unresolved']);
  return result.unresolved;
}

/** Both steps, as the run does them to an entry. */
const converted = (source) => mounted(stripped(source, ENTRY).source);

// ---- strip: components, stores, mixins ------------------------------------------------------

test('strips the installs of a component and its unused imports', () => {
  const result = stripped(
    component(
      'import Vue from "vue";',
      'import { BootstrapVue, IconsPlugin } from "bootstrap-vue";',
      'import "bootstrap/dist/css/bootstrap.css";',
      'import "bootstrap-vue/dist/bootstrap-vue.css";',
      'import Formatters from "@/utils/formatters";',
      '',
      'Vue.use(BootstrapVue);',
      'Vue.use(IconsPlugin);',
      'Vue.config.productionTip = false;',
      '',
      'export default {',
      '    methods: { ...Formatters },',
      '};',
    ),
  );
  assert.equal(
    result.source,
    component('import Formatters from "@/utils/formatters";', '', 'export default {', '    methods: { ...Formatters },', '};'),
  );
  assert.deepEqual(result.removed, [
    'import "bootstrap/dist/css/bootstrap.css"',
    'import "bootstrap-vue/dist/bootstrap-vue.css"',
    'Vue.use(BootstrapVue)',
    'Vue.use(IconsPlugin)',
    'Vue.config.productionTip = false',
  ]);
  assert.deepEqual(result.left, []);
});

test('strips a store and a mixin: Vuex and VueCookies, the default and the named bootstrap-vue imports', () => {
  assert.equal(
    strippedText(text('import Vue from "vue";', 'import Vuex from "vuex";', '', 'Vue.use(Vuex);', '', 'export default new Vuex.Store({});')),
    text('import Vuex from "vuex";', '', 'export default new Vuex.Store({});'),
  );
  assert.equal(
    strippedText(
      text(
        'import Vue from "vue"',
        'import VueCookies from "vue-cookies";',
        'import BootstrapVue from "bootstrap-vue";',
        'import { BootstrapVueIcons } from "bootstrap-vue";',
        '',
        'Vue.use(VueCookies)',
        'Vue.use(BootstrapVueIcons);',
        'Vue.use(BootstrapVue);',
        'export const userMixin = {};',
      ),
      'src/mixins/userMixin.js',
    ),
    text('export const userMixin = {};'),
  );
});

test('keeps an import that is still used', () => {
  assert.equal(
    strippedText(
      text(
        'import Vue from "vue";',
        'import Vuex from "vuex";',
        'Vue.use(Vuex);',
        'export default new Vuex.Store({ mutations: { set(state, v) { Vue.set(state, "v", v); } } });',
      ),
    ),
    text('import Vue from "vue";', 'import Vuex from "vuex";', 'export default new Vuex.Store({ mutations: { set(state, v) { Vue.set(state, "v", v); } } });'),
  );
  assert.equal(
    stripped(
      component(
        'import Vue from "vue";',
        'import { BootstrapVue, BootstrapVueIcons, BIconMouse2 } from "bootstrap-vue";',
        'Vue.use(BootstrapVue);',
        'Vue.use(BootstrapVueIcons);',
        'export default { components: { BIconMouse2 } };',
      ),
    ).source,
    component('import { BIconMouse2 } from "bootstrap-vue";', 'export default { components: { BIconMouse2 } };'),
  );
  // `Vue.$cookies` is another reference, and so are an export and an assignment.
  for (const use of ['export const get = () => Vue.$cookies.get("a");', 'export { Vue };', 'window.Vue = Vue;']) {
    assert.equal(
      strippedText(text('import Vue from "vue";', 'import VueCookies from "vue-cookies";', 'Vue.use(VueCookies);', use)),
      text('import Vue from "vue";', use),
    );
  }
});

test('takes a dropped name out of an import that keeps others, in every place it can have', () => {
  const cases = [
    ['import Vue, { shallowRef } from "vue";', 'import { shallowRef } from "vue";', 'Vue.use(A); shallowRef(1);', 'import A from "vuex";'],
    ['import Vuex, { mapState } from "vuex";', 'import { mapState } from "vuex";', 'V.use(Vuex); mapState();', 'import V from "vue";'],
    ['import { BButton, BootstrapVue } from "bootstrap-vue";', 'import { BButton } from "bootstrap-vue";', 'V.use(BootstrapVue); BButton();', 'import V from "vue";'],
    ['import { A, BootstrapVue, B } from "bootstrap-vue";', 'import { A, B } from "bootstrap-vue";', 'V.use(BootstrapVue); A(B);', 'import V from "vue";'],
    ['import { A, BootstrapVue, IconsPlugin, } from "bootstrap-vue";', 'import { A, } from "bootstrap-vue";', 'V.use(BootstrapVue); V.use(IconsPlugin); A();', 'import V from "vue";'],
    ['import Boot, { IconsPlugin } from "bootstrap-vue";', 'import Boot from "bootstrap-vue";', 'V.use(IconsPlugin); Boot();', 'import V from "vue";'],
  ];
  for (const [before, after, code, other] of cases) {
    assert.equal(
      strippedText(text(before, other, ...code.split('; ').map((line) => line.replace(/;?$/, ';')))),
      text(after, code.split('; ').at(-1)),
      before,
    );
  }
  assert.equal(
    strippedText(
      text('import Vue from "vue";', 'import {', '    BIconCheck,', '    BootstrapVue,', '    IconsPlugin,', '} from "bootstrap-vue";', 'Vue.use(BootstrapVue);', 'Vue.use(IconsPlugin);', 'use(BIconCheck);'),
    ),
    text('import {', '    BIconCheck,', '} from "bootstrap-vue";', 'use(BIconCheck);'),
  );
});

test('a binding that was unused before stays', () => {
  assert.equal(
    strippedText(
      text('import Vue from "vue";', 'import { BootstrapVue, IconsPlugin } from "bootstrap-vue";', 'import Vuex from "vuex";', 'Vue.use(BootstrapVue);', 'export default {};'),
    ),
    text('import { IconsPlugin } from "bootstrap-vue";', 'import Vuex from "vuex";', 'export default {};'),
  );
  const unused = text('import Vue from "vue";', 'import BootstrapVue from "bootstrap-vue";', 'export default {};');
  assert.deepEqual(stripPlugins(unused, STORE), { source: unused, removed: [], left: [] });
});

test('decides by what a name is bound to, not by the name', () => {
  // Other local names for the same things.
  const renamed = stripped(
    text(
      'import V from "vue";',
      'import { default as Store } from "vuex";',
      'import { BootstrapVue as Boot, IconsPlugin as Icons } from "bootstrap-vue";',
      'import Jar from "vue-cookies";',
      'V.use(Store);',
      'V.use(Boot);',
      'V.use(Icons);',
      'V.use(Jar);',
      'V.config.productionTip = false;',
      'export default {};',
    ),
    STORE,
  );
  assert.equal(renamed.source, text('export default {};'));
  assert.deepEqual(renamed.removed, ['Vue.use(Vuex)', 'Vue.use(BootstrapVue)', 'Vue.use(IconsPlugin)', 'Vue.use(VueCookies)', 'Vue.config.productionTip = false']);

  // The same names bound to something else. A `Vue` that is not Vue installs nothing.
  const others = text(
    'import Vue from "./fakeVue";',
    'import BootstrapVue from "./bootstrap";',
    'Vue.use(BootstrapVue);',
    'Vue.config.productionTip = false;',
    'export default {};',
  );
  assert.deepEqual(stripPlugins(others, STORE), { source: others, removed: [], left: [] });

  // A parameter that shadows the import is not a reference to it, so the import goes with its last real reference.
  assert.equal(
    strippedText(text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);', 'export const install = (Vue) => Vue.mixin({});')),
    text('export const install = (Vue) => Vue.mixin({});'),
  );
});

test('leaves VueCodemirror and AsyncComputed and reports them', () => {
  const codemirror = text(
    'import Vue from "vue";',
    'import BootstrapVue from "bootstrap-vue";',
    'import VueCodemirror from "vue-codemirror";',
    '',
    'Vue.use(BootstrapVue);',
    'Vue.use(VueCodemirror);',
    '',
    'export default {};',
  );
  const first = stripped(codemirror, STORE);
  assert.equal(
    first.source,
    text('import Vue from "vue";', 'import VueCodemirror from "vue-codemirror";', '', 'Vue.use(VueCodemirror);', '', 'export default {};'),
  );
  assert.deepEqual(first.left, [{ line: 6, text: 'Vue.use(VueCodemirror)' }]);

  const asyncComputed = component('import Vue from "vue"', 'import AsyncComputed from "vue-async-computed";', 'Vue.use(AsyncComputed);', 'export default {};');
  assert.deepEqual(stripPlugins(asyncComputed, FILE), { source: asyncComputed, removed: [], left: [{ line: 8, text: 'Vue.use(AsyncComputed)' }] });
});

const IMPORTS = ['import Vue from "vue";', 'import { BootstrapVue, ModalPlugin } from "bootstrap-vue";', 'import Vuex from "vuex";'];

for (const [label, code, line, shown] of [
  ['options', ['Vue.use(BootstrapVue, { BTooltip: {} });'], 4, 'Vue.use(BootstrapVue, { BTooltip: {} })'],
  ['a function', ['export function setup() {', '    Vue.use(BootstrapVue);', '}'], 5, 'Vue.use(BootstrapVue)'],
  ['a method', ['export default {', '    mounted() {', '        Vue.use(BootstrapVue);', '    },', '};'], 6, 'Vue.use(BootstrapVue)'],
  ['a condition', ['if (window.icons) {', '    Vue.use(BootstrapVue);', '}'], 5, 'Vue.use(BootstrapVue)'],
  ['a condition without braces', ['if (window.icons) Vue.use(BootstrapVue);'], 4, 'Vue.use(BootstrapVue)'],
  ['a short circuit', ['window.icons && Vue.use(BootstrapVue);'], 4, 'Vue.use(BootstrapVue)'],
  ['a loop', ['[BootstrapVue, Vuex].forEach((plugin) => Vue.use(plugin));'], 4, 'Vue.use(plugin)'],
  ['Vue.use passed on', ['[BootstrapVue, Vuex].forEach(Vue.use);'], 4, '[BootstrapVue, Vuex].forEach(Vue.use)'],
  ['a chain', ['Vue.use(BootstrapVue).use(Vuex);'], 4, 'Vue.use(BootstrapVue).use(Vuex)'],
  ['an assigned result', ['const installed = Vue.use(BootstrapVue);'], 4, 'Vue.use(BootstrapVue)'],
  ['a plugin in a variable', ['const plugin = BootstrapVue;', 'Vue.use(plugin);'], 5, 'Vue.use(plugin)'],
  ['a plugin of another kind', ['Vue.use(ModalPlugin);'], 4, 'Vue.use(ModalPlugin)'],
  ['no argument that is a name', ['Vue.use({ install() {} });'], 4, 'Vue.use({ install() {} })'],
  ['a computed call', ['Vue["use"](BootstrapVue);'], 4, 'Vue["use"](BootstrapVue)'],
  ['an optional call', ['Vue?.use(BootstrapVue);'], 4, 'Vue?.use(BootstrapVue)'],
  ['an alias of Vue', ['const V = Vue;', 'V.use(BootstrapVue);'], 5, 'V.use(BootstrapVue)'],
  ['a comment inside the call', ['Vue.use(/* all of it */ BootstrapVue);'], 4, 'Vue.use(/* all of it */ BootstrapVue)'],
  ['another production tip', ['Vue.config.productionTip = true;'], 4, 'Vue.config.productionTip = true'],
  ['a production tip in a function', ['export const quiet = () => {', '    Vue.config.productionTip = false;', '};'], 5, 'Vue.config.productionTip = false'],
  ['a production tip that is part of an assignment', ['window.quiet = Vue.config.productionTip = false;'], 4, 'Vue.config.productionTip = false'],
  ['a required Bootstrap stylesheet', ['require("bootstrap/dist/css/bootstrap.css");'], 4, 'require("bootstrap/dist/css/bootstrap.css")'],
  ['a Bootstrap stylesheet imported as a value', ['import css from "bootstrap/dist/css/bootstrap.css";'], 4, 'import css from "bootstrap/dist/css/bootstrap.css";'],
]) {
  test(`reports an install it will not move: ${label}`, () => {
    const source = text(...IMPORTS, ...code);
    assert.deepEqual(stripPlugins(source, STORE), { source, removed: [], left: [{ line, text: shown }] });
  });
}

test('reports an install through a Vue it cannot be sure of, and a re-assigned plugin', () => {
  for (const [lines, shown] of [
    [['import * as Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);'], 'Vue.use(Vuex)'],
    [['const Vue = require("vue");', 'const other = require("./other");', 'Vue.use(other);'], 'Vue.use(other)'],
    [['const Vue = require("vue").default;', 'const other = require("./other");', 'Vue.use(other);'], 'Vue.use(other)'],
    [['import other from "./other";', 'import Vuex from "vuex";', 'Vue.use(other);'], 'Vue.use(other)'],
    [['import { createLocalVue } from "./test";', 'import Vuex from "vuex";', 'createLocalVue().use(Vuex);'], 'createLocalVue().use(Vuex)'],
    [['import Vue from "vue";', 'let Boot = require("bootstrap-vue");', 'Vue.use(Boot);'], 'Vue.use(Boot)'],
  ]) {
    const source = text(...lines);
    assert.deepEqual(stripPlugins(source, STORE), { source, removed: [], left: [{ line: 3, text: shown }] }, shown);
  }
  for (const changed of ['BootstrapVue', 'Vue']) {
    const source = text('import Vue from "vue";', 'import BootstrapVue from "bootstrap-vue";', `${changed} = wrap(${changed});`, 'Vue.use(BootstrapVue);');
    assert.deepEqual(stripPlugins(source, STORE), { source, removed: [], left: [{ line: 4, text: 'Vue.use(BootstrapVue)' }] }, changed);
  }
});

test('reports a long install on one line, cut short', () => {
  const source = text('import Vue from "vue";', 'Vue.use({', '    install() {', `        ${'x'.repeat(100)}();`, '    },', '});');
  const [{ line, text: shown }] = stripPlugins(source, STORE).left;
  assert.equal(line, 2);
  assert.equal(shown.length, 80);
  assert.match(shown, /^Vue\.use\(\{ install\(\) \{ x+\.\.\.$/);
});

test('keeps other CSS imports', () => {
  assert.equal(
    strippedText(
      text(
        'import "codemirror/lib/codemirror.css";',
        'import "bootstrap/dist/css/bootstrap.css";',
        'import "bootstrap-vue/dist/bootstrap-vue.css";',
        'import "bootstrap/dist/css/bootstrap-grid.css";',
        'import "./bootstrap.css";',
        'export default {};',
      ),
    ),
    text('import "codemirror/lib/codemirror.css";', 'import "bootstrap/dist/css/bootstrap-grid.css";', 'import "./bootstrap.css";', 'export default {};'),
  );
});

test('commented-out code is not touched and not counted', () => {
  const source = component(
    '// import Vue from "vue";',
    '/* Vue.use(BootstrapVue);',
    '   Vue.config.productionTip = false; */',
    '//import "bootstrap/dist/css/bootstrap.css";',
    'export default { name: "Vue.use(Vuex)" };',
  );
  assert.deepEqual(stripPlugins(source, FILE), { source, removed: [], left: [] });
});

test('a file with nothing to strip is returned as it is, whatever is in it', () => {
  for (const source of ['not javascript (((\n', text('<template><div /></template>')]) {
    assert.deepEqual(stripPlugins(source, 'src/a.js'), { source, removed: [], left: [] });
    assert.deepEqual(stripPlugins(source, 'src/a.vue'), { source, removed: [], left: [] });
  }
  // `.use(` of something that is neither Vue nor one of the plugins.
  const source = text('import app from "./app";', 'import plugin from "./plugin";', 'app.use(plugin);');
  assert.deepEqual(stripPlugins(source, STORE), { source, removed: [], left: [] });
});

test('never touches pageSetup.js', () => {
  const source = text('import Vue from "vue";', 'import Vuex from "vuex";', 'import "bootstrap/dist/css/bootstrap.css";', 'Vue.use(Vuex);', 'Vue.config.productionTip = false;');
  assert.deepEqual(stripPlugins(source, 'src/utils/pageSetup.js'), { source, removed: [], left: [] });
});

test('a component script it cannot edit is refused, with the reason', () => {
  const install = text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);');
  for (const [source, reason] of [
    [`<template><div /></template>\n<script setup>\n${install}</script>\n`, /<script setup>/],
    [`<template><div /></template>\n<script lang="ts">\n${install}</script>\n`, /lang="ts"/],
    [`<template><div /></template>\n<script>\n${install}</script>\n<script>\nexport default {};\n</script>\n`, /more than one <script> block/],
  ]) {
    const result = stripPlugins(source, FILE);
    assert.match(result.unresolved, reason);
    assert.deepEqual([result.source, result.removed, result.left], [source, [], []]);
  }
});

// ---- strip: the text around what goes ---------------------------------------------------------

test('one blank line stays where there was one on each side, and none at the edges of a script', () => {
  // Between two blank lines, in several blocks that only blank lines separate.
  assert.equal(
    strippedText(
      text(
        'import Vuex from "vuex";',
        'import a from "@/modules/a";',
        '',
        'import { BootstrapVue, IconsPlugin } from "bootstrap-vue";',
        '',
        'V.use(BootstrapVue);',
        'V.use(IconsPlugin);',
        '',
        'import "bootstrap/dist/css/bootstrap.css";',
        'import "bootstrap-vue/dist/bootstrap-vue.css";',
        '',
        'V.use(Vuex);',
        '',
        'import V from "vue";',
        'export default new Vuex.Store({ a });',
      ),
    ),
    text('import Vuex from "vuex";', 'import a from "@/modules/a";', '', 'export default new Vuex.Store({ a });'),
  );
  // A blank line on one side only stays.
  assert.equal(strippedText(text('import V from "vue";', 'import S from "vuex";', 'a();', 'V.use(S);', '', 'b();')), text('a();', '', 'b();'));
  assert.equal(strippedText(text('import V from "vue";', 'import S from "vuex";', 'a();', '', 'V.use(S);', 'b();')), text('a();', '', 'b();'));
  // Two blank lines that were there before stay two.
  assert.equal(strippedText(text('import V from "vue";', 'import S from "vuex";', 'a();', '', 'V.use(S);', '', '', 'b();')), text('a();', '', '', 'b();'));
  // The start and the end of the script.
  assert.equal(
    stripped(component('import V from "vue";', 'import S from "vuex";', '', 'export default {};', '', 'V.use(S);')).source,
    component('export default {};'),
  );
});

test('a trailing comment goes with its line, and a comment on a line of its own stays', () => {
  assert.equal(
    strippedText(
      text(
        '// The store of the page.',
        'import Vue from "vue"; // for the install',
        'import Vuex from "vuex";',
        '',
        '// Vuex first.',
        'Vue.use(Vuex); // the install',
        '',
        '/* the store */',
        'export default new Vuex.Store({});',
      ),
    ),
    text('// The store of the page.', 'import Vuex from "vuex";', '', '// Vuex first.', '', '/* the store */', 'export default new Vuex.Store({});'),
  );
  // A comment that runs on to the next line is not only about this line.
  assert.equal(
    strippedText(text('import V from "vue";', 'import S from "vuex";', 'V.use(S); /* one', 'two */', 'S();')),
    text('import S from "vuex";', '/* one', 'two */', 'S();'),
  );
  // An import whose own text holds a comment keeps it.
  const commented = text('import V from "vue";', 'import { BootstrapVue /* all */ } from "bootstrap-vue";', 'V.use(BootstrapVue);', 'export default {};');
  assert.equal(stripPlugins(commented, STORE).source, text('import { BootstrapVue /* all */ } from "bootstrap-vue";', 'export default {};'));
});

test('a statement that shares its line goes alone', () => {
  const imports = ['import V from "vue";', 'import S from "vuex";'];
  for (const [before, after] of [
    ['    V.use(S); a();', '    a();'],
    ['V.use(S); a();', 'a();'],
    ['a(); V.use(S);', 'a();'],
    ['a(); V.use(S); // both', 'a(); // both'],
    ['a(); V.use(S); b();', 'a(); b();'],
    ['a();V.use(S); b();', 'a(); b();'],
  ]) {
    assert.equal(strippedText(text(...imports, before)), text(after), before);
  }
  assert.equal(strippedText(text(...imports, 'import B from "bootstrap-vue";', 'x();', 'V.use(S); V.use(B); // both', 'y();')), text('x();', 'y();'));
});

test('a removal that would join two statements is an error, not a silent change', () => {
  const source = text('import V from "vue";', 'import S from "vuex";', 'const a = b', 'V.use(S);', '(function () {})();');
  assert.throws(() => stripPlugins(source, STORE), /would join/);
  // An import that goes because it is unused now can do it too.
  const dropped = text('import S from "vuex";', 'V.use(S);', 'const a = b', 'import V from "vue";', '(function () {})();');
  assert.throws(() => stripPlugins(dropped, STORE), /would join/);
});

// ---- entries --------------------------------------------------------------------------------

const HEAD = ['import Vue from "vue";', 'import Template from "./Template.vue";', 'import store from "./store.js";', ''];
const MOUNTED_HEAD = ['import { mountPage } from "@/utils/pageSetup";', ...HEAD.slice(1)];

test('rewrites render(createElement, context)', () => {
  assert.equal(
    mounted(
      text(
        ...HEAD,
        'new Vue({',
        '    store,',
        '    methods: {},',
        '',
        '    render(createElement, context) {',
        '        return createElement(Template);',
        '    },',
        '',
        '    watch: {},',
        '}).$mount("#app");',
      ),
    ),
    text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '    methods: {},', '', '    watch: {},', '});'),
  );
});

test('rewrites render when it is the first or the last option, with the blank line that set it apart', () => {
  assert.equal(
    mounted(text(...HEAD, 'new Vue({', '    store,', '', '    render(h) {', '        return h(Template);', '    },', '}).$mount("#app");')),
    text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '});'),
  );
  assert.equal(
    mounted(text(...HEAD, 'new Vue({', '    render(h) {', '        return h(Template);', '    },', '', '    store,', '}).$mount("#app");')),
    text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '});'),
  );
  // No trailing comma, and a comment on a line of its own.
  assert.equal(
    mounted(text(...HEAD, 'new Vue({', '    store,', '    // the page', '    render(h) {', '        return h(Template);', '    }', "}).$mount('#app')")),
    text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '    // the page', '})'),
  );
});

test('rewrites an arrow render', () => {
  for (const render of ['render: (h) => h(Template),', 'render: h => h(Template)', 'render: (createElement) => { return createElement(Template); },', 'render: function (h) { return h(Template) },']) {
    assert.equal(
      mounted(text(...HEAD, 'new Vue({', '    store,', `    ${render}`, '}).$mount("#app");')),
      text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '});'),
      render,
    );
  }
});

test('rewrites options on one line', () => {
  for (const [options, after] of [
    ['{ store, render: (h) => h(Template) }', '{ store }'],
    ['{ render: (h) => h(Template), store }', '{ store }'],
    ['{ store, render: (h) => h(Template), methods: {} }', '{ store, methods: {} }'],
    ['{ store, render: (h) => h(Template), }', '{ store, }'],
    ['{ render: (h) => h(Template) }', '{ }'],
  ]) {
    assert.equal(mounted(text(...HEAD, `new Vue(${options}).$mount("#app");`)), text(...MOUNTED_HEAD, `mountPage(Template, ${after});`), options);
  }
});

test('rewrites two renders that both return the template, since the later one wins either way', () => {
  const render = ['    render(createElement, context) {', '        return createElement(Template);', '    },'];
  assert.equal(
    mounted(text(...HEAD, 'new Vue({', '    store,', ...render, ...render, '}).$mount("#app");')),
    text(...MOUNTED_HEAD, 'mountPage(Template, {', '    store,', '});'),
  );
  assert.match(unresolved(text(...HEAD, 'new Vue({', ...render, '    render: (h) => h("div"),', '}).$mount("#app");')), /render/);
});

const entryWith = (...options) => text(...HEAD, 'new Vue({', ...options, '}).$mount("#app");');

test('leaves a render that returns something else unresolved', () => {
  for (const render of [
    'render: (h) => h("div"),',
    'render: (h) => h(Other),',
    'render: (h) => h(Template, { props: {} }),',
    'render: (h) => [h(Template)],',
    'render: (h) => other(Template),',
    'render: (h) => h(Template) || null,',
    'render: (Template) => Template(Template),',
    'render: (h, Template) => h(Template),',
    'render: function Template(h) { return h(Template); },',
    'render: ({ h }) => h(Template),',
    'render() { return this.$createElement(Template); },',
    'render() { return h(Template); },',
    'render(h) { "use strict"; return h(Template); },',
    'render(h) { return h(Template); log(); },',
    'async render(h) { return h(Template); },',
    'render(h) { log(); return h(Template); },',
    'render(h) { if (h) return h(Template); },',
    'render(h) { return; },',
    'get render() { return (h) => h(Template); },',
    'render,',
    'render: draw,',
  ]) {
    assert.match(unresolved(entryWith('    store,', `    ${render}`)), /`render`/, render);
  }
  assert.match(unresolved(entryWith('    store,')), /no `render`/);
  // A `Template` the file does not declare is nothing to hand on.
  assert.match(unresolved(text('import Vue from "vue";', 'new Vue({ render: (h) => h(Template) }).$mount("#app");')), /`render`/);
});

test('leaves an entry of another shape unresolved, with the reason', () => {
  const render = '    render: (h) => h(Template),';
  for (const [source, reason] of [
    [text(...HEAD, 'new Vue({', '    el: "#app",', render, '});'), /`el`/],
    [entryWith('    el: "#app",', render), /`el`/],
    [entryWith('    template: "<div />",', render), /`template`/],
    [entryWith('    ...options,', render), /spread/],
    [entryWith('    ["render"]: draw,', render), /computed/],
    [text(...HEAD, 'new Vue({', render, '});'), /not mounted with `\.\$mount\("#app"\)`/],
    [text(...HEAD, 'new Vue({', render, '}).$mount("#root");'), /not mounted with/],
    [text(...HEAD, 'new Vue({', render, '}).$mount(document.body);'), /not mounted with/],
    [text(...HEAD, 'new Vue({', render, '}).$mount();'), /not mounted with/],
    [text(...HEAD, 'new Vue({', render, '}).$mount("#app", true);'), /not mounted with/],
    [text(...HEAD, 'new Vue(options).$mount("#app");'), /object literal/],
    [text(...HEAD, 'new Vue().$mount("#app");'), /object literal/],
    [text(...HEAD, 'export const vm = new Vue({', render, '}).$mount("#app");'), /statement of its own/],
    [text(...HEAD, 'load().then(() => {', '    new Vue({', render, '    }).$mount("#app");', '});'), /statement of its own/],
    [text(...HEAD, 'const bus = new Vue();', 'new Vue({', render, '}).$mount("#app");'), /2 `new Vue` calls/],
    [text(...HEAD, 'start();'), /no `new Vue/],
    [text('import Vue from "./vue";', ...HEAD.slice(1), 'new Vue({', render, '}).$mount("#app");'), /no `new Vue/],
    [text('import * as Vue from "vue";', ...HEAD.slice(1), 'new Vue({', render, '}).$mount("#app");'), /no `new Vue/],
    [text(...HEAD, 'function mountPage() {}', 'new Vue({', render, '}).$mount("#app");'), /`mountPage` is declared/],
    [text(...HEAD, 'new Vue({', '    store,', '    render(h) {', '        // the page', '        return h(Template);', '    },', '}).$mount("#app");'), /comment/],
    [text(...HEAD, 'new Vue({', '    store,', '    render: (h) => h(Template) /* the page */,', '}).$mount("#app");'), /comment/],
    [text(...HEAD, 'new Vue(/* the page */ {', render, '}).$mount("#app");'), /comment/],
    [text(...HEAD, 'new Vue({', render, '}) // the page', '    .$mount("#app");'), /comment/],
    [text(...HEAD, 'new Vue({'), /does not parse/],
  ]) {
    assert.match(unresolved(source), reason, source);
  }
});

test('an entry that calls mountPage is done', () => {
  for (const specifier of ['@/utils/pageSetup', '@/utils/pageSetup.js', '../../utils/pageSetup']) {
    for (const [imported, name] of [['mountPage', 'mountPage'], ['mountPage as mount', 'mount']]) {
      const source = text(`import { ${imported} } from "${specifier}";`, 'import Template from "./Template.vue";', '', `${name}(Template);`);
      assert.deepEqual(mountEntry(source, ENTRY), { source });
    }
  }
  // A `mountPage` from elsewhere is not it.
  assert.match(unresolved(text('import { mountPage } from "./mount";', 'mountPage(Template);')), /no `new Vue/);
});

test('puts the pageSetup import first', () => {
  // The store comes before `vue` here, and its `new Vuex.Store` runs when it is imported.
  assert.equal(
    mounted(text('import store from "./store.js";', 'import Vue from "vue";', 'import Template from "./Template.vue";', '', 'new Vue({ store, render: (h) => h(Template) }).$mount("#app");')),
    text('import { mountPage } from "@/utils/pageSetup";', 'import store from "./store.js";', 'import Template from "./Template.vue";', '', 'mountPage(Template, { store });'),
  );
  // After a comment that heads the file, and after code that stands before the imports.
  assert.equal(
    mounted(text('// Adapted from a generated page.', 'import Vue from "vue";', '', 'import Template from "./Template.vue";', 'new Vue({ a: 1, render: (h) => h(Template) }).$mount("#app");')),
    text('// Adapted from a generated page.', 'import { mountPage } from "@/utils/pageSetup";', '', 'import Template from "./Template.vue";', 'mountPage(Template, { a: 1 });'),
  );
  // `Vue` stays imported when something else uses it.
  assert.equal(
    mounted(text(...HEAD, 'Vue.prototype.$x = 1;', 'new Vue({ a: 1, render: (h) => h(Template) }).$mount("#app");')),
    text(MOUNTED_HEAD[0], ...HEAD, 'Vue.prototype.$x = 1;', 'mountPage(Template, { a: 1 });'),
  );
});

test('both steps give an entry the shape the pages converted by hand have, and change nothing in those', () => {
  const before = text(
    'import Vue from "vue";',
    'import Template from "./Template.vue";',
    'import store from "./store.js";',
    '',
    'import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";',
    'import "bootstrap/dist/css/bootstrap.css";',
    'import "bootstrap-vue/dist/bootstrap-vue.css";',
    '',
    'import { pageMixin } from "@/mixins/pageMixin";',
    '',
    'Vue.config.productionTip = false;',
    'Vue.use(BootstrapVue);',
    'Vue.use(BootstrapVueIcons);',
    '',
    'const started = Date.now();',
    '',
    'new Vue({',
    '    store,',
    '    mixins: [pageMixin],',
    '    created() {',
    '        this.started = started;',
    '    },',
    '    render(createElement) {',
    '        return createElement(Template);',
    '    },',
    '    computed: {},',
    '}).$mount("#app");',
  );
  const after = text(
    'import { mountPage } from "@/utils/pageSetup";',
    'import Template from "./Template.vue";',
    'import store from "./store.js";',
    '',
    'import { pageMixin } from "@/mixins/pageMixin";',
    '',
    'const started = Date.now();',
    '',
    'mountPage(Template, {',
    '    store,',
    '    mixins: [pageMixin],',
    '    created() {',
    '        this.started = started;',
    '    },',
    '    computed: {},',
    '});',
  );
  assert.equal(converted(before), after);
  assert.equal(converted(after), after);

  // An install it leaves stays where it is, before the mount.
  assert.equal(
    converted(
      text(
        'import Vue from "vue";',
        '//import VueCodeMirror from "vue-codemirror";',
        'import BootstrapVue from "bootstrap-vue";',
        'import Template from "./Template.vue";',
        '',
        'import VueCodemirror from "vue-codemirror";',
        '',
        'Vue.use(BootstrapVue);',
        'Vue.use(VueCodemirror);',
        'Vue.config.productionTip = false;',
        '',
        'new Vue({',
        '    a: 1,',
        '    render: (h) => h(Template),',
        '}).$mount("#app");',
      ),
    ),
    text(
      'import { mountPage } from "@/utils/pageSetup";',
      'import Vue from "vue";',
      '//import VueCodeMirror from "vue-codemirror";',
      'import Template from "./Template.vue";',
      '',
      'import VueCodemirror from "vue-codemirror";',
      '',
      'Vue.use(VueCodemirror);',
      '',
      'mountPage(Template, {',
      '    a: 1,',
      '});',
    ),
  );
});

test('keeps comments and CRLF', () => {
  const before = text(
    '// The page.',
    'import Vue from "vue";',
    '//import BootstrapVue from "bootstrap-vue";',
    'import { BootstrapVue } from "bootstrap-vue";',
    'import Template from "./Template.vue";',
    '',
    '/* The installs. */',
    'Vue.use(BootstrapVue);',
    '// Quiet.',
    'Vue.config.productionTip = false;',
    '',
    'new Vue({',
    '\ta: 1, // one',
    '',
    '\trender(createElement, context) {',
    '\t\treturn createElement(Template);',
    '\t},',
    '}).$mount("#app"); // done',
  );
  const after = text(
    '// The page.',
    'import { mountPage } from "@/utils/pageSetup";',
    '//import BootstrapVue from "bootstrap-vue";',
    'import Template from "./Template.vue";',
    '',
    '/* The installs. */',
    '// Quiet.',
    '',
    'mountPage(Template, {',
    '\ta: 1, // one',
    '}); // done',
  );
  assert.equal(converted(before), after);
  assert.equal(converted(crlf(before)), crlf(after));
  const sfc = component('import Vue from "vue";', 'import Vuex from "vuex";', '', 'Vue.use(Vuex); // now', '', 'export default {};');
  assert.equal(stripped(crlf(sfc)).source, crlf(component('export default {};')));
});

// ---- the tree -------------------------------------------------------------------------------

const PAGE_SETUP = text(
  'import Vue from "vue";',
  'import Vuex from "vuex";',
  'import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";',
  'import VueCookies from "vue-cookies";',
  '',
  'import "bootstrap/dist/css/bootstrap.css";',
  'import "bootstrap-vue/dist/bootstrap-vue.css";',
  '',
  'Vue.use(Vuex);',
  'Vue.use(BootstrapVue);',
  'Vue.use(BootstrapVueIcons);',
  'Vue.use(VueCookies);',
  'Vue.config.productionTip = false;',
  '',
  'export function mountPage(Template, options = {}, plugins = []) {',
  '    plugins.forEach((plugin) => Vue.use(plugin));',
  '    return new Vue({ ...options, render: (h) => h(Template) }).$mount("#app");',
  '}',
);

const ALL = ['Vuex', 'BootstrapVue', 'BootstrapVueIcons', 'VueCookies', 'bootstrap/dist/css/bootstrap.css', 'bootstrap-vue/dist/bootstrap-vue.css'];

const STORE_TEXT = text('import Vue from "vue";', 'import Vuex from "vuex";', '', 'Vue.use(Vuex);', '', 'export default new Vuex.Store({});');
const STORE_AFTER = text('import Vuex from "vuex";', '', 'export default new Vuex.Store({});');

/** An entry that mounts `Template` after `head` (lines) and imports `./store.js`. */
const entry = (...head) =>
  text('import Vue from "vue";', 'import Template from "./Template.vue";', 'import store from "./store.js";', ...head, '', 'new Vue({', '    store,', '    render(createElement) {', '        return createElement(Template);', '    },', '}).$mount("#app");');
const ENTRY_AFTER = text('import { mountPage } from "@/utils/pageSetup";', 'import Template from "./Template.vue";', 'import store from "./store.js";', '', 'mountPage(Template, {', '    store,', '});');

const FULL = component(
  'import Vue from "vue";',
  'import VueCookies from "vue-cookies";',
  'import { BootstrapVue, IconsPlugin } from "bootstrap-vue";',
  'import "bootstrap/dist/css/bootstrap.css";',
  'import "bootstrap-vue/dist/bootstrap-vue.css";',
  'Vue.use(VueCookies);',
  'Vue.use(BootstrapVue);',
  'Vue.use(IconsPlugin);',
  'export default {};',
);
const importing = (file) => component(`import A from "${file}";`, 'export default { components: { A } };');

const FIXTURE = {
  'src/utils/pageSetup.js': PAGE_SETUP,
  // Every plugin reaches this page, some of them through its template.
  'src/views/Full/main.js': entry(),
  'src/views/Full/store.js': STORE_TEXT,
  'src/views/Full/Template.vue': importing('@/components/Full.vue'),
  'src/components/Full.vue': FULL,
  // Vuex only.
  'src/views/Bare/main.js': entry(),
  'src/views/Bare/store.js': STORE_TEXT,
  'src/views/Bare/Template.vue': component('export default {};'),
  // A portal's own page, converted already.
  'src/portals/P/views/Done/main.js': ENTRY_AFTER,
  'src/portals/P/views/Done/store.js': STORE_AFTER,
  'src/portals/P/views/Done/Template.vue': component('export default {};'),
};

async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'page-setup-'));
  try {
    for (const [file, contents] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), contents);
    }
    return await fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const read = (root, file) => readFileSync(join(root, file), 'utf8');

/** A writable that keeps what it is given, like process.stdout. */
function sink() {
  const chunks = [];
  return {
    write(chunk) {
      chunks.push(chunk);
      return true;
    },
    get text() {
      return chunks.join('');
    },
  };
}

/** `run` against `root` with its output collected; `writes` lists the paths `write` was asked to write. */
async function cli(root, argv = [], deps = {}) {
  const out = sink();
  const err = sink();
  const writes = [];
  const code = await run(['--root', root, ...argv], {
    ...deps,
    out,
    err,
    write: (path, contents) => {
      writes.push(path.slice(root.length + 1));
      writeFileSync(path, contents);
    },
  });
  return { code, out: out.text, err: err.text, writes };
}

/** The lines of one `## <heading>` section of a report, up to the next heading. */
const section = (report, heading) => report.split(`## ${heading}\n`)[1].split('\n## ')[0];

const CHANGED = ['src/components/Full.vue', 'src/views/Bare/main.js', 'src/views/Bare/store.js', 'src/views/Full/main.js', 'src/views/Full/store.js'];

test('converts the entries and strips the rest of the tree', async () => {
  await withRoot(FIXTURE, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 0, result.err);
    assert.equal(result.err, '');
    assert.deepEqual(result.writes, CHANGED);
    for (const page of ['Full', 'Bare']) {
      assert.equal(read(root, `src/views/${page}/main.js`), ENTRY_AFTER);
      assert.equal(read(root, `src/views/${page}/store.js`), STORE_AFTER);
    }
    assert.equal(read(root, 'src/components/Full.vue'), component('export default {};'));
    assert.equal(read(root, 'src/utils/pageSetup.js'), PAGE_SETUP);

    assert.match(result.out, /^# Page setup$/m);
    assert.match(result.out, /^\| Entries converted \| 2 \|$/m);
    assert.match(result.out, /^\| Entries already on pageSetup \| 1 \|$/m);
    assert.match(result.out, /^\| Files to change \| 5 \|$/m);
    assert.match(result.out, /^\| Unresolved \| 0 \|$/m);
    assert.match(result.out, /^\| Left in place \| 0 \|$/m);
    assert.match(section(result.out, 'Removed'), /^\| `Vue\.use\(Vuex\)` \| 2 \|$/m);
    assert.match(section(result.out, 'Removed'), /^\| `Vue\.use\(IconsPlugin\)` \| 1 \|$/m);
    assert.deepEqual(section(result.out, 'Changed files').trim().split('\n'), CHANGED.map((file) => `- \`${file}\``));
  });
});

test('a dry run reports the same and writes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0, dry.err);
    assert.deepEqual(dry.writes, []);
    for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents);
    assert.match(dry.out, /^# Page setup \(dry run\)$/m);
    assert.match(dry.out, /^\| Entries converted \| 2 \|$/m);
    assert.deepEqual(section(dry.out, 'Files that would change').trim().split('\n'), CHANGED.map((file) => `- \`${file}\``));
  });
});

test('a second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    assert.equal((await cli(root)).code, 0);
    const second = await cli(root);
    assert.equal(second.code, 0, second.err);
    assert.deepEqual(second.writes, []);
    assert.match(second.out, /^\| Entries converted \| 0 \|$/m);
    assert.match(second.out, /^\| Entries already on pageSetup \| 3 \|$/m);
    assert.equal(section(second.out, 'Changed files').trim(), 'None.');
    assert.equal(section(second.out, 'Pages that gain or lose something').trim(), 'None.');
  });
});

test('reports plugins gained and lost per page', async () => {
  // A main.js that is not a page, and one this will not convert: their stores lose Vuex, and they reach no pageSetup.js.
  const files = {
    ...FIXTURE,
    'src/views/Widget/main.js': entry().replace('"#app"', '"#widget"'),
    'src/views/Widget/store.js': STORE_TEXT,
    'src/views/Widget/Template.vue': component('export default {};'),
  };
  await withRoot(files, async (root) => {
    const { pages } = setupTree({ root, dryRun: true });
    assert.deepEqual(pages, [
      { entry: 'src/views/Bare/main.js', gained: ALL.slice(1), lost: [] },
      { entry: 'src/views/Widget/main.js', gained: [], lost: ['Vuex'] },
    ]);

    const result = await cli(root, ['--dry-run']);
    const rows = section(result.out, 'Pages that gain or lose something');
    assert.match(rows, /^\| `Bare` \| `BootstrapVue`, `BootstrapVueIcons`, `VueCookies`, `bootstrap\/dist\/css\/bootstrap\.css`, `bootstrap-vue\/dist\/bootstrap-vue\.css` \| {2}\|$/m);
    assert.match(rows, /^\| `Widget` \| {2}\| `Vuex` \|$/m);
    assert.doesNotMatch(rows, /`Full`|Done/);
    assert.match(result.out, /^\| Pages that gain \| 1 \|$/m);
    assert.match(result.out, /^\| Pages that lose \| 1 \|$/m);
  });
});

test('pagePlugins counts what each page reaches: installs that run on load, either icon plugin, the two stylesheets', () => {
  const sources = new Map([
    ['src/utils/pageSetup.js', PAGE_SETUP],
    ['src/views/A/main.js', text('import "./lazy.js";', 'import { icons } from "./icons";', 'import "codemirror/lib/codemirror.css";')],
    ['src/views/A/icons.js', text('import V from "vue";', 'import { IconsPlugin as icons, BootstrapVue } from "bootstrap-vue";', 'V.use(icons);', 'export const later = () => V.use(BootstrapVue);', 'export { icons };')],
    ['src/views/A/lazy.js', text('import Vue from "vue";', 'import Vuex from "vuex";', '// Vue.use(Cookies)', 'export default () => import("./chunk.vue");')],
    ['src/views/A/chunk.vue', component('import Vue from "vue";', 'import VueCookies from "vue-cookies";', 'import "bootstrap/dist/css/bootstrap.css";', 'Vue.use(VueCookies, {});', 'export default {};')],
    ['src/views/B/main.js', text('import { mountPage } from "@/utils/pageSetup";')],
    ['src/views/C/main.js', text('import x from "vuex";')],
    ['src/unreached.js', text('import Vue from "vue";', 'import Vuex from "vuex";', 'Vue.use(Vuex);')],
  ]);
  assert.deepEqual(
    pagePlugins(sources),
    new Map([
      ['src/views/A/main.js', new Set(['BootstrapVueIcons', 'VueCookies', 'bootstrap/dist/css/bootstrap.css'])],
      ['src/views/B/main.js', new Set(ALL)],
      ['src/views/C/main.js', new Set()],
    ]),
  );
});

test('an unresolved entry is listed with its reason and not changed; what is left is listed with its line', async () => {
  const widget = text('import Vue from "vue";', 'import BootstrapVue from "bootstrap-vue";', 'import VueCodemirror from "vue-codemirror";', 'Vue.use(BootstrapVue);', 'Vue.use(VueCodemirror);', 'new Vue({ el: "#app" });');
  const setup = '<template><div /></template>\n<script setup>\nimport Vue from "vue";\nVue.use(x);\n</script>\n';
  await withRoot({ ...FIXTURE, 'src/views/Widget/main.js': widget, 'src/components/Setup.vue': setup }, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 0, result.err);
    assert.deepEqual(result.writes, CHANGED);
    assert.equal(read(root, 'src/views/Widget/main.js'), widget);
    const rows = section(result.out, 'Unresolved');
    assert.match(rows, /^\| `src\/views\/Widget\/main\.js` \| .*`el`.* \|$/m);
    assert.match(rows, /^\| `src\/components\/Setup\.vue` \| .*<script setup>.* \|$/m);
    assert.match(section(result.out, 'Left in place'), /^\| `src\/views\/Widget\/main\.js:5` \| `Vue\.use\(VueCodemirror\)` \|$/m);
    assert.match(result.out, /^\| Unresolved \| 2 \|$/m);
    assert.match(result.out, /^\| Left in place \| 1 \|$/m);
  });
});

test('a converted entry is stripped again when a merge brings an install back', async () => {
  const merged = ENTRY_AFTER.replace('import Template', 'import Vue from "vue";\nimport Vuex from "vuex";\nimport Template').replace('\n\n', '\n\nVue.use(Vuex);\n\n');
  await withRoot({ ...FIXTURE, 'src/portals/P/views/Done/main.js': merged }, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 0, result.err);
    assert.equal(read(root, 'src/portals/P/views/Done/main.js'), ENTRY_AFTER);
    assert.match(result.out, /^\| Entries converted \| 2 \|$/m);
    assert.match(result.out, /^\| Entries already on pageSetup \| 1 \|$/m);
  });
});

// ---- failures and usage -----------------------------------------------------------------------

test('writes nothing when one file fails to parse', async () => {
  // A source that does not parse: what it imports is unknown.
  await withRoot({ ...FIXTURE, 'src/components/Broken.vue': component('import Vue from "vue";', 'Vue.use(;', 'export default {};') }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.match(dry.out, /^A real run would write nothing\.$/m);

    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents);
    assert.match(section(real.out, 'Failed'), /^- `src\/components\/Broken\.vue`: /m);
    assert.match(real.out, /^Nothing was written\.$/m);
    assert.equal(section(real.out, 'Changed files').trim(), 'None.');
    assert.match(real.err, /1 file\(s\) failed; nothing was written/);
  });
  // A changed file that does not parse any more.
  await withRoot(FIXTURE, async (root) => {
    const strip = (source, file) => {
      const result = stripPlugins(source, file);
      return file.endsWith('Full.vue') ? { ...result, source: result.source.replace('</template>', '') } : result;
    };
    const real = await cli(root, [], { strip });
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.match(section(real.out, 'Failed'), /^- `src\/components\/Full\.vue`: the SFC parser reports: /m);
  });
});

test('a write that throws is a failure with its message; the other files are still written', async () => {
  await withRoot(FIXTURE, async (root) => {
    const out = sink();
    const err = sink();
    const code = await run(['--root', root], {
      out,
      err,
      write: (path, contents) => {
        if (path.endsWith('Full.vue')) throw new Error('EACCES: permission denied');
        writeFileSync(path, contents);
      },
    });
    assert.equal(code, 1);
    assert.match(section(out.text, 'Failed'), /`src\/components\/Full\.vue`: write failed: EACCES/);
    assert.equal(read(root, 'src/components/Full.vue'), FULL);
    assert.equal(read(root, 'src/views/Bare/main.js'), ENTRY_AFTER);
    assert.doesNotMatch(section(out.text, 'Changed files'), /Full\.vue/);
  });
});

test('exit 2 without pageSetup.js', async () => {
  const { 'src/utils/pageSetup.js': _, ...files } = FIXTURE;
  await withRoot(files, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 2);
    assert.equal(result.out, '');
    assert.match(result.err, /src\/utils\/pageSetup\.js/);
    assert.deepEqual(result.writes, []);
  });
});

test('usage errors exit 2 with the usage line on stderr and nothing on stdout', async () => {
  await withRoot(FIXTURE, async (root) => {
    for (const argv of [['--root', root, '--bogus'], ['--root', root, 'extra'], ['--root'], ['--root', join(root, 'missing')]]) {
      const out = sink();
      const err = sink();
      assert.equal(await run(argv, { out, err, write: () => assert.fail('wrote') }), 2, argv.join(' '));
      assert.equal(out.text, '');
      assert.match(err.text, /usage: node scripts\/vue3-migration\/page-setup\.mjs \[--root <dir>\] \[--dry-run\]/);
    }
  });
});
