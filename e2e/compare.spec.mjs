// A/B comparison: open every catalog page in the baseline build (dist-baseline/ on 8081, built by
// `npm run e2e:baseline -- <ref>`) and then in the candidate build (dist/ on 8080), and fail if the
// candidate shows anything the baseline did not: a landmark that no longer renders, new page errors,
// console errors or failed requests, or a screenshot that differs by more than the page allows.
import fs from 'node:fs';
import { DEFAULT_LANDMARK, PAGES, pageUrl } from './catalog.mjs';
import { diffRatio, newItems } from './diff.mjs';
import { LOCAL_ORIGINS, expect, test } from './fixtures.mjs';
import { installNetworkPolicy } from './network.mjs';
import { probePage } from './probe.mjs';

const BASELINE = 'http://localhost:8081';
const CANDIDATE = 'http://localhost:8080';
const DEFAULT_MAX_DIFF = Number(process.env.E2E_MAX_DIFF ?? 0.002);

test.skip(!fs.existsSync('dist-baseline'), 'run npm run e2e:baseline -- <ref> first');

// Three page loads per test (warm-up, baseline, candidate), each of which can wait 20 s for the
// landmark, 15 s for network idle and 15 s for the page to come to rest, on top of the load itself.
test.describe.configure({ timeout: 180_000 });

/** A PNG's size from its IHDR chunk, for the failure message. */
const pngSize = (png) => `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;

/**
 * Load `url` once in a throwaway browser context, so that the response cache holds its live data
 * before either build is probed. Pages load cached data faster than live data, and some render or
 * race differently for it (phenotype.html logs a TypeError only when its c2ct annotations arrive
 * before the phenotype list), so a baseline probe that fetched live while the candidate replayed
 * would differ for no reason in the builds. A separate context keeps the warm-up's cookies and
 * storage (e.g. localStorage `_phenotypes`) away from the baseline probe.
 */
async function warmCache({ browser, cache, cms }, url, landmark, testInfo) {
  const context = await browser.newContext({ viewport: testInfo.project.use.viewport });
  try {
    await installNetworkPolicy(context, { cache, cms, localOrigins: LOCAL_ORIGINS });
    await probePage(await context.newPage(), url, { landmark, settle: true });
  } finally {
    await context.close();
  }
}

for (const p of PAGES) {
  test(`compare: ${p.id}`, async ({ browser, cache, cms, page }, testInfo) => {
    test.skip(!!p.skip, p.skip);
    const landmark = p.landmark ?? DEFAULT_LANDMARK;
    const opts = { landmark, mask: p.mask ?? [] };
    const baselinePath = testInfo.outputPath('baseline.png');
    const candidatePath = testInfo.outputPath('candidate.png');

    await warmCache({ browser, cache, cms }, BASELINE + pageUrl(p), landmark, testInfo);

    // Then one page, in sequence: both builds render the same data, replayed from the cache.
    const baseline = await probePage(page, BASELINE + pageUrl(p), { ...opts, screenshotPath: baselinePath });
    // Leave the baseline page before listening for the candidate, so the baseline's in-flight
    // requests, aborted by the navigation, are not counted as the candidate's failed requests.
    await page.goto('about:blank');
    const candidate = await probePage(page, CANDIDATE + pageUrl(p), { ...opts, screenshotPath: candidatePath });
    await testInfo.attach('probes', { body: JSON.stringify({ baseline, candidate }, null, 2), contentType: 'application/json' });

    if (baseline.landmarkVisible) {
      expect.soft(candidate.landmarkVisible, `landmark ${landmark} renders in the baseline but not in the candidate`).toBe(true);
    }
    for (const key of ['pageErrors', 'consoleErrors', 'failedRequests']) {
      expect.soft(newItems(baseline[key], candidate[key]), `${key} the candidate has and the baseline does not`).toEqual([]);
    }

    const before = fs.readFileSync(baselinePath);
    const after = fs.readFileSync(candidatePath);
    const { ratio, diffPng } = diffRatio(before, after);
    const maxDiff = p.maxDiff ?? DEFAULT_MAX_DIFF;
    if (ratio > 0) {
      await testInfo.attach('baseline.png', { path: baselinePath, contentType: 'image/png' });
      await testInfo.attach('candidate.png', { path: candidatePath, contentType: 'image/png' });
      if (diffPng) await testInfo.attach('diff.png', { body: diffPng, contentType: 'image/png' });
    }
    expect
      .soft(ratio, `screenshot diff ratio ${ratio} exceeds maxDiff ${maxDiff} (baseline ${pngSize(before)}, candidate ${pngSize(after)})`)
      .toBeLessThanOrEqual(maxDiff);

    // Fail here if any soft assertion above did, listing what differed.
    const differences = testInfo.errors.map((error) => (error.message ?? '').split('\n')[0]);
    expect(differences, 'the candidate differs from the baseline').toEqual([]);
  });
}
