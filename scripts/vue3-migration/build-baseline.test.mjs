import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildScript, installPlan } from './build-baseline.mjs';

const SCRIPT = fileURLToPath(new URL('./build-baseline.mjs', import.meta.url));

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

test('buildScript: production is `npm run deploy` and development is `npm run build`', () => {
  assert.equal(buildScript('production'), 'deploy');
  assert.equal(buildScript('development'), 'build');
});

test('buildScript: any other mode throws', () => {
  for (const mode of ['staging', '', undefined, 'Production']) {
    assert.throws(() => buildScript(mode), /unknown mode/);
  }
});

// These argv never get as far as git or a build, so the CLI can run for real.
test('the CLI exits 2 with the usage line when its arguments are wrong', () => {
  const bad = [
    [], // no ref
    ['main', '--mode', 'staging'], // a mode that has no build script
    ['--mode', 'development'], // a mode but no ref
    ['main', 'extra'], // two refs
    ['main', '--bogus'], // an option that does not exist
  ];
  for (const args of bad) {
    const { status, stderr } = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
    assert.equal(status, 2, `exit code for ${JSON.stringify(args)}`);
    assert.match(stderr, /usage: npm run e2e:baseline -- <ref> \[--mode production\|development\]/, JSON.stringify(args));
  }
});
