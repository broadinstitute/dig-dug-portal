import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ResponseCache } from './response-cache.mjs';

// No unit test touches the network: a request that gets past the stubs fails here instead.
globalThis.fetch = async (url) => {
  throw new Error(`a unit test tried the network: ${url}`);
};

const U = 'https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9';

function fakeRoute(url = U, method = 'GET', postData = null) {
  const fulfilled = [];
  const aborted = [];
  return {
    fulfilled,
    aborted,
    request: () => ({ method: () => method, url: () => url, postData: () => postData }),
    fulfill: async (response) => {
      fulfilled.push(response);
    },
    abort: async (code) => {
      aborted.push(code);
    },
  };
}

function countingFetch() {
  const fetch = async () => {
    fetch.calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20)); // keep the request in flight
    return {
      status: () => 201,
      headers: () => ({ 'content-type': 'application/json', 'content-encoding': 'gzip', 'content-length': '999' }),
      body: async () => Buffer.from('{"data":[1,2,3]}'),
    };
  };
  fetch.calls = 0;
  return fetch;
}

test('keyFor is a sha256 hex digest of method, URL and body', () => {
  const cache = new ResponseCache('unused');
  const k = cache.keyFor('GET', U, null);
  assert.match(k, /^[0-9a-f]{64}$/);
  assert.equal(cache.keyFor('GET', U, null), k);
  assert.notEqual(cache.keyFor('POST', U, null), k);
  assert.notEqual(cache.keyFor('GET', `${U}&x=1`, null), k);
  assert.notEqual(cache.keyFor('POST', U, '{"a":1}'), cache.keyFor('POST', U, '{"a":2}'));
});

test('concurrent identical requests reach the network once; a new cache on the same dir reads from disk', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'response-cache-'));
  try {
    const fetch = countingFetch();
    const cache = new ResponseCache(dir, { fetch });
    const r1 = fakeRoute();
    const r2 = fakeRoute();
    await Promise.all([cache.fulfill(r1), cache.fulfill(r2)]);

    assert.equal(fetch.calls, 1);
    assert.equal(r1.fulfilled.length, 1);
    assert.equal(r2.fulfilled.length, 1);
    for (const { fulfilled } of [r1, r2]) {
      assert.equal(fulfilled[0].status, 201);
      assert.equal(Buffer.from(fulfilled[0].body).toString(), '{"data":[1,2,3]}');
      assert.equal(fulfilled[0].headers['content-type'], 'application/json');
      assert.equal(fulfilled[0].headers['content-encoding'], undefined); // body is stored decoded
      assert.equal(fulfilled[0].headers['content-length'], undefined);
    }

    // On disk: exactly <key>.json, no temp files left behind.
    const key = cache.keyFor('GET', U, null);
    assert.deepEqual(readdirSync(dir), [`${key}.json`]);
    const stored = JSON.parse(readFileSync(join(dir, `${key}.json`), 'utf8'));
    assert.equal(stored.url, U);
    assert.equal(stored.status, 201);
    assert.equal(Buffer.from(stored.bodyBase64, 'base64').toString(), '{"data":[1,2,3]}');

    const fetch2 = countingFetch();
    const second = new ResponseCache(dir, { fetch: fetch2 });
    const r3 = fakeRoute();
    await second.fulfill(r3);
    assert.equal(fetch2.calls, 0);
    assert.equal(r3.fulfilled[0].status, 201);
    assert.equal(Buffer.from(r3.fulfilled[0].body).toString(), '{"data":[1,2,3]}');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed fetch is not cached, is warned with its URL and reason, and is retried by the next request', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'response-cache-'));
  try {
    let calls = 0;
    const warned = [];
    const cache = new ResponseCache(dir, {
      fetch: async () => {
        calls += 1;
        throw new Error('network down');
      },
      warn: (message) => warned.push(message),
    });
    const route = fakeRoute();
    await cache.fulfill(route);
    assert.deepEqual(route.aborted, ['failed']);
    assert.deepEqual(readdirSync(dir), []);
    assert.equal(warned.length, 1);
    assert.ok(warned[0].includes(U) && warned[0].includes('network down'), warned[0]);
    await cache.fulfill(route);
    assert.equal(calls, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Live fetches go through Node's fetch with redirect: 'manual'. A redirect is followed only while its
// target is itself a live host, at most five hops; the 3xx itself is never cached or fulfilled
// (Chromium would request its target unrouted). The stubs answer by URL and record every request.

const BI = 'https://bioindex.hugeamp.org';

/** A fetch stub: `answers` maps a URL to a function that returns a fresh Response. */
function stubFetch(answers) {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    const answer = answers[url];
    if (!answer) throw new Error(`no stub for ${url}`);
    return answer();
  };
  return { fetchFn, calls };
}

// A 304 may not carry a body (the Response constructor throws), the others do.
const redirectTo = (location, status = 302) => () =>
  new Response(status === 304 ? null : 'moved', { status, headers: location === undefined ? {} : { location } });
const json = (body) => () => new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });

/**
 * One request for `url` through a new cache, with `answers` as the network. The cache dir is a fresh
 * temp dir (its files and their contents are returned) unless `dir` is given.
 */
async function runOnce(answers, { url = U, method = 'GET', postData = null, dir } = {}) {
  const ownDir = dir === undefined;
  const cacheDir = dir ?? mkdtempSync(join(tmpdir(), 'response-cache-'));
  try {
    const { fetchFn, calls } = stubFetch(answers);
    const warned = [];
    const cache = new ResponseCache(cacheDir, { fetchFn, warn: (message) => warned.push(message) });
    const route = fakeRoute(url, method, postData);
    await cache.fulfill(route);
    const files = ownDir ? readdirSync(cacheDir) : null;
    const stored = files?.map((f) => JSON.parse(readFileSync(join(cacheDir, f), 'utf8')));
    return { cache, route, calls, warned, files, stored };
  } finally {
    if (ownDir) rmSync(cacheDir, { recursive: true, force: true });
  }
}

test('a live -> live redirect is followed (manual, with a timeout) and cached under the original request key', async () => {
  const target = 'https://bioindex-dev.hugeamp.org/api/bio/query/gene?q=PCSK9';
  const r = await runOnce({ [U]: redirectTo(target, 301), [target]: json('{"data":["final"]}') });

  assert.deepEqual(r.calls.map((c) => c.url), [U, target]);
  for (const { init } of r.calls) {
    assert.equal(init.redirect, 'manual');
    assert.ok(init.signal instanceof AbortSignal);
  }
  assert.deepEqual(r.route.aborted, []);
  assert.equal(r.route.fulfilled.length, 1);
  assert.equal(r.route.fulfilled[0].status, 200);
  assert.equal(Buffer.from(r.route.fulfilled[0].body).toString(), '{"data":["final"]}');

  assert.deepEqual(r.files, [`${r.cache.keyFor('GET', U, null)}.json`]);
  assert.equal(r.stored[0].url, U);
  assert.equal(r.stored[0].status, 200);
  assert.equal(Buffer.from(r.stored[0].bodyBase64, 'base64').toString(), '{"data":["final"]}');
});

test('a relative location resolves against the URL that sent it', async () => {
  const a = `${BI}/api/bio/query/gene?q=PCSK9`;
  const b = `${BI}/api/v2/query/gene?q=PCSK9`; // ../../v2/query/gene?q=PCSK9 from a
  const c = `${BI}/api/final`; // /api/final from b
  const r = await runOnce({ [a]: redirectTo('../../v2/query/gene?q=PCSK9'), [b]: redirectTo('/api/final', 307), [c]: json('[]') }, { url: a });
  assert.deepEqual(r.calls.map((call) => call.url), [a, b, c]);
  assert.equal(r.route.fulfilled.length, 1);
  assert.equal(r.route.fulfilled[0].status, 200);
});

test('a live -> CMS redirect is aborted and the CMS URL is never fetched', async () => {
  for (const cms of ['https://hugeampkpncms.org/rest/views/x?portal=md', 'http://kp4cd.org/x', 'https://www.kp4cd.org/x']) {
    const r = await runOnce({ [U]: redirectTo(cms), [cms]: json('"cms"') });
    assert.deepEqual(r.calls.map((c) => c.url), [U], cms);
    assert.deepEqual(r.route.aborted, ['failed'], cms);
    assert.deepEqual(r.route.fulfilled, [], cms);
    assert.deepEqual(r.files, [], cms);
    assert.equal(r.warned.length, 1, cms);
    assert.ok(r.warned[0].includes(U) && r.warned[0].includes(`${cms} (cms) not followed`), r.warned[0]);
  }
});

