import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { applyRegistrations } from './register-write.mjs';
import { pageName, run } from './register-components.mjs';

// The fixture is a tiny tree under a temp root: a page (`P`) whose template uses <comp-a> and <comp-b>,
// and a component A that is defined as comp-a and uses <comp-b>. Three uses, two files to change.

const MAIN = [
  'import Vue from "vue";',
  'import Template from "./Template.vue";',
  'import "@/components/A.vue";',
  'import "@/components/B.vue";',
  'new Vue({ render: (h) => h(Template) }).$mount("#app");',
  '',
].join('\n');
const TEMPLATE = '<template>\n  <div>\n    <comp-a />\n    <comp-b />\n  </div>\n</template>\n<script>\nexport default {\n    name: "Template",\n};\n</script>\n';
const COMP_A =
  '<template>\n  <div>\n    <comp-b />\n  </div>\n</template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("comp-a", {\n    name: "CompA",\n});\n</script>\n';
const COMP_B = '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("comp-b", {});\n</script>\n';

const FIXTURE = {
  'src/views/P/main.js': MAIN,
  'src/views/P/Template.vue': TEMPLATE,
  'src/components/A.vue': COMP_A,
  'src/components/B.vue': COMP_B,
};

/** Writes `files` (path -> text) under a fresh temp root, runs `fn(root)`, and always removes the root. */
async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'register-components-'));
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
async function cli(root, argv = [], deps = {}) {
  const out = sink();
  const err = sink();
  const writes = [];
  const write = deps.write ?? ((path, text) => writeFileSync(path, text));
  const code = await run(['--root', root, ...argv], {
    ...deps,
    out,
    err,
    write: (path, text) => {
      writes.push(path);
      write(path, text);
    },
  });
  return { code, out: out.text, err: err.text, writes };
}

// ---- the report and the writes ------------------------------------------------------------------

