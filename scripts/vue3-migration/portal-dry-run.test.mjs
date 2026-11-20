import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { analyzeTree, renderPortalReport, run } from './portal-dry-run.mjs';

// ---- renderPortalReport --------------------------------------------------------------------------

const UNRESOLVED = [
  { file: 'src/components/Foo.vue', line: 7, tag: 'foo-bar', reason: 'no-registration' },
  { file: 'src/components/Foo.vue', line: 9, tag: 'baz', reason: 'ambiguous', candidates: ['src/a/Baz.vue', 'src/b/Baz.vue'] },
  { file: 'src/components/Qux.vue', line: 3, tag: 'qux', reason: 'not-loaded', pages: ['src/views/Gene/main.js', 'src/views/Region/main.js'] },
];

/** A branch with 3 unresolved uses, a phase 2 refusal (the parse failure) and a phase 1 failure. */
const WITH_REFUSAL = {
  branch: 'cfde-main',
  sha: '7ecb0a802',
  phase1: {
    findings: 12,
    files: 5,
    entries: 9,
    unresolved: UNRESOLVED,
    failed: [{ file: 'src/components/Odd.vue', message: 'the `<script>` does not parse: Unexpected token' }],
  },
  phase2: { files: 4, refused: [{ file: 'src/components/Ts.vue', message: 'has a <script lang="ts"> block, which is not plain JavaScript' }] },
  analysisErrors: [],
  lintError: null,
  checkByHand: [
    { file: 'src/components/Pick.vue', line: 3, kind: ':is', expression: 'current' },
    { file: 'src/views/Gene/main.js', line: 40, kind: 'createElement', expression: 'Template' },
  ],
};

/** A branch with two analysis errors and nothing unresolved. */
const WITH_ANALYSIS_ERRORS = {
  branch: 'matkp-main',
  sha: 'abc123def',
  phase1: { findings: 3, files: 2, entries: 3, unresolved: [], failed: [] },
  phase2: { files: 1, refused: [] },
  analysisErrors: [
    { file: 'src/bad.js', kind: 'parse', message: 'Unexpected token\n  (3:1)' },
    { file: 'src/dyn.js', line: 12, kind: 'registration', message: 'Vue.component(name, ...) needs a string literal' },
  ],
  lintError: null,
  checkByHand: [],
};

const lines = (report) => report.split('\n');

test('renderPortalReport: a table with one row per branch and a totals row', () => {
  const report = renderPortalReport([WITH_REFUSAL, WITH_ANALYSIS_ERRORS], { fetch: { ok: true } });
  const out = lines(report);

  assert.equal(out[0], '# Portal-branch dry run: component registration codemods');
  assert.ok(
    out.includes(
      '| branch | SHA | status | findings | files to change | entries | unresolved | no-registration | phase-2-present | ambiguous | self | not-loaded | script-setup | cycle | phase 1 failed | phase 2 files to change (if phase 1 were complete) | phase 2 refused (if phase 1 were complete) | analysis errors | lint failed |',
    ),
    'header row',
  );
  assert.ok(out.includes('| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |'), 'separator row');
  assert.ok(out.includes('| cfde-main | `7ecb0a802` | ok | 12 | 5 | 9 | 3 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 4 | 1 | 0 | no |'));
  assert.ok(out.includes('| matkp-main | `abc123def` | ok | 3 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | no |'));
  // The totals line sums every numeric column.
  assert.ok(out.includes('| **total** |  | 2 ok | 15 | 7 | 12 | 3 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 5 | 1 | 2 | 0 |'));
  // The table comes before the details, and the rows come in the order given.
  const table = out.findIndex((line) => line.startsWith('| cfde-main |'));
  assert.ok(table > 0 && out.findIndex((line) => line.startsWith('| matkp-main |')) === table + 1);
  assert.ok(table < out.indexOf('## cfde-main (`7ecb0a802`)'));
});

test('renderPortalReport: the header says what was fetched and what the phase 2 column means', () => {
  const ok = renderPortalReport([WITH_REFUSAL], { fetch: { ok: true } });
  assert.match(ok, /^Fetched `origin` before the run\.$/m);
  assert.match(ok, /Phase 2 is counted as if phase 1 were complete/);
  assert.match(ok, /read-only/i);

  const failed = renderPortalReport([WITH_REFUSAL], { fetch: { ok: false, message: 'Could not resolve host: github.com\nfatal: x' } });
  assert.match(failed, /^`git fetch origin` failed \(Could not resolve host: github\.com fatal: x\); the `origin\/\*` refs already present were used, so they may be out of date\.$/m);
});

