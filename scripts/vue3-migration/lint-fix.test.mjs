import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import vueTemplateCompiler from 'vue-template-compiler';
import { SAFE_ON_VUE2, dataSiteKey, fixTree, rootDataSites, run, shouldFix } from './lint-fix.mjs';
import { vue3Linter } from './vue3-eslint.mjs';

const { compile, parseComponent } = vueTemplateCompiler;
const require = createRequire(import.meta.url);

const SLOT = 'vue/no-deprecated-slot-attribute';
const SLOT_SCOPE = 'vue/no-deprecated-slot-scope-attribute';
const DATA = 'vue/no-deprecated-data-object-declaration';
const ALL_SAFE = ['--rule', SLOT, '--rule', SLOT_SCOPE, '--rule', DATA];

// The fixture is a tiny tree under a temp root: a page (`X`) whose root instance has a `data` object, and a
// component with two slots (one scoped) on a `<b-table>`. Both files also hold a `beforeDestroy()`, which
// another rule (`vue/no-deprecated-destroyed-lifecycle`) would fix to a Vue 3-only name.

const MAIN = [
  'import Vue from "vue";',
  'import Template from "./Template.vue";',
  'new Vue({ data: { a: 1 }, beforeDestroy() {}, render: (h) => h(Template) }).$mount("#app");',
  '',
].join('\n');
const TEMPLATE = [
  '<template>',
  '  <b-table :items="items">',
  '    <template slot="title" slot-scope="s">{{ s.value }}</template>',
  '    <template slot="foot">footer</template>',
  '  </b-table>',
  '</template>',
  '<script>',
  'export default {',
  '    name: "Template",',
  '    data() {',
  '        return { items: [] };',
  '    },',
  '    beforeDestroy() {},',
  '};',
  '</script>',
  '',
].join('\n');

const FIXTURE = {
  'src/views/X/main.js': MAIN,
  'src/views/X/Template.vue': TEMPLATE,
};

/** Writes `files` (path -> text) under a fresh temp root, runs `fn(root)`, and always removes the root. */
async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'lint-fix-'));
  try {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), text);
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
    write(text) {
      chunks.push(text);
      return true;
    },
    get text() {
      return chunks.join('');
    },
  };
}

/** `run` against `root` with its output collected; `writes` lists the paths `write` was asked to write. */
async function cli(root, argv, deps = {}) {
  const out = sink();
  const err = sink();
  const writes = [];
  const code = await run(['--root', root, ...argv], {
    ...deps,
    out,
    err,
    write: (path, text) => {
      writes.push(path);
      writeFileSync(path, text);
    },
  });
  return { code, out: out.text, err: err.text, writes };
}

// ---- usage errors -------------------------------------------------------------------------------------

test('refuses a rule outside SAFE_ON_VUE2: exit 2, stderr names the rule and why, nothing is written', async () => {
  await withRoot(FIXTURE, async (root) => {
    const result = await cli(root, ['--rule', 'vue/no-deprecated-v-bind-sync']);
    assert.equal(result.code, 2);
    assert.match(result.err, /vue\/no-deprecated-v-bind-sync/);
    assert.match(result.err, /its fix writes Vue 3-only syntax/);
    assert.equal(result.out, '');
    assert.deepEqual(result.writes, []);

    // One unsafe rule among safe ones refuses the whole run.
    const mixed = await cli(root, ['--rule', SLOT, '--rule', 'vue/no-deprecated-destroyed-lifecycle']);
    assert.equal(mixed.code, 2);
    assert.match(mixed.err, /vue\/no-deprecated-destroyed-lifecycle/);
    assert.deepEqual(mixed.writes, []);
    assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);
  });
});

test('SAFE_ON_VUE2 is the three rules whose fix is valid on 2.7', () => {
  assert.deepEqual([...SAFE_ON_VUE2].sort(), [DATA, SLOT, SLOT_SCOPE]);
});

