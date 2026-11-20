import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { run, unwrapSource } from './unwrap-vue-component.mjs';

/** Source text from lines: every file in this test ends with a newline. */
const text = (...lines) => `${lines.join('\n')}\n`;
const crlf = (source) => source.replace(/\n/g, '\r\n');

/** A `.vue` file whose `<script>` is `script`. */
const sfc = (script) => `<template><div /></template>\n<script>\n${script}</script>\n`;

const FILE = 'src/components/Thing.vue';

/** Unwraps `script` (the text of a `<script>`) and checks that unwrapping the result again changes nothing. */
function unwrap(script, file = FILE) {
  const result = unwrapSource(sfc(script), file);
  const again = unwrapSource(result.source, file);
  assert.equal(again.changed, false, 'a second run changes nothing');
  assert.equal(again.source, result.source);
  return { ...result, script: result.source.slice('<template><div /></template>\n<script>\n'.length, -'</script>\n'.length) };
}

// ---- unwrapSource: the wrapper -----------------------------------------------------------------

test('export default Vue.component("name", {...}) becomes export default {...} with the name as the first property', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      'import A from "@/components/A.vue";',
      '',
      'export default Vue.component("my-comp", {',
      '    components: { A },',
      '    props: ["x"],',
      '});',
    ),
  );
  assert.equal(
    result.script,
    text('import A from "@/components/A.vue";', '', 'export default {', '    name: "my-comp",', '    components: { A },', '    props: ["x"],', '};'),
  );
  assert.equal(result.changed, true);
  assert.deepEqual(result.notes, []);
  assert.deepEqual(result.counts, { unwrapped: 1, namesInserted: 1, aliasesRemoved: 0, importsRemoved: 1 });
});

test('single quotes are read, and the inserted name uses double quotes', () => {
  const result = unwrap(text("import Vue from 'vue';", "export default Vue.component('sq-comp', {", "    props: ['x'],", '});'));
  assert.equal(result.script, text('export default {', '    name: "sq-comp",', "    props: ['x'],", '};'));
});

test('a call split across lines: the wrapper goes and the closing paren with it', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      '',
      'export default Vue.component(',
      '    "split-comp",',
      '    {',
      '        data() {',
      '            return {};',
      '        },',
      '    }',
      ');',
    ),
  );
  // Nothing outside the wrapper is re-indented: the object keeps the lines it had.
  assert.equal(
    result.script,
    text('', 'export default {', '        name: "split-comp",', '        data() {', '            return {};', '        },', '    };'),
  );
});

for (const [label, tail, expected] of [
  ['`);` on its own line', ['}', ');'], ['};']],
  ['a trailing comma and `);` on its own line', ['},', ');'], ['};']],
  ['`)` and `;` on lines of their own', ['}', ')', ';'], ['}', ';']],
]) {
  test(`the closing paren goes with ${label}`, () => {
    const result = unwrap(text('export default Vue.component("tail-comp", {', '    props: ["x"],', ...tail));
    assert.equal(result.script, text('export default {', '    name: "tail-comp",', '    props: ["x"],', ...expected));
  });
}

test('a call with no semicolon after it', () => {
  const result = unwrap(text('export default Vue.component("asi", {', '    props: [],', '})'));
  assert.equal(result.script, text('export default {', '    name: "asi",', '    props: [],', '}'));
});

test('an empty options object gets the name on a line of its own', () => {
  const result = unwrap(text('import Vue from "vue";', '', 'export default Vue.component("ga-errors", {});'));
  assert.equal(result.script, text('', 'export default {', '    name: "ga-errors",', '};'));
  assert.equal(unwrap(text('export default Vue.component("empty", { })')).script, text('export default {', '    name: "empty",', '}'));
});

test('the inserted name follows the file own indentation: a tab, an indented script, a comment after the brace', () => {
  assert.equal(
    unwrap(text('export default Vue.component("tabbed", {', '\tprops: [],', '});')).script,
    text('export default {', '\tname: "tabbed",', '\tprops: [],', '};'),
  );
  assert.equal(
    unwrap(text('    export default Vue.component("indented", {', '        props: [],', '    });')).script,
    text('    export default {', '        name: "indented",', '        props: [],', '    };'),
  );
  assert.equal(
    unwrap(text('export default Vue.component("c", { // the options', '    props: [],', '});')).script,
    text('export default { // the options', '    name: "c",', '    props: [],', '};'),
  );
});

test('an empty options object in a tab-indented file gets a tab', () => {
  assert.equal(
    unwrap(text('\texport default Vue.component("tabbed-empty", {});')).script,
    text('\texport default {', '\t\tname: "tabbed-empty",', '\t};'),
  );
});

test('line endings are kept: CRLF in, CRLF out, including the inserted line', () => {
  const input = crlf(sfc(text('import Vue from "vue";', 'export default Vue.component("crlf", {', '    props: [],', '});')));
  const result = unwrapSource(input, FILE);
  assert.equal(result.source, crlf(sfc(text('export default {', '    name: "crlf",', '    props: [],', '};'))));
  assert.doesNotMatch(result.source.replace(/\r\n/g, ''), /[\r\n]/);
});

