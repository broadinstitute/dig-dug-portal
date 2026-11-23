import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse as parseBabel } from '@babel/parser';
import { BABEL_OPTIONS, toKebab } from './component-graph.mjs';
import { addPropertyAfter, applyRegistrations, keyName, splice } from './register-write.mjs';

/** Source text from lines: every file in this test ends with a newline. */
const text = (...lines) => `${lines.join('\n')}\n`;
const crlf = (source) => source.replace(/\n/g, '\r\n');

/** `Entry` for a component key, the tag spelled the way the planner would see it in a template. */
const entry = (key, source) => ({ tag: toKebab(key), key, source });
const HEADER = entry('PageHeader', '@/components/PageHeader.vue');
const FOOTER = entry('PageFooter', '@/components/PageFooter.vue');

const FILE = 'src/components/Thing.vue';

/** Applies and checks that applying the result again changes nothing. */
function apply(source, entries) {
  const result = applyRegistrations(source, entries, FILE);
  assert.deepEqual(applyRegistrations(result.source, entries, FILE), { source: result.source, changed: false });
  return result;
}

// ---- a file without a script ----------------------------------------------------------------

test('a file without a script gets one after the template, before the style, with entries ordered by key', () => {
  const input = text('<template>', '    <page-header />', '</template>', '<style>', '.a { color: red; }', '</style>');
  const result = apply(input, [HEADER, FOOTER]);
  assert.equal(
    result.source,
    text(
      '<template>',
      '    <page-header />',
      '</template>',
      '',
      '<script>',
      'import PageFooter from "@/components/PageFooter.vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default {',
      '    components: {',
      '        PageFooter,',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
      '<style>',
      '.a { color: red; }',
      '</style>',
    ),
  );
  assert.equal(result.changed, true);
});

test('a template that is the last thing in the file keeps having no final newline', () => {
  const result = apply('<template><div /></template>', [HEADER]);
  assert.equal(
    result.source,
    [
      '<template><div /></template>',
      '',
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
    ].join('\n'),
  );
});

test('a package component is imported by its package name', () => {
  const result = apply(text('<template><div /></template>'), [entry('VueTypeaheadBootstrap', 'vue-typeahead-bootstrap')]);
  assert.match(result.source, /^import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";$/m);
});

test('an empty script block is filled in place', () => {
  const input = text('<template>', '    <page-header />', '</template>', '<script>', '</script>', '<style>', '</style>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<template>',
      '    <page-header />',
      '</template>',
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
      '<style>',
      '</style>',
    ),
  );
});

// ---- Vue.component(name, { ... }) and export default { ... } ---------------------------------

test('Vue.component without a components option gets one as its first property, and the import after the last import', () => {
  const input = text(
    '<template>',
    '    <page-header />',
    '</template>',
    '',
    '<script>',
    'import Vue from "vue";',
    'import gaUtils from "@/utils/gaUtils";',
    '',
    'export default Vue.component("my-comp", {',
    '    props: ["x"],',
    '    data() {',
    '        return {};',
    '    },',
    '});',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<template>',
      '    <page-header />',
      '</template>',
      '',
      '<script>',
      'import Vue from "vue";',
      'import gaUtils from "@/utils/gaUtils";',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default Vue.component("my-comp", {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '    props: ["x"],',
      '    data() {',
      '        return {};',
      '    },',
      '});',
      '</script>',
    ),
  );
});

test('a components option that holds one entry gets the new keys after it, one per line, with a comma added', () => {
  const input = text(
    '<script>',
    'import Vue from "vue";',
    'import DataDownload from "@/components/DataDownload.vue";',
    '',
    'export default Vue.component("datasets-table", {',
    '    props: ["datasets"],',
    '    components: {',
    '        DataDownload',
    '    },',
    '    computed: {},',
    '});',
    '</script>',
  );
  assert.equal(
    apply(input, [FOOTER, HEADER]).source,
    text(
      '<script>',
      'import Vue from "vue";',
      'import DataDownload from "@/components/DataDownload.vue";',
      'import PageFooter from "@/components/PageFooter.vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default Vue.component("datasets-table", {',
      '    props: ["datasets"],',
      '    components: {',
      '        DataDownload,',
      '        PageFooter,',
      '        PageHeader,',
      '    },',
      '    computed: {},',
      '});',
      '</script>',
    ),
  );
});

test('a trailing comma and a comment after the last entry stay where they are', () => {
  const input = text(
    '<script>',
    'import DataDownload from "@/components/DataDownload.vue";',
    'export default {',
    '    components: {',
    '        DataDownload, // the download button',
    '    },',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import DataDownload from "@/components/DataDownload.vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        DataDownload, // the download button',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
    ),
  );
});