test('usage errors exit 2 with the usage line on stderr and nothing on stdout', async () => {
  await withRoot(FIXTURE, async (root) => {
    await withRoot({ 'README.md': 'no src here\n' }, async (noSrc) => {
      const cases = {
        'no --rule': ['--root', root],
        'an unknown option': ['--root', root, '--rule', SLOT, '--bogus'],
        'a positional argument': ['--root', root, '--rule', SLOT, 'extra'],
        '--rule without a value': ['--root', root, '--rule'],
        '--root without a value': ['--rule', SLOT, '--root'],
        '--root that does not exist': ['--rule', SLOT, '--root', join(root, 'missing')],
        '--root without a src/ folder': ['--rule', SLOT, '--root', noSrc],
      };
      for (const [label, argv] of Object.entries(cases)) {
        const out = sink();
        const err = sink();
        const writes = [];
        const code = await run(argv, { out, err, write: (path) => writes.push(path) });
        assert.equal(code, 2, label);
        assert.equal(out.text, '', label);
        assert.match(err.text, /usage: node scripts\/vue3-migration\/lint-fix\.mjs --rule <id>/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});

// ---- the fixes ------------------------------------------------------------------------------------------

test('rewrites slot and slot-scope on a template to v-slot', async () => {
  await withRoot(FIXTURE, async (root) => {
    const real = await cli(root, ['--rule', SLOT, '--rule', SLOT_SCOPE]);
    assert.equal(real.code, 0);
    const template = read(root, 'src/views/X/Template.vue');
    assert.doesNotMatch(template, /\sslot=/);
    assert.doesNotMatch(template, /slot-scope=/);
    // Only the two attributes change, and nothing else moves.
    assert.equal(
      template,
      TEMPLATE.replace('<template slot="title" slot-scope="s">', '<template v-slot:title="s">').replace('<template slot="foot">', '<template v-slot:foot>'),
    );
    // The result still compiles on Vue 2.7.
    const { errors } = compile(parseComponent(template).template.content);
    assert.deepEqual(errors, []);
  });
});

// ESLint's merged fix for `slot` + `slot-scope` replaces one attribute and removes the other, and its text keeps
// the whitespace that stood between them. lint-fix trims it, so no stray space or blank line is left behind.
const WHITESPACE_BEFORE = [
  '<template>',
  '  <b-table>',
  '    <template slot="a" slot-scope="s"><p>{{ s }}</p></template>',
  '    <template',
  '      slot="b"',
  '      slot-scope="{ f }"',
  '    ><p>{{ f }}</p></template>',
  '    <template slot-scope="t" slot="c"><p>{{ t }}</p></template>',
  '  </b-table>',
  '</template>',
  '<script>',
  'export default { name: "Whitespace" };',
  '</script>',
  '',
].join('\n');
const WHITESPACE_AFTER = [
  '<template>',
  '  <b-table>',
  '    <template v-slot:a="s"><p>{{ s }}</p></template>',
  '    <template',
  '      v-slot:b="{ f }"',
  '    ><p>{{ f }}</p></template>',
  '    <template v-slot:c="t"><p>{{ t }}</p></template>',
  '  </b-table>',
  '</template>',
  '<script>',
  'export default { name: "Whitespace" };',
  '</script>',
  '',
].join('\n');

test('the slot fix leaves no stray whitespace: same line, attributes on their own lines, slot-scope first', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Whitespace.vue': WHITESPACE_BEFORE }, async (root) => {
    const real = await cli(root, ['--rule', SLOT, '--rule', SLOT_SCOPE]);
    assert.equal(real.code, 0);
    const text = read(root, 'src/components/Whitespace.vue');
    assert.equal(text, WHITESPACE_AFTER);
    assert.doesNotMatch(text, /^[ \t]+$/m);
    assert.deepEqual(compile(parseComponent(text).template.content).errors, []);

    const again = await cli(root, ['--rule', SLOT, '--rule', SLOT_SCOPE]);
    assert.equal(again.code, 0);
    assert.equal(read(root, 'src/components/Whitespace.vue'), WHITESPACE_AFTER);
  });
});

// Review focus 3: BootstrapVue names its slots `cell(name)`, `head(x)`. eslint-plugin-vue declines to convert a
// slot name with anything but word characters and `-` (its `canConvertFromSlotToVSlot`), so such a template is
// left as it is and stays counted. The v-slot form it would become does compile on 2.7.
const PAREN = '<template>\n  <b-table :items="items">\n    <template slot="cell(name)" slot-scope="r">{{ r.value }}</template>\n  </b-table>\n</template>\n<script>\nexport default { name: "Paren" };\n</script>\n';

test('a parenthesised slot name is left alone (the stock fixer declines it) and stays in the count', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Paren.vue': PAREN }, async (root) => {
    const result = await fixTree({ root, rules: [SLOT, SLOT_SCOPE], dryRun: false });
    assert.equal(read(root, 'src/components/Paren.vue'), PAREN);
    assert.deepEqual(result.changed, ['src/views/X/Template.vue']);
    assert.deepEqual(result.before, { [SLOT]: 3, [SLOT_SCOPE]: 2 });
    assert.deepEqual(result.after, { [SLOT]: 1, [SLOT_SCOPE]: 1 });
  });
});

