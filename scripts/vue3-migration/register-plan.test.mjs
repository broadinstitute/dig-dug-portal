import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { analyzeSources, pageEntries, scriptSetupFiles, toKebab } from './component-graph.mjs';
import { planRegistrations, undefinedTags } from './register-plan.mjs';

// ---- planRegistrations: a synthetic graph, no files on disk ------------------------------------

const definition = (file, name) => ({ file, name, kind: 'definition' });
const alias = (file, name, source) => ({ file, name, kind: 'alias', source });
const use = (tag, line = 1) => ({ tag, line });

/** Registrations in the shape `analyzeSources` returns: a map keyed by `toKebab(name)`. */
function registry(...list) {
  const map = new Map();
  for (const registration of list) {
    const key = toKebab(registration.name);
    map.set(key, [...(map.get(key) ?? []), registration]);
  }
  return map;
}

/** `planRegistrations` with plain objects for the maps and arrays for the sets. */
function plan({ uses, registrations = [], imports = {}, pages = [], scriptSetup = [] }) {
  return planRegistrations({
    uses: new Map(Object.entries(uses)),
    registrations: registry(...registrations),
    imports: new Map(Object.entries(imports)),
    pages,
    scriptSetupFiles: new Set(scriptSetup),
  });
}

const PAGE = 'src/views/P/Template.vue';
const COMP_A = 'src/components/CompA.vue';

test('a tag with exactly one definition is registered from that file', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('comp-a', 4)] },
    registrations: [definition(COMP_A, 'comp-a')],
  });
  assert.deepEqual([...edits], [[PAGE, [{ tag: 'comp-a', key: 'CompA', source: '@/components/CompA.vue' }]]]);
  assert.deepEqual(unresolved, []);
});

test('a PascalCase tag finds the registration of its kebab-case name', () => {
  const { edits } = plan({
    uses: { [PAGE]: [use('CompA')] },
    registrations: [definition(COMP_A, 'comp-a')],
  });
  assert.deepEqual(edits.get(PAGE), [{ tag: 'CompA', key: 'CompA', source: '@/components/CompA.vue' }]);
});

test('a tag nothing registers is no-registration, with the tag as the lint rule spelled it and its line', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('center', 9), use('Strong', 12)] },
    registrations: [definition(COMP_A, 'comp-a')],
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [
    { file: PAGE, line: 9, tag: 'center', reason: 'no-registration' },
    { file: PAGE, line: 12, tag: 'Strong', reason: 'no-registration' },
  ]);
});

test('aliases that share one package source register from that package', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('vue-typeahead-bootstrap')] },
    registrations: [
      alias('src/components/GeneSelectPicker.vue', 'vue-typeahead-bootstrap', 'vue-typeahead-bootstrap'),
      alias('src/components/PhenotypePicker.vue', 'vue-typeahead-bootstrap', 'vue-typeahead-bootstrap'),
    ],
  });
  assert.deepEqual(edits.get(PAGE), [
    { tag: 'vue-typeahead-bootstrap', key: 'VueTypeaheadBootstrap', source: 'vue-typeahead-bootstrap' },
  ]);
  assert.deepEqual(unresolved, []);
});

test('an alias with a relative source is resolved against the aliasing file and written as @/ with its extension', () => {
  const sources = new Map([
    ['src/components/picker/Picker.vue', '<script>\nimport Fancy from "../Fancy";\nVue.component("fancy-thing", Fancy);\n</script>'],
    ['src/components/Fancy.vue', '<script>export default {};</script>'],
    [PAGE, '<template><fancy-thing /></template>'],
  ]);
  const { registrations, imports } = analyzeSources(sources);
  const { edits, unresolved } = planRegistrations({
    uses: new Map([[PAGE, [use('fancy-thing', 1)]]]),
    registrations,
    imports,
    pages: [],
    scriptSetupFiles: new Set(),
  });
  assert.deepEqual(edits.get(PAGE), [{ tag: 'fancy-thing', key: 'FancyThing', source: '@/components/Fancy.vue' }]);
  assert.deepEqual(unresolved, []);
});

