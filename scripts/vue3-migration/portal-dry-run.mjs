// Portal-branch dry run: what the two registration codemods would do on every portal branch. Strictly
// read-only; it is planning input for the sync points, when `master` is merged down into each portal.
//
//   npm run codemod:portal-dry-run > .superpowers/reports/stage1-portal-dry-run.md
//
// The 11 portal branches (`PORTAL_REFS`) each have their own components and pages, so the codemods
// (`register-components.mjs`, phase 1, and `unwrap-vue-component.mjs`, phase 2) have to run on each one at
// its sync point. For every branch this checks out `origin/<branch>` into a temporary detached worktree
// (`withWorktree`), analyzes the tree there, removes the worktree and moves on to the next branch:
//
//   - Phase 1: the same analysis as `register-components --dry-run` (`analyzePhaseOne`): findings, files
//     it would change, entries, and the uses it cannot place, by reason.
//   - Phase 2: the files `unwrapSource` would change and the files it refuses (`analyzePhaseTwo`). The
//     phase 2 command refuses to run until phase 1 is complete (ruling R2), which no unmigrated branch is,
//     so this skips that check: it is the count to expect once phase 1 is complete.
//   - The scan's analysis errors, and whether ESLint could lint the tree at all.
//
// The report is markdown on stdout: a table with one row per branch and a totals row, then one section per
// branch with the lists to fix by hand (every unresolved use, every runtime component choice to check, every
// file a phase refuses, every analysis error). Progress goes to stderr.
//
// Read-only: `git fetch origin` once at the start (it moves the `origin/*` refs, not a local branch) and
// then temporary worktrees; nothing is written to a worktree, committed, pushed or installed. ESLint plugins
// resolve from this repo, so a worktree needs no `node_modules`. If the fetch fails the run goes on with the
// `origin/*` refs already present, and the report says so.
//
// One branch failing (a checkout error, an exception) is an `error` row with the message; the others still run.
//
// Exit codes: 0 every branch has a row (a row may be an error), 1 no branch could be analyzed, 2 usage error.
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';
import { CHECK_BY_HAND, analysisErrorLine, analyzePhaseOne, cell, checkByHandTable, code, oneLine, unresolvedTable } from './register-components.mjs';
import { REASONS } from './register-plan.mjs';
import { PORTAL_REFS } from './unused-report.mjs';
import { analyzePhaseTwo } from './unwrap-vue-component.mjs';
import { withWorktree } from './worktree.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const USAGE = 'usage: node scripts/vue3-migration/portal-dry-run.mjs';
const NOT_AVAILABLE = 'n/a';
const NOT_COMPUTED = 'Not computed: the lint step failed.';
const IF_COMPLETE = '(if phase 1 were complete)';
const SHA_LENGTH = 9;
const FETCH_TIMEOUT_MS = 120_000;

const NUMERIC_HEADERS = [
  'findings',
  'files to change',
  'entries',
  'unresolved',
  ...REASONS,
  'phase 1 failed',
  `phase 2 files to change ${IF_COMPLETE}`,
  `phase 2 refused ${IF_COMPLETE}`,
  'analysis errors',
];

/**
 * What `analyzeTree` returns for one tree, and what a row of the report holds besides its branch.
 *
 *  - `phase1`: `findings`, the `files` and `entries` it would write, the `unresolved` uses (see
 *    `register-plan.mjs`) and the `failed` files (`{ file, message }`: could not be edited, or did not parse
 *    again).
 *  - `phase2`: the `files` it would change, and the `refused` ones (`{ file, message }`).
 *  - `analysisErrors`: what the scan of the tree found, and `lintError` the lint's message when ESLint could
 *    not lint the tree (`null` otherwise), in which case the phase 1 figures are empty, not zero.
 *  - `checkByHand`: the components chosen at run time (`RuntimeChoice`, see `analyzeSources`); they need no
 *    lint.
 * @typedef {{ phase1: { findings: number, files: number, entries: number,
 *     unresolved: import('./register-plan.mjs').Unresolved[], failed: { file: string, message: string }[] },
 *   phase2: { files: number, refused: { file: string, message: string }[] },
 *   analysisErrors: { file: string, line?: number, kind: string, message: string }[],
 *   lintError: string | null, checkByHand: import('./component-graph.mjs').RuntimeChoice[] }} Analysis
 */

