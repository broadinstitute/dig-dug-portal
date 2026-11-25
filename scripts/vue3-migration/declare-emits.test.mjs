import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { declareEmits, dynamicEmits, emittedNames, run } from './declare-emits.mjs';
import { vue3Linter } from './vue3-eslint.mjs';

/** Source text from lines: every file in this test ends with a newline. */
const text = (...lines) => `${lines.join('\n')}\n`;
const crlf = (source) => source.replace(/\n/g, '\r\n');

const FILE = 'src/components/Thing.vue';

/** A component file whose script is `script` (lines). */
const component = (...script) => text('<template>', '    <div />', '</template>', '', '<script>', ...script, '</script>');

/** Declares `names` in `source`, which must resolve, and checks that declaring them again changes nothing. */
function declared(source, names, file = FILE) {
  const result = declareEmits(source, names, file);
  assert.equal(result.unresolved, undefined, result.unresolved);
  assert.deepEqual(declareEmits(result.source, names, file), { source: result.source, changed: false });
  return result;
}

/** What `declareEmits` says about a source it will not edit: its reason, with the source checked to be unchanged. */
function unresolved(source, names, file = FILE) {
  const result = declareEmits(source, names, file);
  assert.equal(result.changed, false);
  assert.equal(result.source, source);
  assert.equal(typeof result.unresolved, 'string');
  return result.unresolved;
}

// ---- emittedNames ---------------------------------------------------------------------------

const missing = (name) => ({ ruleId: 'vue/require-explicit-emits', message: `The "${name}" event has been triggered but not declared on \`emits\` option.` });

test('emittedNames reads the event names of the rule messages: unique, in message order, whatever they hold', () => {
  const names = ['b', 'a', 'b', 'click', 'update:regionViewArea', 'toggle-star-variant', 'say "hi"', 'a|b'];
  assert.deepEqual(emittedNames(names.map(missing)), ['b', 'a', 'click', 'update:regionViewArea', 'toggle-star-variant', 'say "hi"', 'a|b']);
  assert.deepEqual(emittedNames([]), []);
});

test('emittedNames ignores a message that is not about the emits option', () => {
  const setup = { ruleId: 'vue/require-explicit-emits', message: 'The "a" event has been triggered but not declared on `defineEmits`.' };
  const other = { ruleId: 'vue/no-undef-components', message: "The component 'x' has not been registered." };
  assert.deepEqual(emittedNames([setup, other, missing('c')]), ['c']);
});

// ---- where the property goes ----------------------------------------------------------------

test('adds emits after props, the names in source order', () => {
  const input = component(
    'export default {',
    '    name: "Thing",',
    '    props: {',
    '        a: String,',
    '    },',
    '    data() {',
    '        return {};',
    '    },',
    '};',
  );
  const result = declared(input, ['b', 'a']);
  assert.equal(result.changed, true);
  assert.equal(
    result.source,
    component(
      'export default {',
      '    name: "Thing",',
      '    props: {',
      '        a: String,',
      '    },',
      '    emits: ["b", "a"],',
      '    data() {',
      '        return {};',
      '    },',
      '};',
    ),
  );
});

test('falls back to components, then name, then the first property', () => {
  const withComponents = component('export default {', '    name: "Thing",', '    components: { A, B },', '    data() {},', '};');
  assert.equal(
    declared(withComponents, ['a']).source,
    component('export default {', '    name: "Thing",', '    components: { A, B },', '    emits: ["a"],', '    data() {},', '};'),
  );

  const withName = component('export default {', '    name: "Thing",', '    data() {},', '};');
  assert.equal(declared(withName, ['a']).source, component('export default {', '    name: "Thing",', '    emits: ["a"],', '    data() {},', '};'));

  const bare = component('export default {', '    data() {},', '    methods: {},', '};');
  assert.equal(declared(bare, ['a']).source, component('export default {', '    emits: ["a"],', '    data() {},', '    methods: {},', '};'));

  const empty = component('export default {};');
  assert.equal(declared(empty, ['a']).source, component('export default {', '    emits: ["a"],', '};'));

  // props beats components, and components beats name, wherever they stand.
  const all = component('export default {', '    props: [],', '    name: "Thing",', '    components: {},', '};');
  assert.equal(declared(all, ['a']).source, component('export default {', '    props: [],', '    emits: ["a"],', '    name: "Thing",', '    components: {},', '};'));
  const noProps = component('export default {', '    components: {},', '    name: "Thing",', '};');
  assert.equal(declared(noProps, ['a']).source, component('export default {', '    components: {},', '    emits: ["a"],', '    name: "Thing",', '};'));
});

