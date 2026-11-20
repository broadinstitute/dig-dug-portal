import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  toKebab,
  toKey,
  readSources,
  analyzeSources,
  scanRegistrations,
  scanImports,
  pageEntries,
  reachable,
  findCycles,
  scriptSetupFiles,
} from './component-graph.mjs';

const sfc = (script, attrs = '') => `<template><div/></template>\n<script${attrs}>\n${script}\n</script>\n`;
const srcs = (obj) => new Map(Object.entries(obj));

test('toKebab turns PascalCase and camelCase into kebab-case and leaves kebab names alone', () => {
  assert.equal(toKebab('DownloadChart'), 'download-chart');
  assert.equal(toKebab('downloadChart'), 'download-chart');
  assert.equal(toKebab('download-chart'), 'download-chart');
  assert.equal(toKebab('lz-panel'), 'lz-panel');
  assert.equal(toKebab('ResearchBarPlotV2'), 'research-bar-plot-v2');
});

test('toKey maps every spelling of a tag to the same PascalCase key', () => {
  assert.equal(toKey('download-chart'), 'DownloadChart');
  assert.equal(toKey('DownloadChart'), 'DownloadChart');
  assert.equal(toKey('downloadChart'), 'DownloadChart');
  assert.equal(toKey('lz-panel'), 'LzPanel');
  assert.equal(toKey('Autocomplete'), 'Autocomplete');
});

test('scanRegistrations finds definitions in double quotes, single quotes, and split across lines', () => {
  const regs = scanRegistrations(
    srcs({
      'src/components/Dq.vue': sfc(`import Vue from "vue";\nexport default Vue.component("dq-comp", { data() { return {}; } });`),
      'src/components/Sq.vue': sfc(`import Vue from 'vue';\n  export default Vue.component('sq-comp', {});`),
      'src/components/Split.vue': sfc(
        `import Vue from "vue";\nexport default Vue.component(\n    "split-comp",\n    {\n        data() { return {}; }\n    }\n);`,
      ),
    }),
  );
  assert.deepEqual([...regs.keys()], ['dq-comp', 'split-comp', 'sq-comp']);
  assert.deepEqual(regs.get('dq-comp'), [{ file: 'src/components/Dq.vue', name: 'dq-comp', kind: 'definition' }]);
  assert.deepEqual(regs.get('sq-comp'), [{ file: 'src/components/Sq.vue', name: 'sq-comp', kind: 'definition' }]);
  assert.deepEqual(regs.get('split-comp'), [{ file: 'src/components/Split.vue', name: 'split-comp', kind: 'definition' }]);
});

test('scanRegistrations records an alias with the import specifier of its identifier', () => {
  const regs = scanRegistrations(
    srcs({
      'src/components/Picker.vue': sfc(
        [
          `import Vue from "vue";`,
          `import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";`,
          `import { Autocomplete } from "./Autocomplete.vue";`,
          `import * as Ns from "@/components/Ns";`,
          `const Local = { template: "<i/>" };`,
          `Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);`,
          `Vue.component("autocomplete", Autocomplete);`,
          `Vue.component("ns", Ns);`,
          `Vue.component("local", Local);`,
          `export default Vue.component("picker", {});`,
        ].join('\n'),
      ),
    }),
  );
  const file = 'src/components/Picker.vue';
  assert.deepEqual(regs.get('vue-typeahead-bootstrap'), [
    { file, name: 'vue-typeahead-bootstrap', kind: 'alias', source: 'vue-typeahead-bootstrap' },
  ]);
  assert.deepEqual(regs.get('autocomplete'), [{ file, name: 'autocomplete', kind: 'alias', source: './Autocomplete.vue' }]);
  assert.deepEqual(regs.get('ns'), [{ file, name: 'ns', kind: 'alias', source: '@/components/Ns' }]);
  assert.deepEqual(regs.get('local'), [{ file, name: 'local', kind: 'alias', source: null }]);
  assert.deepEqual(regs.get('picker'), [{ file, name: 'picker', kind: 'definition' }]);
});