test('an alias whose source is not imported, or does not resolve to a file, is no-registration', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('local-thing', 2), use('gone-thing', 3)] },
    registrations: [
      alias('src/components/A.vue', 'local-thing', null),
      alias('src/components/B.vue', 'gone-thing', '@/components/Missing.vue'),
    ],
    imports: { 'src/components/A.vue': [], 'src/components/B.vue': [] },
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(
    unresolved.map(({ tag, reason }) => [tag, reason]),
    [['local-thing', 'no-registration'], ['gone-thing', 'no-registration']],
  );
});

test('aliases that disagree on the source are ambiguous, listing the sources', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('multi', 5)] },
    registrations: [alias('src/a.js', 'multi', 'pkg-b'), alias('src/b.js', 'multi', 'pkg-a'), alias('src/c.js', 'multi', 'pkg-b')],
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [{ file: PAGE, line: 5, tag: 'multi', reason: 'ambiguous', candidates: ['pkg-a', 'pkg-b'] }]);
});

test('with one definition the aliases of the same name are ignored', () => {
  const { edits } = plan({
    uses: { [PAGE]: [use('autocomplete')] },
    registrations: [
      definition('src/components/Autocomplete.vue', 'autocomplete'),
      alias('src/components/GeneSelectPicker.vue', 'autocomplete', '@/components/Autocomplete.vue'),
    ],
  });
  assert.deepEqual(edits.get(PAGE), [{ tag: 'autocomplete', key: 'Autocomplete', source: '@/components/Autocomplete.vue' }]);
});

const DUP_X = 'src/components/x/DownloadChart.vue';
const DUP_Y = 'src/components/y/DownloadChart.vue';
const dupes = [definition(DUP_X, 'download-chart'), definition(DUP_Y, 'download-chart')];

test('a duplicate name is settled when every page that reaches the file reaches the same one candidate', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('download-chart')] },
    registrations: dupes,
    imports: {
      'src/views/P/main.js': [PAGE, DUP_X],
      'src/views/Q/main.js': [PAGE, DUP_X],
      'src/views/R/main.js': [DUP_Y], // does not reach PAGE, so it is no evidence
    },
    pages: ['src/views/P/main.js', 'src/views/Q/main.js', 'src/views/R/main.js'],
  });
  assert.deepEqual(edits.get(PAGE), [{ tag: 'download-chart', key: 'DownloadChart', source: '@/components/x/DownloadChart.vue' }]);
  assert.deepEqual(unresolved, []);
});

test('a duplicate name stays ambiguous when two pages that reach the file reach different candidates', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('download-chart', 8)] },
    registrations: [dupes[1], dupes[0]],
    imports: { 'src/views/P/main.js': [PAGE, DUP_X], 'src/views/Q/main.js': [PAGE, DUP_Y] },
    pages: ['src/views/P/main.js', 'src/views/Q/main.js'],
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [
    { file: PAGE, line: 8, tag: 'download-chart', reason: 'ambiguous', candidates: [DUP_X, DUP_Y] },
  ]);
});

test('a duplicate name stays ambiguous when a page reaches both candidates, or neither', () => {
  for (const reached of [[DUP_X, DUP_Y], []]) {
    const { edits, unresolved } = plan({
      uses: { [PAGE]: [use('download-chart')] },
      registrations: dupes,
      imports: { 'src/views/P/main.js': [PAGE, ...reached] },
      pages: ['src/views/P/main.js'],
    });
    assert.equal(edits.size, 0);
    assert.deepEqual(
      unresolved.map(({ reason, candidates }) => [reason, candidates]),
      [['ambiguous', [DUP_X, DUP_Y]]],
    );
  }
});

test('a duplicate name is ambiguous when no page reaches the using file, because there is no evidence', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('download-chart')] },
    registrations: dupes,
    imports: { 'src/views/P/main.js': [DUP_X] },
    pages: ['src/views/P/main.js'],
  });
  assert.equal(edits.size, 0);
  assert.equal(unresolved[0].reason, 'ambiguous');
  assert.deepEqual(unresolved[0].candidates, [DUP_X, DUP_Y]);
});

