import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyUrl, installNetworkPolicy, liveDataDisabled, CMS_HOSTS, LIVE_HOSTS } from './network.mjs';
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

// E2E_NO_LIVE_DATA=1 is the no-live-data mode for runs that cannot reach the live data services (the
// GitHub runners get a Cloudflare managed challenge, 403, from them): live requests are aborted, so
// every run sees the same "no data" and no request leaves the machine for a live host.
test('liveDataDisabled: true only for E2E_NO_LIVE_DATA=1', () => {
  assert.equal(liveDataDisabled({ E2E_NO_LIVE_DATA: '1' }), true);
  assert.equal(liveDataDisabled({}), false);
  for (const value of ['0', 'true', '', 'yes', ' 1', undefined]) {
    assert.equal(liveDataDisabled({ E2E_NO_LIVE_DATA: value }), false, JSON.stringify(value));
  }
});

test('liveDataDisabled reads process.env by default', () => {
  const saved = process.env.E2E_NO_LIVE_DATA;
  try {
    process.env.E2E_NO_LIVE_DATA = '1';
    assert.equal(liveDataDisabled(), true);
    delete process.env.E2E_NO_LIVE_DATA;
    assert.equal(liveDataDisabled(), false);
  } finally {
    if (saved === undefined) delete process.env.E2E_NO_LIVE_DATA;
    else process.env.E2E_NO_LIVE_DATA = saved;
  }
});

function liveHarness(opts) {
  const calls = [];
  const cache = { fulfill: async (route) => calls.push(['cache', route.request().url()]) };
  const fixture = { status: 200, headers: { 'content-type': 'application/json' }, body: '[]' };
  const cms = { get: (url) => (url.includes('has-fixture') ? fixture : null) };
  const setup = async () => {
    let handler;
    await installNetworkPolicy({ route: async (pattern, fn) => { handler = fn; } }, { cache, cms, localOrigins: L, ...opts });
    return (url) =>
      handler({
        request: () => ({ url: () => url, method: () => 'GET', postData: () => null }),
        continue: async () => calls.push(['continue', url]),
        fulfill: async (r) => calls.push(['fulfill', url, r]),
        abort: async (code) => calls.push(['abort', url, code]),
      });
  };
  return { setup, calls, fixture };
}

const LIVE_URLS = [
  'https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9',
  'https://bioindex-dev.hugeamp.org/api/bio/query/gene?q=PCSK9',
  'https://ld.hugeamp.org/api/ld/query',
  'https://portaldev.sph.umich.edu/api/v1/statistic/single/',
];

test('installNetworkPolicy with no live data aborts every live URL and never calls the cache', async () => {
  const h = liveHarness({ noLiveData: true });
  const route = await h.setup();
  for (const url of LIVE_URLS) await route(url);
  assert.deepEqual(
    h.calls,
    LIVE_URLS.map((url) => ['abort', url, 'blockedbyclient']),
  );
});

test('installNetworkPolicy with no live data leaves local, CMS and blocked requests as they are', async () => {
  const h = liveHarness({ noLiveData: true });
  const route = await h.setup();
  await route('http://localhost:8080/gene.html?gene=PCSK9');
  await route('https://hugeampkpncms.org/rest/has-fixture');
  await route('https://hugeampkpncms.org/rest/no-fixture');
  await route('https://www.googletagmanager.com/gtag/js');
  assert.deepEqual(h.calls, [
    ['continue', 'http://localhost:8080/gene.html?gene=PCSK9'],
    ['fulfill', 'https://hugeampkpncms.org/rest/has-fixture', h.fixture],
    ['abort', 'https://hugeampkpncms.org/rest/no-fixture', 'blockedbyclient'],
    ['abort', 'https://www.googletagmanager.com/gtag/js', 'blockedbyclient'],
  ]);
});

test('installNetworkPolicy with live data sends a live URL to the cache', async () => {
  const h = liveHarness({ noLiveData: false });
  const route = await h.setup();
  await route(LIVE_URLS[0]);
  assert.deepEqual(h.calls, [['cache', LIVE_URLS[0]]]);
});

test('installNetworkPolicy takes the no-live-data mode from E2E_NO_LIVE_DATA when no option is given', async () => {
  const saved = process.env.E2E_NO_LIVE_DATA;
  try {
    process.env.E2E_NO_LIVE_DATA = '1';
    const off = liveHarness({});
    await (await off.setup())(LIVE_URLS[0]);
    assert.deepEqual(off.calls, [['abort', LIVE_URLS[0], 'blockedbyclient']]);

    delete process.env.E2E_NO_LIVE_DATA;
    const on = liveHarness({});
    await (await on.setup())(LIVE_URLS[0]);
    assert.deepEqual(on.calls, [['cache', LIVE_URLS[0]]]);
  } finally {
    if (saved === undefined) delete process.env.E2E_NO_LIVE_DATA;
    else process.env.E2E_NO_LIVE_DATA = saved;
  }
});

