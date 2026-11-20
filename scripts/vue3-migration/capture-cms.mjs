// Capture the CMS responses the e2e pages ask for, as fixtures in e2e/fixtures/cms/.
//
//   node scripts/vue3-migration/capture-cms.mjs [--dry-run]
//
// The e2e harness never requests the CMS live (hugeampkpncms.org has gone down under crawler load).
// A page's CMS request that has no fixture is aborted and its URL is appended to
// test-results/missing-cms.ndjson. This tool turns that log into fixtures, and is the one place
// that is allowed to touch the CMS, so it is gated hard:
//
//   - only hugeampkpncms.org URLs; the kp4cd.org failover and everything else is skipped
//   - deduplicated, first-seen order, URLs that already have a fixture skipped
//   - at most 50 URLs per run; a bigger plan is refused (exit 2), never trimmed or raised
//   - sequential plain GETs, 2,000 ms apart, no retries, no cache-busting, one fixed User-Agent
//   - refuses to run (exit 2) unless E2E_ALLOW_CMS_CAPTURE=yes, which only the user's explicit go sets
//   - a 5xx, a 429 (the CMS asking us to back off) or a network error stops the run at once and
//     writes nothing for that URL
//   - redirects are not followed (see below), so one URL is one request
//
// Workflow (Playwright empties test-results/ at the start of every run, the log included, so the
// log is whatever the last run asked for: run step 1 right before steps 2 and 3, with no other
// Playwright run in between, or rerun it):
//   1. Discovery. Pages whose catalog skip is "needs CMS fixtures: ..." are skipped, so their CMS
//      URLs never reach the log. E2E_CMS_DISCOVERY=1 makes the smoke spec probe them anyway (with
//      no assertions), which logs the URLs without a single live request:
//        E2E_CMS_DISCOVERY=1 npx playwright test e2e/smoke.spec.mjs --project=chromium
//   2. Plan. Print what a real run would fetch and skip. Makes no request:
//        node scripts/vue3-migration/capture-cms.mjs --dry-run
//   3. Go. The user reads the plan and says go. Only then:
//        E2E_ALLOW_CMS_CAPTURE=yes node scripts/vue3-migration/capture-cms.mjs
//   4. Rerun the e2e suite. test-results/missing-cms.ndjson should now be empty or absent; remove
//      the "needs CMS fixtures" skips from e2e/catalog.mjs and commit e2e/fixtures/cms/.
//
// A fixture is { url, status, headers: { 'content-type' }, body }. A binary response (an image)
// keeps its bytes as base64 in `bodyBase64`, with `body` empty; CmsFixtures serves it as a Buffer.
// Redirects are never followed (redirect: 'manual'): a followed redirect is a second request that is
// neither spaced nor counted, and a loop is up to 20 of them back to back. A 3xx is stored as the CMS
// returned it, with its `location` header (when it sent one) beside content-type. At test time the
// network policy (e2e/network.mjs) follows that redirect through the fixtures and fulfills with the
// final response; it never sends the browser a redirect, because Chromium would then request the
// target live. A target with no fixture yet is aborted and logged, so it lands in the next
// discovery log for a later capped, spaced round.
//
// Exit codes: 0 done (or nothing to do), 1 a request failed, 2 refused or usage error.
import { mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { CmsFixtures, MISSING_CMS_LOG, cmsFixtureKey } from '../../e2e/cms-fixtures.mjs';
import { classifyUrl } from '../../e2e/network.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const CAP = 50;
export const DELAY_MS = 2000;
export const USER_AGENT = 'dig-dug-portal-e2e-fixture-capture';
const PRIMARY_CMS_HOST = 'hugeampkpncms.org';
const FIXTURES_DIR = 'e2e/fixtures/cms';
const USAGE = 'usage: node scripts/vue3-migration/capture-cms.mjs [--dry-run]';
const REFUSAL = "CMS capture needs the user's explicit go: the CMS has gone down under crawler load";

/** True for hugeampkpncms.org and its subdomains: the one CMS host a capture may request. */
function isPrimaryCms(url) {
  if (classifyUrl(url, []) !== 'cms') return false;
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === PRIMARY_CMS_HOST || hostname.endsWith(`.${PRIMARY_CMS_HOST}`);
}

/**
 * What a capture run would fetch, from the URLs the e2e run found without a fixture.
 *
 * @param {string[]} missing URLs in the order they were logged, repeats included
 * @param {(url: string) => boolean} hasFixture
 * @param {number} cap most URLs one run may fetch
 * @returns {{ toFetch: string[], skipped: Array<{ url: string, reason: 'duplicate' | 'has-fixture' | 'not-primary-cms' }>, overCap: boolean }}
 */
export function planCapture(missing, hasFixture, cap) {
  const seen = new Set();
  const candidates = [];
  const skipped = [];
  for (const url of missing) {
    if (seen.has(url)) {
      skipped.push({ url, reason: 'duplicate' });
      continue;
    }
    seen.add(url);
    if (!isPrimaryCms(url)) skipped.push({ url, reason: 'not-primary-cms' });
    else if (hasFixture(url)) skipped.push({ url, reason: 'has-fixture' });
    else candidates.push(url);
  }
  const overCap = candidates.length > cap;
  return { toFetch: overCap ? [] : candidates, skipped, overCap };
}

/**
 * The URLs in a missing-cms.ndjson log (one {"url":...} per line), or null when there is no log.
 *
 * @param {string} file
 */
export function readMissingUrls(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  const urls = [];
  text.split('\n').forEach((line, i) => {
    if (line.trim() === '') return;
    let url;
    try {
      url = JSON.parse(line).url;
    } catch {
      throw new Error(`${file} line ${i + 1}: not JSON`);
    }
    if (typeof url !== 'string' || url === '') throw new Error(`${file} line ${i + 1}: no "url" string`);
    urls.push(url);
  });
  return urls;
}

// Content types whose bytes are text; anything else is stored as base64.
const isTextType = (type) => /^text\/|^application\/(json|xml|javascript)\b|\+(json|xml)\b/i.test(type);

/** `{ body }` for a text response that survives a UTF-8 round trip, `{ body: '', bodyBase64 }` otherwise. */
function encodeBody(bytes, contentType) {
  if (contentType === '' || isTextType(contentType)) {
    const text = bytes.toString('utf8');
    if (Buffer.from(text, 'utf8').equals(bytes)) return { body: text };
  }
  return { body: '', bodyBase64: bytes.toString('base64') };
}

/** Write `data` as JSON to `file` through a temp file in the same directory, so a reader never sees half of it. */
function writeJsonAtomic(file, data) {
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(temp, file);
}

/**
 * Fetch each URL once, in order, `delayMs` apart, and write its response as a fixture in `dir`.
 * No retries, and redirects are not followed, so each URL is exactly one request. A network error,
 * a 5xx or a 429 stops the run (the CMS may be struggling or asking us to back off) and writes
 * nothing for that URL; other statuses, 404 and 3xx included, are what the page would have seen and
 * are kept. Throws, before any request, when given more than CAP URLs.
 *
 * @param {string[]} urls
 * @param {{ fetchFn: typeof fetch, sleepFn: (ms: number) => Promise<unknown>, dir: string, log: (message: string) => void, delayMs?: number }} deps
 * @returns {Promise<{ ok: boolean, written: number }>}
 */
export async function captureAll(urls, { fetchFn, sleepFn, dir, log, delayMs = DELAY_MS }) {
  if (urls.length > CAP) throw new Error(`captureAll refuses more than ${CAP} URLs per run (got ${urls.length})`);
  mkdirSync(dir, { recursive: true });
  let written = 0;
  for (const [i, url] of urls.entries()) {
    if (i > 0) await sleepFn(delayMs);
    const label = `[${i + 1}/${urls.length}]`;
    let status;
    let contentType;
    let location;
    let encoded;
    try {
      const response = await fetchFn(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'manual' });
      status = response.status;
      contentType = response.headers.get('content-type');
      if (status === 429) {
        log(`${label} 429 ${url}: the CMS asked us to back off, stopping (no retry)`);
        return { ok: false, written };
      }
      if (status >= 500) {
        log(`${label} ${status} ${url}: server error, stopping (no retry)`);
        return { ok: false, written };
      }
      if (status >= 300 && status < 400) location = response.headers.get('location') ?? undefined;
      encoded = encodeBody(Buffer.from(await response.arrayBuffer()), contentType ?? '');
    } catch (error) {
      log(`${label} ${url}: ${error instanceof Error ? error.message : error}, stopping (no retry)`);
      return { ok: false, written };
    }
    const headers = {};
    if (contentType !== null) headers['content-type'] = contentType;
    if (location !== undefined) headers.location = location;
    writeJsonAtomic(join(dir, `${cmsFixtureKey(url)}.json`), { url, status, headers, ...encoded });
    written += 1;
    log(`${label} ${status} ${contentType ?? '(no content-type)'} ${url}${location === undefined ? '' : ` -> ${location}`}`);
  }
  return { ok: true, written };
}