test('a last property without a comma gets one, and the file keeps the script around it', () => {
  const input = component('import A from "./A.vue";', '', 'export default {', '    name: "Thing",', '    props: { a: String }', '};');
  assert.equal(
    declared(input, ['a']).source,
    component('import A from "./A.vue";', '', 'export default {', '    name: "Thing",', '    props: { a: String },', '    emits: ["a"],', '};'),
  );
});

// ---- an emits option that exists ------------------------------------------------------------

test('appends to an existing emits array without duplicating', () => {
  const input = component('export default {', '    emits: ["a"],', '    methods: {},', '};');
  assert.equal(declared(input, ['a', 'c']).source, component('export default {', '    emits: ["a", "c"],', '    methods: {},', '};'));

  // Everything is declared already: nothing changes.
  assert.deepEqual(declareEmits(input, ['a'], FILE), { source: input, changed: false });

  // An array over several lines gets one line per name, with trailing commas.
  const many = component('export default {', '    emits: [', '        "a",', '        "b"', '    ],', '};');
  assert.equal(
    declared(many, ['b', 'c', 'd']).source,
    component('export default {', '    emits: [', '        "a",', '        "b",', '        "c",', '        "d",', '    ],', '};'),
  );
});

// ---- names ----------------------------------------------------------------------------------

test('declares native-named and colon names verbatim', () => {
  const input = component('export default {', '    name: "Thing",', '};');
  const result = declared(input, ['click', 'update:regionViewArea', 'toggle-star-variant']);
  assert.equal(
    result.source,
    component('export default {', '    name: "Thing",', '    emits: ["click", "update:regionViewArea", "toggle-star-variant"],', '};'),
  );
  // A name is written as a JavaScript string, so a quote in it is escaped.
  assert.match(declared(input, ['say "hi"']).source, /^ {4}emits: \["say \\"hi\\""\],$/m);
});

// ---- layout ---------------------------------------------------------------------------------

test('keeps CRLF and tab indentation', () => {
  const input = crlf(component('export default {', '\tname: "Thing",', '\tprops: {', '\t\ta: String,', '\t},', '\tdata() {},', '};'));
  const result = declared(input, ['a', 'b']);
  assert.equal(
    result.source,
    crlf(component('export default {', '\tname: "Thing",', '\tprops: {', '\t\ta: String,', '\t},', '\temits: ["a", "b"],', '\tdata() {},', '};')),
  );
  assert.equal(result.source.replace(/\r\n/g, '').includes('\n'), false);

  // A split list is indented one tab in, with CRLF between its lines.
  const names = Array.from({ length: 12 }, (_, i) => `event-number-${i}`);
  const split = declared(input, names).source;
  assert.equal(split.replace(/\r\n/g, '').includes('\n'), false);
  assert.match(split, /\r\n\temits: \[\r\n\t\t"event-number-0",\r\n/);
  assert.match(split, /\t\t"event-number-11",\r\n\t\],\r\n\tdata\(\) \{\},/);
});

test('splits a long list one name per line, at more than 100 columns', () => {
  const names = Array.from({ length: 12 }, (_, i) => `event-number-${i}`);
  const input = component('export default {', '    name: "Thing",', '};');
  assert.equal(
    declared(input, names).source,
    component('export default {', '    name: "Thing",', '    emits: [', ...names.map((name) => `        "${name}",`), '    ],', '};'),
  );

  // `    emits: ["` and `"],` are 12 columns around the name: a name of 84 characters makes a line of 100, which stays.
  const fits = 'x'.repeat(84);
  const long = 'x'.repeat(85);
  assert.equal(declared(input, [fits]).source, component('export default {', '    name: "Thing",', `    emits: ["${fits}"],`, '};'));
  assert.equal(
    declared(input, [long]).source,
    component('export default {', '    name: "Thing",', '    emits: [', `        "${long}",`, '    ],', '};'),
  );
});

// ---- what is not edited ---------------------------------------------------------------------

