import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { expectedHtmlFiles } from '../scripts/vue3-migration/check-dist.mjs';
import { PAGES, DEFAULT_LANDMARK, pageUrl } from './catalog.mjs';

// vue.config.js drops the dev-only pages when NODE_ENV is production, at require time.
process.env.NODE_ENV = 'production';
const { pages } = createRequire(import.meta.url)('../vue.config.js');

test('one catalog entry per production page, in vue.config.js order', () => {
  assert.equal(Object.keys(pages).length, 54);
  assert.deepEqual(
    PAGES.map((p) => p.id),
    Object.keys(pages),
  );
});

test('every path is a built HTML file', () => {
  const files = new Set(expectedHtmlFiles(pages));
  for (const p of PAGES) {
    assert.ok(p.path.startsWith('/'), `${p.id}: ${p.path}`);
    assert.ok(files.has(p.path.slice(1)), `${p.id}: ${p.path}`);
  }
});

test('no landmark mentions #app (Vue 2 replaces it on mount, Vue 3 renders inside it)', () => {
  assert.equal(DEFAULT_LANDMARK, '.mdkp-body');
  for (const p of PAGES) {
    if (p.landmark !== undefined) {
      assert.equal(typeof p.landmark, 'string', p.id);
      assert.ok(p.landmark.length > 0, p.id);
      assert.ok(!p.landmark.includes('#app'), `${p.id}: ${p.landmark}`);
    }
    for (const m of p.mask ?? []) assert.ok(!m.includes('#app'), `${p.id} mask: ${m}`);
  }
});

test('every skip states its reason', () => {
  for (const p of PAGES) {
    if ('skip' in p) assert.ok(typeof p.skip === 'string' && p.skip.trim().length > 0, p.id);
  }
});

test('the core pages are pinned to PCSK9 / T2D / rs11591147 and the PCSK9 region', () => {
  const byId = Object.fromEntries(PAGES.map((p) => [p.id, p]));
  assert.deepEqual(byId.phenotype.query, { phenotype: 'T2D' });
  assert.deepEqual(byId.gene.query, { gene: 'PCSK9' });
  assert.deepEqual(byId.variant.query, { variant: '1:55505647:G:T' }); // rs11591147
  // region also pins the top phenotype the page writes back into its URL.
  const { chr, start, end } = byId.region.query;
  assert.deepEqual({ chr, start, end }, { chr: '1', start: '55000000', end: '55100000' });
});

test('pageUrl appends the encoded query, or nothing', () => {
  assert.equal(pageUrl({ id: 'a', path: '/about.html' }), '/about.html');
  assert.equal(pageUrl({ id: 'g', path: '/gene.html', query: { gene: 'PCSK9' } }), '/gene.html?gene=PCSK9');
  assert.equal(
    pageUrl({ id: 'r', path: '/region.html', query: { chr: '1', start: '55000000', end: '55100000' } }),
    '/region.html?chr=1&start=55000000&end=55100000',
  );
  assert.equal(pageUrl({ id: 'x', path: '/x.html', query: { q: 'a b&c' } }), '/x.html?q=a+b%26c');
});
