import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CMS_HOSTS } from '../../e2e/network.mjs';
import { CmsFixtures, cmsFixtureKey } from '../../e2e/cms-fixtures.mjs';
import { CAP, DELAY_MS, USER_AGENT, captureAll, planCapture, readMissingUrls, run } from './capture-cms.mjs';

// These tests must never reach the network: the CMS has gone down under crawler load. Every
// function that fetches takes its fetch as an argument; this guard catches any that does not.
globalThis.fetch = () => {
  throw new Error('a test reached the real fetch');
};

const H = 'https://hugeampkpncms.org/rest/views/';

/** A fetch stub that records each call and answers from `responses` (url -> { status, type, body }). */
function stubFetch(responses = {}) {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    const r = responses[url] ?? { status: 200, type: 'application/json', body: '{}' };
    return new Response(r.body, { status: r.status, headers: r.type ? { 'content-type': r.type } : {} });
  };
  return { fetchFn, calls };
}

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'capture-cms-'));
}

test('planCapture: only first-seen hugeampkpncms.org URLs without a fixture are fetched, in order', () => {
  const r = planCapture(
    [H + 'a', H + 'a', 'https://kp4cd.org/rest/views/a', H + 'b', 'https://bioindex.hugeamp.org/x'],
    (u) => u === H + 'b',
    50,
  );
  assert.deepEqual(r.toFetch, [H + 'a']);
  assert.deepEqual(
    r.skipped.map((s) => s.reason),
    ['duplicate', 'not-primary-cms', 'has-fixture', 'not-primary-cms'],
  );
  assert.deepEqual(r.skipped[0], { url: H + 'a', reason: 'duplicate' });
  assert.equal(r.overCap, false);
});

test('planCapture: first-seen order is kept, http URLs and subdomains of the primary host count, lookalikes do not', () => {
  const r = planCapture(
    [H + 'c', 'http://hugeampkpncms.org/sites/default/files/x.png', H + 'a', 'https://www.hugeampkpncms.org/z', 'https://nothugeampkpncms.org/z', 'not a url'],
    () => false,
    50,
  );
  assert.deepEqual(r.toFetch, [H + 'c', 'http://hugeampkpncms.org/sites/default/files/x.png', H + 'a', 'https://www.hugeampkpncms.org/z']);
  assert.deepEqual(r.skipped, [
    { url: 'https://nothugeampkpncms.org/z', reason: 'not-primary-cms' },
    { url: 'not a url', reason: 'not-primary-cms' },
  ]);
});

test('planCapture: a URL listed twice is one duplicate, whatever host it is on', () => {
  const k = 'https://kp4cd.org/rest/views/a';
  const r = planCapture([k, k], () => false, 50);
  assert.deepEqual(r.skipped, [
    { url: k, reason: 'not-primary-cms' },
    { url: k, reason: 'duplicate' },
  ]);
});

test('planCapture: more than the cap is overCap with nothing to fetch; exactly the cap is fine', () => {
  const many = (n) => Array.from({ length: n }, (_, i) => H + i);
  const over = planCapture(many(51), () => false, 50);
  assert.equal(over.overCap, true);
  assert.deepEqual(over.toFetch, []);
  const exact = planCapture(many(50), () => false, 50);
  assert.equal(exact.overCap, false);
  assert.equal(exact.toFetch.length, 50);
  // URLs that are skipped do not count towards the cap.
  assert.equal(planCapture(many(60), (u) => Number(u.slice(H.length)) >= 10, 50).overCap, false);
});

test('the constants are the agreed ones, and the primary host is one of the CMS hosts', () => {
  assert.equal(CAP, 50);
  assert.equal(DELAY_MS, 2000);
  assert.equal(USER_AGENT, 'dig-dug-portal-e2e-fixture-capture');
  assert.ok(CMS_HOSTS.includes('hugeampkpncms.org'));
});