test('leaves object-form emits and .js components unresolved', () => {
  const objectForm = component('export default {', '    emits: { a: null },', '};');
  assert.match(unresolved(objectForm, ['a', 'b']), /object-form `emits`/);

  const script = text('import Vue from "vue";', 'new Vue({ name: "x" });');
  assert.match(unresolved(script, ['a'], 'src/views/X/main.js'), /\.js file/);
});

test('leaves a component it cannot place a property in unresolved, with the reason', () => {
  assert.match(unresolved(component('export default Vue.extend({});'), ['a']), /no `export default \{ \.\.\. \}`/);
  assert.match(unresolved(component('const options = {};', 'export default options;'), ['a']), /no `export default \{ \.\.\. \}`/);
  assert.match(unresolved(text('<template><div /></template>'), ['a']), /no <script>/);
  assert.match(unresolved(text('<script setup>', 'const a = 1;', '</script>'), ['a']), /<script setup>/);
  assert.match(unresolved(component('export default {', '};', 'export default {'), ['a']), /does not parse/);
  assert.match(unresolved(component('export default {', '    ...mixin,', '};'), ['a']), /spread/);
  assert.match(unresolved(component('export default {', '    emits: ["a"],', '    "emits": ["b"],', '};'), ['c']), /2 `emits` options/);
  assert.match(unresolved(component('export default {', '    emits: [EVENT],', '};'), ['a']), /not an array of string literals/);
  assert.match(unresolved(component('export default {', '    emits,', '};'), ['a']), /not an array of string literals/);
});

test('leaves a property that shares its line with other code unresolved', () => {
  assert.equal(unresolved(component('export default { name: "Thing" };'), ['a']), 'property shares its line');
  assert.equal(unresolved(component('export default {', '    props: [], data() {},', '};'), ['a']), 'property shares its line');
  // With no props, components or name, the first property is the one that shares its line with the brace.
  assert.equal(unresolved(component('export default { data() {} };'), ['a']), 'property shares its line');
});

test('with no names it returns the source at once, whatever its shape', () => {
  const input = text('<script setup>', '</script>');
  assert.deepEqual(declareEmits(input, [], FILE), { source: input, changed: false });
});

// ---- $emit calls the lint cannot see --------------------------------------------------------

test('dynamicEmits lists a call whose first argument is not a string literal, with its line and argument', () => {
  const source = text(
    '<template>',
    '    <button @click="$emit(name)">a</button>',
    '    <button @click="$emit(\'ok\')">b</button>',
    '</template>',
    '<script>',
    'export default {',
    '    methods: {',
    '        a() {',
    '            this.$emit("ok", 1);',
    "            this.$emit('ok');",
    '            this.$emit(`ok`);',
    '            this.$emit(',
    '                "ok",',
    '                1,',
    '            );',
    '            this.$emit("a,b)");',
    '            this.$emit(eventName);',
    '            this.$emit(`on-${kind}`, 1);',
    '            this.$emit("on-" + kind);',
    '            this.$emit(',
    '                kind.name,',
    '                1,',
    '            );',
    '            this.$emit(...args);',
    '        },',
    '    },',
    '};',
    '</script>',
  );
  assert.deepEqual(
    dynamicEmits(source).map(({ line, argument }) => [line, argument]),
    [
      [2, 'name'],
      [17, 'eventName'],
      [18, '`on-${kind}`'],
      [19, '"on-" + kind'],
      [20, 'kind.name'],
      [24, '...args'],
    ],
  );
  assert.deepEqual(dynamicEmits(text('<template><div /></template>')), []);
});

// ---- the command ----------------------------------------------------------------------------

const THING = text(
  '<template>',
  '    <div @click="$emit(\'toggle-star-variant\')">',
  '        <button @click="$emit(\'click\')">go</button>',
  '    </div>',
  '</template>',
  '',
  '<script>',
  'export default {',
  '    name: "Thing",',
  '    props: {',
  '        a: String,',
  '    },',
  '    methods: {',
  '        pick() {',
  '            this.$emit("update:regionViewArea", 1);',
  '            this.$emit("click");',
  '        },',
  '    },',
  '};',
  '</script>',
);
const OTHER = text('<script>', 'export default {', '    name: "Other",', '    methods: {', '        go() {', '            this.$emit("a");', '        },', '    },', '};', '</script>');
const OBJECT_FORM = text(
  '<script>',
  'export default {',
  '    emits: { a: null },',
  '    methods: {',
  '        go() {',
  '            this.$emit("a");',
  '            this.$emit("b");',
  '            this.$emit("c");',
  '        },',
  '    },',
  '};',
  '</script>',
);
const DYNAMIC = text(
  '<template>',
  '    <button @click="$emit(name)">go</button>',
  '</template>',
  '<script>',
  'export default {',
  '    emits: ["known"],',
  '    methods: {',
  '        go() {',
  '            this.$emit("known");',
  '            this.$emit(this.kind);',
  '        },',
  '    },',
  '};',
  '</script>',
);

