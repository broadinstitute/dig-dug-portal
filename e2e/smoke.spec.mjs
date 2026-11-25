// Single-build smoke: every production page renders its landmark, and its query string reaches
// the page intact.
import { DEFAULT_LANDMARK, PAGES, needsCmsFixtures, needsLiveData, pageUrl } from './catalog.mjs';
import { expect, test } from './fixtures.mjs';
import { liveDataDisabled } from './network.mjs';
import { probePage } from './probe.mjs';

// A probe can spend 20 s waiting for the landmark and 15 s waiting for the network to go idle,
// on top of the page load itself; the default 30 s test timeout would cut it short.
test.describe.configure({ timeout: 60_000 });

// E2E_CMS_DISCOVERY=1 probes the pages that wait on CMS fixtures, so the CMS URLs they request land in
// test-results/missing-cms.ndjson for scripts/vue3-migration/capture-cms.mjs. Those pages make no
// assertions (they cannot render without the fixtures); every other page and skip is unchanged.
const discovery = process.env.E2E_CMS_DISCOVERY === '1';

// E2E_NO_LIVE_DATA=1 aborts every request to the live data services (see e2e/network.mjs), so a page
// whose landmark only renders once BioIndex data loads cannot be checked.
const noLiveData = liveDataDisabled();

for (const p of PAGES) {
  test(`smoke: ${p.id}`, async ({ page }, testInfo) => {
    const probeOnly = discovery && needsCmsFixtures(p);
    test.skip(!!p.skip && !probeOnly, p.skip);
    test.skip(noLiveData && needsLiveData(p), 'needs live BioIndex data (E2E_NO_LIVE_DATA=1)');
    const url = pageUrl(p);
    const probe = await probePage(page, url, { landmark: p.landmark ?? DEFAULT_LANDMARK });
    await testInfo.attach('probe', { body: JSON.stringify(probe, null, 2), contentType: 'application/json' });
    if (probeOnly) return;

    expect(probe.landmarkVisible).toBe(true);
    expect(probe.finalSearch).toBe(new URL(url, 'http://x').search);
  });
}