test('renderPortalReport: the details list every unresolved use, phase 2 refusal, phase 1 failure and analysis error', () => {
  const report = renderPortalReport([WITH_REFUSAL, WITH_ANALYSIS_ERRORS], { fetch: { ok: true } });

  const first = report.split('## cfde-main (`7ecb0a802`)\n')[1].split('\n## ')[0];
  assert.match(first, /^### Unresolved uses \(3\)$/m);
  assert.match(first, /^\| `src\/components\/Foo\.vue:7` \| `foo-bar` \| no-registration \| {2}\|$/m);
  assert.match(first, /^\| `src\/components\/Foo\.vue:9` \| `baz` \| ambiguous \| `src\/a\/Baz\.vue`, `src\/b\/Baz\.vue` \|$/m);
  // `not-loaded` lists the pages by their folder, as the register-components report does.
  assert.match(first, /^\| `src\/components\/Qux\.vue:3` \| `qux` \| not-loaded \| `Gene`, `Region` \|$/m);
  assert.match(first, /^### Phase 1 failed \(1\)$/m);
  assert.match(first, /^- `src\/components\/Odd\.vue`: the `<script>` does not parse: Unexpected token$/m);
  assert.match(first, /^### Phase 2 refused, if phase 1 were complete \(1\)$/m);
  assert.match(first, /^- `src\/components\/Ts\.vue`: has a <script lang="ts"> block, which is not plain JavaScript$/m);
  assert.match(first, /^### Analysis errors \(0\)$/m);
  assert.doesNotMatch(first, /### Lint failed/);
  // Runtime component choices, for the sync point's hand checks (I3).
  assert.match(first, /^### Check by hand \(2\)$/m);
  assert.match(first, /^\| `src\/components\/Pick\.vue:3` \| `:is` \| `current` \|$/m);
  assert.match(first, /^\| `src\/views\/Gene\/main\.js:40` \| `createElement` \| `Template` \|$/m);

  const second = report.split('## matkp-main (`abc123def`)\n')[1];
  assert.match(second, /^### Unresolved uses \(0\)\n\nNone\.$/m);
  assert.match(second, /^### Check by hand \(0\)\n\nNone\.$/m);
  assert.match(second, /^### Analysis errors \(2\)$/m);
  assert.match(second, /^- `src\/bad\.js` \(parse\): Unexpected token \(3:1\)$/m);
  assert.match(second, /^- `src\/dyn\.js:12` \(registration\): Vue\.component\(name, \.\.\.\) needs a string literal$/m);
});

test('renderPortalReport: a branch whose lint failed has the status lint-failed, n/a for the figures that need the lint, and the message in the details', () => {
  const lintFailed = {
    ...WITH_ANALYSIS_ERRORS,
    branch: 'sysbio-main',
    sha: '1234567ab',
    phase1: { findings: 0, files: 0, entries: 0, unresolved: [], failed: [] },
    lintError: 'src/x.js:1: unexpected ESLint message (fatal): Parsing error',
  };
  const report = renderPortalReport([WITH_REFUSAL, lintFailed], { fetch: { ok: true } });
  const out = lines(report);
  assert.ok(out.includes('| sysbio-main | `1234567ab` | lint-failed | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 1 | 0 | 2 | yes |'));
  // The n/a cells are left out of the totals; the lint failure is counted.
  assert.ok(out.includes('| **total** |  | 1 ok, 1 lint-failed | 12 | 5 | 9 | 3 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 5 | 1 | 2 | 1 |'));
  // The header counts it apart from the branches that are ok.
  assert.ok(out.includes('Branches: 2 (1 ok, 1 lint-failed, 0 error).'));
  const details = report.split('## sysbio-main (`1234567ab`)\n')[1];
  assert.match(details, /^### Lint failed$/m);
  assert.match(details, /^- src\/x\.js:1: unexpected ESLint message \(fatal\): Parsing error$/m);
  assert.match(details, /^### Unresolved uses\n\nNot computed: the lint step failed\.$/m);
});

test('renderPortalReport: an error row names the message and the other rows still render', () => {
  const broken = { branch: 'mouse-main', sha: null, error: 'fatal: invalid reference: origin/mouse-main\nmore' };
  const report = renderPortalReport([WITH_REFUSAL, broken, WITH_ANALYSIS_ERRORS], { fetch: { ok: true } });
  const out = lines(report);
  assert.ok(out.includes('| mouse-main | n/a | error: fatal: invalid reference: origin/mouse-main more | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |'));
  assert.ok(out.includes('| cfde-main | `7ecb0a802` | ok | 12 | 5 | 9 | 3 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 4 | 1 | 0 | no |'));
  assert.ok(out.includes('| matkp-main | `abc123def` | ok | 3 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 2 | no |'));
  assert.ok(out.includes('| **total** |  | 2 ok, 1 error | 15 | 7 | 12 | 3 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 5 | 1 | 2 | 0 |'));
  assert.ok(out.includes('Branches: 3 (2 ok, 0 lint-failed, 1 error).'));
  const details = report.split('## mouse-main\n')[1].split('\n## ')[0];
  assert.match(details, /^Error: fatal: invalid reference: origin\/mouse-main more$/m);
});

test('renderPortalReport: the same rows give byte-identical output, and the report ends with one newline', () => {
  const rows = [WITH_REFUSAL, WITH_ANALYSIS_ERRORS];
  const first = renderPortalReport(rows, { fetch: { ok: true } });
  assert.equal(renderPortalReport(rows, { fetch: { ok: true } }), first);
  assert.ok(first.endsWith('\n') && !first.endsWith('\n\n'));
});

// ---- run: one row per branch, whatever happens to the others ----------------------------------------

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

const ANALYSIS = {
  phase1: { findings: 2, files: 1, entries: 2, unresolved: [], failed: [] },
  phase2: { files: 1, refused: [] },
  analysisErrors: [],
  lintError: null,
  checkByHand: [],
};

/** Seams for `run`: no git, no worktrees, no ESLint. `calls` records what was asked of them, in order. */
function seams(overrides = {}) {
  const calls = [];
  const out = sink();
  const err = sink();
  const deps = {
    refs: ['origin/a-main', 'origin/b-main', 'origin/c-main'],
    fetch: () => calls.push('fetch'),
    resolveSha: (ref) => `sha-${ref.replace('origin/', '')}`,
    withWorktree: async (ref, fn) => {
      calls.push(`checkout ${ref}`);
      try {
        return await fn(`/fake/${ref}`);
      } finally {
        calls.push(`remove ${ref}`);
      }
    },
    analyze: async (dir) => {
      calls.push(`analyze ${dir}`);
      return ANALYSIS;
    },
    out,
    err,
    ...overrides,
  };
  return { deps, calls, out, err };
}

test('run: fetches once, then analyzes the branches one at a time, in order, each in its own worktree', async () => {
  let active = 0;
  let overlapped = false;
  const { deps, calls, out } = seams({
    withWorktree: async (ref, fn) => {
      active++;
      overlapped ||= active > 1;
      calls.push(`checkout ${ref}`);
      await new Promise((resolve) => setImmediate(resolve));
      try {
        return await fn(`/fake/${ref}`);
      } finally {
        calls.push(`remove ${ref}`);
        active--;
      }
    },
  });
  const code = await run([], deps);
  assert.equal(code, 0);
  assert.equal(overlapped, false);
  assert.deepEqual(calls, [
    'fetch',
    'checkout origin/a-main',
    'analyze /fake/origin/a-main',
    'remove origin/a-main',
    'checkout origin/b-main',
    'analyze /fake/origin/b-main',
    'remove origin/b-main',
    'checkout origin/c-main',
    'analyze /fake/origin/c-main',
    'remove origin/c-main',
  ]);
  for (const branch of ['a-main', 'b-main', 'c-main']) assert.match(out.text, new RegExp(`^\\| ${branch} \\| \`sha-${branch}\` \\| ok \\|`, 'm'));
  assert.match(out.text, /^\| \*\*total\*\* \| {2}\| 3 ok \|/m);
});

test('run: a branch whose analysis throws becomes an error row; the others still render; exit 0', async () => {
  const { deps, out, err } = seams({
    analyze: async (dir) => {
      if (dir.endsWith('b-main')) throw new Error('boom: something broke');
      return ANALYSIS;
    },
  });
  const code = await run([], deps);
  assert.equal(code, 0);
  assert.match(out.text, /^\| a-main \| `sha-a-main` \| ok \| 2 \|/m);
  assert.match(out.text, /^\| b-main \| `sha-b-main` \| error: boom: something broke \| n\/a \|/m);
  assert.match(out.text, /^\| c-main \| `sha-c-main` \| ok \| 2 \|/m);
  assert.match(out.text, /^\| \*\*total\*\* \| {2}\| 2 ok, 1 error \|/m);
  assert.match(out.text, /^## b-main \(`sha-b-main`\)\n\nError: boom: something broke$/m);
  assert.match(err.text, /b-main: error: boom: something broke/);
});

test('run: a checkout that fails, or a ref that does not resolve, is an error row too; a ref that does not resolve is never analyzed', async () => {
  const { deps, out, calls } = seams({
    withWorktree: async (ref, fn) => {
      if (ref.endsWith('a-main')) throw new Error('fatal: could not checkout');
      return fn(`/fake/${ref}`);
    },
    resolveSha: (ref) => {
      if (ref.endsWith('b-main')) throw new Error('ref not found: origin/b-main');
      return 'sha';
    },
  });
  const code = await run([], deps);
  assert.equal(code, 0);
  assert.match(out.text, /^\| a-main \| `sha` \| error: fatal: could not checkout \|/m);
  assert.match(out.text, /^\| b-main \| n\/a \| error: ref not found: origin\/b-main \|/m);
  assert.match(out.text, /^\| c-main \| `sha` \| ok \|/m);
  assert.equal(calls.some((call) => call.includes('b-main')), false);
});

test('run: when every branch fails nothing could run: the report is still printed, and the exit code is 1', async () => {
  const { deps, out, err } = seams({
    analyze: async () => {
      throw new Error('boom');
    },
  });
  const code = await run([], deps);
  assert.equal(code, 1);
  assert.match(out.text, /^\| \*\*total\*\* \| {2}\| 3 error \|/m);
  assert.match(err.text, /no branch could be analyzed/);
});

test('run: a failed fetch is said in the report and the run goes on with the refs it has', async () => {
  const { deps, out, calls } = seams({
    fetch: () => {
      throw new Error('fatal: unable to access https://github.com/');
    },
  });
  const code = await run([], deps);
  assert.equal(code, 0);
  assert.match(out.text, /^`git fetch origin` failed \(fatal: unable to access https:\/\/github\.com\/\)/m);
  assert.doesNotMatch(out.text, /Fetched `origin` before the run/);
  assert.equal(calls.filter((call) => call.startsWith('checkout')).length, 3);
});

test('run: the report says it fetched, and the same seams give byte-identical output', async () => {
  const first = seams();
  const second = seams();
  await run([], first.deps);
  await run([], second.deps);
  assert.match(first.out.text, /^Fetched `origin` before the run\.$/m);
  assert.equal(first.out.text, second.out.text);
});

test('run: usage errors exit 2 with the usage line on stderr and nothing on stdout, and nothing is fetched', async () => {
  for (const argv of [['--bogus'], ['master'], ['--root', 'x']]) {
    const { deps, out, err, calls } = seams();
    const code = await run(argv, deps);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(out.text, '');
    assert.match(err.text, /usage: node scripts\/vue3-migration\/portal-dry-run\.mjs/);
    assert.deepEqual(calls, []);
  }
});

// ---- analyzeTree: the two codemods on one tree, read-only ---------------------------------------------
// The tree is an unmigrated branch: a page (`P`) whose template uses <comp-a>, <comp-b> and <comp-x>; A
// and B are `Vue.component(...)` and neither is registered anywhere locally; nothing registers
// <comp-x>; and Ts is a TypeScript file that registers a component, which phase 2 refuses.

const MAIN = [
  'import Vue from "vue";',
  'import Template from "./Template.vue";',
  'import "@/components/A.vue";',
  'import "@/components/B.vue";',
  'new Vue({ render: (h) => h(Template) }).$mount("#app");',
  '',
].join('\n');
const TEMPLATE = '<template>\n  <div>\n    <comp-a />\n    <comp-b />\n    <comp-x />\n  </div>\n</template>\n<script>\nexport default {\n    name: "Template",\n};\n</script>\n';
const COMP_A = '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("comp-a", {});\n</script>\n';
const COMP_B = '<template><div /></template>\n<script>\nimport Vue from "vue";\nexport default Vue.component("comp-b", {});\n</script>\n';
const COMP_TS = '<template><div /></template>\n<script lang="ts">\nimport Vue from "vue";\nexport default Vue.component("comp-ts", {});\n</script>\n';

const TREE = {
  'src/views/P/main.js': MAIN,
  'src/views/P/Template.vue': TEMPLATE,
  'src/components/A.vue': COMP_A,
  'src/components/B.vue': COMP_B,
  'src/components/Ts.vue': COMP_TS,
};

/** The uses ESLint would report for TREE (the lint is a seam: it is the slow part). */
const lintTree = async () =>
  new Map([
    [
      'src/views/P/Template.vue',
      [
        { tag: 'comp-a', line: 3 },
        { tag: 'comp-b', line: 4 },
        { tag: 'comp-x', line: 5 },
      ],
    ],
  ]);

async function withRoot(files, fn) {
  const root = mkdtempSync(join(tmpdir(), 'portal-dry-run-'));
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

/** Every file under `root` with its text, as one sorted list. */
const snapshot = (root) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => [join(entry.parentPath ?? entry.path, entry.name), readFileSync(join(entry.parentPath ?? entry.path, entry.name), 'utf8')])
    .sort(([a], [b]) => (a < b ? -1 : 1));

test('analyzeTree: phase 1 counts what it would change and lists what it cannot place', async () => {
  await withRoot(TREE, async (root) => {
    const { phase1, analysisErrors, lintError } = await analyzeTree(root, { lint: lintTree });
    assert.equal(phase1.findings, 3);
    assert.equal(phase1.files, 1);
    assert.equal(phase1.entries, 2);
    assert.deepEqual(
      phase1.unresolved.map(({ file, line, tag, reason }) => ({ file, line, tag, reason })),
      [{ file: 'src/views/P/Template.vue', line: 5, tag: 'comp-x', reason: 'no-registration' }],
    );
    assert.deepEqual(phase1.failed, []);
    assert.deepEqual(analysisErrors, []);
    assert.equal(lintError, null);
  });
});

test('analyzeTree: lists the runtime component choices to check by hand', async () => {
  await withRoot(TREE, async (root) => {
    const { checkByHand } = await analyzeTree(root, { lint: lintTree });
    assert.deepEqual(checkByHand, [{ file: 'src/views/P/main.js', line: 5, kind: 'h', expression: 'Template' }]);
  });
});

test('analyzeTree: phase 2 is counted although phase 1 is incomplete (the R2 check is not made), and refusals are listed', async () => {
  await withRoot(TREE, async (root) => {
    const { phase2 } = await analyzeTree(root, { lint: lintTree });
    assert.equal(phase2.files, 2);
    assert.equal(phase2.refused.length, 1);
    assert.equal(phase2.refused[0].file, 'src/components/Ts.vue');
    assert.match(phase2.refused[0].message, /lang="ts"/);
    assert.equal(phase2.refused[0].message.startsWith('src/components/Ts.vue'), false, 'the message does not repeat the file');
  });
});

test('analyzeTree: leaves the tree exactly as it found it', async () => {
  await withRoot(TREE, async (root) => {
    const before = snapshot(root);
    await analyzeTree(root, { lint: lintTree });
    assert.deepEqual(snapshot(root), before);
  });
});

test('analyzeTree: a lint that fails is a lintError, and phase 2 is still counted', async () => {
  await withRoot(TREE, async (root) => {
    const lint = async () => {
      throw new Error('src/x.js:1: unexpected ESLint message (fatal): Parsing error');
    };
    const result = await analyzeTree(root, { lint });
    assert.equal(result.lintError, 'src/x.js:1: unexpected ESLint message (fatal): Parsing error');
    assert.equal(result.phase1.findings, 0);
    assert.equal(result.phase2.files, 2);
  });
});

test('analyzeTree: a script that does not parse is an analysis error with its file', async () => {
  await withRoot({ ...TREE, 'src/broken.js': 'export default {\n' }, async (root) => {
    const { analysisErrors } = await analyzeTree(root, { lint: lintTree });
    assert.ok(analysisErrors.some(({ file, kind }) => file === 'src/broken.js' && kind === 'parse'));
  });
});

test('analyzeTree: a root without src/ throws, which run turns into an error row', async () => {
  await withRoot({ 'README.md': 'x' }, async (root) => {
    await assert.rejects(() => analyzeTree(root, { lint: lintTree }));
  });
});