// Phase 2 turns `export default Vue.component("id", {...})` into `export default { name: "id", ... }`. That
// file no longer registers anything, but phase 1 must still see that a component of that name exists (I1).
test('scanRegistrations records a .vue whose default export is an options object with a string-literal name as named', () => {
  const regs = scanRegistrations(
    srcs({
      'src/components/Unwrapped.vue': sfc(`import B from "./B.vue";\nexport default {\n    name: "comp-x",\n    components: { B },\n};`),
      'src/components/Quoted.vue': sfc(`export default { 'name': 'QuotedName', data() { return {}; } };`),
      'src/components/Last.vue': sfc(`export default { name: "first", name: "last-one" };`),
      // Not named: a .js file, a name that is not a string literal, no name, a computed key, another export.
      'src/components/plain.js': `export default { name: "from-js" };`,
      'src/components/Var.vue': sfc(`const n = "v";\nexport default { name: n };`),
      'src/components/Tpl.vue': sfc('export default { name: `tpl` };'),
      'src/components/NoName.vue': sfc(`export default { components: {} };`),
      'src/components/Computed.vue': sfc(`const k = "name";\nexport default { [k]: "computed" };`),
      'src/components/Ident.vue': sfc(`const Options = { name: "ident" };\nexport default Options;`),
      'src/components/NotLast.vue': sfc(`const n = "x";\nexport default { name: "early", name: n };`),
      'src/components/Wrapped.vue': sfc(`export default Vue.component("wrapped", { name: "WrappedName" });`),
    }),
  );
  assert.deepEqual([...regs.keys()], ['comp-x', 'last-one', 'quoted-name', 'wrapped']);
  assert.deepEqual(regs.get('comp-x'), [{ file: 'src/components/Unwrapped.vue', name: 'comp-x', kind: 'named' }]);
  assert.deepEqual(regs.get('quoted-name'), [{ file: 'src/components/Quoted.vue', name: 'QuotedName', kind: 'named' }]);
  assert.deepEqual(regs.get('last-one'), [{ file: 'src/components/Last.vue', name: 'last-one', kind: 'named' }]);
  // A Vue.component definition is a definition, whatever name its options carry.
  assert.deepEqual(regs.get('wrapped'), [{ file: 'src/components/Wrapped.vue', name: 'wrapped', kind: 'definition' }]);
});

test('scanRegistrations keys a PascalCase name by its kebab form and keeps the name as written', () => {
  const regs = scanRegistrations(srcs({ 'src/components/D.vue': sfc(`export default Vue.component("DownloadChart", {});`) }));
  assert.deepEqual([...regs.keys()], ['download-chart']);
  assert.deepEqual(regs.get('download-chart'), [{ file: 'src/components/D.vue', name: 'DownloadChart', kind: 'definition' }]);
});

test('scanRegistrations returns every file that registers the same name, in file order', () => {
  const regs = scanRegistrations(
    srcs({
      'src/components/lz/panels/LzPanel.vue': sfc(`export default Vue.component('lz-panel', {});`),
      'src/components/lz/beta/LzPanel.vue': sfc(`export default Vue.component('lz-panel', {});`),
    }),
  );
  assert.deepEqual(
    regs.get('lz-panel').map((r) => r.file),
    ['src/components/lz/beta/LzPanel.vue', 'src/components/lz/panels/LzPanel.vue'],
  );
});

test('scanRegistrations also reads plain .js files and ignores other Vue.component look-alikes', () => {
  const regs = scanRegistrations(
    srcs({
      'src/utils/reg.js': `import Vue from "vue";\nVue.component("from-js", {});`,
      'src/utils/getter.js': `const C = Vue.component("only-a-lookup");`,
      'src/utils/other.js': `Other.component("not-vue", {}); component("bare", {}); Vue["component"]("computed", {});`,
      'src/utils/text.js': `const s = 'Vue.component("in-a-string", {})'; // Vue.component("in-a-comment", {})`,
    }),
  );
  assert.deepEqual([...regs.keys()], ['from-js']);
});

test('scanRegistrations reports a non-literal name or an unrecognised component argument instead of ignoring it', () => {
  const errors = [];
  const regs = scanRegistrations(
    srcs({
      'src/components/Dyn.vue': sfc(`const n = "x";\nexport default Vue.component(n, {});`),
      'src/components/Tpl.vue': sfc('export default Vue.component(`tpl-${n}`, {});'),
      'src/components/Ext.vue': sfc(`export default Vue.component("ext", Vue.extend({}));`),
      'src/components/Empty.vue': sfc(`Vue.component();`),
      'src/components/Ok.vue': sfc(`export default Vue.component("ok", {});`),
    }),
    errors,
  );
  assert.deepEqual([...regs.keys()], ['ok']);
  assert.deepEqual(
    errors.map((e) => [e.file, e.kind, e.line]),
    [
      ['src/components/Dyn.vue', 'registration', 4],
      ['src/components/Empty.vue', 'registration', 3],
      ['src/components/Ext.vue', 'registration', 3],
      ['src/components/Tpl.vue', 'registration', 3],
    ],
  );
  assert.match(errors[0].message, /first argument is not a string literal/);
  assert.match(errors[2].message, /second argument is neither an object literal nor an identifier/);
});