test('a dry run writes nothing and reports 3 entries in 2 files; a real run writes them; a second run changes nothing', async () => {
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.deepEqual(dry.writes, []);
    assert.equal(read(root, 'src/views/P/Template.vue'), TEMPLATE);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    assert.match(dry.out, /^# Register components \(dry run\)$/m);
    assert.match(dry.out, /^\| Findings \| 3 \|$/m);
    assert.match(dry.out, /^\| Files to change \| 2 \|$/m);
    assert.match(dry.out, /^\| Entries \| 3 \|$/m);
    assert.match(dry.out, /^\| Unresolved \| 0 \|$/m);
    assert.match(dry.out, /^## Files that would change$/m);
    assert.match(dry.out, /^- `src\/components\/A\.vue`$/m);
    assert.match(dry.out, /^- `src\/views\/P\/Template\.vue`$/m);
    assert.doesNotMatch(dry.out, /^## (Failed|Analysis errors)$/m);
    assert.equal(dry.err, '');

    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.match(real.out, /^# Register components$/m);
    assert.match(real.out, /^## Changed files$/m);
    // Only the files that change are written, in sorted order; B.vue has nothing to add.
    assert.deepEqual(real.writes, [join(root, 'src/components/A.vue'), join(root, 'src/views/P/Template.vue')]);
    const template = read(root, 'src/views/P/Template.vue');
    assert.match(template, /import CompA from "@\/components\/A\.vue";/);
    assert.match(template, /import CompB from "@\/components\/B\.vue";/);
    assert.match(template, /components: \{\n\s+CompA,\n\s+CompB,\n\s+\},/);
    assert.match(read(root, 'src/components/A.vue'), /import CompB from "@\/components\/B\.vue";/);
    assert.equal(read(root, 'src/components/B.vue'), COMP_B);

    const again = await cli(root);
    assert.equal(again.code, 0);
    assert.deepEqual(again.writes, []);
    assert.match(again.out, /^\| Findings \| 0 \|$/m);
    assert.match(again.out, /^\| Files to change \| 0 \|$/m);
    assert.match(again.out, /^\| Entries \| 0 \|$/m);
  });
});

test('the same input gives byte-identical output', async () => {
  await withRoot(FIXTURE, async (root) => {
    const first = await cli(root, ['--dry-run']);
    const second = await cli(root, ['--dry-run']);
    assert.equal(first.out, second.out);
  });
});

test('unresolved items are a table sorted by file and line, with candidates, and exit stays 0', async () => {
  const files = {
    ...FIXTURE,
    'src/views/P/Legacy.vue': '<template>\n  <div>\n    <center />\n    <dup-comp />\n    <comp-a />\n  </div>\n</template>\n<script>\nexport default {};\n</script>\n',
    'src/components/Dup1.vue': '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("dup-comp", {});\n</script>\n',
    'src/components/Dup2.vue': '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("dup-comp", {});\n</script>\n',
  };
  await withRoot(files, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.match(dry.out, /^\| Unresolved \| 2 \|$/m);
    assert.match(dry.out, /^\| Unresolved: no-registration \| 1 \|$/m);
    assert.match(dry.out, /^\| Unresolved: ambiguous \| 1 \|$/m);
    assert.doesNotMatch(dry.out, /^\| Unresolved: self /m);
    const table = dry.out.split('\n').filter((line) => line.startsWith('| `src/views/P/Legacy.vue:'));
    assert.deepEqual(table, [
      '| `src/views/P/Legacy.vue:3` | `center` | no-registration |  |',
      '| `src/views/P/Legacy.vue:4` | `dup-comp` | ambiguous | `src/components/Dup1.vue`, `src/components/Dup2.vue` |',
    ]);
    assert.match(dry.out, /^\| file:line \| tag \| reason \| candidates \/ pages \|$/m);
    // The resolvable <comp-a> in the same file is still planned.
    assert.match(dry.out, /^\| Entries \| 4 \|$/m);
  });
});

// A second page, Q, loads A (which uses <comp-b>) but not B: on Q the tag is an unknown element today.
const PAGE_Q_MAIN = 'import Vue from "vue";\nimport "@/components/A.vue";\nnew Vue({}).$mount("#app");\n';

test('a tag a page never loads is not-loaded: it has its own totals row and its table row shows the page', async () => {
  await withRoot({ ...FIXTURE, 'src/views/Q/main.js': PAGE_Q_MAIN }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.match(dry.out, /^\| Unresolved \| 1 \|$/m);
    assert.match(dry.out, /^\| Unresolved: not-loaded \| 1 \|$/m);
    assert.match(dry.out, /^\| file:line \| tag \| reason \| candidates \/ pages \|$/m);
    const table = dry.out.split('\n').filter((line) => line.startsWith('| `src/components/A.vue:'));
    assert.deepEqual(table, ['| `src/components/A.vue:3` | `comp-b` | not-loaded | `Q` |']);
    // A has no other use, so only the template (comp-a, comp-b: both pages that render it load them) changes.
    assert.match(dry.out, /^\| Files to change \| 1 \|$/m);
    assert.match(dry.out, /^\| Entries \| 2 \|$/m);
    assert.doesNotMatch(dry.out.split('## Files that would change')[1], /A\.vue/);

    // A real run leaves the not-loaded use alone.
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
  });
});

test('every page that does not load the tag is listed by its folder, sorted, even for a nested page', async () => {
  const nested = 'import "@/components/A.vue";\n';
  await withRoot(
    { ...FIXTURE, 'src/views/Z/main.js': nested, 'src/views/Q/main.js': PAGE_Q_MAIN, 'src/views/group/R/main.js': nested },
    async (root) => {
      const dry = await cli(root, ['--dry-run']);
      const table = dry.out.split('\n').filter((line) => line.startsWith('| `src/components/A.vue:'));
      assert.deepEqual(table, ['| `src/components/A.vue:3` | `comp-b` | not-loaded | `Q`, `Z`, `group/R` |']);
    },
  );
});

// Nine portal branches keep their pages under src/portals/<Portal>/views/ (C1).
test('a page outside src/views is a page too: its evidence makes a tag not-loaded, and the table names it by its path', async () => {
  await withRoot({ ...FIXTURE, 'src/portals/X/views/Q/main.js': PAGE_Q_MAIN }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.match(dry.out, /^\| Unresolved: not-loaded \| 1 \|$/m);
    const table = dry.out.split('\n').filter((line) => line.startsWith('| `src/components/A.vue:'));
    assert.deepEqual(table, ['| `src/components/A.vue:3` | `comp-b` | not-loaded | `portals/X/views/Q` |']);
    // The real run leaves the use alone, as it would for a page under src/views.
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
  });
});