/**
 * One row of the report: `{ branch, sha, ...Analysis }`, or `{ branch, sha, error }` when the branch could
 * not be analyzed. `sha` is null when the ref did not resolve.
 * @typedef {{ branch: string, sha: string | null } & (Analysis | { error: string })} Row
 */

/**
 * Both codemods' dry runs over the tree under `root`, as the figures a row needs. Nothing is written, and
 * the lint runs once (phase 2 does not need it). Rejects when `root` has no `src/` folder.
 * `lint`, `apply` and `unwrap` are the codemods' seams (see `analyzePhaseOne` and `analyzePhaseTwo`).
 * @param {string} root
 * @param {{ lint?: Parameters<typeof analyzePhaseOne>[1]['lint'], apply?: Parameters<typeof analyzePhaseOne>[1]['apply'],
 *   unwrap?: Parameters<typeof analyzePhaseTwo>[1]['unwrap'] }} [deps]
 * @returns {Promise<Analysis>}
 */
export async function analyzeTree(root, { lint, apply, unwrap } = {}) {
  const one = await analyzePhaseOne(root, { lint, apply });
  const two = analyzePhaseTwo(one.sources, { unwrap });
  return {
    phase1: {
      findings: one.findings,
      files: one.changes.length,
      entries: one.changes.reduce((sum, { entries }) => sum + entries, 0),
      unresolved: one.plan.unresolved,
      failed: one.failures,
    },
    phase2: { files: two.changes.length, refused: two.failures },
    analysisErrors: one.analysisErrors,
    lintError: one.lintError,
    checkByHand: one.runtimeChoices,
  };
}

const isError = (row) => row.error !== undefined;
const isLintFailed = (row) => !isError(row) && row.lintError !== null;
/** A row's status: `error`, `lint-failed` (analyzed, but the phase 1 figures are `n/a`) or `ok`. */
const statusOf = (row) => (isError(row) ? 'error' : isLintFailed(row) ? 'lint-failed' : 'ok');
const STATUSES = ['ok', 'lint-failed', 'error'];

/** The numeric cells of a row, in `NUMERIC_HEADERS` order; null is `n/a`. An error row has none. */
function figures(row) {
  if (isError(row)) return NUMERIC_HEADERS.map(() => null);
  const { phase1, phase2, analysisErrors, lintError } = row;
  const fromLint = [
    phase1.findings,
    phase1.files,
    phase1.entries,
    phase1.unresolved.length,
    ...REASONS.map((reason) => phase1.unresolved.filter((item) => item.reason === reason).length),
    phase1.failed.length,
  ].map((count) => (lintError === null ? count : null));
  return [...fromLint, phase2.files, phase2.refused.length, analysisErrors.length];
}

const shaCell = (row) => (row.sha === null ? NOT_AVAILABLE : code(row.sha));
const number = (count) => (count === null ? NOT_AVAILABLE : String(count));

function tableRow(row) {
  const status = isError(row) ? cell(`error: ${oneLine(row.error)}`) : statusOf(row);
  const lint = isError(row) ? NOT_AVAILABLE : row.lintError === null ? 'no' : 'yes';
  return `| ${[cell(row.branch), shaCell(row), status, ...figures(row).map(number), lint].join(' | ')} |`;
}

/** How many rows have each status, in `STATUSES` order. */
const statusCounts = (rows) => STATUSES.map((status) => [status, rows.filter((row) => statusOf(row) === status).length]);

