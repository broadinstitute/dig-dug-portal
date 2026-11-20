import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessage, probePage } from './probe.mjs';

test('normalizeMessage strips the origin port, the bundle hash and line:column', () => {
  assert.equal(
    normalizeMessage('TypeError at http://localhost:8081/js/gene.3f2a1b9c.js:12:345'),
    'TypeError at <origin>/js/gene.js:<l>:<c>',
  );
  assert.equal(normalizeMessage('no location here'), 'no location here');
});

// A stand-in for Playwright's Page with just what probePage uses. `landmark` and `idle` are the
// landmark wait and the network-idle wait; each may resolve, reject, or emit page events.
// `domQuietMs` answers the settle step's in-page check: how long the DOM has been unchanged.
// Screenshots are recorded in `shots`, with the time they were taken.
function fakePage({ landmark = async () => {}, idle = async () => {}, domQuietMs = () => 60_000 } = {}) {
  const listeners = new Map();
  const page = {
    listeners,
    shots: [],
    on(event, fn) {
      listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    },
    off(event, fn) {
      listeners.set(event, (listeners.get(event) ?? []).filter((f) => f !== fn));
    },
    emit(event, arg) {
      for (const fn of listeners.get(event) ?? []) fn(arg);
    },
    listenerCount: () => [...listeners.values()].reduce((n, fns) => n + fns.length, 0),
    goto: async () => {},
    url: () => 'http://localhost:8080/gene.html?gene=PCSK9',
    locator: () => ({ filter: () => ({ first: () => ({ waitFor: () => landmark(page) }) }) }),
    waitForLoadState: () => idle(page),
    evaluate: async () => domQuietMs(),
    screenshot: async (opts) => {
      page.shots.push({ at: Date.now(), ...opts });
    },
  };
  return page;
}

const timeoutError = () => Object.assign(new Error('Timeout 15000ms exceeded.'), { name: 'TimeoutError' });
const closedError = () => new Error('page.waitForLoadState: Target page, context or browser has been closed');
const PROBE = ['http://localhost:8080/gene.html?gene=PCSK9', { landmark: '.mdkp-body' }];
const SHOT = ['http://localhost:8080/gene.html?gene=PCSK9', { landmark: '.mdkp-body', screenshotPath: 'shot.png' }];

test('probePage: a network-idle timeout is best effort', async () => {
  const page = fakePage({ idle: async () => { throw timeoutError(); } });
  const probe = await probePage(page, ...PROBE);
  assert.equal(probe.landmarkVisible, true);
  assert.equal(probe.finalSearch, '?gene=PCSK9');
  assert.equal(page.listenerCount(), 0);
});

test('probePage: any other network-idle failure (e.g. the page closed) fails the probe', async () => {
  const page = fakePage({ idle: async () => { throw closedError(); } });
  await assert.rejects(probePage(page, ...PROBE), /has been closed/);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: only a landmark timeout means the landmark is not visible', async () => {
  const page = fakePage({ landmark: async () => { throw timeoutError(); } });
  assert.equal((await probePage(page, ...PROBE)).landmarkVisible, false);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: any other landmark-wait failure fails the probe', async () => {
  const page = fakePage({ landmark: async () => { throw closedError(); } });
  await assert.rejects(probePage(page, ...PROBE), /has been closed/);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: a request the page cancelled itself (net::ERR_ABORTED) is not a failed request', async () => {
  const failed = (url, errorText) => ({ url: () => url, method: () => 'GET', failure: () => ({ errorText }) });
  const page = fakePage({
    idle: async (p) => {
      // Chromium cancels an image whose element re-renders while it loads.
      p.emit('requestfailed', failed('http://hugeampkpncms.org/logo.svg', 'net::ERR_ABORTED'));
      p.emit('requestfailed', failed('https://elsewhere.example/x.js?v=1', 'net::ERR_BLOCKED_BY_CLIENT'));
    },
  });
  const probe = await probePage(page, ...PROBE);
  assert.deepEqual(probe.failedRequests, ['GET https://elsewhere.example/x.js net::ERR_BLOCKED_BY_CLIENT']);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: a renderer crash fails the probe even when every wait settles', async () => {
  const page = fakePage({
    idle: async (p) => {
      p.emit('crash', p);
      throw timeoutError(); // a crashed page never goes idle
    },
  });
  await assert.rejects(probePage(page, ...PROBE), /crashed/);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: before a screenshot, waits until no request has been in flight for a second', async () => {
  const request = { url: () => 'https://bioindex.hugeamp.org/api/bio/query/gene?q=PCSK9', method: () => 'GET' };
  let finishedAt;
  const page = fakePage({
    // A second wave of data starts as the page first goes idle, and takes 300 ms.
    idle: async (p) => {
      p.emit('request', request);
      setTimeout(() => {
        finishedAt = Date.now();
        p.emit('requestfinished', request);
      }, 300);
    },
  });
  await probePage(page, ...SHOT);
  assert.equal(page.shots.length, 1);
  assert.equal(page.shots[0].path, 'shot.png');
  assert.ok(page.shots[0].at - finishedAt >= 1000, `screenshot ${page.shots[0].at - finishedAt} ms after the request finished`);
  assert.equal(page.listenerCount(), 0);
});

test('probePage: before a screenshot, waits until the DOM has been quiet for a second', async () => {
  const start = Date.now();
  // The DOM keeps changing for 500 ms, then stays still.
  const page = fakePage({ domQuietMs: () => Math.max(0, Date.now() - start - 500) });
  await probePage(page, ...SHOT);
  assert.equal(page.shots.length, 1);
  assert.ok(page.shots[0].at - start >= 1500, `screenshot ${page.shots[0].at - start} ms after the probe started`);
});

test('probePage: settle: true waits for the page to come to rest without a screenshot', async () => {
  const start = Date.now();
  const page = fakePage({ domQuietMs: () => Math.max(0, Date.now() - start - 500) });
  await probePage(page, PROBE[0], { ...PROBE[1], settle: true });
  assert.ok(Date.now() - start >= 1500, `returned ${Date.now() - start} ms after the probe started`);
  assert.equal(page.shots.length, 0);
});

test('probePage: without a screenshot there is no settle step', async () => {
  const page = fakePage({
    domQuietMs: () => {
      throw new Error('the DOM was checked');
    },
  });
  const probe = await probePage(page, ...PROBE);
  assert.equal(probe.landmarkVisible, true);
  assert.equal(page.shots.length, 0);
});