test('pageName is the page folder under src/views, or the path under src/ for a page anywhere else', () => {
  assert.equal(pageName('src/views/Gene/main.js'), 'Gene');
  assert.equal(pageName('src/views/group/R/main.js'), 'group/R');
  assert.equal(pageName('src/portals/PanKbase/views/Gene/main.js'), 'portals/PanKbase/views/Gene');
  assert.equal(pageName('src/main.js'), 'src');
});

test('the Unresolved totals rows come in the planner reason order', async () => {
  const files = {
    ...FIXTURE,
    'src/views/Q/main.js': PAGE_Q_MAIN,
    'src/views/P/Legacy.vue': '<template>\n  <div>\n    <center />\n    <dup-comp />\n  </div>\n</template>\n<script>\nexport default {};\n</script>\n',
    'src/components/Dup1.vue': '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("dup-comp", {});\n</script>\n',
    'src/components/Dup2.vue': '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("dup-comp", {});\n</script>\n',
  };
  await withRoot(files, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    const rows = dry.out.split('\n').filter((line) => line.startsWith('| Unresolved: '));
    assert.deepEqual(rows, ['| Unresolved: no-registration | 1 |', '| Unresolved: ambiguous | 1 |', '| Unresolved: not-loaded | 1 |']);
  });
});

test('a template warning the file already had does not fail the strict re-parse', async () => {
  const template = TEMPLATE.replace('<comp-a />', '<img src="x.png">\n    <comp-a />');
  await withRoot({ ...FIXTURE, 'src/views/P/Template.vue': template }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.doesNotMatch(real.out, /^## Failed$/m);
    assert.match(read(root, 'src/views/P/Template.vue'), /import CompA from/);
  });
});

// ---- check by hand: components chosen at run time (I3) ------------------------------------------------

const PICKER = [
  '<template>',
  '  <div>',
  '    <component :is="current" />',
  '    <tr is="my-row"></tr>',
  '    <section v-bind:is="kind" />',
  '  </div>',
  '</template>',
  '<script>',
  'export default {',
  '    name: "Picker",',
  '    render(h) {',
  '        return this.a ? h("comp-a") : h(this.pick);',
  '    },',
  '    created() {',
  '        this.node = this.$createElement(`x-${this.kind}`);',
  '    },',
  '};',
  '</script>',
  '',
].join('\n');

test('every runtime component choice is listed under Check by hand; the exit code does not change', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Picker.vue': PICKER }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 0);
    assert.match(dry.out, /^\| Check by hand \| 7 \|$/m);
    const section = dry.out.split('## Check by hand\n')[1].split('\n## ')[0];
    assert.match(section, /^\| file:line \| kind \| expression \|$/m);
    assert.deepEqual(
      section.split('\n').filter((line) => line.startsWith('| `src/')),
      [
        '| `src/components/Picker.vue:3` | `:is` | `current` |',
        '| `src/components/Picker.vue:4` | `is` | `my-row` |',
        '| `src/components/Picker.vue:5` | `v-bind:is` | `kind` |',
        '| `src/components/Picker.vue:12` | `h` | `"comp-a"` |',
        '| `src/components/Picker.vue:12` | `h` | `this.pick` |',
        // A code span that holds backticks is fenced with more of them.
        '| `src/components/Picker.vue:15` | `this.$createElement` | `` `x-${this.kind}` `` |',
        // The page entry renders its imported Template: not a literal, so it is listed too.
        '| `src/views/P/main.js:5` | `h` | `Template` |',
      ],
    );
    // A real run still writes what it planned.
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.match(real.out, /^## Check by hand$/m);
  });
});

