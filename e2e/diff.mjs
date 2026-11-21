// What the A/B comparison counts as "different": the share of screenshot pixels that changed, and
// the messages the candidate produced that the baseline did not.
import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';
import { normalizeMessage } from './probe.mjs';

const { PNG } = pngjs;

// Chromium's error text for a request the network policy aborted ('blockedbyclient'), and the
// console line it logs for each one. That line names no URL, so it says nothing the failed-request
// entry does not, and how often a page re-renders the element that makes the request (and so how
// often it is blocked) depends on timing.
const BLOCKED = 'net::ERR_BLOCKED_BY_CLIENT';
const BLOCKED_CONSOLE_LINE = /^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT(\.\w+)?$/;

/**
 * The fraction of pixels that differ between two PNG screenshots (pixelmatch, threshold 0.1), with
 * an image marking the differences. Screenshots of different sizes count as entirely different and
 * have no diff image.
 *
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {{ ratio: number, diffPng: Buffer | null }}
 */
export function diffRatio(a, b) {
  const before = PNG.sync.read(a);
  const after = PNG.sync.read(b);
  if (before.width !== after.width || before.height !== after.height) return { ratio: 1, diffPng: null };

  const { width, height } = before;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(before.data, after.data, diff.data, width, height, { threshold: 0.1 });
  return { ratio: mismatched / (width * height), diffPng: PNG.sync.write(diff) };
}

/**
 * The items of `after` left over once each item of `before` cancels one equal item: a multiset
 * difference that keeps the order of `after`.
 *
 * @param {string[]} before
 * @param {string[]} after
 * @returns {string[]}
 */
export function newItems(before, after) {
  const remaining = countItems(before);
  return after.filter((item) => isExtra(remaining, item));
}

function countItems(items) {
  const counts = new Map();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

/** Cancel `item` against one left in `remaining`; true when none is left (the item is new). */
function isExtra(remaining, item) {
  const count = remaining.get(item) ?? 0;
  if (count === 0) return true;
  remaining.set(item, count - 1);
  return false;
}

/**
 * The failed requests the candidate has and the baseline does not, in the order of `after`.
 * Entries are normalized first (normalizeMessage), so the same failure on the baseline and
 * candidate servers, or in differently hashed bundles, is one entry. Requests the network policy
 * blocked compare as a set: a blocked URL new in the candidate is reported once, a URL the
 * baseline also had blocked is not, however often. Every other failure compares as a multiset.
 *
 * @param {string[]} before
 * @param {string[]} after
 * @returns {string[]}
 */
export function newFailedRequests(before, after) {
  const isBlocked = (entry) => entry.includes(BLOCKED);
  const baseline = before.map(normalizeMessage);
  const seenBlocked = new Set(baseline.filter(isBlocked));
  const remaining = countItems(baseline.filter((entry) => !isBlocked(entry)));
  return after.map(normalizeMessage).filter((entry) => {
    if (!isBlocked(entry)) return isExtra(remaining, entry);
    if (seenBlocked.has(entry)) return false;
    seenBlocked.add(entry);
    return true;
  });
}

/**
 * The console errors the candidate has and the baseline does not (a multiset difference), leaving
 * out on both sides the URL-less line Chromium logs for every blocked request.
 *
 * @param {string[]} before
 * @param {string[]} after
 * @returns {string[]}
 */
export function newConsoleErrors(before, after) {
  const relevant = (line) => !BLOCKED_CONSOLE_LINE.test(line);
  return newItems(before.filter(relevant), after.filter(relevant));
}