// Chromium follows a redirect that route.fulfill replays, but the redirect target does not go back
// through the route: it is requested live. So the policy never hands the browser a 3xx with a
// location; it follows the redirect through the fixtures itself and fulfills with the final response.
// (Checked against Playwright 1.64.1: the target of a fulfilled 301 got no route callback.)
function redirectHarness(fixtures) {
  const cms = { get: (url) => fixtures[url] ?? null };
  const noted = [];
  const out = [];
  const setup = async () => {
    let handler;
    await installNetworkPolicy({ route: async (pattern, fn) => { handler = fn; } }, { cache: {}, cms, localOrigins: L, noteMissing: (u) => noted.push(u) });
    return (url) =>
      handler({
        request: () => ({ url: () => url, method: () => 'GET', postData: () => null }),
        fulfill: async (r) => out.push(['fulfill', url, r]),
        abort: async (code) => out.push(['abort', url, code]),
        continue: async () => out.push(['continue', url]),
      });
  };
  return { setup, noted, out };
}

const moved = (location, extra = {}) => ({ status: 301, headers: { 'content-type': 'text/html', location }, body: 'moved', ...extra });
const png = { status: 200, headers: { 'content-type': 'image/png' }, body: Buffer.from([1, 2, 3]) };

test('CmsFixtures.get passes a redirect fixture\'s location header through', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cms-fixtures-'));
  try {
    const url = 'http://hugeampkpncms.org/sites/default/files/a.png';
    const location = 'https://hugeampkpncms.org/sites/default/files/a.png';
    writeFileSync(join(dir, `${cmsFixtureKey(url)}.json`), JSON.stringify({ url, status: 301, headers: { 'content-type': 'text/html', location }, body: 'moved' }));
    assert.deepEqual(new CmsFixtures(dir).get(url), { status: 301, headers: { 'content-type': 'text/html', location }, body: 'moved' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a CMS redirect fixture is followed through the fixtures: the browser gets the final response, never a 3xx to replay', async () => {
  const A = 'http://hugeampkpncms.org/a.png';
  const B = 'https://hugeampkpncms.org/a.png';
  const h = redirectHarness({ [A]: moved(B), [B]: png });
  const route = await h.setup();
  await route(A);
  assert.deepEqual(h.out, [['fulfill', A, png]]);
  assert.deepEqual(h.noted, []);
});

test('a CMS redirect: a relative location resolves against the URL that sent it, and a chain is followed', async () => {
  const A = 'https://hugeampkpncms.org/rest/old/a.json';
  const B = 'https://hugeampkpncms.org/rest/new/a.json';
  const C = 'https://hugeampkpncms.org/rest/newer/a.json';
  const h = redirectHarness({ [A]: moved('../new/a.json'), [B]: moved('/rest/newer/a.json'), [C]: png });
  const route = await h.setup();
  await route(A);
  assert.deepEqual(h.out, [['fulfill', A, png]]);
});

test('a CMS redirect whose target has no fixture is aborted and the target is logged as missing, never requested', async () => {
  const A = 'http://hugeampkpncms.org/a.png';
  const B = 'https://hugeampkpncms.org/a.png';
  const h = redirectHarness({ [A]: moved(B) });
  const route = await h.setup();
  await route(A);
  assert.deepEqual(h.out, [['abort', A, 'blockedbyclient']]);
  assert.deepEqual(h.noted, [B]);
});

test('a redirect off the CMS, a redirect loop and a chain longer than five hops are aborted, not followed', async () => {
  const A = 'https://hugeampkpncms.org/a';
  const B = 'https://hugeampkpncms.org/b';
  const off = redirectHarness({ [A]: moved('https://example.org/x') });
  await (await off.setup())(A);
  assert.deepEqual(off.out, [['abort', A, 'blockedbyclient']]);
  assert.deepEqual(off.noted, []);

  const loop = redirectHarness({ [A]: moved(B), [B]: moved(A) });
  await (await loop.setup())(A);
  assert.deepEqual(loop.out, [['abort', A, 'blockedbyclient']]);
  assert.deepEqual(loop.noted, []);

  const hop = (i) => `https://hugeampkpncms.org/hop${i}`;
  const chain = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [hop(i), moved(hop(i + 1))]));
  const long = redirectHarness({ ...chain, [hop(8)]: png });
  await (await long.setup())(hop(0));
  assert.deepEqual(long.out, [['abort', hop(0), 'blockedbyclient']]);
  assert.deepEqual(long.noted, []);

  // Five hops is still followed.
  const five = redirectHarness({ ...Object.fromEntries(Array.from({ length: 5 }, (_, i) => [hop(i), moved(hop(i + 1))])), [hop(5)]: png });
  await (await five.setup())(hop(0));
  assert.deepEqual(five.out, [['fulfill', hop(0), png]]);
});

test('a 3xx fixture without a location is served as it is', async () => {
  const A = 'https://hugeampkpncms.org/a';
  const fixture = { status: 304, headers: {}, body: '' };
  const h = redirectHarness({ [A]: fixture });
  await (await h.setup())(A);
  assert.deepEqual(h.out, [['fulfill', A, fixture]]);
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