test('a file that uses the tag of its own definition is self', () => {
  const { edits, unresolved } = plan({
    uses: { [COMP_A]: [use('comp-a', 21)] },
    registrations: [definition(COMP_A, 'comp-a')],
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [{ file: COMP_A, line: 21, tag: 'comp-a', reason: 'self' }]);
});

test('self is decided before script-setup, and a duplicate name is ambiguous before it is self', () => {
  const self = plan({
    uses: { [COMP_A]: [use('comp-a')] },
    registrations: [definition(COMP_A, 'comp-a')],
    scriptSetup: [COMP_A],
  });
  assert.equal(self.unresolved[0].reason, 'self');

  const ambiguous = plan({
    uses: { [DUP_X]: [use('download-chart')] },
    registrations: dupes,
    scriptSetup: [DUP_X],
  });
  assert.equal(ambiguous.unresolved[0].reason, 'ambiguous');
});

test('a file with <script setup> or lang="ts" gets no edit and is script-setup', () => {
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('comp-a', 6)] },
    registrations: [definition(COMP_A, 'comp-a')],
    scriptSetup: [PAGE],
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [{ file: PAGE, line: 6, tag: 'comp-a', reason: 'script-setup' }]);
});

test('an edge that closes a cycle with an existing import is dropped as cycle', () => {
  const panel = 'src/components/Panel.vue';
  const table = 'src/components/Table.vue';
  const { edits, unresolved } = plan({
    uses: { [table]: [use('panel-comp', 7)] },
    registrations: [definition(panel, 'panel-comp')],
    imports: { [panel]: [table], [table]: [] },
  });
  assert.equal(edits.size, 0);
  assert.deepEqual(unresolved, [{ file: table, line: 7, tag: 'panel-comp', reason: 'cycle' }]);
});

test('an indirect import path back to the file is a cycle too', () => {
  const [a, b, c] = ['src/components/A.vue', 'src/components/B.vue', 'src/components/C.vue'];
  const { unresolved } = plan({
    uses: { [c]: [use('a-comp')] },
    registrations: [definition(a, 'a-comp')],
    imports: { [a]: [b], [b]: [c], [c]: [] },
  });
  assert.deepEqual(unresolved.map(({ reason }) => reason), ['cycle']);
});

test('planned edges count: of two registrations that would loop, the first in file order is kept', () => {
  const [a, b] = ['src/components/A.vue', 'src/components/B.vue'];
  const input = {
    uses: { [b]: [use('a-comp', 2)], [a]: [use('b-comp', 3)] }, // deliberately not in sorted order
    registrations: [definition(a, 'a-comp'), definition(b, 'b-comp')],
  };
  const { edits, unresolved } = plan(input);
  assert.deepEqual([...edits], [[a, [{ tag: 'b-comp', key: 'BComp', source: '@/components/B.vue' }]]]);
  assert.deepEqual(unresolved, [{ file: b, line: 2, tag: 'a-comp', reason: 'cycle' }]);
});

test('registering a file that already imports the target is not a cycle unless the target imports back', () => {
  const [a, b] = ['src/components/A.vue', 'src/components/B.vue'];
  const oneWay = plan({
    uses: { [a]: [use('b-comp')] },
    registrations: [definition(b, 'b-comp')],
    imports: { [a]: [b], [b]: [] },
  });
  assert.equal(oneWay.edits.get(a).length, 1);

  // Both files already import each other: reading B while A loads may see it unfinished, so it stays a cycle.
  const loop = plan({
    uses: { [a]: [use('b-comp')] },
    registrations: [definition(b, 'b-comp')],
    imports: { [a]: [b], [b]: [a] },
  });
  assert.deepEqual(loop.unresolved.map(({ reason }) => reason), ['cycle']);
});

test('a package registration adds no edge, so it never closes a cycle', () => {
  const { edits } = plan({
    uses: { [PAGE]: [use('vue-typeahead-bootstrap')] },
    registrations: [alias(PAGE, 'vue-typeahead-bootstrap', 'vue-typeahead-bootstrap')],
    imports: { [PAGE]: [] },
  });
  assert.equal(edits.get(PAGE).length, 1);
});

