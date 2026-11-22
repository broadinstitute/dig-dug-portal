// Vue 3 lint ratchet: lint `src` with a Vue 3 rule set at HEAD and at a base ref
// (in a temporary git worktree) and fail if any rule's count rises.
//
//   node scripts/vue3-migration/lint-ratchet.mjs [--base <ref>] [--json]
//
// Exit codes: 0 ok, 1 a rule count increased, 2 usage error or git/ESLint failure.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import eslint from 'eslint';
import { compareCounts, countByRule, resolveBaseRef } from './ratchet.mjs';
import { withWorktree } from './worktree.mjs';

const { ESLint } = eslint;

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const configFile = resolve(here, 'eslint-vue3.cjs');

const USAGE = 'usage: node scripts/vue3-migration/lint-ratchet.mjs [--base <ref>] [--json]';

async function lintCounts(cwd) {
  const linter = new ESLint({
    cwd,
    useEslintrc: false,
    overrideConfigFile: configFile,
    // Worktrees have no node_modules, so always resolve plugins from the real repo.
    resolvePluginsRelativeTo: repoRoot,
    extensions: ['.js', '.vue'],
  });
  return countByRule(await linter.lintFiles(['src']));
}

function formatTable(header, rows) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) =>
    cells.map((c, i) => (i === 0 ? String(c).padEnd(widths[i]) : String(c).padStart(widths[i]))).join('  ');
  return [line(header), ...rows.map(line)].join('\n');
}

const sum = (counts) => Object.values(counts).reduce((a, b) => a + b, 0);
const byHeadDescending = (head) => (a, b) => (head[b] ?? 0) - (head[a] ?? 0) || a.localeCompare(b);
const signed = (n) => (n > 0 ? `+${n}` : String(n));

async function main() {
  let args;
  try {
    args = parseArgs({
      options: { base: { type: 'string' }, json: { type: 'boolean', default: false } },
    }).values;
  } catch (err) {
    console.error(`${err.message}\n${USAGE}`);
    return 2;
  }

  // `git worktree add` runs against the process cwd, so anchor it to this repo.
  process.chdir(repoRoot);

  const baseRef = resolveBaseRef(process.env, args.base);
  const head = await lintCounts(repoRoot);

  if (baseRef === null) {
    if (args.json) {
      console.log(JSON.stringify({ baseRef: null, head }, null, 2));
    } else {
      const rows = Object.keys(head)
        .sort(byHeadDescending(head))
        .map((rule) => [rule, head[rule]]);
      rows.push(['total', sum(head)]);
      console.log(formatTable(['rule', 'head'], rows));
    }
    return 0;
  }

  const base = await withWorktree(baseRef, (dir) => lintCounts(dir));
  const { increased, decreased } = compareCounts(base, head);

  if (args.json) {
    console.log(JSON.stringify({ baseRef, base, head, increased, decreased }, null, 2));
  } else {
    const rules = [...new Set([...Object.keys(base), ...Object.keys(head)])].sort(byHeadDescending(head));
    const rows = rules.map((rule) => {
      const [b, h] = [base[rule] ?? 0, head[rule] ?? 0];
      return [rule, b, h, signed(h - b)];
    });
    rows.push(['total', sum(base), sum(head), signed(sum(head) - sum(base))]);
    console.log(`base: ${baseRef}`);
    console.log(formatTable(['rule', 'base', 'head', 'delta'], rows));
  }

  if (increased.length > 0) {
    console.error(`\nVue 3 lint ratchet failed: these rules increased against ${baseRef}`);
    for (const { rule, base: b, head: h } of increased) console.error(`  ${rule} ${b} → ${h}`);
    return 1;
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 2;
  },
);
