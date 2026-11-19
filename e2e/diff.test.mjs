import { test } from 'node:test';
import assert from 'node:assert/strict';
import pngjs from 'pngjs';
import { diffRatio, newItems } from './diff.mjs';

const { PNG } = pngjs;

/** An encoded PNG, `width`×`height`, every pixel opaque white except `black` ([x, y] pairs). */
function png(width, height, black = []) {
  const image = new PNG({ width, height });
  image.data.fill(255);
  for (const [x, y] of black) {
    const i = (y * width + x) * 4;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = 0;
  }
  return PNG.sync.write(image);
}

const white10 = png(10, 10);
const onePixel10 = png(10, 10, [[4, 4]]);
const white10x11 = png(10, 11);

test('diffRatio: identical images differ nowhere', () => {
  assert.equal(diffRatio(white10, white10).ratio, 0);
});

test('diffRatio: one pixel of a hundred differs', () => {
  assert.equal(diffRatio(white10, onePixel10).ratio, 0.01);
});

test('diffRatio: a diff image comes back with the ratio, the same size as the inputs', () => {
  const { diffPng } = diffRatio(white10, onePixel10);
  const diff = PNG.sync.read(diffPng);
  assert.equal(diff.width, 10);
  assert.equal(diff.height, 10);
});

test('diffRatio: different dimensions count as entirely different, with no diff image', () => {
  assert.deepEqual(diffRatio(white10, white10x11), { ratio: 1, diffPng: null });
});

test('newItems: the multiset difference, in the order of `after`', () => {
  assert.deepEqual(newItems(['a', 'b', 'b'], ['b', 'b', 'b', 'c']), ['b', 'c']);
  assert.deepEqual(newItems([], ['x', 'y']), ['x', 'y']);
  assert.deepEqual(newItems(['x', 'y'], []), []);
  assert.deepEqual(newItems(['x', 'y'], ['y', 'x']), []);
  assert.deepEqual(newItems(['a'], ['c', 'a', 'a', 'b']), ['c', 'a', 'b']);
});