test('the v-slot form of a parenthesised slot name compiles on Vue 2.7', () => {
  const { errors, render } = compile('<b-table :items="items"><template v-slot:cell(name)="r">{{ r.value }}</template></b-table>');
  assert.deepEqual(errors, []);
  assert.match(render, /key:"cell\(name\)"/);
});

// ESLint's own fix writes `function() {\nreturn <object>;\n}`, which leaves `return` in column 0 and the object's
// lines under-indented. lint-fix writes the arrow form `() => (<object>)` around the same object text instead.
const DATA_MULTILINE = 'new Vue({\n    data: {\n        a: 1,\n    },\n})\n';
const DATA_MULTILINE_FIXED = 'new Vue({\n    data: () => ({\n        a: 1,\n    }),\n})\n';

test('turns a root data object into an arrow function that returns it, around the same object text', async () => {
  await withRoot({ ...FIXTURE, 'src/views/Y/main.js': `import Vue from "vue";\n${DATA_MULTILINE}` }, async (root) => {
    const real = await cli(root, ['--rule', DATA]);
    assert.equal(real.code, 0);
    assert.equal(read(root, 'src/views/X/main.js'), MAIN.replace('data: { a: 1 }', 'data: () => ({ a: 1 })'));
    assert.equal(read(root, 'src/views/Y/main.js'), `import Vue from "vue";\n${DATA_MULTILINE_FIXED}`);
    // The slot rules were not asked for.
    assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);

    const again = await cli(root, ['--rule', DATA]);
    assert.equal(again.code, 0);
    assert.deepEqual(again.writes, []);
    assert.equal(read(root, 'src/views/Y/main.js'), `import Vue from "vue";\n${DATA_MULTILINE_FIXED}`);
  });
});

const WRAP_OPEN = 'function() {\nreturn ';
const WRAP_CLOSE = ';\n}';

test('shouldFix rewrites the data-object fix only when its text is exactly the function wrapper', () => {
  const wanted = new Set([DATA]);
  const fixOf = (text) => ({ range: [10, 30], text });
  // The site is one of the root instances' data objects, which is what lets the fix through.
  const accepts = (text) => {
    const message = { ruleId: DATA, fix: fixOf(text) };
    return [shouldFix(message, wanted, new Set([dataSiteKey(message.fix)])), message.fix];
  };

  // The shape ESLint 8.57.1 writes, for an object, a parenthesised object and a call.
  assert.deepEqual(accepts(`${WRAP_OPEN}{\n  a: 1,\n}${WRAP_CLOSE}`), [true, fixOf('() => ({\n  a: 1,\n})')]);
  assert.deepEqual(accepts(`${WRAP_OPEN}({ a: 1 })${WRAP_CLOSE}`), [true, fixOf('() => (({ a: 1 }))')]);
  assert.deepEqual(accepts(`${WRAP_OPEN}make()${WRAP_CLOSE}`), [true, fixOf('() => (make())')]);

  // Anything else is refused, and the fix is left exactly as ESLint made it.
  for (const text of ['', 'odd(', `${WRAP_OPEN}{}`, `{}${WRAP_CLOSE}`, `${WRAP_OPEN}${WRAP_CLOSE}`, `function () {\nreturn {};\n}`, `${WRAP_OPEN}{}; // x\n}`]) {
    assert.deepEqual(accepts(text), [false, fixOf(text)], JSON.stringify(text));
  }

  // A rule that was not asked for is refused without touching its fix.
  const other = { ruleId: SLOT, fix: fixOf(' v-slot:a="s" ') };
  assert.equal(shouldFix(other, wanted, new Set()), false);
  assert.deepEqual(other.fix, fixOf(' v-slot:a="s" '));
});