test('with no runtime choices, Check by hand says None', async () => {
  const main = MAIN.replace('new Vue({ render: (h) => h(Template) }).$mount("#app");', 'new Vue({ el: "#app" });');
  await withRoot({ ...FIXTURE, 'src/views/P/main.js': main }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.match(dry.out, /^\| Check by hand \| 0 \|$/m);
    assert.equal(dry.out.split('## Check by hand\n')[1].split('\n## ')[0].trim(), 'None.');
  });
});

// ---- phase 2 output in the tree (I1) ------------------------------------------------------------------
// A portal merged master's phase 2 before running phase 1: B is already unwrapped, so nothing registers
// <comp-b> globally any more, and both uses of it look like a registration phase 1 should add.

const B_UNWRAPPED = '<template><div /></template>\n<script>\nexport default {\n    name: "comp-b",\n};\n</script>\n';
const MERGED_EARLY = { ...FIXTURE, 'src/components/B.vue': B_UNWRAPPED };

test('phase 2 output in the tree: a real run writes nothing, says why, and exits 1', async () => {
  await withRoot(MERGED_EARLY, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    for (const [file, contents] of Object.entries(MERGED_EARLY)) assert.equal(read(root, file), contents, file);
    assert.match(real.out, /^\| Unresolved: phase-2-present \| 2 \|$/m);
    const table = real.out.split('\n').filter((line) => line.includes('| phase-2-present |'));
    assert.deepEqual(table, [
      '| `src/components/A.vue:3` | `comp-b` | phase-2-present | `src/components/B.vue` |',
      '| `src/views/P/Template.vue:4` | `comp-b` | phase-2-present | `src/components/B.vue` |',
    ]);
    const why = real.out.split('## Phase 2 present\n')[1].split('\n## ')[0];
    assert.match(why, /2 unresolved uses/);
    assert.match(why, /Sync-point order/);
    assert.match(why, /^Nothing was written\.$/m);
    // The report still shows what would change: <comp-a> in the template.
    assert.match(real.out, /^## Files that would change$/m);
    assert.match(real.out, /^- `src\/views\/P\/Template\.vue`$/m);
    assert.doesNotMatch(real.out, /^## Changed files$/m);
    assert.match(real.err, /2 use\(s\) are phase-2-present; nothing was written/);
  });
});

test('phase 2 output in the tree: a dry run prints everything and exits 1', async () => {
  await withRoot(MERGED_EARLY, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    assert.match(dry.out, /^\| Files to change \| 1 \|$/m);
    assert.match(dry.out, /^\| Entries \| 1 \|$/m);
    const why = dry.out.split('## Phase 2 present\n')[1].split('\n## ')[0];
    assert.match(why, /^A real run would write nothing\.$/m);
    assert.match(dry.err, /phase-2-present; a real run would write nothing/);
  });
});

// Master at HEAD: both phases ran, so every file registers what it uses and is unwrapped. The named files
// are seen, but the lint finds no use, so there is nothing for them to block.
test('a tree where both phases are done reports nothing to do and exits 0, named files and all', async () => {
  const done = {
    'src/views/P/main.js': 'import Vue from "vue";\nimport Template from "./Template.vue";\nnew Vue({ render: (h) => h(Template) }).$mount("#app");\n',
    'src/views/P/Template.vue':
      '<template>\n  <div>\n    <comp-a />\n    <comp-b />\n  </div>\n</template>\n<script>\nimport CompA from "@/components/A.vue";\nimport CompB from "@/components/B.vue";\nexport default {\n    name: "Template",\n    components: { CompA, CompB },\n};\n</script>\n',
    'src/components/A.vue':
      '<template>\n  <div>\n    <comp-b />\n    <comp-a v-if="deep" />\n  </div>\n</template>\n<script>\nimport CompB from "@/components/B.vue";\nexport default {\n    name: "comp-a",\n    components: { CompB },\n    props: ["deep"],\n};\n</script>\n',
    'src/components/B.vue': B_UNWRAPPED,
  };
  await withRoot(done, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 0);
    assert.deepEqual(real.writes, []);
    assert.match(real.out, /^\| Findings \| 0 \|$/m);
    assert.match(real.out, /^\| Unresolved \| 0 \|$/m);
    assert.doesNotMatch(real.out, /phase-2-present|## Phase 2 present/);
    assert.equal(real.err, '');
  });
});

