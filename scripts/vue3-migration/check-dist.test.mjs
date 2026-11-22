import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { expectedHtmlFiles } from './check-dist.mjs';

test('expectedHtmlFiles keeps nested paths and defaults a missing filename to <key>.html', () => {
  assert.deepEqual(
    expectedHtmlFiles({ birds: {}, pigean_index: { filename: 'pigean/index.html' }, about: { filename: 'about.html' } }),
    ['about.html', 'birds.html', 'pigean/index.html'],
  );
});

test('the real production config yields 54 pages, including nested and default names', () => {
  process.env.NODE_ENV = 'production';
  const { pages } = createRequire(import.meta.url)('../../vue.config.js');
  const files = expectedHtmlFiles(pages);
  assert.equal(files.length, 54);
  for (const f of ['birds.html', 'bottom-line.html', 'pigean/index.html', 'cvdi_pigean/phenotype.html']) assert.ok(files.includes(f), f);
  assert.ok(!files.includes('debug.html'));
});
