import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import vueTemplateCompiler from 'vue-template-compiler';
import { SAFE_ON_VUE2, fixTree, run } from './lint-fix.mjs';
import { vue3Linter } from './vue3-eslint.mjs';

const { compile, parseComponent } = vueTemplateCompiler;

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
    assert.match(template, /<template v-slot:title="s"\s*>\{\{ s\.value \}\}<\/template>/);
    assert.match(template, /<template v-slot:foot>footer<\/template>/);
    assert.doesNotMatch(template, /\sslot=/);
    assert.doesNotMatch(template, /slot-scope=/);
    // Only the two attributes change: ESLint leaves a space where it removed `slot-scope`, and nothing else moves.
    assert.equal(
      template,
      TEMPLATE.replace('<template slot="title" slot-scope="s">', '<template v-slot:title="s" >').replace('<template slot="foot">', '<template v-slot:foot>'),
    );
    // The result still compiles on Vue 2.7.
    const { errors } = compile(parseComponent(template).template.content);
    assert.deepEqual(errors, []);
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

test('turns a root data object into a function that returns it', async () => {
  await withRoot(FIXTURE, async (root) => {
    const real = await cli(root, ['--rule', DATA]);
    assert.equal(real.code, 0);
    assert.match(read(root, 'src/views/X/main.js'), /data: function\(\) \{\s*return \{ a: 1 \};\s*\}, beforeDestroy\(\) \{\}/);
    // The slot rules were not asked for.
    assert.equal(read(root, 'src/views/X/Template.vue'), TEMPLATE);
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