test('everything outside the script is kept as it was', () => {
  const input = [
    '<template>',
    '  <div class="a">   {{ x }}  </div>',
    '</template>',
    '',
    '<script>',
    'import Vue from "vue";',
    'export default Vue.component("keep", { props: ["x"] });',
    '</script>',
    '',
    '<style scoped>',
    '.a { color: red; }',
    '</style>',
    '',
  ].join('\n');
  const result = unwrapSource(input, FILE);
  assert.equal(result.changed, true);
  assert.ok(result.source.startsWith('<template>\n  <div class="a">   {{ x }}  </div>\n</template>\n\n<script>\n'));
  assert.ok(result.source.endsWith('</script>\n\n<style scoped>\n.a { color: red; }\n</style>\n'));
});

test('a plain .js file is unwrapped the same way', () => {
  const result = unwrapSource(text('import Vue from "vue";', 'export default Vue.component("js-comp", {', '    props: [],', '});'), 'src/components/x.js');
  assert.equal(result.source, text('export default {', '    name: "js-comp",', '    props: [],', '};'));
});

// ---- unwrapSource: the name rule -----------------------------------------------------------------

test('an existing name that equals the id is left alone, and nothing is noted', () => {
  const result = unwrap(text('export default Vue.component("same-name", {', '    name: "same-name",', '    props: [],', '});'));
  assert.equal(result.script, text('export default {', '    name: "same-name",', '    props: [],', '};'));
  assert.deepEqual(result.notes, []);
  assert.equal(result.counts.namesInserted, 0);
});

test('an existing name that differs is kept, and noted as name-mismatch', () => {
  const result = unwrap(text('export default Vue.component("kc-logo", {', '    name: "KcLogo",', '});'));
  assert.equal(result.script, text('export default {', '    name: "KcLogo",', '};'));
  assert.deepEqual(result.notes, ['name-mismatch']);
  assert.equal(result.counts.namesInserted, 0);
});

test('a name key written as a string, or a name that is not a string literal, is still the existing name', () => {
  const quoted = unwrap(text('export default Vue.component("a-b", {', '    "name": "A-B",', '});'));
  assert.equal(quoted.script, text('export default {', '    "name": "A-B",', '};'));
  assert.deepEqual(quoted.notes, ['name-mismatch']);
  // The planner cannot tell that a name read from a constant equals the id, so it keeps it and says so.
  const dynamic = unwrap(text('const NAME = "a-b";', 'export default Vue.component("a-b", {', '    name: NAME,', '});'));
  assert.equal(dynamic.script, text('const NAME = "a-b";', 'export default {', '    name: NAME,', '};'));
  assert.deepEqual(dynamic.notes, ['name-mismatch']);
});

// ---- unwrapSource: alias statements ------------------------------------------------------------------

test('alias statements are removed with their line break, and the Vue import with them', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      'import Typeahead from "vue-typeahead-bootstrap";',
      'import Autocomplete from "@/components/Autocomplete.vue";',
      '',
      'Vue.component("vue-typeahead-bootstrap", Typeahead);',
      "Vue.component('autocomplete', Autocomplete)",
      '',
      'export default {',
      '    components: { Typeahead, Autocomplete },',
      '};',
    ),
  );
  assert.equal(
    result.script,
    text(
      'import Typeahead from "vue-typeahead-bootstrap";',
      'import Autocomplete from "@/components/Autocomplete.vue";',
      '',
      '',
      'export default {',
      '    components: { Typeahead, Autocomplete },',
      '};',
    ),
  );
  assert.deepEqual(result.counts, { unwrapped: 0, namesInserted: 0, aliasesRemoved: 2, importsRemoved: 1 });
  assert.deepEqual(result.notes, []);
});

test('an indented alias statement is removed whole; one that shares its line is removed alone', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      'import Typeahead from "vue-typeahead-bootstrap";',
      '    Vue.component("a", Typeahead);',
      'const x = 1; Vue.component("b", Typeahead); const y = 2;',
      'export default { components: { Typeahead }, x, y };',
    ),
  );
  assert.equal(
    result.script,
    text('import Typeahead from "vue-typeahead-bootstrap";', 'const x = 1;  const y = 2;', 'export default { components: { Typeahead }, x, y };'),
  );
});

test('an alias whose result is used is left alone and noted as alias-in-use; Vue is still referenced, so the import stays', () => {
  for (const script of [
    text('import Vue from "vue";', 'import Foo from "./Foo.vue";', '', 'export default Vue.component("foo", Foo);'),
    text('import Vue from "vue";', 'import Foo from "./Foo.vue";', '', 'const Registered = Vue.component("foo", Foo);', 'export default {};'),
    text('import Vue from "vue";', 'import Foo from "./Foo.vue";', '', 'export default {', '    created() {', '        Vue.component("foo", Foo);', '    },', '};'),
  ]) {
    const result = unwrap(script);
    assert.equal(result.changed, false);
    assert.equal(result.source, sfc(script));
    assert.deepEqual(result.notes, ['alias-in-use']);
  }
});

