// Load one page and record what a user would notice: did the page body render, did the query
// string survive, and what went wrong on the way (page errors, console errors, failed requests).
// Takes the Playwright `page` as an argument and never imports Playwright itself, so the pure
// helpers here stay importable from plain `node --test`.
import { setTimeout as delay } from 'node:timers/promises';

/**
 * Make messages comparable across servers and builds: the origin's port, the bundle hash,
 * line:column positions and, in a development build, the path to node_modules in a stack frame's
 * module name (`push../node_modules/...` in the candidate, `push.../../home/me/repo/node_modules/...`
 * in a baseline built in a worktree that links to this repo's node_modules) vary between the
 * baseline and the candidate.
 */
export function normalizeMessage(text) {
  return text
    .replace(/http:\/\/localhost:\d+/g, '<origin>')
    .replace(/\.[0-9a-f]{8}\.js/g, '.js')
    .replace(/:\d+:\d+/g, ':<l>:<c>')
    .replace(/(\w\.)\.{1,2}\/[^\s()]*?node_modules\//g, '$1./node_modules/');
}

const LANDMARK_TIMEOUT_MS = 20_000;
const NETWORK_IDLE_TIMEOUT_MS = 15_000;
const SETTLE_QUIET_MS = 1_000;
const SETTLE_TIMEOUT_MS = 15_000;
const SETTLE_POLL_MS = 100;

// A timeout is an expected outcome of the waits below. Anything else (the page closed, the renderer
// crashed) fails the probe, so a broken page can never pass as "landmark seen".
const isTimeout = (error) => error?.name === 'TimeoutError';

/** Milliseconds since the page's DOM last changed, watching from the first call on each document. */
async function domQuietMs(page) {
  try {
    return await page.evaluate(() => {
      if (window.__e2eLastMutation === undefined) {
        window.__e2eLastMutation = performance.now();
        new MutationObserver(() => {
          window.__e2eLastMutation = performance.now();
        }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      }
      return performance.now() - window.__e2eLastMutation;
    });
  } catch (error) {
    // The page navigated during the check: its new document has only just started.
    if (/Execution context was destroyed/.test(error?.message ?? '')) return 0;
    throw error;
  }
}

/**
 * Wait (best effort) until no request has been in flight and the DOM has not changed for
 * SETTLE_QUIET_MS. Network idle fires once per page load, so a later wave of data, what renders
 * from it, and the "Loading ..." toasts closing can all land after it; two loads of one page are
 * only comparable once each is at rest.
 */
async function waitForRest(page, network) {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const networkQuiet = network.inflight.size === 0 && Date.now() - network.lastActivity >= SETTLE_QUIET_MS;
    if (networkQuiet && (await domQuietMs(page)) >= SETTLE_QUIET_MS) return;
    await delay(SETTLE_POLL_MS);
  }
}

/**
 * @typedef {{ landmarkVisible: boolean, finalSearch: string, pageErrors: string[], consoleErrors: string[], failedRequests: string[] }} Probe
 *
 * `settle` waits for the page to come to rest before returning (and before the screenshot); it
 * defaults to on when a screenshot is taken.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} url
 * @param {{ landmark: string, mask?: string[], screenshotPath?: string, settle?: boolean }} opts
 * @returns {Promise<Probe>}
 */
export async function probePage(page, url, { landmark, mask = [], screenshotPath, settle = Boolean(screenshotPath) }) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const onPageError = (error) => pageErrors.push(normalizeMessage(error?.message ?? String(error)));
  const onConsole = (message) => {
    if (message.type() === 'error') consoleErrors.push(normalizeMessage(message.text()));
  };
  const onRequestFailed = (request) => {
    const errorText = request.failure()?.errorText ?? '';
    // net::ERR_ABORTED is the page cancelling its own request (an image whose element re-renders
    // while it loads, a superseded fetch), not a failure, and it comes and goes with timing. The
    // network policy never produces it: it blocks with ERR_BLOCKED_BY_CLIENT or ERR_FAILED.
    if (errorText === 'net::ERR_ABORTED') return;
    const [withoutQuery] = request.url().split('?');
    failedRequests.push(`${request.method()} ${withoutQuery} ${errorText}`);
  };

  let crashed = false;
  const onCrash = () => {
    crashed = true;
  };

  const network = { inflight: new Set(), lastActivity: Date.now() };
  const onRequestStart = (request) => {
    network.inflight.add(request);
    network.lastActivity = Date.now();
  };
  const onRequestEnd = (request) => {
    network.inflight.delete(request);
    network.lastActivity = Date.now();
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('requestfailed', onRequestFailed);
  page.on('crash', onCrash);
  page.on('request', onRequestStart);
  page.on('requestfinished', onRequestEnd);
  page.on('requestfailed', onRequestEnd);
  try {
    await page.goto(url, { waitUntil: 'load' });

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

    if (settle) await waitForRest(page, network);

    // A crashed renderer can still let the waits settle (a crashed page never goes idle).
    if (crashed) throw new Error(`page crashed while probing ${url}`);

    // Read after the waits, not at `load`: some pages rewrite their query string while their data
    // loads (region.html drops `phenotype`, then writes it back once its associations arrive), so the
    // URL at `load` depends on how fast the data services answer.
    const finalSearch = new URL(page.url()).search;

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
    page.off('request', onRequestStart);
    page.off('requestfinished', onRequestEnd);
    page.off('requestfailed', onRequestEnd);
  }
}
