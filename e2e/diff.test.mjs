import { test } from 'node:test';
import assert from 'node:assert/strict';
import pngjs from 'pngjs';
import { diffRatio, newConsoleErrors, newFailedRequests, newItems } from './diff.mjs';

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

// Failed-request entries as probePage builds them: `${method} ${url without query} ${errorText}`.
const BLOCKED = 'net::ERR_BLOCKED_BY_CLIENT.Inspector';
const CMS_IMAGE = `GET https://hugeampkpncms.org/sites/default/files/images/KP_guide_images/1_2_3_icon_slim.png ${BLOCKED}`;
const CMS_VIEW = `GET https://hugeampkpncms.org/rest/views/news2vueportal ${BLOCKED}`;
const LIVE_FAILED = 'GET https://bioindex.hugeamp.org/api/bio/query/gene net::ERR_FAILED';

test('newFailedRequests: a blocked URL requested more often in the candidate is nothing new', () => {
  assert.deepEqual(newFailedRequests([CMS_IMAGE, CMS_IMAGE], [CMS_IMAGE, CMS_IMAGE, CMS_IMAGE]), []);
});

test('newFailedRequests: a blocked URL the baseline never requested is new, once', () => {
  assert.deepEqual(newFailedRequests([CMS_IMAGE], [CMS_VIEW, CMS_IMAGE, CMS_VIEW]), [CMS_VIEW]);
});

test('newFailedRequests: any other failure still counts as a multiset', () => {
  assert.deepEqual(newFailedRequests([LIVE_FAILED], [LIVE_FAILED, LIVE_FAILED]), [LIVE_FAILED]);
  assert.deepEqual(newFailedRequests([LIVE_FAILED, CMS_IMAGE], [CMS_IMAGE, LIVE_FAILED, CMS_IMAGE]), []);
});

test('newFailedRequests: the same failure on the baseline (8081) and candidate (8080) servers is nothing new', () => {
  const baseline = 'GET http://localhost:8081/js/chunk-vendors.06e212f7.js net::ERR_ABORTED';
  const candidate = 'GET http://localhost:8080/js/chunk-vendors.e0f38165.js net::ERR_ABORTED';
  assert.deepEqual(newFailedRequests([baseline], [candidate]), []);
  assert.deepEqual(newFailedRequests([], [candidate]), ['GET <origin>/js/chunk-vendors.js net::ERR_ABORTED']);
});

test('newConsoleErrors: leaves out the URL-less line logged for each blocked request', () => {
  const blockedLine = `Failed to load resource: ${BLOCKED}`;
  const typeError = "TypeError: Cannot read properties of null (reading 'name')";
  assert.deepEqual(newConsoleErrors([blockedLine], [blockedLine, blockedLine, blockedLine]), []);
  assert.deepEqual(newConsoleErrors([], [blockedLine, 'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT']), []);
  // Everything else is still a multiset.
  assert.deepEqual(newConsoleErrors([typeError, blockedLine], [blockedLine, typeError, typeError]), [typeError]);
  assert.deepEqual(
    newConsoleErrors([], ['Failed to load resource: the server responded with a status of 404 (Not Found)']),
    ['Failed to load resource: the server responded with a status of 404 (Not Found)'],
  );
});