test('an alias in use and an alias that can go: only the second is removed, and the import stays', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      'import Foo from "./Foo.vue";',
      'import Bar from "./Bar.vue";',
      '',
      'Vue.component("bar", Bar);',
      'export default Vue.component("foo", Foo);',
    ),
  );
  assert.equal(
    result.script,
    text('import Vue from "vue";', 'import Foo from "./Foo.vue";', 'import Bar from "./Bar.vue";', '', 'export default Vue.component("foo", Foo);'),
  );
  assert.deepEqual(result.notes, ['alias-in-use']);
  assert.equal(result.counts.aliasesRemoved, 1);
});

test('notes come one per occurrence, in source order', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      'import Foo from "./Foo.vue";',
      'const A = Vue.component("a", Foo);',
      'const B = Vue.component("b", Foo);',
      'export default Vue.component("c", {',
      '    name: "C",',
      '});',
    ),
  );
  assert.deepEqual(result.notes, ['alias-in-use', 'alias-in-use', 'name-mismatch']);
});

// ---- unwrapSource: the Vue import --------------------------------------------------------------------

test('Vue is still used (Vue.set), so the import stays', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      '',
      'export default Vue.component("picker", {',
      '    methods: {',
      '        add(key) {',
      '            Vue.set(this.items, key, true);',
      '        },',
      '    },',
      '});',
    ),
  );
  assert.equal(
    result.script,
    text(
      'import Vue from "vue";',
      '',
      'export default {',
      '    name: "picker",',
      '    methods: {',
      '        add(key) {',
      '            Vue.set(this.items, key, true);',
      '        },',
      '    },',
      '};',
    ),
  );
  assert.equal(result.counts.importsRemoved, 0);
});

for (const [label, use] of [
  ['a call', 'Vue.nextTick(() => {});'],
  ['new Vue', 'const vm = new Vue({});'],
  ['a shorthand property', 'const registry = { Vue };'],
  ['an export', 'export const Ctor = Vue;'],
  ['an argument', 'register(Vue);'],
  ['a computed key', 'const m = { [Vue.name]: 1 };'],
]) {
  test(`Vue used as ${label} keeps the import`, () => {
    const result = unwrap(text('import Vue from "vue";', use, 'export default Vue.component("x", {', '    props: [],', '});'));
    assert.equal(result.script, text('import Vue from "vue";', use, 'export default {', '    name: "x",', '    props: [],', '};'));
  });
}

test('Vue mentioned in a comment, a string, a property name or as a property is not a use: the import goes', () => {
  const result = unwrap(
    text(
      'import Vue from "vue";',
      '',
      '// Vue.set is not used here, and neither is "Vue.nextTick"',
      'export default Vue.component("plain", {',
      '    data() {',
      '        return { Vue: "a string key", note: "Vue.delete" };',
      '    },',
      '    methods: {',
      '        show() {',
      '            return this.Vue;',
      '        },',
      '        Vue() {},',
      '    },',
      '});',
    ),
  );
  assert.equal(
    result.script,
    text(
      '',
      '// Vue.set is not used here, and neither is "Vue.nextTick"',
      'export default {',
      '    name: "plain",',
      '    data() {',
      '        return { Vue: "a string key", note: "Vue.delete" };',
      '    },',
      '    methods: {',
      '        show() {',
      '            return this.Vue;',
      '        },',
      '        Vue() {},',
      '    },',
      '};',
    ),
  );
  assert.equal(result.counts.importsRemoved, 1);
});

test('import Vue, { x } from "vue": only the default specifier goes when Vue is not used any more', () => {
  const result = unwrap(
    text(
      "import Vue, { shallowRef } from 'vue';",
      '',
      "export default Vue.component('browser', {",
      '    data() {',
      '        return { ref: shallowRef(null) };',
      '    },',
      '});',
    ),
  );
  assert.equal(
    result.script,
    text("import { shallowRef } from 'vue';", '', 'export default {', '    name: "browser",', '    data() {', '        return { ref: shallowRef(null) };', '    },', '};'),
  );
  assert.equal(result.counts.importsRemoved, 1);
});

test('import Vue, { x } from "vue" stays whole while Vue is used', () => {
  const result = unwrap(
    text(
      "import Vue, { shallowRef } from 'vue';",
      '',
      "export default Vue.component('browser', {",
      '    async load() {',
      '        await Vue.nextTick();',
      '        return shallowRef(null);',
      '    },',
      '});',
    ),
  );
  assert.equal(
    result.script,
    text("import Vue, { shallowRef } from 'vue';", '', 'export default {', '    name: "browser",', '    async load() {', '        await Vue.nextTick();', '        return shallowRef(null);', '    },', '};'),
  );
});