function printPlan(plan, full, log, cap) {
  const list = plan.overCap ? full.toFetch : plan.toFetch;
  log(`${plan.overCap ? 'Over the cap of ' + cap + ': ' : ''}${list.length} URL(s) to fetch, in order:`);
  list.forEach((url, i) => log(`  ${i + 1}. ${url}`));
  if (plan.overCap) {
    log(`The plan is over the cap of ${cap} URLs per run, so a real run refuses it. Narrow what the pages ask for; the cap is not raised.`);
  }
  // The log repeats a URL once per page load, so a skipped URL is listed once with its count.
  const groups = new Map();
  for (const { url, reason } of plan.skipped) {
    const key = `${reason}\t${url}`;
    groups.set(key, { url, reason, count: (groups.get(key)?.count ?? 0) + 1 });
  }
  const order = ['not-primary-cms', 'has-fixture', 'duplicate'];
  const rows = [...groups.values()].sort((a, b) => order.indexOf(a.reason) - order.indexOf(b.reason));
  log(`${plan.skipped.length} logged request(s) skipped, ${rows.length} distinct URL/reason pair(s):`);
  for (const { url, reason, count } of rows) log(`  ${reason.padEnd(16)} ${url}${count > 1 ? ` (x${count})` : ''}`);
  const requests = plan.overCap ? 0 : plan.toFetch.length;
  log(`A real run would make ${requests} request(s) to ${PRIMARY_CMS_HOST}, ${DELAY_MS / 1000} s apart. This dry run made none.`);
}