test('a one-argument Vue.component("x") is a lookup: no registration and no error', () => {
  const errors = [];
  const regs = scanRegistrations(
    srcs({
      'src/utils/lookup.js': `const C = Vue.component("only-a-lookup");`,
      'src/components/Lookup.vue': sfc(`export default { created() { this.C = Vue.component('another-lookup'); } };`),
    }),
    errors,
  );
  assert.equal(regs.size, 0);
  assert.deepEqual(errors, []);
});

test('a one-argument Vue.component(...) that is not a string-literal lookup is reported', () => {
  const errors = [];
  const regs = scanRegistrations(
    srcs({
      'src/utils/ident.js': `Vue.component(name);`,
      'src/utils/spread.js': `\n\nVue.component(...args);`,
    }),
    errors,
  );
  assert.equal(regs.size, 0);
  assert.deepEqual(
    errors.map((e) => [e.file, e.kind, e.line]),
    [
      ['src/utils/ident.js', 'registration', 1],
      ['src/utils/spread.js', 'registration', 3],
    ],
  );
  assert.ok(errors.every((e) => /first argument is not a string literal/.test(e.message)));
});

test('a file that fails to parse is reported with its file name and line, and the other files are still scanned', () => {
  const sources = srcs({
    'src/components/Broken.vue': sfc(`import Vue from "vue";\nconst = ;`),
    'src/utils/broken.js': `const = ;`,
    'src/components/Fine.vue': sfc(`export default Vue.component("fine", {});`),
  });
  const analysis = analyzeSources(sources);
  assert.deepEqual([...analysis.registrations.keys()], ['fine']);
  assert.deepEqual(
    analysis.errors.map((e) => [e.file, e.kind]),
    [
      ['src/components/Broken.vue', 'parse'],
      ['src/utils/broken.js', 'parse'],
    ],
  );
  assert.equal(analysis.errors[0].line, 4, 'the line is in the .vue file, not in its script block');
  assert.equal(analysis.errors[1].line, 1);
  assert.ok(analysis.errors.every((e) => typeof e.message === 'string' && e.message.length > 0));
  // a broken file still has an (empty) entry in the import map
  assert.deepEqual(analysis.imports.get('src/utils/broken.js'), []);
});

test('Babel errors it recovers from are reported, and the file is still scanned', () => {
  const analysis = analyzeSources(
    srcs({ 'src/components/Dup.vue': sfc(`let a = 1;\nlet a = 2;\nexport default Vue.component("dup", {});`) }),
  );
  assert.deepEqual([...analysis.registrations.keys()], ['dup']);
  assert.deepEqual(
    analysis.errors.map((e) => [e.file, e.kind, e.line]),
    [['src/components/Dup.vue', 'parse', 4]],
  );
  assert.match(analysis.errors[0].message, /already been declared/);
});

test('a <script> block the SFC parser lost is reported, but template HTML warnings are not', () => {
  const analysis = analyzeSources(
    srcs({
      'src/components/Lost.vue': '<template>\n<div></div>\n<script>\nexport default Vue.component("lost", {});\n</script>\n',
      'src/components/Unclosed.vue': '<template>\n<img>\n</template>\n<script>\nexport default Vue.component("unclosed", {});\n</script>\n',
    }),
  );
  assert.deepEqual([...analysis.registrations.keys()], ['unclosed']);
  assert.deepEqual(
    analysis.errors.map((e) => [e.file, e.kind]),
    [['src/components/Lost.vue', 'parse']],
  );
});

test('scanRegistrations and scanImports push their errors into the array they are given', () => {
  const sources = srcs({
    'src/a.js': `const = ;`,
    'src/b.js': `Vue.component(x, {});`,
  });
  const regErrors = [];
  scanRegistrations(sources, regErrors);
  assert.deepEqual(regErrors.map((e) => [e.file, e.kind]), [['src/a.js', 'parse'], ['src/b.js', 'registration']]);
  const importErrors = [];
  scanImports(sources, importErrors);
  assert.deepEqual(importErrors.map((e) => [e.file, e.kind]), [['src/a.js', 'parse']], 'scanImports only reports parse errors');
  // the error array is optional
  assert.doesNotThrow(() => scanRegistrations(sources));
  assert.doesNotThrow(() => scanImports(sources));
});

