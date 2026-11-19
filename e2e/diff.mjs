// What the A/B comparison counts as "different": the share of screenshot pixels that changed, and
// the messages the candidate produced that the baseline did not.
import pixelmatch from 'pixelmatch';
import pngjs from 'pngjs';

const { PNG } = pngjs;

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
  const remaining = new Map();
  for (const item of before) remaining.set(item, (remaining.get(item) ?? 0) + 1);
  return after.filter((item) => {
    const count = remaining.get(item) ?? 0;
    if (count === 0) return true;
    remaining.set(item, count - 1);
    return false;
  });
}
