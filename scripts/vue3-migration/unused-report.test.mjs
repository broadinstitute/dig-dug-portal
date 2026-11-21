import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  importPattern,
  parseGitGrep,
  ambiguousNames,
  summarizeComponent,
  renderReport,
} from './unused-report.mjs';

test('importPattern matches quoted specifiers ending in /<basename>[.vue] and require()', () => {
  const re = new RegExp(importPattern('LzPanel'));
  assert.ok(re.test(`import LzPanel from "@/components/lz/panels/LzPanel.vue";`));
  assert.ok(re.test(`import LzPanel from './LzPanel'`));
  assert.ok(re.test(`const LzPanel = require("../lz/LzPanel.vue").default;`));
  assert.ok(re.test('const m = () => import(`@/components/LzPanel`)'));
  assert.ok(!re.test(`import LzPanelGroup from './LzPanelGroup.vue'`));
  assert.ok(!re.test(`import BigLzPanel from './BigLzPanel.vue'`));
  assert.ok(!re.test(`// see LzPanel.vue for details`));
});

test('importPattern escapes regex metacharacters in the basename', () => {
  const re = new RegExp(importPattern('a.b'));
  assert.ok(re.test(`import X from './a.b.vue'`));
  assert.ok(!re.test(`import X from './aXb.vue'`));
});

test('parseGitGrep keeps only the given ref and strips its prefix', () => {
  assert.deepEqual(
    parseGitGrep('origin/cfde-main:src/views/Gene/main.js\norigin/cfde-main:src/a.vue\n', 'origin/cfde-main'),
    ['src/views/Gene/main.js', 'src/a.vue'],
  );
  const mixed = 'origin/master:src/a.js\norigin/cfde-main:src/b.js\norigin/cfde-liver-main:src/c.js\n';
  assert.deepEqual(parseGitGrep(mixed, 'origin/cfde-main'), ['src/b.js']);
  assert.deepEqual(parseGitGrep('', 'origin/master'), []);
});

test('ambiguousNames returns basenames shared by more than one .vue file', () => {
  assert.deepEqual(
    [
      ...ambiguousNames([
        'src/components/lz/beta/LzPanel.vue',
        'src/components/lz/panels/LzPanel.vue',
        'src/components/A.vue',
      ]),
    ],
    ['LzPanel'],
  );
  // Non-.vue files do not count toward ambiguity.
  assert.equal(ambiguousNames(['src/a/B.vue', 'src/b/B.js']).size, 0);
});

const MASTER = 'origin/master';
const PORTALS = ['origin/cfde-main', 'origin/matkp-main'];
const COMP = 'src/components/NCATS/ResultsDashboard.vue';

test('summarizeComponent leaves the file itself out and lists portal branches that import it', () => {
  const hits = {
    [MASTER]: [COMP],
    'origin/cfde-main': [COMP, 'src/views/NCATS/main.js'],
    'origin/matkp-main': [COMP],
  };
  const row = summarizeComponent(COMP, hits, MASTER, PORTALS, new Set());
  assert.deepEqual(row.masterImporters, []);
  assert.deepEqual(row.portalBranches, ['cfde-main']);
  assert.equal(row.unusedEverywhere, false);
  assert.equal(row.ambiguous, false);
});

test('summarizeComponent is unused everywhere only when no ref has an importer', () => {
  const none = summarizeComponent(COMP, { [MASTER]: [COMP], 'origin/cfde-main': [], 'origin/matkp-main': [] }, MASTER, PORTALS, new Set());
  assert.equal(none.unusedEverywhere, true);

  const onMaster = summarizeComponent(COMP, { [MASTER]: ['src/views/X/main.js'] }, MASTER, PORTALS, new Set());
  assert.deepEqual(onMaster.masterImporters, ['src/views/X/main.js']);
  assert.equal(onMaster.unusedEverywhere, false);
});

test('summarizeComponent flags ambiguous basenames and never calls them unused everywhere', () => {
  const row = summarizeComponent(COMP, {}, MASTER, PORTALS, new Set(['ResultsDashboard']));
  assert.equal(row.ambiguous, true);
  assert.equal(row.unusedEverywhere, false);
});

test('renderReport prints the static-imports caveat, counts, and a markdown table', () => {
  const rows = [
    summarizeComponent('src/components/Dead.vue', {}, MASTER, PORTALS, new Set()),
    summarizeComponent(COMP, { 'origin/cfde-main': ['src/views/NCATS/main.js'] }, MASTER, PORTALS, new Set()),
    summarizeComponent('src/components/Dup.vue', {}, MASTER, PORTALS, new Set(['Dup'])),
    summarizeComponent(
      'src/components/Everywhere.vue',
      { [MASTER]: ['src/views/X/main.js'], 'origin/cfde-main': ['src/a.js'], 'origin/matkp-main': ['src/b.js'] },
      MASTER,
      PORTALS,
      new Set(),
    ),
  ];
  const md = renderReport(rows, { masterRef: MASTER, portalRefs: PORTALS });
  assert.match(md, /static imports only/);
  assert.match(md, /^\| component \| importers on master \| portal branches importing it \| unused everywhere\? \|$/m);
  assert.match(md, /^\| `src\/components\/Dead\.vue` \| 0 \| none \| yes \|$/m);
  assert.match(md, /^\| `src\/components\/NCATS\/ResultsDashboard\.vue` \| 0 \| cfde-main \| no \|$/m);
  assert.match(md, /^\| `src\/components\/Dup\.vue` \| 0 \| none \| ambiguous: check by hand \|$/m);
  assert.match(md, /^\| `src\/components\/Everywhere\.vue` \| 1: `src\/views\/X\/main\.js` \| all 2 \| no \|$/m);
  assert.match(md, /unused everywhere: 1/i);
  assert.match(md, /ambiguous names: 1/i);
});
