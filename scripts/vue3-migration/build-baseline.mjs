// Build a git ref into dist-baseline/, the baseline that e2e/compare.spec.mjs compares dist/ against.
//
//   npm run e2e:baseline -- <ref>
//
// The ref is checked out in a temporary worktree and built with `npm run deploy`. When its
// package-lock.json matches this checkout's, the worktree borrows this repo's node_modules through
// symlinks; when it has one that differs, it runs `npm ci`; when it has none (the lockfile-less
// portal branches), `npm install`. The build's dist/ replaces dist-baseline/, and
// dist-baseline/.baseline-ref records the commit SHA that was built.
//
// Exit codes: 0 built, 1 the install or build failed, 2 usage error, unknown ref or git failure.
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withWorktree } from './worktree.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = 'dist-baseline';
const REF_FILE = '.baseline-ref';
const USAGE = 'usage: npm run e2e:baseline -- <ref>';

class StepFailed extends Error {}

/** The full commit SHA `ref` names, or null when it names no commit. */
function resolveCommit(ref) {
  try {
    return execFileSync('git', ['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * How the worktree gets its packages: borrow this checkout's node_modules when the ref's lockfile
 * is the one they were installed from, `npm ci` when the ref has a different lockfile, and
 * `npm install` when it has none (`npm ci` refuses to run without one).
 *
 * @param {{ refHasLockfile: boolean, lockfileMatches: boolean, repoHasNodeModules: boolean }} state
 * @returns {{ kind: 'link' } | { kind: 'npm', args: string[] }}
 */
export function installPlan({ refHasLockfile, lockfileMatches, repoHasNodeModules }) {
  if (!refHasLockfile) return { kind: 'npm', args: ['install', '--no-audit', '--no-fund'] };
  if (lockfileMatches && repoHasNodeModules) return { kind: 'link' };
  return { kind: 'npm', args: ['ci', '--no-audit', '--no-fund'] };
}

/**
 * Whether `sha`'s package-lock.json is the one this checkout's node_modules was installed from.
 * Compared against the working tree rather than HEAD, so an uncommitted dependency change in the
 * candidate is never borrowed by the baseline.
 */
function lockfileMatches(sha) {
  const { status } = spawnSync('git', ['diff', '--quiet', sha, '--', 'package-lock.json'], { stdio: 'ignore' });
  if (status !== 0 && status !== 1) throw new Error(`git diff --quiet ${sha} -- package-lock.json exited ${status}`);
  return status === 0;
}

/**
 * Give the worktree this repo's packages: a real node_modules/ whose entries link to the repo's.
 * Linking entry by entry, rather than the directory, leaves out node_modules/.cache: Vue CLI's
 * babel/vue-loader caches are keyed by absolute path, so a build in a fresh temporary directory
 * could never reuse them and would only grow the repo's cache. The worktree's own cache goes with it.
 */
function linkNodeModules(dir) {
  const source = join(repoRoot, 'node_modules');
  const target = join(dir, 'node_modules');
  mkdirSync(target);
  for (const name of readdirSync(source)) {
    if (name !== '.cache') symlinkSync(join(source, name), join(target, name));
  }
}

function run(command, args, cwd) {
  const { status, signal, error } = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (error) throw new StepFailed(`${command} ${args.join(' ')}: ${error.message}`);
  if (status !== 0) throw new StepFailed(`${command} ${args.join(' ')} failed (${signal ?? `exit ${status}`})`);
}

async function main(argv) {
  if (argv.length !== 1 || argv[0].startsWith('-')) {
    console.error(USAGE);
    return 2;
  }
  const [ref] = argv;

  // `git worktree add` and `git diff` run against the process cwd, so anchor it to this repo.
  process.chdir(repoRoot);

  const sha = resolveCommit(ref);
  if (!sha) {
    console.error(`unknown ref: ${ref}\n${USAGE}`);
    return 2;
  }

  await withWorktree(sha, async (dir) => {
    const refHasLockfile = existsSync(join(dir, 'package-lock.json'));
    const plan = installPlan({
      refHasLockfile,
      lockfileMatches: refHasLockfile && lockfileMatches(sha),
      repoHasNodeModules: existsSync(join(repoRoot, 'node_modules')),
    });
    if (plan.kind === 'link') {
      console.log(`${ref} (${sha}): package-lock.json matches this checkout, linking its node_modules`);
      linkNodeModules(dir);
    } else {
      console.log(`${ref} (${sha}): running npm ${plan.args.join(' ')}`);
      run('npm', plan.args, dir);
    }
    run('npm', ['run', 'deploy'], dir);

    const out = join(repoRoot, OUT_DIR);
    rmSync(out, { recursive: true, force: true });
    cpSync(join(dir, 'dist'), out, { recursive: true });
    writeFileSync(join(out, REF_FILE), `${sha}\n`);
  });

  console.log(`${OUT_DIR}/ built from ${ref} (${sha})`);
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

// Run the CLI only when executed directly, so tests can import installPlan.
if (isMain()) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = err instanceof StepFailed ? 1 : 2;
    },
  );
}
