import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessage } from './probe.mjs';

test('normalizeMessage strips the origin port, the bundle hash and line:column', () => {
  assert.equal(
    normalizeMessage('TypeError at http://localhost:8081/js/gene.3f2a1b9c.js:12:345'),
    'TypeError at <origin>/js/gene.js:<l>:<c>',
  );
  assert.equal(normalizeMessage('no location here'), 'no location here');
});