test('scanImports resolves @/ and relative specifiers, require() and import(), and drops packages', () => {
  const sources = srcs({
    'src/components/A.vue': sfc(''),
    'src/components/B.vue': sfc(''),
    'src/components/sub/C.vue': sfc(''),
    'src/utils/x.js': '',
    'src/views/Page/Template.vue': sfc(
      [
        `import A from "@/components/A";`,
        `import B from "../../components/B.vue";`,
        `import C from "./local/../../../components/sub/C.vue";`,
        `import Vue from "vue";`,
        `import { BootstrapVue } from "bootstrap-vue";`,
        `import "@/assets/style.css";`,
        `import Missing from "@/components/Missing.vue";`,
        `const x = require("@/utils/x.js");`,
        `const Lazy = () => import("@/components/A.vue");`,
        `const dyn = () => import("@/components/" + name);`,
      ].join('\n'),
    ),
  });
  const imports = scanImports(sources);
  assert.deepEqual(imports.get('src/views/Page/Template.vue'), [
    'src/components/A.vue',
    'src/components/B.vue',
    'src/components/sub/C.vue',
    'src/utils/x.js',
  ]);
});

test('scanImports resolves ./ relative to the importing file, and re-exports count as imports', () => {
  const sources = srcs({
    'src/components/A.vue': sfc(`import B from "./B";\nimport D from "./deep/D.js";`),
    'src/components/B.vue': sfc(''),
    'src/components/deep/D.js': `export { default } from "../B.vue";\nexport * from "./E";`,
    'src/components/deep/E.js': '',
  });
  const imports = scanImports(sources);
  assert.deepEqual(imports.get('src/components/A.vue'), ['src/components/B.vue', 'src/components/deep/D.js']);
  assert.deepEqual(imports.get('src/components/deep/D.js'), ['src/components/B.vue', 'src/components/deep/E.js']);
});

test('scanImports tries no extension, .vue, .js, /index.js, /index.vue in that order', () => {
  const sources = srcs({
    'src/exact.js': '',
    'src/exact.js.vue': '',
    'src/both.vue': '',
    'src/both.js': '',
    'src/dir/index.js': '',
    'src/dir/index.vue': '',
    'src/only/index.vue': '',
    'src/main.js': [
      `import a from "@/exact.js";`,
      `import b from "@/both";`,
      `import c from "@/dir";`,
      `import d from "@/only";`,
    ].join('\n'),
  });
  assert.deepEqual(scanImports(sources).get('src/main.js'), [
    'src/exact.js',
    'src/both.vue',
    'src/dir/index.js',
    'src/only/index.vue',
  ]);
});

test('scanImports lists each file once, in order of first import, and imports from <script setup> count', () => {
  const sources = srcs({
    'src/a/A.vue': sfc(''),
    'src/a/B.vue': sfc(''),
    'src/a/Page.vue':
      '<template><div/></template>\n' +
      '<script setup>\nimport B from "./B.vue";\nimport A from "./A.vue";\n</script>\n' +
      '<script>\nimport A2 from "./A";\nexport default { name: "page" };\n</script>\n',
  });
  assert.deepEqual(scanImports(sources).get('src/a/Page.vue'), ['src/a/B.vue', 'src/a/A.vue']);
});

test('a .vue with no script has no imports, and every .vue/.js source has an entry', () => {
  const sources = srcs({
    'src/a/NoScript.vue': '<template><div>hi</div></template>\n<style>.a { color: red }</style>\n',
    'src/a/b.js': `import x from "./NoScript.vue";`,
    'src/a/readme.txt': 'not a script',
  });
  const imports = scanImports(sources);
  assert.deepEqual(imports.get('src/a/NoScript.vue'), []);
  assert.deepEqual(imports.get('src/a/b.js'), ['src/a/NoScript.vue']);
  assert.deepEqual([...imports.keys()], ['src/a/NoScript.vue', 'src/a/b.js']);
});

