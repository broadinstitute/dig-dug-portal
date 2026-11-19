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
function fakePage({ landmark = async () => {}, idle = async () => {} } = {}) {
  const listeners = new Map();
  const page = {
    listeners,
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
  };
  return page;
}

const timeoutError = () => Object.assign(new Error('Timeout 15000ms exceeded.'), { name: 'TimeoutError' });
const closedError = () => new Error('page.waitForLoadState: Target page, context or browser has been closed');
const PROBE = ['http://localhost:8080/gene.html?gene=PCSK9', { landmark: '.mdkp-body' }];

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
