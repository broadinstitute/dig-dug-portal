// A page that mounts through src/utils/pageSetup.js ends up inside a #page-root wrapper that takes no
// part in the layout, and does not leave an #app of its own behind it. Vue 3 mounts inside #app where
// Vue 2 replaces it; the wrapper makes both builds produce the same structure.
import { PAGES, pageUrl } from './catalog.mjs';
import { expect, test } from './fixtures.mjs';

// The pages that mount through mountPage so far. Papers/Research has an #app of its own in its
// template, which has to survive inside the wrapper.
const MOUNTED = [
  { id: 'page404', ownApp: false },
  { id: 'research', ownApp: true },
];

for (const { id, ownApp } of MOUNTED) {
  test(`page setup: ${id}`, async ({ page }) => {
    const entry = PAGES.find((p) => p.id === id);
    expect(entry, `${id} is in the catalog`).toBeTruthy();
    await page.goto(pageUrl(entry));

    const root = page.locator('#page-root');
    await expect(root).toHaveCount(1);
    await expect(root).toHaveCSS('display', 'contents');
    await expect(page.locator('#page-root > *')).toHaveCount(1);
    await expect(page.locator('body > #app')).toHaveCount(0);

    if (ownApp) {
      await expect(page.locator('#app')).toHaveCount(1);
      await expect(page.locator('#page-root #app')).toHaveCount(1);
    }
  });
}