// ---- failures: nothing is written for the file, the rest still is, exit 1 -------------------------

/** An `apply` that damages the result for Template.vue and is the real writer for everything else. */
const breakTemplate = (damage) => (source, entries, file) => {
  const result = applyRegistrations(source, entries, file);
  return file.endsWith('Template.vue') ? { source: damage(result.source), changed: true } : result;
};

for (const [name, damage, pattern] of [
  ['a script that no longer parses', (source) => source.replace('</script>', 'export default {\n</script>'), /Template\.vue.*(Unexpected|Unterminated|parse)/is],
  ['a template that gains an SFC error', (source) => source.replace('</div>', ''), /Template\.vue.*no matching end tag/is],
]) {
  test(`R7: ${name} is reported under Failed, not written, and the other files still are`, async () => {
    await withRoot(FIXTURE, async (root) => {
      const dry = await cli(root, ['--dry-run'], { apply: breakTemplate(damage) });
      assert.equal(dry.code, 1);
      assert.match(dry.out, /^## Failed$/m);
      assert.match(dry.out, /^\| Files to change \| 1 \|$/m);

      const real = await cli(root, [], { apply: breakTemplate(damage) });
      assert.equal(real.code, 1);
      assert.match(real.out, /^## Failed$/m);
      const failed = real.out.split('## Failed')[1].split('\n## ')[0];
      assert.match(failed, pattern);
      assert.match(failed, /`src\/views\/P\/Template\.vue`/);
      assert.deepEqual(real.writes, [join(root, 'src/components/A.vue')]);
      assert.equal(read(root, 'src/views/P/Template.vue'), TEMPLATE);
      assert.match(read(root, 'src/components/A.vue'), /import CompB from/);
      assert.match(real.err, /1 file\(s\) failed/);
    });
  });
}

test('a throw from applyRegistrations is a failure with its message; the other files are still written', async () => {
  const spread = TEMPLATE.replace('name: "Template",', '...base,');
  await withRoot({ ...FIXTURE, 'src/views/P/Template.vue': spread }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    const failed = real.out.split('## Failed')[1].split('\n## ')[0];
    assert.match(failed, /`src\/views\/P\/Template\.vue`/);
    assert.match(failed, /contain a spread/);
    assert.deepEqual(real.writes, [join(root, 'src/components/A.vue')]);
    assert.equal(read(root, 'src/views/P/Template.vue'), spread);
  });
});

test('a write that throws is a failure; the other files are still written', async () => {
  await withRoot(FIXTURE, async (root) => {
    const write = (path, text) => {
      if (path.endsWith('A.vue')) throw new Error('EACCES: permission denied');
      writeFileSync(path, text);
    };
    const real = await cli(root, [], { write });
    assert.equal(real.code, 1);
    const failed = real.out.split('## Failed')[1].split('\n## ')[0];
    assert.match(failed, /`src\/components\/A\.vue`.*EACCES/);
    assert.match(read(root, 'src/views/P/Template.vue'), /import CompA from/);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    // Only the file that was written is listed as changed.
    const changed = real.out.split('## Changed files')[1];
    assert.match(changed, /`src\/views\/P\/Template\.vue`/);
    assert.doesNotMatch(changed, /A\.vue/);
  });
});

// ---- analysis errors ------------------------------------------------------------------------------

const DYNAMIC = '<template><div /></template>\n<script>\nimport Vue from "vue";\nconst name = "x";\nVue.component(name, {});\nexport default {};\n</script>\n';

test('analysis errors: a real run writes nothing at all and says so; exit 1', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Dynamic.vue': DYNAMIC }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/views/P/Template.vue'), TEMPLATE);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    const section = real.out.split('## Analysis errors')[1].split('\n## ')[0];
    assert.match(section, /`src\/components\/Dynamic\.vue:5`/);
    assert.match(section, /nothing was written/i);
    // The report still shows what would change.
    assert.match(real.out, /^## Files that would change$/m);
    assert.match(real.out, /^\| Entries \| 3 \|$/m);
    assert.match(real.err, /analysis error/);
  });
});