const FIXTURE = {
  'src/components/Thing.vue': THING,
  'src/components/Other.vue': OTHER,
  'src/components/ObjectForm.vue': OBJECT_FORM,
  'src/components/Dynamic.vue': DYNAMIC,
};

const THING_AFTER = THING.replace('    },\n    methods', '    },\n    emits: ["toggle-star-variant", "click", "update:regionViewArea"],\n    methods');
const OTHER_AFTER = OTHER.replace('    name: "Other",\n', '    name: "Other",\n    emits: ["a"],\n');

/** Writes `files` (path -> text) under a fresh temp root, runs `fn(root)`, and always removes the root. */
async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'declare-emits-'));
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
      writes.push(path);
      writeFileSync(path, contents);
    },
  });
  return { code, out: out.text, err: err.text, writes };
}

/** The lines of one `## <heading>` section of a report, up to the next heading. */
const section = (report, heading) => report.split(`## ${heading}\n`)[1].split('\n## ')[0];

test('declares what the lint finds, native-named and colon names included, and leaves the rest alone', async () => {
  await withRoot(FIXTURE, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 0, real.err);
    assert.equal(read(root, 'src/components/Thing.vue'), THING_AFTER);
    assert.equal(read(root, 'src/components/Other.vue'), OTHER_AFTER);
    // The object-form emits is reported, not edited, and so is the file that has nothing the lint can see.
    assert.equal(read(root, 'src/components/ObjectForm.vue'), OBJECT_FORM);
    assert.equal(read(root, 'src/components/Dynamic.vue'), DYNAMIC);
    assert.deepEqual(real.writes, [join(root, 'src/components/Other.vue'), join(root, 'src/components/Thing.vue')]);
    assert.equal(real.err, '');
  });
});

test('the report gives the totals, what is unresolved, what to check by hand, and the files changed', async () => {
  await withRoot(FIXTURE, async (root) => {
    const real = await cli(root);
    assert.match(real.out, /^# Declare emits$/m);
    assert.match(real.out, /^\| Total \| Count \|$/m);
    // Thing: 4 findings, Other: 1, ObjectForm: 2 (a is declared; b and c are not).
    assert.match(real.out, /^\| Findings \| 7 \|$/m);
    assert.match(real.out, /^\| Files with findings \| 3 \|$/m);
    assert.match(real.out, /^\| Files to change \| 2 \|$/m);
    assert.match(real.out, /^\| Unresolved \| 1 \|$/m);
    assert.match(real.out, /^\| Check by hand \| 2 \|$/m);

    assert.match(section(real.out, 'Unresolved'), /^\| `src\/components\/ObjectForm\.vue` \| `b`, `c` \| object-form `emits` \|$/m);
    const byHand = section(real.out, 'Check by hand');
    assert.match(byHand, /^\| `src\/components\/Dynamic\.vue:2` \| `name` \|$/m);
    assert.match(byHand, /^\| `src\/components\/Dynamic\.vue:10` \| `this\.kind` \|$/m);
    assert.doesNotMatch(byHand, /Thing|Other|ObjectForm/);

    const changed = section(real.out, 'Changed files');
    assert.match(changed, /^- `src\/components\/Other\.vue`$/m);
    assert.match(changed, /^- `src\/components\/Thing\.vue`$/m);
    assert.doesNotMatch(real.out, /^## Failed$/m);
  });
});

test('a dry run reports the same totals and files, and writes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0, dry.err);
    assert.deepEqual(dry.writes, []);
    for (const [file, contents] of Object.entries(FIXTURE)) assert.equal(read(root, file), contents);
    assert.match(dry.out, /^# Declare emits \(dry run\)$/m);
    assert.match(dry.out, /^\| Findings \| 7 \|$/m);
    assert.match(dry.out, /^\| Files with findings \| 3 \|$/m);
    assert.match(dry.out, /^\| Files to change \| 2 \|$/m);
    const would = section(dry.out, 'Files that would change');
    assert.match(would, /^- `src\/components\/Other\.vue`$/m);
    assert.match(would, /^- `src\/components\/Thing\.vue`$/m);
  });
});