test('shouldFix refuses a data object that is not a root instance\'s, and leaves its fix as ESLint made it', () => {
  const wanted = new Set([DATA]);
  const fix = { range: [10, 30], text: `${WRAP_OPEN}{ a: 1 }${WRAP_CLOSE}` };
  const message = { ruleId: DATA, fix: { ...fix } };
  assert.equal(shouldFix(message, wanted, new Set()), false);
  assert.deepEqual(message.fix, fix);
  // Not even the default, with no root sites given, lets a data fix through.
  assert.equal(shouldFix(message, wanted), false);
  assert.deepEqual(message.fix, fix);
});

// ---- component data: left alone ---------------------------------------------------------------------------
//
// `vue/no-deprecated-data-object-declaration` also fires on a component's `data: { ... }`. There 2.7 drops the
// object (with a warning), so the component has no data at all, and an arrow function around it would make the
// data live. Only the options of `new Vue(...)` may take the fix: 2.7 does read an object there.

test('2.7 drops a component\'s object data and keeps a root instance\'s (why only `new Vue` takes the fix)', () => {
  const Vue = require('vue/dist/vue.common.dev.js');
  const warnings = [];
  const { warnHandler } = Vue.config;
  Vue.config.warnHandler = (message) => warnings.push(message);
  try {
    const Component = Vue.extend({ data: { x: 1 } });
    assert.equal(new Component().x, undefined);
    assert.match(warnings.join('\n'), /The "data" option should be a function/);
    assert.equal(new Vue({ data: { x: 1 } }).x, 1);
  } finally {
    Vue.config.warnHandler = warnHandler;
  }
});

const COMPONENT_DATA_VUE = '<template>\n  <div>{{ x }}</div>\n</template>\n<script>\nexport default {\n  name: "Plain",\n  data: { x: 1 },\n};\n</script>\n';
const COMPONENT_DATA_JS = [
  'import Vue from "vue";',
  'export const A = Vue.extend({ data: { x: 1 } });',
  'Vue.component("b", { data: { y: 2 } });',
  '',
].join('\n');

test('a component\'s data object is left as it is and stays counted: `export default` in a .vue, Vue.extend and Vue.component in a .js', async () => {
  await withRoot({ 'src/components/Plain.vue': COMPONENT_DATA_VUE, 'src/components/defs.js': COMPONENT_DATA_JS }, async (root) => {
    const dry = await fixTree({ root, rules: [DATA], dryRun: true });
    assert.deepEqual(dry, { before: { [DATA]: 3 }, after: { [DATA]: 3 }, changed: [], failed: [], failures: [] });

    const real = await cli(root, ['--rule', DATA]);
    assert.equal(real.code, 0);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/components/Plain.vue'), COMPONENT_DATA_VUE);
    assert.equal(read(root, 'src/components/defs.js'), COMPONENT_DATA_JS);
    assert.match(real.out, /^\| `vue\/no-deprecated-data-object-declaration` \| 3 \| 3 \|$/m);
    assert.equal(real.out.split('## Changed files')[1].trim(), 'None.');
  });
});

test('in one file the root instance\'s data is fixed and the component\'s beside it is not', async () => {
  const before = [
    'import Vue from "vue";',
    'export const A = Vue.extend({ data: { x: 1 } });',
    'new Vue({ data: ({ a: 1 }), render: (h) => h(A) });',
    'new Vue({ "data": { b: 2 } });',
    '',
  ].join('\n');
  const after = [
    'import Vue from "vue";',
    'export const A = Vue.extend({ data: { x: 1 } });',
    'new Vue({ data: () => (({ a: 1 })), render: (h) => h(A) });',
    'new Vue({ "data": () => ({ b: 2 }) });',
    '',
  ].join('\n');
  await withRoot({ 'src/views/Z/main.js': before }, async (root) => {
    const real = await fixTree({ root, rules: [DATA], dryRun: false });
    assert.deepEqual(real.changed, ['src/views/Z/main.js']);
    assert.deepEqual([real.before, real.after], [{ [DATA]: 3 }, { [DATA]: 1 }]);
    assert.equal(read(root, 'src/views/Z/main.js'), after);
    // A second run changes nothing.
    assert.deepEqual((await fixTree({ root, rules: [DATA], dryRun: false })).changed, []);
  });
});