test('analysis errors: a dry run prints the full report and exits 1', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Dynamic.vue': DYNAMIC }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    assert.match(dry.out, /^## Analysis errors$/m);
    assert.match(dry.out, /^\| Files to change \| 2 \|$/m);
    assert.doesNotMatch(dry.out.split('## Analysis errors')[1], /nothing was written/i);
  });
});

// ESLint cannot lint a tree with a script that does not parse, so `undefinedTags` throws. The report
// must still be printed, with the scan's own errors for that file.
const BROKEN = '<template><div /></template>\n<script>\nexport default {\n</script>\n';

test('a script that does not parse: a dry run prints the report with the analysis error and the lint failure; exit 1', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Broken.vue': BROKEN }, async (root) => {
    const dry = await cli(root, ['--dry-run']);
    assert.equal(dry.code, 1);
    assert.deepEqual(dry.writes, []);
    assert.match(dry.out, /^# Register components \(dry run\)$/m);
    const analysis = dry.out.split('## Analysis errors')[1].split('\n## ')[0];
    assert.match(analysis, /^- `src\/components\/Broken\.vue:4` \(parse\): Unexpected token \(4:0\)$/m);
    const lint = dry.out.split('## Lint failed')[1].split('\n## ')[0];
    assert.match(lint, /Broken\.vue/);
    // Without the lint there are no findings, and the totals say so instead of showing zeros.
    assert.match(dry.out, /^\| Findings \| n\/a \|$/m);
    assert.match(dry.out, /^\| Files to change \| n\/a \|$/m);
    assert.match(dry.out, /^\| Entries \| n\/a \|$/m);
    assert.match(dry.out, /^\| Unresolved \| n\/a \|$/m);
    assert.match(dry.err, /lint/i);
    assert.match(dry.err, /1 analysis error/);
  });
});

test('a script that does not parse: a real run writes nothing and says so; exit 1', async () => {
  await withRoot({ ...FIXTURE, 'src/components/Broken.vue': BROKEN }, async (root) => {
    const real = await cli(root);
    assert.equal(real.code, 1);
    assert.deepEqual(real.writes, []);
    assert.equal(read(root, 'src/views/P/Template.vue'), TEMPLATE);
    assert.equal(read(root, 'src/components/A.vue'), COMP_A);
    assert.match(real.out, /^## Analysis errors$/m);
    assert.match(real.out.split('## Analysis errors')[1].split('\n## ')[0], /nothing was written/i);
    assert.match(real.out.split('## Lint failed')[1].split('\n## ')[0], /nothing was written/i);
    assert.match(real.out, /^## Files that would change$/m);
    assert.match(real.err, /nothing was written/);
  });
});

test('a lint failure without analysis errors is still reported, not thrown', async () => {
  // The scan finds nothing wrong here, so the lint failure alone decides the exit code.
  const lintFails = async () => {
    throw new Error('src/views/P/Odd.vue:1: unexpected ESLint message (fatal): Parsing error');
  };
  await withRoot(FIXTURE, async (root) => {
    const dry = await cli(root, ['--dry-run'], { lint: lintFails });
    assert.equal(dry.code, 1);
    assert.doesNotMatch(dry.out, /^## Analysis errors$/m);
    assert.match(dry.out.split('## Lint failed')[1].split('\n## ')[0], /Odd\.vue:1: unexpected ESLint message/);
    assert.match(dry.err, /lint/i);
  });
});

// ---- usage errors -----------------------------------------------------------------------------------

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
        assert.match(err.text, /usage: node scripts\/vue3-migration\/register-components\.mjs \[--dry-run\] \[--root <dir>\]/, label);
        assert.deepEqual(writes, [], label);
      }
    });
  });
});

test('a root that is not a usable directory says which one in the error', async () => {
  const err = sink();
  const code = await run(['--root', '/definitely/not/a/directory'], { out: sink(), err });
  assert.equal(code, 2);
  assert.match(err.text, /\/definitely\/not\/a\/directory/);
});