test('second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const first = await cli(root);
    assert.equal(first.code, 0, first.err);
    assert.equal(first.writes.length, 2);

    const second = await cli(root);
    assert.equal(second.code, 0, second.err);
    assert.deepEqual(second.writes, []);
    // The object-form file is still unresolved, so its two findings remain; nothing else does.
    assert.match(second.out, /^\| Findings \| 2 \|$/m);
    assert.match(second.out, /^\| Files with findings \| 1 \|$/m);
    assert.match(second.out, /^\| Files to change \| 0 \|$/m);
    assert.equal(section(second.out, 'Changed files').trim(), 'None.');
    assert.equal(read(root, 'src/components/Thing.vue'), THING_AFTER);
    assert.equal(read(root, 'src/components/Other.vue'), OTHER_AFTER);
  });
});

test('a tree with nothing to declare says so', async () => {
  await withRoot({ 'src/components/Clean.vue': component('export default {', '    emits: ["a"],', '    methods: {},', '};') }, async (root) => {
    const result = await cli(root);
    assert.equal(result.code, 0, result.err);
    assert.match(result.out, /^\| Findings \| 0 \|$/m);
    assert.match(result.out, /^\| Files with findings \| 0 \|$/m);
    assert.equal(section(result.out, 'Unresolved').trim(), 'None.');
    assert.equal(section(result.out, 'Check by hand').trim(), 'None.');
    assert.deepEqual(result.writes, []);
  });
});

test('a file ESLint cannot parse is counted and listed, not skipped silently', async () => {
  const broken = '<template><div /></template>\n<script>\nexport default {\n</script>\n';
  await withRoot({ ...FIXTURE, 'src/components/Broken.vue': broken }, async (root) => {
    const result = await cli(root, ['--dry-run']);
    assert.equal(result.code, 0, result.err);
    assert.match(result.out, /^\| Files ESLint could not parse \| 1 \|$/m);
    assert.match(section(result.out, 'Not parsed'), /^- `src\/components\/Broken\.vue`$/m);
    assert.match(result.out, /^\| Findings \| 7 \|$/m);
  });
});

test('a rule message that names no event leaves its file unresolved, not silently skipped', async () => {
  await withRoot(FIXTURE, async (root) => {
    // The same lint, with the rule's text changed the way a new eslint-plugin-vue might.
    const makeLinter = (options) => {
      const linter = vue3Linter(options);
      const lintFiles = linter.lintFiles.bind(linter);
      linter.lintFiles = async (patterns) =>
        (await lintFiles(patterns)).map((result) => ({
          ...result,
          messages: result.messages.map((message) => (message.ruleId === 'vue/require-explicit-emits' ? { ...message, message: 'An event is not declared.' } : message)),
        }));
      return linter;
    };
    const result = await cli(root, [], { makeLinter });
    assert.equal(result.code, 0, result.err);
    assert.deepEqual(result.writes, []);
    assert.match(result.out, /^\| Findings \| 7 \|$/m);
    assert.match(result.out, /^\| Files to change \| 0 \|$/m);
    assert.match(result.out, /^\| Unresolved \| 3 \|$/m);
    assert.match(section(result.out, 'Unresolved'), /^\| `src\/components\/Thing\.vue` \| {2}\| the lint messages name no event/m);
  });
});

// A `.vue` file with a second component inside it: the lint attributes `inner` to the `Vue.extend` component, and
// a name added to the `export default` options (what the first run does) does not declare it there.
const NESTED = text(
  '<script>',
  'import Vue from "vue";',
  'const Inner = Vue.extend({',
  '    methods: {',
  '        go() {',
  '            this.$emit("inner");',
  '        },',
  '    },',
  '});',
  'export default {',
  '    name: "Outer",',
  '    components: { Inner },',
  '    methods: {',
  '        go() {',
  '            this.$emit("outer");',
  '        },',
  '    },',
  '};',
  '</script>',
);

