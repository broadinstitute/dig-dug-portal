import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Check out `ref` into a detached temporary git worktree, run `fn(dir)`, and
 * always remove the worktree afterwards. The worktree has no node_modules.
 */
export async function withWorktree(ref, fn) {
  const dir = await mkdtemp(join(tmpdir(), 'vue3-wt-'));
  try {
    execFileSync('git', ['worktree', 'add', '--detach', dir, ref], { stdio: 'pipe' });
  } catch (err) {
    await rm(dir, { recursive: true, force: true });
    throw err;
  }
  try {
    return await fn(dir);
  } finally {
    try {
      execFileSync('git', ['worktree', 'remove', '--force', dir], { stdio: 'pipe' });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