// Portal branches keep pages outside src/views (src/portals/PanKbase/views/Gene/main.js), so every
// main.js under src/ is a page. One that is not built only adds evidence, which makes the rules stricter.
test('pageEntries lists every main.js under src/, whatever the folder, sorted, and nothing else', () => {
  const sources = srcs({
    'src/views/Gene/main.js': '',
    'src/views/A2fIndex/main.js': '',
    'src/views/Research/Deep/main.js': '',
    'src/portals/PanKbase/views/Gene/main.js': '',
    'src/main.js': '',
    'src/components/views/main.js': '',
    'src/views/Gene/Template.vue': '',
    'src/views/Gene/store.js': '',
    'src/views/Gene/notmain.js': '',
    'src/views/Gene/main.vue': '',
    'src/portals/PanKbase/views/Gene/Template.vue': '',
  });
  assert.deepEqual(pageEntries(sources), [
    'src/components/views/main.js',
    'src/main.js',
    'src/portals/PanKbase/views/Gene/main.js',
    'src/views/A2fIndex/main.js',
    'src/views/Gene/main.js',
    'src/views/Research/Deep/main.js',
  ]);
});

test('reachable follows transitive imports, includes the entry, and terminates on cycles', () => {
  const imports = new Map([
    ['main', ['a']],
    ['a', ['b', 'c']],
    ['b', ['a']],
    ['c', ['d']],
    ['d', []],
    ['orphan', ['d']],
  ]);
  assert.deepEqual([...reachable(imports, 'main')].sort(), ['a', 'b', 'c', 'd', 'main']);
  assert.deepEqual([...reachable(imports, 'd')], ['d']);
  assert.deepEqual([...reachable(imports, 'unknown')], ['unknown']);
});

test('findCycles returns each strongly connected component with more than one file', () => {
  assert.deepEqual(findCycles(new Map([['a', ['b']], ['b', ['a']]])), [['a', 'b']]);
  assert.deepEqual(findCycles(new Map([['a', ['b']], ['b', ['c']], ['c', []]])), []);
  assert.deepEqual(findCycles(new Map()), []);
  // a self-import is not a cycle between files
  assert.deepEqual(findCycles(new Map([['a', ['a']]])), []);
});

test('findCycles separates distinct cycles, follows longer loops, and tolerates targets with no entry', () => {
  const edges = new Map([
    ['entry', ['x', 'p']],
    ['x', ['y']],
    ['y', ['z']],
    ['z', ['x', 'leaf']],
    ['p', ['q']],
    ['q', ['p']],
    ['r', new Set(['r', 'entry'])],
  ]);
  assert.deepEqual(findCycles(edges), [
    ['p', 'q'],
    ['x', 'y', 'z'],
  ]);
});

test('scriptSetupFiles lists .vue files with <script setup> or a lang="ts" script, and nothing else', () => {
  const sources = srcs({
    'src/c/Setup.vue': sfc(`const a = 1;`, ' setup'),
    'src/c/Ts.vue': sfc(`export default Vue.component("ts", {});`, ' lang="ts"'),
    'src/c/SetupTs.vue': sfc(`const a = 1;`, ' setup lang="ts"'),
    'src/c/BothBlocks.vue':
      '<template><div/></template>\n<script>\nexport default {};\n</script>\n<script setup lang="ts">\nconst a: number = 1;\n</script>\n',
    'src/c/Plain.vue': sfc(`export default Vue.component("plain", {});`),
    'src/c/NoScript.vue': '<template><div/></template>',
    'src/c/plain.js': `export default {};`,
  });
  assert.deepEqual(
    [...scriptSetupFiles(sources)].sort(),
    ['src/c/BothBlocks.vue', 'src/c/Setup.vue', 'src/c/SetupTs.vue', 'src/c/Ts.vue'],
  );
});

test('readSources reads .vue and .js under <root>/src with forward-slash relative keys, skipping node_modules', () => {
  const root = mkdtempSync(join(tmpdir(), 'component-graph-'));
  try {
    const files = {
      'src/b.js': 'b',
      'src/a.vue': 'a',
      'src/components/deep/C.vue': 'c',
      'src/components/note.txt': 'text',
      'src/components/style.css': 'css',
      'src/node_modules/pkg/index.js': 'skip',
      'src/components/node_modules/pkg/Skip.vue': 'skip',
      'outside.js': 'outside',
      'scripts/tool.js': 'tool',
    };
    for (const [rel, content] of Object.entries(files)) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), content);
    }
    const sources = readSources(root);
    assert.deepEqual([...sources.keys()], ['src/a.vue', 'src/b.js', 'src/components/deep/C.vue']);
    assert.equal(sources.get('src/components/deep/C.vue'), 'c');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