test('a file whose findings the default export already declares is listed as unresolved, not left out of the report', async () => {
  await withRoot({ 'src/components/Nested.vue': NESTED, 'src/components/Other.vue': OTHER }, async (root) => {
    // The first run cannot tell the two components apart: both names go to `export default`.
    const first = await cli(root);
    assert.equal(first.code, 0, first.err);
    assert.match(read(root, 'src/components/Nested.vue'), /emits: \["outer", "inner"\]|emits: \["inner", "outer"\]/);
    assert.match(first.out, /^\| Unresolved \| 0 \|$/m);

    // The second finds `inner` still undeclared on the inner component, with nothing left to add: it says so.
    const second = await cli(root);
    assert.equal(second.code, 0, second.err);
    assert.deepEqual(second.writes, []);
    assert.match(second.out, /^\| Findings \| 1 \|$/m);
    assert.match(second.out, /^\| Files with findings \| 1 \|$/m);
    assert.match(second.out, /^\| Files to change \| 0 \|$/m);
    assert.match(second.out, /^\| Unresolved \| 1 \|$/m);
    assert.match(
      section(second.out, 'Unresolved'),
      /^\| `src\/components\/Nested\.vue` \| `inner` \| findings remain that the default export already declares \(another component in the file\?\) \|$/m,
    );
  });
});

// ---- usage and failures ---------------------------------------------------------------------

test('usage errors exit 2 with the usage line on stderr and nothing on stdout', async () => {
  await withRoot(FIXTURE, async (root) => {
    await withRoot({ 'README.md': 'no src here\n' }, async (noSrc) => {
      const cases = {
        'an unknown option': ['--root', root, '--bogus'],
        'a positional argument': ['--root', root, 'extra'],
        '--root without a value': ['--root'],
        '--root that does not exist': ['--root', join(root, 'missing')],
        '--root without a src/ folder': ['--root', noSrc],
      };
      for (const [label, argv] of Object.entries(cases)) {
        const out = sink();
        const err = sink();
        const writes = [];
        const code = await run(argv, { out, err, write: (path) => writes.push(path) });
        assert.equal(code, 2, label);
        assert.equal(out.text, '', label);
        assert.match(err.text, /usage: node scripts\/vue3-migration\/declare-emits\.mjs \[--root <dir>\] \[--dry-run\]/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});

test('a lint that cannot run exits 2 with its message, and writes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const makeLinter = () => ({
      lintFiles: async () => {
        throw new Error('No files matching "src" were found.');
      },
    });
    const result = await cli(root, [], { makeLinter });
    assert.equal(result.code, 2);
    assert.match(result.err, /No files matching "src" were found\./);
    assert.equal(result.out, '');
    assert.deepEqual(result.writes, []);
  });
});

test('a changed file that does not parse again is reported under Failed; nothing at all is written; exit 1', async () => {
  await withRoot(FIXTURE, async (root) => {
    const apply = (source, names, file) => {
      const result = declareEmits(source, names, file);
      return file.endsWith('Thing.vue') ? { ...result, source: result.source.replace('</template>', '') } : result;
    };
    const dry = await cli(root, ['--dry-run'], { declare: apply });
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    assert.match(dry.out, /^A real run would write nothing\.$/m);
    assert.match(dry.err, /1 file\(s\) failed; a real run would write nothing/);

    const real = await cli(root, [], { declare: apply });
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/components/Thing.vue'), THING);
    assert.equal(read(root, 'src/components/Other.vue'), OTHER);
    assert.match(section(real.out, 'Failed'), /^- `src\/components\/Thing\.vue`: the SFC parser reports: /m);
    assert.match(real.out, /^Nothing was written\.$/m);
    assert.equal(section(real.out, 'Changed files').trim(), 'None.');
    assert.match(real.err, /1 file\(s\) failed; nothing was written/);
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
        if (path.endsWith('Thing.vue')) throw new Error('EACCES: permission denied');
        writeFileSync(path, contents);
      },
    });
    assert.equal(code, 1);
    assert.match(section(out.text, 'Failed'), /`src\/components\/Thing\.vue`: write failed: EACCES/);
    assert.equal(read(root, 'src/components/Thing.vue'), THING);
    assert.equal(read(root, 'src/components/Other.vue'), OTHER_AFTER);
    const changed = section(out.text, 'Changed files');
    assert.match(changed, /Other\.vue/);
    assert.doesNotMatch(changed, /Thing\.vue/);
  });
});