test('<a-b> and <AB> in one file give one entry; entries are sorted by key; every finding of an unresolved tag is listed', () => {
  const ab = 'src/components/AB.vue';
  const zeta = 'src/components/Zeta.vue';
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('zeta-comp', 1), use('a-b', 2), use('AB', 3), use('zeta-comp', 4), use('missing-x', 5), use('missing-x', 6)] },
    registrations: [definition(zeta, 'zeta-comp'), definition(ab, 'a-b')],
  });
  assert.deepEqual(edits.get(PAGE), [
    { tag: 'a-b', key: 'AB', source: '@/components/AB.vue' },
    { tag: 'zeta-comp', key: 'ZetaComp', source: '@/components/Zeta.vue' },
  ]);
  assert.deepEqual(unresolved, [
    { file: PAGE, line: 5, tag: 'missing-x', reason: 'no-registration' },
    { file: PAGE, line: 6, tag: 'missing-x', reason: 'no-registration' },
  ]);
});

test('files with nothing to register are left out of edits; edits and unresolved come out in sorted order', () => {
  const other = 'src/views/O/Template.vue';
  const { edits, unresolved } = plan({
    uses: { [PAGE]: [use('nothing-here', 2)], [other]: [use('comp-a', 9), use('nothing-here', 3)] },
    registrations: [definition(COMP_A, 'comp-a')],
  });
  assert.deepEqual([...edits.keys()], [other]);
  assert.deepEqual(
    unresolved.map(({ file, line }) => [file, line]),
    [[other, 3], [PAGE, 2]],
  );
});

test('the plan does not depend on input order and does not change its inputs', () => {
  const inputs = () => ({
    uses: new Map([
      ['src/views/B/Template.vue', [use('comp-a', 3), use('download-chart', 4), use('center', 5)]],
      ['src/views/A/Template.vue', [use('comp-a', 2), use('download-chart', 1)]],
      [COMP_A, [use('comp-a', 8)]],
    ]),
    registrations: registry(definition(COMP_A, 'comp-a'), ...dupes),
    imports: new Map([
      ['src/views/A/main.js', ['src/views/A/Template.vue', DUP_X]],
      ['src/views/B/main.js', ['src/views/B/Template.vue', DUP_Y]],
    ]),
    pages: ['src/views/A/main.js', 'src/views/B/main.js'],
    scriptSetupFiles: new Set(),
  });
  const first = inputs();
  const before = JSON.stringify([...first.uses, [...first.registrations], [...first.imports]]);
  const result = planRegistrations(first);
  assert.equal(JSON.stringify([...first.uses, [...first.registrations], [...first.imports]]), before);

  const shuffled = inputs();
  shuffled.uses = new Map([...shuffled.uses].reverse().map(([file, found]) => [file, [...found].reverse()]));
  shuffled.pages.reverse();
  const again = planRegistrations(shuffled);
  assert.deepEqual([...again.edits], [...result.edits]);
  assert.deepEqual(again.unresolved, result.unresolved);
  assert.deepEqual(planRegistrations(inputs()), result);
});

