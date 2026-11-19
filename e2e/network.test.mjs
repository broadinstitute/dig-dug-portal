import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyUrl, installNetworkPolicy, CMS_HOSTS, LIVE_HOSTS } from './network.mjs';
import { CmsFixtures, cmsFixtureKey } from './cms-fixtures.mjs';

const L = ['http://localhost:8080', 'http://localhost:8081'];

test('classifyUrl: local origins, CMS hosts (incl. the kp4cd.org failover), live data, everything else blocked', () => {
  assert.equal(classifyUrl('http://localhost:8081/js/gene.js', L), 'local');
  assert.equal(classifyUrl('https://hugeampkpncms.org/rest/views/news2vueportal?portal=md', L), 'cms');
  assert.equal(classifyUrl('https://kp4cd.org/reset/views/portal_front?portal=md', L), 'cms');
  assert.equal(classifyUrl('https://www.kp4cd.org/x', L), 'cms');
  assert.equal(classifyUrl('https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9', L), 'live');
  assert.equal(classifyUrl('https://www.googletagmanager.com/gtag/js?id=G-X', L), 'blocked');
  assert.equal(classifyUrl('https://notkp4cd.org/x', L), 'blocked'); // suffix match must respect the dot boundary
});

test('classifyUrl: a local origin must match exactly, and non-http URLs are blocked', () => {
  assert.equal(classifyUrl('http://localhost:9999/index.html', L), 'blocked');
  assert.equal(classifyUrl('data:image/png;base64,AAAA', L), 'blocked');
  assert.equal(classifyUrl('not a url', L), 'blocked');
});

test('the host lists are the agreed ones', () => {
  assert.deepEqual(CMS_HOSTS, ['hugeampkpncms.org', 'kp4cd.org']);
  assert.deepEqual(LIVE_HOSTS, ['bioindex.hugeamp.org', 'bioindex-dev.hugeamp.org', 'ld.hugeamp.org', 'portaldev.sph.umich.edu']);
});

test('installNetworkPolicy routes each class: continue, CMS fixture, cache, abort', async () => {
  let handler;
  const context = { route: async (pattern, fn) => { handler = fn; } };
  const calls = [];
  const cache = { fulfill: async (route) => calls.push(['cache', route.request().url()]) };
  const fixture = { status: 200, headers: { 'content-type': 'application/json' }, body: '[]' };
  const cms = { get: (url) => (url.includes('has-fixture') ? fixture : null) };
  await installNetworkPolicy(context, { cache, cms, localOrigins: L });
  assert.equal(typeof handler, 'function');

  const fakeRoute = (url) => ({
    request: () => ({ url: () => url, method: () => 'GET', postData: () => null }),
    continue: async () => calls.push(['continue', url]),
    fulfill: async (r) => calls.push(['fulfill', url, r]),
    abort: async (code) => calls.push(['abort', url, code]),
  });

  await handler(fakeRoute('http://localhost:8080/gene.html?gene=PCSK9'));
  await handler(fakeRoute('https://hugeampkpncms.org/rest/has-fixture'));
  await handler(fakeRoute('https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9'));
  await handler(fakeRoute('https://www.googletagmanager.com/gtag/js'));

  assert.deepEqual(calls, [
    ['continue', 'http://localhost:8080/gene.html?gene=PCSK9'],
    ['fulfill', 'https://hugeampkpncms.org/rest/has-fixture', fixture],
    ['cache', 'https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9'],
    ['abort', 'https://www.googletagmanager.com/gtag/js', 'blockedbyclient'],
  ]);
});

test('CmsFixtures: <sha256(url)>.json holds { url, status, headers, body }; a missing fixture is null', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cms-fixtures-'));
  try {
    const url = 'https://hugeampkpncms.org/rest/views/news2vueportal?portal=md';
    const key = cmsFixtureKey(url);
    assert.match(key, /^[0-9a-f]{64}$/);
    assert.notEqual(cmsFixtureKey(`${url}&x=1`), key);
    const stored = { url, status: 200, headers: { 'content-type': 'application/json' }, body: '[]' };
    writeFileSync(join(dir, `${key}.json`), JSON.stringify(stored));

    const cms = new CmsFixtures(dir);
    assert.deepEqual(cms.get(url), { status: 200, headers: { 'content-type': 'application/json' }, body: '[]' });
    assert.equal(cms.get('https://hugeampkpncms.org/rest/other'), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