test('a missing comma goes before a comment that follows the last entry', () => {
  const input = text(
    '<script>',
    'export default {',
    '    components: {',
    '        DataDownload // the download button',
    '    },',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        DataDownload, // the download button',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
    ),
  );
});

test('a one-line components option stays on one line', () => {
  const input = text('<script>', 'export default {', '    components: { DataDownload, Other },', '};', '</script>');
  assert.equal(
    apply(input, [HEADER, FOOTER]).source,
    text(
      '<script>',
      'import PageFooter from "@/components/PageFooter.vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: { DataDownload, Other, PageFooter, PageHeader },',
      '};',
      '</script>',
    ),
  );
});

test('an empty components option is filled one level deeper than the property', () => {
  const input = text('<script>', 'export default {', '    components: {},', '    props: [],', '};', '</script>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

test('an empty components option spread over two lines keeps its closing brace', () => {
  const input = text('<script>', 'export default {', '  components: {', '  },', '  props: [],', '};', '</script>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '  components: {',
      '    PageHeader,',
      '  },',
      '  props: [],',
      '};',
      '</script>',
    ),
  );
});

test('the export default { ... } form: new properties and imports follow the script\'s own indentation', () => {
  const input = text(
    '<script>',
    '  import Vue from "vue";',
    '  export default {',
    '    name: "x",',
    '    props: [],',
    '  };',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      '  import Vue from "vue";',
      '  import PageHeader from "@/components/PageHeader.vue";',
      '  export default {',
      '    components: {',
      '      PageHeader,',
      '    },',
      '    name: "x",',
      '    props: [],',
      '  };',
      '</script>',
    ),
  );
});

test('a tab-indented component gets tabs', () => {
  const input = text('<script>', 'import Vue from "vue";', 'export default Vue.component("x", {', '\tprops: [],', '\tcomponents: {},', '});', '</script>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import Vue from "vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default Vue.component("x", {',
      '\tprops: [],',
      '\tcomponents: {',
      '\t\tPageHeader,',
      '\t},',
      '});',
      '</script>',
    ),
  );
});

test('an indented Vue.component call split across lines: the new property matches the first one', () => {
  const input = text(
    '<template><button /></template>',
    '',
    '<script>',
    '    import Vue from "vue";',
    '    import gaUtils from "@/utils/gaUtils";',
    '',
    '    export default Vue.component(',
    '        "ga-event-log",',
    '        {',
    '',
    '        data() {',
    '            return { value: null };',
    '        },',
    '    })',
    '',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<template><button /></template>',
      '',
      '<script>',
      '    import Vue from "vue";',
      '    import gaUtils from "@/utils/gaUtils";',
      '    import PageHeader from "@/components/PageHeader.vue";',
      '',
      '    export default Vue.component(',
      '        "ga-event-log",',
      '        {',
      '        components: {',
      '            PageHeader,',
      '        },',
      '',
      '        data() {',
      '            return { value: null };',
      '        },',
      '    })',
      '',
      '</script>',
    ),
  );
});

test('an empty options object is filled in', () => {
  const input = text('<script>', 'import Vue from "vue";', 'export default Vue.component("x", {});', '</script>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import Vue from "vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default Vue.component("x", {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '});',
      '</script>',
    ),
  );
});