test('readMissingUrls: one {"url":...} per line, blank lines ignored, a bad line is an error', () => {
  const dir = tempDir();
  try {
    const file = join(dir, 'missing.ndjson');
    writeFileSync(file, `${JSON.stringify({ url: H + 'a' })}\n\n${JSON.stringify({ url: H + 'b' })}\n`);
    assert.deepEqual(readMissingUrls(file), [H + 'a', H + 'b']);
    writeFileSync(file, `${JSON.stringify({ url: H + 'a' })}\nnot json\n`);
    assert.throws(() => readMissingUrls(file), /line 2/);
    writeFileSync(file, `${JSON.stringify({ nope: 1 })}\n`);
    assert.throws(() => readMissingUrls(file), /line 1/);
    assert.equal(readMissingUrls(join(dir, 'absent.ndjson')), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('captureAll: one plain GET per URL, in order, User-Agent set, 2000 ms between requests only', async () => {
  const dir = tempDir();
  try {
    const { fetchFn, calls } = stubFetch();
    const events = [];
    const wrapped = async (url, init) => {
      events.push(`fetch ${url}`);
      return fetchFn(url, init);
    };
    const sleepFn = async (ms) => events.push(`sleep ${ms}`);
    const result = await captureAll([H + 'a', H + 'b', H + 'c'], { fetchFn: wrapped, sleepFn, dir, log: () => {} });
    assert.equal(result.ok, true);
    assert.deepEqual(events, [`fetch ${H}a`, 'sleep 2000', `fetch ${H}b`, 'sleep 2000', `fetch ${H}c`]);
    for (const c of calls) {
      assert.deepEqual(c.init, { headers: { 'User-Agent': 'dig-dug-portal-e2e-fixture-capture' } });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('captureAll: each response is written as <cmsFixtureKey(url)>.json { url, status, headers, body }, atomically', async () => {
  const dir = tempDir();
  try {
    const { fetchFn } = stubFetch({
      [H + 'a']: { status: 200, type: 'application/json; charset=utf-8', body: '[{"title":"café"}]' },
      [H + 'gone']: { status: 404, type: 'text/html', body: 'Not found' },
    });
    await captureAll([H + 'a', H + 'gone'], { fetchFn, sleepFn: async () => {}, dir, log: () => {} });

    const a = JSON.parse(readFileSync(join(dir, `${cmsFixtureKey(H + 'a')}.json`), 'utf8'));
    assert.deepEqual(a, {
      url: H + 'a',
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: '[{"title":"café"}]',
    });
    // A 404 is what the page would have seen, so it is a fixture too.
    const gone = JSON.parse(readFileSync(join(dir, `${cmsFixtureKey(H + 'gone')}.json`), 'utf8'));
    assert.equal(gone.status, 404);
    // Only the finished fixtures are left behind: no temp files.
    assert.deepEqual(readdirSync(dir).sort(), [`${cmsFixtureKey(H + 'a')}.json`, `${cmsFixtureKey(H + 'gone')}.json`].sort());
    // CmsFixtures reads them back as they were captured.
    assert.deepEqual(new CmsFixtures(dir).get(H + 'a'), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: '[{"title":"café"}]' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('captureAll: a binary response keeps its bytes (base64), and CmsFixtures serves them back as a Buffer', async () => {
  const dir = tempDir();
  try {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xfe, 0x00, 0x80]);
    const url = 'http://hugeampkpncms.org/sites/default/files/x.png';
    const fetchFn = async () => new Response(png, { status: 200, headers: { 'content-type': 'image/png' } });
    await captureAll([url], { fetchFn, sleepFn: async () => {}, dir, log: () => {} });
    const stored = JSON.parse(readFileSync(join(dir, `${cmsFixtureKey(url)}.json`), 'utf8'));
    assert.equal(stored.body, '');
    assert.equal(stored.bodyBase64, png.toString('base64'));
    const served = new CmsFixtures(dir).get(url);
    assert.equal(served.status, 200);
    assert.deepEqual(served.headers, { 'content-type': 'image/png' });
    assert.ok(Buffer.isBuffer(served.body));
    assert.deepEqual([...served.body], [...png]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('captureAll: no retries, and a 5xx or a network error stops the run (the CMS may be struggling)', async () => {
  const dir = tempDir();
  try {
    const { fetchFn, calls } = stubFetch({ [H + 'b']: { status: 503, type: 'text/html', body: 'down' } });
    const result = await captureAll([H + 'a', H + 'b', H + 'c'], { fetchFn, sleepFn: async () => {}, dir, log: () => {} });
    assert.equal(result.ok, false);
    assert.deepEqual(calls.map((c) => c.url), [H + 'a', H + 'b']); // b once, c never
    assert.deepEqual(readdirSync(dir), [`${cmsFixtureKey(H + 'a')}.json`]); // the 503 is not a fixture

    const failing = [];
    const result2 = await captureAll([H + 'a', H + 'b'], {
      fetchFn: async (url) => {
        failing.push(url);
        throw new Error('connect ETIMEDOUT');
      },
      sleepFn: async () => {},
      dir,
      log: () => {},
    });
    assert.equal(result2.ok, false);
    assert.deepEqual(failing, [H + 'a']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Everything `run` needs, with no network and no real files. */
function harness({ missing, existing = new Set(), env = {}, responses } = {}) {
  const { fetchFn, calls } = stubFetch(responses);
  const out = [];
  const err = [];
  const sleeps = [];
  const dir = tempDir();
  return {
    calls,
    out,
    err,
    sleeps,
    dir,
    deps: {
      env,
      fetchFn,
      sleepFn: async (ms) => sleeps.push(ms),
      readMissing: () => missing,
      hasFixture: (u) => existing.has(u),
      dir,
      log: (m) => out.push(m),
      error: (m) => err.push(m),
    },
  };
}

test('run --dry-run: prints the plan, exits 0, and makes no request (even with the capture env var set)', async () => {
  const h = harness({ missing: [H + 'a', H + 'a', 'https://kp4cd.org/x', H + 'b'], existing: new Set([H + 'b']), env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  try {
    assert.equal(await run(['--dry-run'], h.deps), 0);
    const text = h.out.join('\n');
    assert.ok(text.includes(H + 'a'));
    assert.match(text, /duplicate/);
    assert.match(text, /not-primary-cms/);
    assert.match(text, /has-fixture/);
    assert.equal(h.calls.length, 0);
    assert.equal(readdirSync(h.dir).length, 0);
  } finally {
    rmSync(h.dir, { recursive: true, force: true });
  }
});

test('run --dry-run: a URL the log repeats is listed once, skipped with its count', async () => {
  const h = harness({ missing: [H + 'a', H + 'a', H + 'a', H + 'b', H + 'b'] });
  try {
    assert.equal(await run(['--dry-run'], h.deps), 0);
    const lines = h.out.filter((l) => l.includes('duplicate'));
    assert.equal(lines.length, 2);
    assert.ok(lines.some((l) => l.endsWith(`${H}a (x2)`)));
    assert.ok(lines.some((l) => l.endsWith(`${H}b`)));
    assert.match(h.out.join('\n'), /3 logged request\(s\) skipped, 2 distinct/);
  } finally {
    rmSync(h.dir, { recursive: true, force: true });
  }
});

test('run: without E2E_ALLOW_CMS_CAPTURE=yes it refuses with exit 2 and makes no request', async () => {
  for (const env of [{}, { E2E_ALLOW_CMS_CAPTURE: '1' }, { E2E_ALLOW_CMS_CAPTURE: 'true' }, { E2E_ALLOW_CMS_CAPTURE: '' }]) {
    const h = harness({ missing: [H + 'a'], env });
    try {
      assert.equal(await run([], h.deps), 2);
      assert.match(h.err.join('\n'), /CMS capture needs the user's explicit go: the CMS has gone down under crawler load/);
      assert.equal(h.calls.length, 0);
      assert.deepEqual(h.sleeps, []);
    } finally {
      rmSync(h.dir, { recursive: true, force: true });
    }
  }
});

test('run: an over-cap plan is refused with exit 2 even with the env var, and makes no request', async () => {
  const missing = Array.from({ length: 51 }, (_, i) => H + i);
  const h = harness({ missing, env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  try {
    assert.equal(await run([], h.deps), 2);
    assert.match(h.err.join('\n'), /50/);
    assert.equal(h.calls.length, 0);
  } finally {
    rmSync(h.dir, { recursive: true, force: true });
  }
});

test('run --dry-run on an over-cap plan still exits 0, and says the plan is over the cap', async () => {
  const h = harness({ missing: Array.from({ length: 51 }, (_, i) => H + i) });
  try {
    assert.equal(await run(['--dry-run'], h.deps), 0);
    assert.match(h.out.join('\n'), /over the cap of 50/i);
    assert.equal(h.calls.length, 0);
  } finally {
    rmSync(h.dir, { recursive: true, force: true });
  }
});

test('run: with the env var and a plan within the cap it captures each URL, then exits 0', async () => {
  const h = harness({ missing: [H + 'a', H + 'b'], env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  try {
    assert.equal(await run([], h.deps), 0);
    assert.deepEqual(h.calls.map((c) => c.url), [H + 'a', H + 'b']);
    assert.deepEqual(h.sleeps, [2000]);
    assert.ok(existsSync(join(h.dir, `${cmsFixtureKey(H + 'a')}.json`)));
    assert.ok(existsSync(join(h.dir, `${cmsFixtureKey(H + 'b')}.json`)));
  } finally {
    rmSync(h.dir, { recursive: true, force: true });
  }
});

test('run: nothing to capture (no log, or nothing eligible) exits 0 without a request; a failed fetch exits 1; unknown flags exit 2', async () => {
  const none = harness({ missing: null, env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  const nothing = harness({ missing: [H + 'a'], existing: new Set([H + 'a']), env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  const down = harness({ missing: [H + 'a'], env: { E2E_ALLOW_CMS_CAPTURE: 'yes' }, responses: { [H + 'a']: { status: 500, type: 'text/html', body: 'x' } } });
  const flags = harness({ missing: [H + 'a'], env: { E2E_ALLOW_CMS_CAPTURE: 'yes' } });
  try {
    assert.equal(await run(['--dry-run'], none.deps), 0);
    assert.equal(await run([], none.deps), 0);
    assert.equal(none.calls.length, 0);
    assert.equal(await run([], nothing.deps), 0);
    assert.equal(nothing.calls.length, 0);
    assert.equal(await run([], down.deps), 1);
    assert.equal(await run(['--force'], flags.deps), 2);
    assert.equal(flags.calls.length, 0);
  } finally {
    for (const h of [none, nothing, down, flags]) rmSync(h.dir, { recursive: true, force: true });
  }
});
