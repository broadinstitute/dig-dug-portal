// Load one page and record what a user would notice: did the page body render, did the query
// string survive, and what went wrong on the way (page errors, console errors, failed requests).
// Takes the Playwright `page` as an argument and never imports Playwright itself, so the pure
// helpers here stay importable from plain `node --test`.

/**
 * Make messages comparable across servers and builds: the origin's port, the bundle hash and
 * line:column positions vary between the baseline and the candidate.
 */
export function normalizeMessage(text) {
  return text
    .replace(/http:\/\/localhost:\d+/g, '<origin>')
    .replace(/\.[0-9a-f]{8}\.js/g, '.js')
    .replace(/:\d+:\d+/g, ':<l>:<c>');
}

const LANDMARK_TIMEOUT_MS = 20_000;
const NETWORK_IDLE_TIMEOUT_MS = 15_000;

// A timeout is an expected outcome of the waits below. Anything else (the page closed, the renderer
// crashed) fails the probe, so a broken page can never pass as "landmark seen".
const isTimeout = (error) => error?.name === 'TimeoutError';

/**
 * @typedef {{ landmarkVisible: boolean, finalSearch: string, pageErrors: string[], consoleErrors: string[], failedRequests: string[] }} Probe
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url
 * @param {{ landmark: string, mask?: string[], screenshotPath?: string }} opts
 * @returns {Promise<Probe>}
 */
export async function probePage(page, url, { landmark, mask = [], screenshotPath }) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const onPageError = (error) => pageErrors.push(normalizeMessage(error?.message ?? String(error)));
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(normalizeMessage(message.text()));
  };
  const onRequestFailed = (request) => {
    const [withoutQuery] = request.url().split('?');
    failedRequests.push(`${request.method()} ${withoutQuery} ${request.failure()?.errorText ?? ''}`);
  };

  let crashed = false;
  const onCrash = () => {
    crashed = true;
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);
  page.on('crash', onCrash);
  try {
    await page.goto(url, { waitUntil: 'load' });
    const finalSearch = new URL(page.url()).search;

    let landmarkVisible = true;
    try {
      // Some templates render the landmark class more than once; any visible one counts.
      await page.locator(landmark).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: LANDMARK_TIMEOUT_MS });
    } catch (error) {
      if (!isTimeout(error)) throw error;
      landmarkVisible = false;
    }

    try {
      await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS });
    } catch (error) {
      // Best effort: some pages poll or stream and never go idle.
      if (!isTimeout(error)) throw error;
    }

    // A crashed renderer can still let the waits settle (a crashed page never goes idle).
    if (crashed) throw new Error(`page crashed while probing ${url}`);

    if (screenshotPath) {
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled',
        mask: mask.map((selector) => page.locator(selector)),
      });
    }

    return { landmarkVisible, finalSearch, pageErrors, consoleErrors, failedRequests };
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('requestfailed', onRequestFailed);
    page.off('crash', onCrash);
  }
}