test('import Vue, * as ns from "vue" keeps the namespace', () => {
  const result = unwrap(text('import Vue, * as ns from "vue";', 'export default Vue.component("x", {', '    data: () => ns.ref(),', '});'));
  assert.equal(result.script, text('import * as ns from "vue";', 'export default {', '    name: "x",', '    data: () => ns.ref(),', '};'));
});

test('an import of Vue from somewhere other than "vue" is not touched', () => {
  const result = unwrap(text('import Vue from "vue/dist/vue.esm";', 'export default Vue.component("x", {', '    props: [],', '});'));
  assert.equal(result.script, text('import Vue from "vue/dist/vue.esm";', 'export default {', '    name: "x",', '    props: [],', '};'));
});

test('a file with nothing to unwrap keeps its Vue import, however unused', () => {
  const input = sfc(text('import Vue from "vue";', 'export default { name: "plain" };'));
  assert.deepEqual(unwrapSource(input, FILE), { source: input, changed: false, notes: [], counts: { unwrapped: 0, namesInserted: 0, aliasesRemoved: 0, importsRemoved: 0 } });
});

// ---- unwrapSource: files it leaves alone, and shapes it will not guess at -----------------------------

test('a file without Vue.component is returned as it is, even when its script does not parse', () => {
  const broken = sfc(text('export default {'));
  assert.equal(unwrapSource(broken, FILE).source, broken);
  assert.equal(unwrapSource(broken, FILE).changed, false);
});

test('Vue.component("name") only looks a component up: it is not a registration and Vue is still used', () => {
  const script = text('import Vue from "vue";', 'const Known = Vue.component("known");', 'export default { components: { Known } };');
  const result = unwrap(script);
  assert.equal(result.changed, false);
  assert.equal(result.source, sfc(script));
  assert.deepEqual(result.notes, []);
});

for (const [label, script, pattern] of [
  ['a comment inside the call', text('export default Vue.component(/* the id */ "x", {', '    props: [],', '});'), /comment/],
  ['a comment after the options', text('export default Vue.component("x", {', '    props: [],', '} /* end */);'), /comment/],
  ['a definition that is not exported', text('Vue.component("x", {', '    props: [],', '});', 'export default {};'), /export default/],
  ['a call with a third argument', text('export default Vue.component("x", {}, true);'), /Vue\.component/],
  ['a name that is not a string literal', text('const id = "x";', 'export default Vue.component(id, {});'), /Vue\.component/],
  ['a script that does not parse', text('export default Vue.component("x", {'), /does not parse/],
]) {
  test(`${label} is refused with the file name in the message`, () => {
    assert.throws(() => unwrapSource(sfc(script), FILE), (error) => error.message.startsWith(`${FILE}: `) && pattern.test(error.message));
  });
}

test('a <script setup> block, a second <script> block and a src script are refused', () => {
  const call = 'Vue.component("x", {});';
  assert.throws(() => unwrapSource(`<template><div /></template>\n<script setup>\n${call}\n</script>\n`, FILE), /script setup/);
  assert.throws(() => unwrapSource(`<script>\nexport const a = 1;\n</script>\n<script>\nexport default ${call}\n</script>\n`, FILE), /more than one <script>/);
  assert.throws(() => unwrapSource(`<script src="./x.js"></script>\n<!-- ${call} -->\n`, FILE), /<script src/);
});

// ---- run ---------------------------------------------------------------------------------------------
// The tree is a finished phase 1: a page (`P`) whose template uses <comp-a> and <comp-b>, which it
// registers itself; A is `Vue.component("comp-a", ...)` and uses <comp-b>; B's name differs from its id; a
// picker aliases a package component; and TreeNode uses itself, which is the one undefined tag left.

const MAIN = text('import Vue from "vue";', 'import Template from "./Template.vue";', 'new Vue({ render: (h) => h(Template) }).$mount("#app");');
const TEMPLATE = text(
  '<template>',
  '  <div>',
  '    <comp-a />',
  '    <comp-b />',
  '  </div>',
  '</template>',
  '<script>',
  'import CompA from "@/components/A.vue";',
  'import CompB from "@/components/B.vue";',
  'export default {',
  '    name: "Template",',
  '    components: { CompA, CompB },',
  '};',
  '</script>',
);
const COMP_A = text(
  '<template>',
  '  <div>',
  '    <comp-b />',
  '  </div>',
  '</template>',
  '<script>',
  'import Vue from "vue";',
  'import CompB from "@/components/B.vue";',
  'export default Vue.component("comp-a", {',
  '    components: { CompB },',
  '});',
  '</script>',
);
const COMP_B = text(
  '<template><div /></template>',
  '<script>',
  'import Vue from "vue";',
  'export default Vue.component("comp-b", {',
  '    name: "CompB",',
  '});',
  '</script>',
);
const PICKER = text(
  '<template><div /></template>',
  '<script>',
  'import Vue from "vue";',
  'import Typeahead from "vue-typeahead-bootstrap";',
  '',
  'Vue.component("vue-typeahead-bootstrap", Typeahead);',
  '',
  'export default Vue.component("picker", {',
  '    components: { Typeahead },',
  '});',
  '</script>',
);
const TREE_NODE = text(
  '<template>',
  '  <div>',
  '    <tree-node v-if="deep" />',
  '  </div>',
  '</template>',
  '<script>',
  'import Vue from "vue";',
  'export default Vue.component("tree-node", {',
  '    props: ["deep"],',
  '});',
  '</script>',
);