test('in a .vue file the root instance in the script is found at its file offset, past a slot fix in the template', async () => {
  const before = [
    '<template>',
    '  <b-table><template slot="a" slot-scope="s">{{ s }}</template></b-table>',
    '</template>',
    '<script>',
    'import Vue from "vue";',
    'new Vue({ data: { a: 1 } });',
    'export default {',
    '  name: "Both",',
    '  data: { x: 1 },',
    '};',
    '</script>',
    '',
  ].join('\n');
  const after = before.replace('<template slot="a" slot-scope="s">', '<template v-slot:a="s">').replace('{ data: { a: 1 } }', '{ data: () => ({ a: 1 }) }');
  await withRoot({ 'src/components/Both.vue': before }, async (root) => {
    const real = await fixTree({ root, rules: [SLOT, SLOT_SCOPE, DATA], dryRun: false });
    assert.deepEqual([real.before[DATA], real.after[DATA]], [2, 1]);
    assert.equal(read(root, 'src/components/Both.vue'), after);
  });
});

test('a component inside a root instance\'s data object is not the root\'s data, so only the outer one is fixed', async () => {
  const before = 'import Vue from "vue";\nnew Vue({ data: { Child: Vue.extend({ data: { z: 1 } }) } });\n';
  const after = 'import Vue from "vue";\nnew Vue({ data: () => ({ Child: Vue.extend({ data: { z: 1 } }) }) });\n';
  await withRoot({ 'src/views/Z/main.js': before }, async (root) => {
    const real = await fixTree({ root, rules: [DATA], dryRun: false });
    assert.deepEqual([real.before, real.after], [{ [DATA]: 2 }, { [DATA]: 1 }]);
    assert.equal(read(root, 'src/views/Z/main.js'), after);
  });
});

test('a root instance and a component whose fixes read alike (same position, same text) are both left alone', async () => {
  // Both fixes start at column 11 and wrap the same object text, so a lookup by position and text cannot tell them
  // apart. Rather than guess, it fixes neither.
  const root1 = 'import Vue from "vue";\nnew Vue(   { data: { a: 1 } });\n';
  const same = 'import Vue from "vue";\nVue.extend({ data: { a: 1 } });\n';
  await withRoot({ 'src/views/Z/main.js': root1, 'src/components/same.js': same }, async (root) => {
    const real = await fixTree({ root, rules: [DATA], dryRun: false });
    assert.deepEqual(real.changed, []);
    assert.deepEqual([real.before, real.after], [{ [DATA]: 2 }, { [DATA]: 2 }]);
    assert.equal(read(root, 'src/views/Z/main.js'), root1);
    assert.equal(read(root, 'src/components/same.js'), same);
  });
});

test('a file the parser cannot read gives no root sites, so its data object stays', async () => {
  await withRoot({ 'src/views/Z/main.js': 'new Vue({ data: { a: 1 },\n' }, async (root) => {
    const message = { ruleId: DATA, fix: { range: [20, 28], text: `${WRAP_OPEN}{ a: 1 }${WRAP_CLOSE}` } };
    assert.equal(rootDataSites([{ filePath: join(root, 'src/views/Z/main.js'), messages: [message] }]).size, 0);
    assert.equal(rootDataSites([{ filePath: join(root, 'src/views/Z/gone.js'), messages: [message] }]).size, 0);
  });
});

test('leaves other rules alone: beforeDestroy stays, though another rule would fix it', async () => {
  await withRoot(FIXTURE, async (root) => {
    // The fixture does trigger that fixer, or this test would pass for nothing.
    const unfiltered = await vue3Linter({ cwd: root, fix: true }).lintFiles(['src']);
    assert.ok(unfiltered.some((result) => result.output?.includes('beforeUnmount')));

    const real = await cli(root, ALL_SAFE);
    assert.equal(real.code, 0);
    assert.match(read(root, 'src/views/X/main.js'), /beforeDestroy\(\) \{\}/);
    assert.match(read(root, 'src/views/X/Template.vue'), /beforeDestroy\(\) \{\},\n\};/);
    assert.doesNotMatch(read(root, 'src/views/X/main.js') + read(root, 'src/views/X/Template.vue'), /beforeUnmount/);
  });
});

