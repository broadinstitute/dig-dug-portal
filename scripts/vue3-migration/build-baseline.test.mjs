import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installPlan } from './build-baseline.mjs';

const INSTALL = { kind: 'npm', args: ['install', '--no-audit', '--no-fund'] };
const CI = { kind: 'npm', args: ['ci', '--no-audit', '--no-fund'] };
const LINK = { kind: 'link' };

test('installPlan: a ref without package-lock.json gets npm install (the lockfile-less portal branches)', () => {
  assert.deepEqual(installPlan({ refHasLockfile: false, lockfileMatches: false, repoHasNodeModules: true }), INSTALL);
  // Even when this checkout has no lockfile either, so git sees no difference.
  assert.deepEqual(installPlan({ refHasLockfile: false, lockfileMatches: true, repoHasNodeModules: true }), INSTALL);
});

test("installPlan: a lockfile matching this checkout's borrows its node_modules", () => {
  assert.deepEqual(installPlan({ refHasLockfile: true, lockfileMatches: true, repoHasNodeModules: true }), LINK);
});

test('installPlan: a lockfile that differs, or no node_modules to borrow, gets npm ci', () => {
  assert.deepEqual(installPlan({ refHasLockfile: true, lockfileMatches: false, repoHasNodeModules: true }), CI);
  assert.deepEqual(installPlan({ refHasLockfile: true, lockfileMatches: true, repoHasNodeModules: false }), CI);
});