test('a live -> blocked, local or non-http redirect is aborted, not followed', async () => {
  for (const target of [
    'https://example.org/x',
    'https://www.googletagmanager.com/gtag/js',
    'http://localhost:8080/about.html',
    'https://bioindex.hugeamp.org.example.org/x',
    'ftp://bioindex.hugeamp.org/x',
  ]) {
    const r = await runOnce({ [U]: redirectTo(target), [target]: json('"no"') });
    assert.deepEqual(r.calls.map((c) => c.url), [U], target);
    assert.deepEqual(r.route.aborted, ['failed'], target);
    assert.deepEqual(r.route.fulfilled, [], target);
    assert.deepEqual(r.files, [], target);
  }
});

test('a chain of six redirects is aborted after the fifth hop; five are followed', async () => {
  const hop = (i) => `${BI}/hop${i}`;
  const chain = (n) => ({
    ...Object.fromEntries(Array.from({ length: n }, (_, i) => [hop(i), redirectTo(hop(i + 1))])),
    [hop(n)]: json('"end"'),
  });

  const six = await runOnce(chain(6), { url: hop(0) });
  assert.deepEqual(six.calls.map((c) => c.url), [0, 1, 2, 3, 4, 5].map(hop)); // hop6 is never requested
  assert.deepEqual(six.route.aborted, ['failed']);
  assert.deepEqual(six.route.fulfilled, []);
  assert.deepEqual(six.files, []);
  assert.match(six.warned[0], /more than 5 redirects/);

  const five = await runOnce(chain(5), { url: hop(0) });
  assert.deepEqual(five.calls.map((c) => c.url), [0, 1, 2, 3, 4, 5].map(hop));
  assert.equal(five.route.fulfilled.length, 1);
  assert.equal(five.route.fulfilled[0].status, 200);
});

test('a 3xx with no location or an unparsable one is aborted: no 3xx is ever cached or fulfilled', async () => {
  for (const [answer, why] of [
    [redirectTo(undefined, 302), /302 .* has no location/],
    [redirectTo(undefined, 304), /304 .* has no location/],
    [redirectTo('http://[bad', 301), /301 .* has an unparsable location/],
  ]) {
    const r = await runOnce({ [U]: answer });
    assert.deepEqual(r.calls.map((c) => c.url), [U]);
    assert.deepEqual(r.route.aborted, ['failed']);
    assert.deepEqual(r.route.fulfilled, []);
    assert.deepEqual(r.files, []);
    assert.equal(r.warned.length, 1);
    assert.match(r.warned[0], why);
  }
});

test('a redirect keeps the method and body for a 307 and continues as a body-less GET after a 303', async () => {
  const target = `${BI}/api/target`;
  const kept = await runOnce({ [U]: redirectTo(target, 307), [target]: json('[]') }, { method: 'POST', postData: '{"q":1}' });
  assert.deepEqual(
    kept.calls.map((c) => [c.url, c.init.method, c.init.body]),
    [[U, 'POST', '{"q":1}'], [target, 'POST', '{"q":1}']],
  );

  const seeOther = await runOnce({ [U]: redirectTo(target, 303), [target]: json('[]') }, { method: 'POST', postData: '{"q":1}' });
  assert.deepEqual(
    seeOther.calls.map((c) => [c.url, c.init.method, c.init.body]),
    [[U, 'POST', '{"q":1}'], [target, 'GET', undefined]],
  );
});

test('when the cache cannot be written, the fetched response is still fulfilled and the failure is warned', async () => {
  const parent = mkdtempSync(join(tmpdir(), 'response-cache-'));
  try {
    // The cache dir sits under a regular file, so creating it fails (ENOTDIR).
    const file = join(parent, 'not-a-dir');
    writeFileSync(file, '');
    const r = await runOnce({ [U]: json('{"data":[7]}') }, { dir: join(file, 'cache') });
    assert.deepEqual(r.route.aborted, []);
    assert.equal(r.route.fulfilled.length, 1);
    assert.equal(r.route.fulfilled[0].status, 200);
    assert.equal(Buffer.from(r.route.fulfilled[0].body).toString(), '{"data":[7]}');
    assert.equal(r.warned.length, 1);
    assert.ok(r.warned[0].includes(U), r.warned[0]);
    assert.deepEqual(readdirSync(parent), ['not-a-dir']);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