const DONE = {
  'src/views/P/main.js': MAIN,
  'src/views/P/Template.vue': TEMPLATE,
  'src/components/A.vue': COMP_A,
  'src/components/B.vue': COMP_B,
  'src/components/Picker.vue': PICKER,
  'src/components/TreeNode.vue': TREE_NODE,
};

/** Writes `files` (path -> text) under a fresh temp root, runs `fn(root)`, and always removes the root. */
async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'unwrap-vue-component-'));
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
  const write = deps.write ?? ((path, contents) => writeFileSync(path, contents));
  const code = await run(['--root', root, ...argv], {
    ...deps,
    out,
    err,
    write: (path, contents) => {
      writes.push(path);
      write(path, contents);
    },
  });
  return { code, out: out.text, err: err.text, writes };
}

/** The lines of one `## ` section of a report. */
const section = (report, heading) => report.split(`## ${heading}\n`)[1].split('\n## ')[0];

test('a dry run writes nothing and reports the totals; a real run writes them; a second run changes nothing', async () => {
  await withRoot(DONE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.deepEqual(dry.writes, []);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    assert.match(dry.out, /^# Unwrap Vue\.component \(dry run\)$/m);
    assert.match(dry.out, /^\| Files to change \| 4 \|$/m);
    assert.match(dry.out, /^\| Components unwrapped \| 4 \|$/m);
    assert.match(dry.out, /^\| Names inserted \| 3 \|$/m);
    assert.match(dry.out, /^\| Alias statements removed \| 1 \|$/m);
    assert.match(dry.out, /^\| Vue imports removed \| 4 \|$/m);
    assert.match(dry.out, /^\| Notes \| 1 \|$/m);
    assert.match(dry.out, /^\| Notes: name-mismatch \| 1 \|$/m);
    assert.doesNotMatch(dry.out, /^\| Notes: alias-in-use /m);
    // The legend under the table names only the notes that occur.
    assert.match(section(dry.out, 'Notes'), /^- name-mismatch: /m);
    assert.doesNotMatch(section(dry.out, 'Notes'), /alias-in-use/);
    assert.match(dry.out, /^\| Undefined-tag findings \| 1 \|$/m);
    assert.match(dry.out, /^\| Not self-references \| 0 \|$/m);
    assert.match(section(dry.out, 'Phase 1 check'), /^Complete: /m);
    assert.deepEqual(
      section(dry.out, 'Files that would change').split('\n').filter(Boolean),
      ['- `src/components/A.vue`', '- `src/components/B.vue`', '- `src/components/Picker.vue`', '- `src/components/TreeNode.vue`'],
    );
    assert.doesNotMatch(dry.out, /^## (Failed|Analysis errors|Lint failed)$/m);
    assert.equal(dry.err, '');

    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.match(real.out, /^# Unwrap Vue\.component$/m);
    assert.match(real.out, /^## Changed files$/m);
    assert.deepEqual(real.writes, ['A', 'B', 'Picker', 'TreeNode'].map((name) => join(root, `src/components/${name}.vue`)));
    assert.equal(
      read(root, 'src/components/A.vue'),
      text('<template>', '  <div>', '    <comp-b />', '  </div>', '</template>', '<script>', 'import CompB from "@/components/B.vue";', 'export default {', '    name: "comp-a",', '    components: { CompB },', '};', '</script>'),
    );
    assert.equal(
      read(root, 'src/components/B.vue'),
      text('<template><div /></template>', '<script>', 'export default {', '    name: "CompB",', '};', '</script>'),
    );
    assert.equal(
      read(root, 'src/components/Picker.vue'),
      text('<template><div /></template>', '<script>', 'import Typeahead from "vue-typeahead-bootstrap";', '', '', 'export default {', '    name: "picker",', '    components: { Typeahead },', '};', '</script>'),
    );
    assert.equal(read(root, 'src/views/P/Template.vue'), TEMPLATE);
    assert.equal(read(root, 'src/views/P/main.js'), MAIN);

    const again = await cli(root);
    assert.equal(again.code, 0);
    assert.deepEqual(again.writes, []);
    assert.match(again.out, /^\| Files to change \| 0 \|$/m);
    assert.match(again.out, /^\| Components unwrapped \| 0 \|$/m);
    assert.match(again.out, /^\| Notes \| 0 \|$/m);
    assert.match(section(again.out, 'Changed files'), /None\./);
  });
});

test('every file of src is offered to unwrap with its path relative to the root', async () => {
  await withRoot(DONE, async (root) => {
    const files = [];
    await cli(root, ['--dry-run'], {
      unwrap: (source, file) => {
        files.push(file);
        return unwrapSource(source, file);
      },
    });
    assert.deepEqual(files, [
      'src/components/A.vue',
      'src/components/B.vue',
      'src/components/Picker.vue',
      'src/components/TreeNode.vue',
      'src/views/P/Template.vue',
      'src/views/P/main.js',
    ]);
  });
});

test('the same input gives byte-identical output', async () => {
  await withRoot(DONE, async (root) => {
    const first = await cli(root, ['--dry-run']);
    const second = await cli(root, ['--dry-run']);
    assert.equal(first.out, second.out);
  });
});

test('notes are listed per file, with a count, sorted by file; they stay in the report on later runs while the cause remains', async () => {
  const FOO = text('<template><div /></template>', '<script>', 'import Vue from "vue";', 'import Foo from "./Foo.vue";', 'const A = Vue.component("a", Foo);', 'const B = Vue.component("b", Foo);', 'export default {};', '</script>');
  await withRoot({ ...DONE, 'src/components/Foo.vue': FOO }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.match(dry.out, /^\| Notes \| 3 \|$/m);
    assert.match(dry.out, /^\| Notes: name-mismatch \| 1 \|$/m);
    assert.match(dry.out, /^\| Notes: alias-in-use \| 2 \|$/m);
    assert.deepEqual(
      section(dry.out, 'Notes').split('\n').filter((line) => line.startsWith('| `')),
      ['| `src/components/B.vue` | name-mismatch | 1 |', '| `src/components/Foo.vue` | alias-in-use | 2 |'],
    );
    assert.match(section(dry.out, 'Notes'), /^\| file \| note \| count \|$/m);
    assert.match(section(dry.out, 'Notes'), /^- name-mismatch: .*$/m);
    assert.match(section(dry.out, 'Notes'), /^- alias-in-use: .*$/m);
    // Foo.vue has nothing to change, so it is not written; its notes stay.
    assert.doesNotMatch(section(dry.out, 'Files that would change'), /Foo\.vue/);
    await cli(root);
    const again = await cli(root, ['--dry-run']);
    assert.match(again.out, /^\| Notes \| 2 \|$/m);
    assert.deepEqual(section(again.out, 'Notes').split('\n').filter((line) => line.startsWith('| `')), ['| `src/components/Foo.vue` | alias-in-use | 2 |']);
  });
});

test('with no notes, the Notes section says None', async () => {
  await withRoot({ 'src/views/P/main.js': MAIN, 'src/components/B.vue': COMP_B.replace('    name: "CompB",\n', '') }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(section(dry.out, 'Notes').trim(), 'None.');
  });
});

// ---- ruling R2: phase 1 must be complete -------------------------------------------------------------

// The same tree, but A has not registered <comp-b> yet, and a template uses a tag nothing registers.
const COMP_A_UNDONE = text(
  '<template>',
  '  <div>',
  '    <comp-b />',
  '    <ghost-tag />',
  '  </div>',
  '</template>',
  '<script>',
  'import Vue from "vue";',
  'export default Vue.component("comp-a", {});',
  '</script>',
);
const UNDONE = { ...DONE, 'src/components/A.vue': COMP_A_UNDONE };

test('R2: a dry run prints the full report with the refusal, and exits 1', async () => {
  await withRoot(UNDONE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    // The rest of the report is still there.
    assert.match(dry.out, /^# Unwrap Vue\.component \(dry run\)$/m);
    assert.match(dry.out, /^\| Files to change \| 4 \|$/m);
    assert.match(dry.out, /^## Files that would change$/m);
    assert.match(dry.out, /^\| Undefined-tag findings \| 3 \|$/m);
    assert.match(dry.out, /^\| Not self-references \| 2 \|$/m);
    const check = section(dry.out, 'Phase 1 check');
    assert.match(check, /^Refused: phase 1 is not complete\./m);
    assert.match(check, /^Undefined-tag findings that are not self-references: 2 of 3\.$/m);
    assert.match(check, /A real run would write nothing\./);
    assert.match(check, /^\| `src\/components\/A\.vue:3` \| `comp-b` \| unregistered \|$/m);
    assert.match(check, /^\| `src\/components\/A\.vue:4` \| `ghost-tag` \| no-registration \|$/m);
    assert.doesNotMatch(check, /tree-node/);
    assert.match(dry.err, /phase 1 is not complete/);
  });
});

test('R2: a real run writes nothing, says so in the report and on stderr, and exits 1', async () => {
  await withRoot(UNDONE, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    for (const [file, contents] of Object.entries(UNDONE)) assert.equal(read(root, file), contents, file);
    const check = section(real.out, 'Phase 1 check');
    assert.match(check, /^Refused: phase 1 is not complete\./m);
    assert.match(check, /Nothing was written\./);
    assert.doesNotMatch(check, /A real run would write nothing/);
    assert.match(real.out, /^## Files that would change$/m);
    assert.doesNotMatch(real.out, /^## Changed files$/m);
    assert.match(real.err, /phase 1 is not complete.*nothing was written/);
  });
});

test('R2: a finding that is not a self-reference blocks the run whatever its reason; self-references alone do not', async () => {
  // A tag two files define is ambiguous, which is not a self-reference either.
  const dup = (name) => text('<template><div /></template>', '<script>', 'import Vue from "vue";', `export default Vue.component("dup-comp", { name: "${name}" });`, '</script>');
  const template = TEMPLATE.replace('<comp-b />', '<comp-b />\n    <dup-comp />');
  await withRoot({ ...DONE, 'src/views/P/Template.vue': template, 'src/components/Dup1.vue': dup('One'), 'src/components/Dup2.vue': dup('Two') }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.match(section(dry.out, 'Phase 1 check'), /^\| `src\/views\/P\/Template\.vue:5` \| `dup-comp` \| ambiguous \|$/m);
  });
  await withRoot(DONE, async (root) => {
    assert.equal((await cli(root, ['--dry-run'])).code, 0);
  });
});

test('R2: a long list of blocking findings is cut to the first twenty, with the counts by reason first', async () => {
  const tags = Array.from({ length: 25 }, (_, index) => `<ghost-${String(index).padStart(2, '0')} />`);
  const template = text('<template>', '  <div>', ...tags.map((tag) => `    ${tag}`), '  </div>', '</template>', '<script>', 'export default { name: "Many" };', '</script>');
  await withRoot({ ...DONE, 'src/views/P/Many.vue': template }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    const check = section(dry.out, 'Phase 1 check');
    assert.match(check, /^\| no-registration \| 25 \|$/m);
    assert.equal(check.split('\n').filter((line) => line.startsWith('| `src/views/P/Many.vue:')).length, 20);
    assert.match(check, /^\.\.\. and 5 more\.$/m);
    assert.match(check, /ghost-00/);
    assert.doesNotMatch(check, /ghost-24/);
  });
});

test('R2: when the lint step fails, the refusal cannot be settled: Lint failed section, exit 1, nothing written', async () => {
  const lintFails = async () => {
    throw new Error('src/views/P/Odd.vue:1: unexpected ESLint message (fatal): Parsing error');
  };
  await withRoot(DONE, async (root) => {
    const dry = await cli(root, ['--dry-run'], { lint: lintFails });
    assert.equal(dry.code, 1);
    assert.match(section(dry.out, 'Lint failed'), /Odd\.vue:1: unexpected ESLint message/);
    assert.match(section(dry.out, 'Phase 1 check'), /^Not computed: the lint step failed\.$/m);
    assert.match(dry.out, /^\| Undefined-tag findings \| n\/a \|$/m);
    assert.match(dry.out, /^\| Not self-references \| n\/a \|$/m);
    // What does not need the lint is still reported.
    assert.match(dry.out, /^\| Files to change \| 4 \|$/m);
    assert.match(dry.err, /lint/i);

    const real = await cli(root, [], { lint: lintFails });
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    assert.match(section(real.out, 'Lint failed'), /Nothing was written\./);
  });
});

// ---- analysis errors, failures ---------------------------------------------------------------------------

const DYNAMIC = text('<template><div /></template>', '<script>', 'import Vue from "vue";', 'const name = "x";', 'Vue.component(name, {});', 'export default {};', '</script>');

test('analysis errors: a real run writes nothing at all and says so; exit 1', async () => {
  await withRoot({ ...DONE, 'src/components/Dynamic.vue': DYNAMIC }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    const errors = section(real.out, 'Analysis errors');
    assert.match(errors, /`src\/components\/Dynamic\.vue:5`/);
    assert.match(errors, /nothing was written/i);
    assert.match(real.out, /^## Files that would change$/m);
    assert.match(real.err, /analysis error/);
  });
});

test('analysis errors: a dry run prints the full report and exits 1', async () => {
  await withRoot({ ...DONE, 'src/components/Dynamic.vue': DYNAMIC }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    assert.match(dry.out, /^## Analysis errors$/m);
    // The call the scanner could not classify is left to a person: it is a failure of its own for the file.
    assert.match(dry.out, /^\| Files to change \| 4 \|$/m);
    assert.match(section(dry.out, 'Failed'), /`src\/components\/Dynamic\.vue`/);
    assert.doesNotMatch(section(dry.out, 'Analysis errors'), /nothing was written/i);
  });
});

test('a script that does not parse: the report carries the analysis error and the lint failure; exit 1, nothing written', async () => {
  const broken = text('<template><div /></template>', '<script>', 'export default {', '</script>');
  await withRoot({ ...DONE, 'src/components/Broken.vue': broken }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.match(section(real.out, 'Analysis errors'), /^- `src\/components\/Broken\.vue:4` \(parse\)/m);
    assert.match(section(real.out, 'Lint failed'), /Broken\.vue/);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
  });
});