test('a script without imports gets the import at its top', () => {
  const input = text('<script>', 'export default {', '    props: [],', '};', '</script>');
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

// ---- imports and clashes --------------------------------------------------------------------

test('an existing default import of the same source is reused under its own name', () => {
  const input = text(
    '<script>',
    'import Header from "@/components/PageHeader.vue";',
    'export default {',
    '    props: [],',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import Header from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        PageHeader: Header,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

test('an existing import that already has the key as its name is registered with the shorthand and not imported again', () => {
  const input = text(
    '<script>',
    'import PageHeader from "@/components/PageHeader.vue";',
    'export default {',
    '    props: [],',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        PageHeader,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

test('a relative or extensionless import of the same file counts as the same source', () => {
  for (const specifier of ['./PageHeader.vue', '../components/PageHeader.vue', '@/components/PageHeader', '@/components/PageHeader.vue']) {
    const input = text('<script>', `import PageHeader from "${specifier}";`, 'export default {', '    props: [],', '};', '</script>');
    const { source } = apply(input, [HEADER]);
    assert.equal(source.match(/^import /gm).length, 1, specifier);
    assert.match(source, /^ {8}PageHeader,$/m, specifier);
  }
});

test('a relative import of another file is not the same source', () => {
  const input = text('<script>', 'import PageHeader from "./other/PageHeader.vue";', 'export default {};', '</script>');
  assert.match(apply(input, [HEADER]).source, /^import PageHeaderComponent from "@\/components\/PageHeader.vue";$/m);
});

test('a name taken by an import of another source is imported as <Key>Component', () => {
  const input = text(
    '<script>',
    'import PageHeader from "@/components/other/PageHeader.vue";',
    'export default {',
    '    props: [],',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/other/PageHeader.vue";',
      'import PageHeaderComponent from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      '        PageHeader: PageHeaderComponent,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

test('a name taken by a const, a function or a class is a clash too', () => {
  for (const declaration of ['const PageHeader = 1;', 'function PageHeader() {}', 'class PageHeader {}', 'const { PageHeader } = window;', 'export const PageHeader = 1;']) {
    const input = text('<script>', declaration, 'export default {', '    props: [],', '};', '</script>');
    const { source } = apply(input, [HEADER]);
    assert.match(source, /^import PageHeaderComponent from "@\/components\/PageHeader.vue";$/m, declaration);
    assert.match(source, /^ {8}PageHeader: PageHeaderComponent,$/m, declaration);
  }
});

test('when <Key>Component is taken too, a number is added', () => {
  const input = text(
    '<script>',
    'import PageHeader from "x";',
    'import PageHeaderComponent from "y";',
    'export default {',
    '    props: [],',
    '};',
    '</script>',
  );
  const { source } = apply(input, [HEADER]);
  assert.match(source, /^import PageHeaderComponent2 from "@\/components\/PageHeader.vue";$/m);
  assert.match(source, /^ {8}PageHeader: PageHeaderComponent2,$/m);
});

test('two entries from one source share one import', () => {
  const input = text('<script>', 'export default {', '    props: [],', '};', '</script>');
  const same = '@/components/Shared.vue';
  assert.equal(
    apply(input, [entry('AaTag', same), entry('BbTag', same)]).source,
    text(
      '<script>',
      `import AaTag from "${same}";`,
      'export default {',
      '    components: {',
      '        AaTag,',
      '        BbTag: AaTag,',
      '    },',
      '    props: [],',
      '};',
      '</script>',
    ),
  );
});

// ---- tags that do not round-trip through their key ------------------------------------------

// `<gene-set-2-phenotype>`: Vue finds `GeneSet2Phenotype` (camelize, then capitalize), but turning the key back
// into kebab-case gives `gene-set2-phenotype`, which is what the lint rule compares with.
const DIGIT = { tag: 'gene-set-2-phenotype', key: 'GeneSet2Phenotype', source: '@/components/Cfde2Kp/GeneSet2Phenotype.vue' };

test('a tag whose key does not round-trip is registered under its own kebab-case name as a string key', () => {
  const input = text('<template>', '    <gene-set-2-phenotype />', '</template>');
  assert.equal(
    apply(input, [DIGIT, HEADER]).source,
    text(
      '<template>',
      '    <gene-set-2-phenotype />',
      '</template>',
      '',
      '<script>',
      'import GeneSet2Phenotype from "@/components/Cfde2Kp/GeneSet2Phenotype.vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default {',
      '    components: {',
      '        "gene-set-2-phenotype": GeneSet2Phenotype,',
      '        PageHeader,',
      '    },',
      '};',
      '</script>',
    ),
  );
});

test('the string key goes into an existing components option, and follows the reuse and clash rules for the binding', () => {
  const existing = text(
    '<script>',
    'export default {',
    '    components: {',
    '        Other,',
    '    },',
    '};',
    '</script>',
  );
  assert.equal(
    apply(existing, [DIGIT]).source,
    text(
      '<script>',
      `import GeneSet2Phenotype from "${DIGIT.source}";`,
      'export default {',
      '    components: {',
      '        Other,',
      '        "gene-set-2-phenotype": GeneSet2Phenotype,',
      '    },',
      '};',
      '</script>',
    ),
  );
  const reused = text('<script>', `import Phenotypes from "${DIGIT.source}";`, 'export default {};', '</script>');
  assert.match(apply(reused, [DIGIT]).source, /^ {8}"gene-set-2-phenotype": Phenotypes,$/m);
  const clash = text('<script>', 'const GeneSet2Phenotype = 1;', 'export default {};', '</script>');
  const { source } = apply(clash, [DIGIT]);
  assert.match(source, /^import GeneSet2PhenotypeComponent from /m);
  assert.match(source, /^ {8}"gene-set-2-phenotype": GeneSet2PhenotypeComponent,$/m);
});

test('an existing string key with the tag\'s kebab-case name counts as registered', () => {
  const input = text(
    '<script>',
    'import Phenotype from "@/components/Cfde2Kp/GeneSet2Phenotype.vue";',
    'export default {',
    '    components: {',
    '        "gene-set-2-phenotype": Phenotype,',
    '    },',
    '};',
    '</script>',
  );
  assert.deepEqual(applyRegistrations(input, [DIGIT], FILE), { source: input, changed: false });
});

test('a tag that round-trips keeps the plain key, whatever its spelling', () => {
  const plain = [
    { tag: 'page-header', key: 'PageHeader', source: HEADER.source },
    { tag: 'PageFooter', key: 'PageFooter', source: FOOTER.source },
    { tag: 'GeneSet2Phenotype', key: 'GeneSet2Phenotype', source: DIGIT.source },
    { tag: 'gene-set2-phenotype', key: 'GeneSet2Phenotype', source: DIGIT.source },
  ];
  for (const one of plain) {
    const { source } = apply(text('<template><div /></template>'), [one]);
    assert.match(source, new RegExp(`^ {8}${one.key},$`, 'm'), one.tag);
    assert.doesNotMatch(source, /": /, one.tag);
  }
});

// ---- idempotence ----------------------------------------------------------------------------

test('keys that are already registered are left alone, whatever their spelling', () => {
  for (const key of ['PageHeader', '"page-header"', '"PageHeader"', 'pageHeader']) {
    const input = text(
      '<script>',
      'import Header from "@/components/PageHeader.vue";',
      'export default {',
      '    components: {',
      `        ${key}: Header,`,
      '    },',
      '};',
      '</script>',
    );
    assert.deepEqual(applyRegistrations(input, [HEADER], FILE), { source: input, changed: false }, key);
  }
});

test('only the missing keys are added, and only their imports', () => {
  const input = text(
    '<script>',
    'import PageHeader from "@/components/PageHeader.vue";',
    'export default {',
    '    components: { PageHeader },',
    '};',
    '</script>',
  );
  assert.equal(
    apply(input, [HEADER, FOOTER]).source,
    text(
      '<script>',
      'import PageHeader from "@/components/PageHeader.vue";',
      'import PageFooter from "@/components/PageFooter.vue";',
      'export default {',
      '    components: { PageHeader, PageFooter },',
      '};',
      '</script>',
    ),
  );
});

test('with no entries the source comes back untouched, even when it is not a shape the writer supports', () => {
  const input = '<script setup>\nconst a = 1;\n</script>\n';
  assert.deepEqual(applyRegistrations(input, [], FILE), { source: input, changed: false });
});

// ---- line endings ---------------------------------------------------------------------------

test('a file with CRLF line endings gets CRLF in everything inserted', () => {
  const input = crlf(
    text(
      '<template>',
      '    <page-header />',
      '</template>',
      '',
      '<script>',
      'import Vue from "vue";',
      '',
      'export default Vue.component("x", {',
      '    components: {',
      '        Other',
      '    },',
      '});',
      '</script>',
    ),
  );
  const expected = crlf(
    text(
      '<template>',
      '    <page-header />',
      '</template>',
      '',
      '<script>',
      'import Vue from "vue";',
      'import PageHeader from "@/components/PageHeader.vue";',
      '',
      'export default Vue.component("x", {',
      '    components: {',
      '        Other,',
      '        PageHeader,',
      '    },',
      '});',
      '</script>',
    ),
  );
  assert.equal(apply(input, [HEADER]).source, expected);
});

test('a CRLF file without a script gets a CRLF script, and a CRLF options object gets a CRLF property', () => {
  const bare = apply(crlf(text('<template>', '    <a-b />', '</template>')), [HEADER]).source;
  assert.equal(bare.replace(/\r\n/g, '').includes('\n'), false);
  assert.match(bare, /<\/template>\r\n\r\n<script>\r\nimport PageHeader from "@\/components\/PageHeader.vue";\r\n\r\nexport default \{\r\n/);

  const withOptions = apply(crlf(text('<script>', 'export default {', '    props: [],', '};', '</script>')), [HEADER]).source;
  assert.equal(withOptions.replace(/\r\n/g, '').includes('\n'), false);
  assert.match(withOptions, /export default \{\r\n {4}components: \{\r\n {8}PageHeader,\r\n {4}\},\r\n {4}props/);
});

// ---- shapes the writer refuses --------------------------------------------------------------

function refuses(input, pattern, entries = [HEADER]) {
  assert.throws(
    () => applyRegistrations(input, entries, FILE),
    (error) => {
      assert.ok(error.message.startsWith(`${FILE}: `), `message names the file: ${error.message}`);
      assert.match(error.message, pattern);
      return true;
    },
  );
}

test('two plain script blocks are refused, naming the file', () => {
  refuses(
    text('<template><a /></template>', '<script>', 'if (a) b();', '</script>', '<script>', 'export default {};', '</script>'),
    /more than one <script>/,
  );
});

test('a <script setup> block and a lang="ts" block are refused', () => {
  refuses(text('<template><a /></template>', '<script setup>', 'const a = 1;', '</script>'), /<script setup>/);
  refuses(text('<template><a /></template>', '<script lang="ts">', 'export default {};', '</script>'), /lang="ts"/);
  refuses(text('<template><a /></template>', '<script src="./x.js"></script>'), /src/);
});

test('a components value that is not an object literal is refused', () => {
  for (const value of ['sharedComponents', 'makeComponents()', 'a ? b : c']) {
    refuses(text('<script>', 'export default {', `    components: ${value},`, '};', '</script>'), /components/);
  }
});

// The lint reads the first `components` key and Vue the last; the writer must not pick one (M3, the Task 7 bug).
test('an options object with more than one components key is refused', () => {
  refuses(
    text('<script>', 'export default {', '    components: { A },', '    props: [],', '    "components": {},', '};', '</script>'),
    /2 `components` keys/,
  );
  refuses(text('<script>', 'export default Vue.component("x", { components: {}, components: { B } });', '</script>'), /2 `components` keys/);
});

test('an options object with a spread is refused', () => {
  refuses(text('<script>', 'export default {', '    ...mixin,', '};', '</script>'), /spread/);
});

test('an export default that is neither Vue.component(name, {...}) nor {...} is refused', () => {
  refuses(text('<script>', 'const options = {};', 'export default options;', '</script>'), /export default/);
  refuses(text('<script>', 'export default Vue.extend({});', '</script>'), /export default/);
  refuses(text('<script>', 'export default Vue.component("x", options);', '</script>'), /export default/);
  refuses(text('<script>', 'export default Vue.component(name, {});', '</script>'), /export default/);
  refuses(text('<script>', 'Vue.component("x", {});', '</script>'), /export default/);
});

test('a script that does not parse and a file with no template are refused', () => {
  refuses(text('<script>', 'export default {', '</script>'), /./);
  refuses(text('<style>', '.a {}', '</style>'), /<template>/);
});

test('duplicate keys in the entries are refused', () => {
  refuses(text('<template><a /></template>'), /PageHeader/, [HEADER, HEADER]);
});

test('the file name is optional and defaults to a placeholder in messages', () => {
  assert.throws(() => applyRegistrations(text('<style>', '</style>'), [HEADER]), /^Error: <source>: /);
});

// ---- addPropertyAfter -----------------------------------------------------------------------

/** The `props` property of `export default {...}` in `raw`, parsed the way the writer parses a script. */
function propsOf(raw) {
  const ast = parseBabel(raw, { ...BABEL_OPTIONS, errorRecovery: false });
  const options = ast.program.body.find(({ type }) => type === 'ExportDefaultDeclaration').declaration;
  return options.properties.find((property) => keyName(property) === 'props');
}

/** `raw` with `emits: ["a"],` added after its `props` property; null when addPropertyAfter declines. */
function addEmitsAfterProps(raw, eol = '\n') {
  const edit = addPropertyAfter(raw, propsOf(raw), (indent) => `${indent}emits: ["a"],`, eol);
  return edit === null ? null : splice(raw, [edit]);
}

test('addPropertyAfter puts the new lines after the comma, indented like the property', () => {
  const raw = text('export default {', '    props: {', '        a: String,', '    },', '    data() {},', '};');
  assert.equal(
    addEmitsAfterProps(raw),
    text('export default {', '    props: {', '        a: String,', '    },', '    emits: ["a"],', '    data() {},', '};'),
  );
});

test('addPropertyAfter adds the comma a last property lacks, right after the property', () => {
  const raw = text('export default {', '    name: "x",', '    props: { a: String }', '};');
  assert.equal(
    addEmitsAfterProps(raw),
    text('export default {', '    name: "x",', '    props: { a: String },', '    emits: ["a"],', '};'),
  );
});

test('addPropertyAfter puts the new lines after a trailing comment, with or without the comma', () => {
  const withComma = text('export default {', '    props: [], // what it takes', '    data() {},', '};');
  assert.equal(
    addEmitsAfterProps(withComma),
    text('export default {', '    props: [], // what it takes', '    emits: ["a"],', '    data() {},', '};'),
  );
  const without = text('export default {', '    props: [] /* what it takes */', '};');
  assert.equal(addEmitsAfterProps(without), text('export default {', '    props: [], /* what it takes */', '    emits: ["a"],', '};'));
  const gap = text('export default {', '    props: [] /* a */ , // b', '    data() {},', '};');
  assert.equal(addEmitsAfterProps(gap), text('export default {', '    props: [] /* a */ , // b', '    emits: ["a"],', '    data() {},', '};'));
});

test('addPropertyAfter uses the eol it is given, and the tab indentation of the property', () => {
  const raw = crlf('export default {\n\tprops: [],\n\tdata() {},\n};\n');
  const result = addEmitsAfterProps(raw, '\r\n');
  assert.equal(result, crlf('export default {\n\tprops: [],\n\temits: ["a"],\n\tdata() {},\n};\n'));
  assert.equal(result.replace(/\r\n/g, '').includes('\n'), false);

  const last = crlf('export default {\n\tprops: []\n};\n');
  assert.equal(addEmitsAfterProps(last, '\r\n'), crlf('export default {\n\tprops: [],\n\temits: ["a"],\n};\n'));
});

test('addPropertyAfter declines when code shares a line with the end of the property, or with its start', () => {
  // A second property after the comma.
  assert.equal(addEmitsAfterProps(text('export default {', '    props: [], data() {},', '};')), null);
  // The closing brace after a last property that has no comma.
  assert.equal(addEmitsAfterProps(text('export default { props: [] };')), null);
  assert.equal(addEmitsAfterProps(text('export default {', '    props: [] };')), null);
  // A comment that runs on to another line.
  assert.equal(addEmitsAfterProps(text('export default {', '    props: [], /* one', '    two */', '};')), null);
  // Code before the property on its line.
  assert.equal(addEmitsAfterProps(text('export default {', '    name: "x", props: [],', '};')), null);
});