test('planRegistrations works on the output of analyzeSources, pageEntries and scriptSetupFiles', () => {
  const sources = new Map([
    ['src/views/P/main.js', 'import Template from "./Template.vue";\nimport "@/components/Grid.vue";\nimport "@/components/Chart.vue";'],
    ['src/views/P/Template.vue', '<template><div><grid-comp /><chart-comp /></div></template>'],
    ['src/components/Grid.vue', '<template><chart-comp /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("grid-comp", {});\n</script>'],
    ['src/components/Chart.vue', '<script>\nimport Vue from "vue";\nexport default Vue.component("chart-comp", {});\n</script>'],
    ['src/components/Setup.vue', '<script setup>\nconst a = 1;\n</script>\n<template><grid-comp /></template>'],
  ]);
  const { registrations, imports } = analyzeSources(sources);
  const { edits, unresolved } = planRegistrations({
    uses: new Map([
      ['src/views/P/Template.vue', [use('grid-comp', 1), use('chart-comp', 1)]],
      ['src/components/Grid.vue', [use('chart-comp', 1)]],
      ['src/components/Setup.vue', [use('grid-comp', 5)]],
    ]),
    registrations,
    imports,
    pages: pageEntries(sources),
    scriptSetupFiles: scriptSetupFiles(sources),
  });
  assert.deepEqual([...edits.keys()], ['src/components/Grid.vue', 'src/views/P/Template.vue']);
  assert.deepEqual(edits.get('src/components/Grid.vue'), [{ tag: 'chart-comp', key: 'ChartComp', source: '@/components/Chart.vue' }]);
  assert.deepEqual(
    edits.get('src/views/P/Template.vue').map(({ key }) => key),
    ['ChartComp', 'GridComp'],
  );
  assert.deepEqual(unresolved, [{ file: 'src/components/Setup.vue', line: 5, tag: 'grid-comp', reason: 'script-setup' }]);
});

// ---- undefinedTags: ESLint against a temporary root ---------------------------------------------

/** Writes `files` (path -> text) under a fresh temp root, runs `run(root)`, and always removes the root. */
async function withRoot(files, run) {
  const root = mkdtempSync(join(tmpdir(), 'register-plan-'));
  try {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), text);
    }
    return await run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const COMPONENT = '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("my-thing", {});\n</script>\n';

test('undefinedTags reports a tag no component registers locally, with its line, keyed by the file relative to root', async () => {
  const found = await withRoot(
    {
      'src/views/P/Template.vue': '<template>\n  <div>\n    <my-thing />\n  </div>\n</template>\n',
      'src/components/MyThing.vue': COMPONENT,
    },
    undefinedTags,
  );
  assert.deepEqual([...found], [['src/views/P/Template.vue', [{ tag: 'my-thing', line: 3 }]]]);
});

test('undefinedTags names each tag the way the template writes it, and lists every use', async () => {
  const found = await withRoot(
    {
      'src/views/P/Template.vue':
        '<template>\n  <div>\n    <MyThing />\n    <my-thing />\n    <b-button />\n    <BModal />\n    <span />\n  </div>\n</template>\n',
    },
    undefinedTags,
  );
  assert.deepEqual(found.get('src/views/P/Template.vue'), [
    { tag: 'MyThing', line: 3 },
    { tag: 'my-thing', line: 4 },
  ]);
});

test('undefinedTags leaves out tags the file registers, and honours eslint-disable comments in templates', async () => {
  const found = await withRoot(
    {
      'src/components/Local.vue':
        '<template><my-thing /></template>\n<script>\nimport MyThing from "./MyThing.vue";\nexport default { components: { MyThing } };\n</script>\n',
      'src/components/MyThing.vue': COMPONENT,
      'src/views/P/Template.vue':
        '<template>\n  <div>\n    <!-- eslint-disable-next-line vue/no-undef-components -- obsolete element -->\n    <center />\n    <other-thing />\n  </div>\n</template>\n',
    },
    undefinedTags,
  );
  assert.deepEqual([...found], [['src/views/P/Template.vue', [{ tag: 'other-thing', line: 5 }]]]);
});

test('undefinedTags reports only vue/no-undef-components: other migration rules stay silent', async () => {
  const found = await withRoot(
    {
      // vue/no-use-v-if-with-v-for and vue/require-explicit-emits are errors in the ratchet config.
      'src/components/Other.vue':
        '<template>\n  <ul><li v-for="x in xs" v-if="x" @go="$emit(\'go\')">{{ x }}</li></ul>\n</template>\n<script>\nexport default { props: ["xs"] };\n</script>\n',
    },
    undefinedTags,
  );
  assert.equal(found.size, 0);
});

test('undefinedTags fails loudly, naming the file, when a file does not parse', async () => {
  await withRoot({ 'src/components/Broken.vue': '<template><div /></template>\n<script>\nexport default {\n</script>\n' }, async (root) => {
    await assert.rejects(undefinedTags(root), /src\/components\/Broken\.vue/);
  });
});