// ---- the report and the writes ----------------------------------------------------------------------------

test('a dry run writes nothing and reports; a real run writes the same files; a second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, [...ALL_SAFE, '--dry-run']);
    assert.equal(dry.code, 0);
    assert.deepEqual(dry.writes, []);
    assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);
    assert.equal(read(root, 'src/views/X/main.js'), MAIN);
    assert.match(dry.out, /^# Lint fix \(dry run\)$/m);
    assert.match(dry.out, /^\| Rule \| Before \| After \|$/m);
    assert.match(dry.out, /^\| `vue\/no-deprecated-data-object-declaration` \| 1 \| 0 \|$/m);
    assert.match(dry.out, /^\| `vue\/no-deprecated-slot-attribute` \| 2 \| 0 \|$/m);
    assert.match(dry.out, /^\| `vue\/no-deprecated-slot-scope-attribute` \| 1 \| 0 \|$/m);
    assert.match(dry.out, /^## Files that would change$/m);
    assert.match(dry.out, /^- `src\/views\/X\/Template\.vue`$/m);
    assert.match(dry.out, /^- `src\/views\/X\/main\.js`$/m);
    assert.doesNotMatch(dry.out, /^## Failed$/m);
    assert.equal(dry.err, '');

    const real = await cli(root, ALL_SAFE);
    assert.equal(real.code, 0);
    assert.match(real.out, /^# Lint fix$/m);
    assert.match(real.out, /^## Changed files$/m);
    assert.match(real.out, /^- `src\/views\/X\/Template\.vue`$/m);
    assert.deepEqual(real.writes, [join(root, 'src/views/X/Template.vue'), join(root, 'src/views/X/main.js')]);
    assert.notEqual(read(root, 'src/views/X/Template.vue'), TEMPLATE);

    const again = await cli(root, ALL_SAFE);
    assert.equal(again.code, 0);
    assert.deepEqual(again.writes, []);
    assert.match(again.out, /^\| `vue\/no-deprecated-slot-attribute` \| 0 \| 0 \|$/m);
    assert.equal(again.out.split('## Changed files')[1].trim(), 'None.');
  });
});

test('fixTree returns the counts before and after, the files changed and the files failed', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await fixTree({ root, rules: new Set([SLOT, SLOT_SCOPE, DATA]), dryRun: true });
    assert.deepEqual(dry, {
      before: { [DATA]: 1, [SLOT]: 2, [SLOT_SCOPE]: 1 },
      after: { [DATA]: 0, [SLOT]: 0, [SLOT_SCOPE]: 0 },
      changed: ['src/views/X/Template.vue', 'src/views/X/main.js'],
      failed: [],
      failures: [],
    });
    assert.equal(read(root, 'src/views/X/main.js'), MAIN);

    await fixTree({ root, rules: [SLOT, SLOT_SCOPE, DATA], dryRun: false });
    const again = await fixTree({ root, rules: [SLOT, SLOT_SCOPE, DATA], dryRun: false });
    assert.deepEqual(again.changed, []);
    assert.deepEqual(again.before, again.after);
  });
});

test('fixTree throws for a rule outside SAFE_ON_VUE2', async () => {
  await withRoot(FIXTURE, async (root) => {
    await assert.rejects(fixTree({ root, rules: ['vue/no-deprecated-v-bind-sync'], dryRun: true }), /vue\/no-deprecated-v-bind-sync.*Vue 3-only syntax/);
  });
});

test('files that ESLint cannot parse are counted as fatal, not skipped silently', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Broken.vue': '<template><div /></template>\n<script>\nexport default {\n</script>\n' }, async (root) => {
    const result = await fixTree({ root, rules: [SLOT], dryRun: true });
    assert.equal(result.before.fatal, 1);
    assert.equal(result.after.fatal, 1);
    const report = await cli(root, ['--rule', SLOT, '--dry-run']);
    assert.match(report.out, /^\| fatal \| 1 \| 1 \|$/m);
  });
});

// ---- a lint that cannot run: exit 2 ---------------------------------------------------------------------------