function totalsRow(rows) {
  const status = statusCounts(rows)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${count} ${name}`)
    .join(', ');
  const totals = NUMERIC_HEADERS.map((_, i) => rows.reduce((sum, row) => sum + (figures(row)[i] ?? 0), 0));
  return `| ${['**total**', '', status, ...totals, rows.filter(isLintFailed).length].join(' | ')} |`;
}

/** The heading of a branch's section: the branch and, when the ref resolved, its commit. */
const sectionHeading = (row) => `## ${row.branch}${row.sha === null ? '' : ` (${code(row.sha)})`}`;

function branchSection(row) {
  const lines = [sectionHeading(row), ''];
  if (isError(row)) {
    lines.push(`Error: ${oneLine(row.error)}`);
    return lines;
  }
  const { phase1, phase2, analysisErrors, lintError, checkByHand } = row;
  const lintFailed = lintError !== null;

  lines.push(lintFailed ? '### Unresolved uses' : `### Unresolved uses (${phase1.unresolved.length})`, '');
  if (lintFailed) lines.push(NOT_COMPUTED);
  else if (phase1.unresolved.length === 0) lines.push('None.');
  else lines.push(...unresolvedTable(phase1.unresolved));

  lines.push('', lintFailed ? '### Phase 1 failed' : `### Phase 1 failed (${phase1.failed.length})`, '');
  if (lintFailed) lines.push(NOT_COMPUTED);
  else if (phase1.failed.length === 0) lines.push('None.');
  else lines.push(...phase1.failed.map(({ file, message }) => `- ${code(file)}: ${message}`));

  lines.push('', `### Check by hand (${checkByHand.length})`, '');
  if (checkByHand.length === 0) lines.push('None.');
  else lines.push(CHECK_BY_HAND, '', ...checkByHandTable(checkByHand));

  lines.push('', `### Phase 2 refused, ${IF_COMPLETE.slice(1, -1)} (${phase2.refused.length})`, '');
  if (phase2.refused.length === 0) lines.push('None.');
  else lines.push(...phase2.refused.map(({ file, message }) => `- ${code(file)}: ${message}`));

  lines.push('', `### Analysis errors (${analysisErrors.length})`, '');
  if (analysisErrors.length === 0) lines.push('None.');
  else lines.push(...analysisErrors.map(analysisErrorLine));

  if (lintFailed) lines.push('', '### Lint failed', '', 'ESLint could not lint the tree, so there are no findings and nothing could be planned for phase 1:', '', `- ${lintError}`);
  return lines;
}

/**
 * The markdown report: a header, a table with one row per branch and a totals row, then one section per
 * branch with the lists to fix by hand.
 *
 * Totals add up the figures that are numbers: an `n/a` cell (the lint failed, or the branch is an error
 * row) counts as nothing. `meta.fetch` says how the `git fetch origin` went: `{ ok: true }`, or
 * `{ ok: false, message }`; with none, the report says nothing about it.
 * @param {Row[]} rows
 * @param {{ fetch?: { ok: true } | { ok: false, message: string } }} [meta]
 * @returns {string}
 */
export function renderPortalReport(rows, { fetch } = {}) {
  const lines = [
    '# Portal-branch dry run: component registration codemods',
    '',
    'Planning input for the sync points, when `master` is merged down into each portal branch. Each branch was checked out into a temporary worktree and both registration codemods were run on it as a dry run: this is read-only, nothing was written, committed or pushed.',
    '',
    'Each branch is analyzed as it stands on `origin/<branch>`, without the registration work done on `master` merged in. Once that work is merged down, the uses `master` has already settled drop out of these counts.',
    '',
  ];
  if (fetch?.ok === true) lines.push('Fetched `origin` before the run.', '');
  else if (fetch) {
    lines.push(`\`git fetch origin\` failed (${oneLine(fetch.message)}); the \`origin/*\` refs already present were used, so they may be out of date.`, '');
  }
  lines.push(
    `Branches: ${rows.length} (${statusCounts(rows).map(([name, count]) => `${count} ${name}`).join(', ')}).`,
    '',
    '- Phase 1 is `register-components`: `findings` are the uses of an undefined component tag, `files to change` and `entries` what it would write, `unresolved` the uses it cannot place (by reason; each is listed below), and `phase 1 failed` the files it could not edit. `phase-2-present` uses name a component that is already unwrapped; with any of them phase 1 writes nothing, so a branch should show 0 there until phase 1 has run on it.',
    `- Phase 2 is \`unwrap-vue-component\`. Phase 2 is counted as if phase 1 were complete: the real command refuses until phase 1 is complete (ruling R2), which would only report a refusal on a branch that has not been migrated. \`refused\` files have a shape it will not guess at (\`lang="ts"\`, several \`<script>\` blocks, ...).`,
    '- `analysis errors` are what the scan of the tree found (a script that does not parse, say); `lint failed` says ESLint could not lint the tree, so the phase 1 figures are `n/a` for that branch and its status is `lint-failed`.',
    '- Totals leave out the `n/a` cells.',
    '',
    `| ${['branch', 'SHA', 'status', ...NUMERIC_HEADERS, 'lint failed'].join(' | ')} |`,
    `| ${['---', '---', '---', ...NUMERIC_HEADERS.map(() => '---:'), '---'].join(' | ')} |`,
    ...rows.map(tableRow),
    totalsRow(rows),
    '',
    'The sections below are the hand-fix lists for each sync point.',
  );
  for (const row of rows) lines.push('', ...branchSection(row));
  return `${lines.join('\n')}\n`;
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

/** `git fetch origin`: moves the `origin/*` refs only, no local branch. Gives up after two minutes. */
function fetchOrigin() {
  git(['fetch', 'origin'], { timeout: FETCH_TIMEOUT_MS });
}

function resolveSha(ref) {
  try {
    return git(['rev-parse', '--verify', '--quiet', `--short=${SHA_LENGTH}`, `${ref}^{commit}`]).trim();
  } catch {
    throw new Error(`ref not found: ${ref}`);
  }
}

const messageOf = (error) => oneLine(error instanceof Error ? error.message : error);

/**
 * Runs both dry runs on every portal branch and writes the report to `out`.
 *
 * `refs`, `fetch()`, `resolveSha(ref)`, `withWorktree(ref, fn)` and `analyze(root)` default to
 * `PORTAL_REFS`, `git fetch origin`, `git rev-parse`, `withWorktree` and `analyzeTree`; they are seams for
 * tests, which must not touch git. Branches run one at a time, in order. Progress and a one-line summary of
 * what failed go to `err`.
 *
 * Does not reject for a branch: an exception while it is checked out or analyzed is an `error` row.
 *
 * @param {string[]} argv
 * @param {{ refs?: string[], fetch?: () => void, resolveSha?: (ref: string) => string,
 *   withWorktree?: (ref: string, fn: (dir: string) => Promise<Analysis>) => Promise<Analysis>,
 *   analyze?: (root: string) => Promise<Analysis>, out?: { write: (text: string) => unknown },
 *   err?: { write: (text: string) => unknown } }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const {
    refs = PORTAL_REFS,
    fetch = fetchOrigin,
    resolveSha: shaOf = resolveSha,
    withWorktree: inWorktree = withWorktree,
    analyze = analyzeTree,
    out = process.stdout,
    err = process.stderr,
  } = deps;

  try {
    parseNodeArgs({ args: argv, options: {}, allowPositionals: false });
  } catch (error) {
    err.write(`${error.message}\n${USAGE}\n`);
    return 2;
  }

  let fetched;
  try {
    fetch();
    fetched = { ok: true };
  } catch (error) {
    const message = String(error?.stderr || error?.message || error).trim();
    fetched = { ok: false, message };
    err.write(`portal-dry-run: git fetch origin failed (${oneLine(message)}); going on with the refs already present\n`);
  }

  const rows = [];
  for (const [i, ref] of refs.entries()) {
    const branch = ref.replace(/^origin\//, '');
    const started = Date.now();
    let sha = null;
    try {
      sha = shaOf(ref);
      const analysis = await inWorktree(ref, analyze);
      rows.push({ branch, sha, ...analysis });
      err.write(`[${i + 1}/${refs.length}] ${branch}: done in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
    } catch (error) {
      const message = messageOf(error);
      rows.push({ branch, sha, error: message });
      err.write(`[${i + 1}/${refs.length}] ${branch}: error: ${message}\n`);
    }
  }

  out.write(renderPortalReport(rows, { fetch: fetched }));

  if (!rows.some((row) => !isError(row))) {
    err.write('portal-dry-run: no branch could be analyzed\n');
    return 1;
  }
  return 0;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

// Run the CLI only when executed directly, so tests can import `run`.
if (isMain()) {
  // `withWorktree` runs git in the process cwd, so anchor it to this repo.
  process.chdir(repoRoot);
  run(process.argv.slice(2)).then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