/** An `unwrap` that damages the result for A.vue and is the real codemod for everything else. */
const breakA = (damage) => (source, file) => {
  const result = unwrapSource(source, file);
  return file.endsWith('A.vue') ? { ...result, source: damage(result.source), changed: true } : result;
};

for (const [name, damage, pattern] of [
  ['a script that no longer parses', (source) => source.replace('</script>', 'export default {\n</script>'), /A\.vue.*(Unexpected|Unterminated|parse)/is],
  ['a template that gains an SFC error', (source) => source.replace('</div>', ''), /A\.vue.*no matching end tag/is],
]) {
  test(`R7a: ${name} is reported under Failed, not written, and the other files still are`, async () => {
    await withRoot(DONE, async (root) => {
      const dry = await cli(root, ['--dry-run'], { unwrap: breakA(damage) });
      assert.equal(dry.code, 1);
      assert.match(dry.out, /^## Failed$/m);
      assert.match(dry.out, /^\| Files to change \| 3 \|$/m);

      const real = await cli(root, [], { unwrap: breakA(damage) });
      assert.equal(real.code, 1);
      const failed = section(real.out, 'Failed');
      assert.match(failed, pattern);
      assert.match(failed, /`src\/components\/A\.vue`/);
      assert.deepEqual(real.writes, ['B', 'Picker', 'TreeNode'].map((file) => join(root, `src/components/${file}.vue`)));
      assert.equal(read(root, 'src/components/A.vue'), COMP_A);
      assert.match(read(root, 'src/components/B.vue'), /^export default \{/m);
      assert.match(real.err, /1 file\(s\) failed/);
    });
  });
}

test('R7a: an SFC error the original file already had does not fail the re-parse', async () => {
  const withImg = COMP_A.replace('<comp-b />', '<img src="x.png">\n    <comp-b />');
  await withRoot({ ...DONE, 'src/components/A.vue': withImg }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.doesNotMatch(real.out, /^## Failed$/m);
    assert.match(read(root, 'src/components/A.vue'), /name: "comp-a"/);
  });
});

test('a shape the codemod will not guess at is a failure with its message; the other files are still written', async () => {
  const commented = PICKER.replace('Vue.component("picker", {', 'Vue.component(/* the id */ "picker", {');
  await withRoot({ ...DONE, 'src/components/Picker.vue': commented }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    const failed = section(real.out, 'Failed');
    assert.match(failed, /`src\/components\/Picker\.vue`.*comment/);
    assert.equal(read(root, 'src/components/Picker.vue'), commented);
    assert.match(read(root, 'src/components/A.vue'), /name: "comp-a"/);
    assert.deepEqual(real.writes.map((path) => path.split('/').at(-1)), ['A.vue', 'B.vue', 'TreeNode.vue']);
  });
});

test('a write that throws is a failure; the other files are still written', async () => {
  await withRoot(DONE, async (root) => {
    const write = (path, contents) => {
      if (path.endsWith('A.vue')) throw new Error('EACCES: permission denied');
      writeFileSync(path, contents);
    };
    const real = await cli(root, [], { write });
    assert.equal(real.code, 1);
    assert.match(section(real.out, 'Failed'), /`src\/components\/A\.vue`.*EACCES/);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    assert.match(read(root, 'src/components/B.vue'), /^export default \{/m);
    const changed = real.out.split('## Changed files')[1];
    assert.match(changed, /`src\/components\/B\.vue`/);
    assert.doesNotMatch(changed, /A\.vue/);
  });
});

// ---- usage errors ------------------------------------------------------------------------------------

test('usage errors exit 2 with the usage line on stderr and nothing on stdout', async () => {
  await withRoot({ 'src/views/P/main.js': MAIN }, async (root) => {
    await withRoot({ 'README.md': 'no src here\n' }, async (noSrc) => {
      const cases = {
        'an unknown option': ['--root', root, '--bogus'],
        'a positional argument': ['--root', root, 'extra'],
        '--root without a value': ['--root'],
        '--root that does not exist': ['--root', join(root, 'missing')],
        '--root that is a file': ['--root', join(root, 'src/views/P/main.js')],
        '--root without a src/ folder': ['--root', noSrc],
      };
      for (const [label, argv] of Object.entries(cases)) {
        const out = sink();
        const err = sink();
        const writes = [];
        const code = await run(argv, { out, err, write: (path) => writes.push(path) });
        assert.equal(code, 2, label);
        assert.equal(out.text, '', label);
        assert.match(err.text, /usage: node scripts\/vue3-migration\/unwrap-vue-component\.mjs \[--dry-run\] \[--root <dir>\]/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});