test('a lint that cannot run exits 2 with its message, writes nothing and prints no report', async () => {
  await withRoot(FIXTURE, async (root) => {
    const broken = (message) => () => ({
      lintFiles: async () => {
        throw new Error(message);
      },
    });
    const result = await cli(root, ALL_SAFE, { makeLinter: broken('No files matching "src" were found.') });
    assert.equal(result.code, 2);
    assert.match(result.err, /^lint-fix: the lint failed: No files matching "src" were found\.$/m);
    assert.equal(result.out, '');
    assert.deepEqual(result.writes, []);

    // The same when only the second lint, the one that fixes, cannot run.
    const second = await cli(root, ALL_SAFE, {
      makeLinter: (options) => (options.fix ? broken('the fixing lint broke\nacross two lines')(options) : vue3Linter(options)),
    });
    assert.equal(second.code, 2);
    assert.match(second.err, /^lint-fix: the lint failed: the fixing lint broke across two lines$/m);
    assert.equal(second.out, '');
    assert.deepEqual(second.writes, []);
    assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);
  });
});

// ---- failures: nothing at all is written, exit 1 -------------------------------------------------------------

/** A `makeLinter` whose fixing linter passes each of its results through `damage`; the plain one is the real one. */
const damaging = (damage) => (options) => {
  const linter = vue3Linter(options);
  if (!options.fix) return linter;
  const lintFiles = linter.lintFiles.bind(linter);
  linter.lintFiles = async (patterns) => (await lintFiles(patterns)).map(damage);
  return linter;
};

const FATAL = { ruleId: null, fatal: true, severity: 2, message: 'Parsing error: Unexpected token', line: 3, column: 1 };

for (const [name, damage, pattern] of [
  [
    'a template that gains an SFC error',
    (result) => (result.filePath.endsWith('Template.vue') ? { ...result, output: result.output.replace('</template>', '') } : result),
    /Template\.vue`: the SFC parser reports: .*(no matching end tag|end tag)/i,
  ],
  [
    'a script that no longer parses',
    (result) => (result.filePath.endsWith('main.js') ? { ...result, messages: [...result.messages, FATAL] } : result),
    /main\.js`: .*Parsing error: Unexpected token/,
  ],
]) {
  test(`${name} is reported under Failed; nothing is written, not even the files that were fine; exit 1`, async () => {
    await withRoot(FIXTURE, async (root) => {
      const dry = await cli(root, [...ALL_SAFE, '--dry-run'], { makeLinter: damaging(damage) });
      assert.equal(dry.code, 1);
      assert.deepEqual(dry.writes, []);
      assert.match(dry.out, /^## Failed$/m);
      assert.match(dry.out, /^A real run would write nothing\.$/m);

      const real = await cli(root, ALL_SAFE, { makeLinter: damaging(damage) });
      assert.equal(real.code, 1);
      assert.deepEqual(real.writes, []);
      assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);
      assert.equal(read(root, 'src/views/X/main.js'), MAIN);
      assert.match(real.out, /^## Failed$/m);
      assert.match(real.out.split('## Failed')[1].split('\n## ')[0], pattern);
      assert.match(real.out, /^Nothing was written\.$/m);
      assert.equal(real.out.split('## Changed files')[1].trim(), 'None.');
      assert.match(real.err, /1 file\(s\) failed; nothing was written/);
      assert.match(dry.err, /1 file\(s\) failed; a real run would write nothing/);
    });
  });
}

test('a write that throws is a failure with its message; the other files are still written', async () => {
  await withRoot(FIXTURE, async (root) => {
    const out = sink();
    const err = sink();
    const code = await run(['--root', root, ...ALL_SAFE], {
      out,
      err,
      write: (path, text) => {
        if (path.endsWith('main.js')) throw new Error('EACCES: permission denied');
        writeFileSync(path, text);
      },
    });
    assert.equal(code, 1);
    assert.match(out.text.split('## Failed')[1].split('\n## ')[0], /`src\/views\/X\/main\.js`: write failed: EACCES/);
    assert.equal(read(root, 'src/views/X/main.js'), MAIN);
    assert.notEqual(read(root, 'src/views/X/Template.vue'), TEMPLATE);
    const changed = out.text.split('## Changed files')[1];
    assert.match(changed, /Template\.vue/);
    assert.doesNotMatch(changed, /main\.js/);
  });
});
