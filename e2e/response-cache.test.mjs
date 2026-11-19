import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ResponseCache } from './response-cache.mjs';

const U = 'https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9';

function fakeRoute(url = U, method = 'GET', postData = null) {
  const fulfilled = [];
  return {
    fulfilled,
    request: () => ({ method: () => method, url: () => url, postData: () => postData }),
    fulfill: async (response) => {
      fulfilled.push(response);
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

test('a failed fetch is not cached and is retried by the next request', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'response-cache-'));
  try {
    let calls = 0;
    const cache = new ResponseCache(dir, {
      fetch: async () => {
        calls += 1;
        throw new Error('network down');
      },
    });
    const aborted = [];
    const route = { ...fakeRoute(), abort: async (code) => aborted.push(code) };
    await cache.fulfill(route);
    assert.deepEqual(aborted, ['failed']);
    assert.deepEqual(readdirSync(dir), []);
    await cache.fulfill(route);
    assert.equal(calls, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
