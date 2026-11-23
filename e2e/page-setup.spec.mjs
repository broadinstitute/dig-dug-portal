// Every page mounts through src/utils/pageSetup.js, so it ends up inside a #page-root wrapper that takes no
// part in the layout, and leaves no #app of its own behind it. Vue 3 mounts inside #app where 2.7 replaces
// it; the wrapper makes both builds produce the same structure.
import { PAGES, pageUrl } from './catalog.mjs';
import { LOCAL_ORIGINS, expect, test } from './fixtures.mjs';
import { classifyUrl } from './network.mjs';

// Papers/Research has an #app in its own template, which has to survive inside the wrapper.
const OWN_APP = new Set(['research']);

// These templates throw until the page has its CMS text, which it asks for once live data has come. Until then the
// root that Vue mounts is a comment.
const RENDERS_LATER = new Set(['collaborate', 'contacts', 'apis']);

for (const p of PAGES) {
  test(`page setup: ${p.id}`, async ({ page }) => {
    test.skip(!!p.skip, p.skip);
    // The structure is there before any data is, so no page here waits for live data, or asks for it.
    await page.route(
      (url) => classifyUrl(url.href, LOCAL_ORIGINS) === 'live',
      (route) => route.abort('blockedbyclient'),
    );
    await page.goto(pageUrl(p), { waitUntil: 'domcontentloaded' });

    const root = page.locator('#page-root');
    await expect(root).toHaveCount(1);
    await expect(root).toHaveCSS('display', 'contents');
    await expect(root).toHaveJSProperty('childNodes.length', 1);
    if (!RENDERS_LATER.has(p.id)) await expect(page.locator('#page-root > *')).toHaveCount(1);
    await expect(page.locator('body > #app')).toHaveCount(0);

    if (OWN_APP.has(p.id)) {
      await expect(page.locator('#app')).toHaveCount(1);
      await expect(page.locator('#page-root #app')).toHaveCount(1);
    }
  });
}