/**
 * @param {string[]} argv
 * @param {{ env?: Record<string, string | undefined>, fetchFn?: typeof fetch, sleepFn?: (ms: number) => Promise<unknown>, readMissing?: () => string[] | null, hasFixture?: (url: string) => boolean, dir?: string, log?: (message: string) => void, error?: (message: string) => void }} [deps]
 * @returns {Promise<number>} the exit code
 */
export async function run(argv, deps = {}) {
  const {
    env = process.env,
    fetchFn = globalThis.fetch,
    sleepFn = delay,
    readMissing = () => readMissingUrls(MISSING_CMS_LOG),
    dir = FIXTURES_DIR,
    log = console.log,
    error = console.error,
  } = deps;
  const fixtures = new CmsFixtures(dir);
  const hasFixture = deps.hasFixture ?? ((url) => !!fixtures.get(url));

  const dryRun = argv.includes('--dry-run');
  if (argv.some((a) => a !== '--dry-run')) {
    error(USAGE);
    return 2;
  }
  if (!dryRun && env.E2E_ALLOW_CMS_CAPTURE !== 'yes') {
    error(REFUSAL);
    return 2;
  }

  const missing = readMissing();
  if (missing === null) {
    log(`${MISSING_CMS_LOG} does not exist: no missing CMS URLs were logged. Nothing to capture.`);
    return 0;
  }
  const plan = planCapture(missing, hasFixture, CAP);
  if (dryRun) {
    printPlan(plan, plan.overCap ? planCapture(missing, hasFixture, Infinity) : plan, log, CAP);
    return 0;
  }
  if (plan.overCap) {
    error(`Refusing to capture: more than ${CAP} URLs are missing a fixture. Run --dry-run to see them; the cap is not raised.`);
    return 2;
  }
  if (plan.toFetch.length === 0) {
    log('Nothing to capture: no logged URL needs a fixture.');
    return 0;
  }
  const result = await captureAll(plan.toFetch, { fetchFn, sleepFn, dir, log });
  log(`${result.written} of ${plan.toFetch.length} fixture(s) written to ${dir}/`);
  return result.ok ? 0 : 1;
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

// Run the CLI only when executed directly, so tests can import the functions.
if (isMain()) {
  process.chdir(repoRoot); // the log and fixture paths are relative to the repo root
  run(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    },
  );
}
