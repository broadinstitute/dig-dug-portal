// Disk cache for live data requests (BioIndex and friends) made during e2e runs.
//
// The A/B comparison probes the baseline build and then the candidate build with the same page,
// and both must see the same data. So the first request for a (method, URL, body) goes to the
// network once, even when both builds ask for it at the same moment, and every later request in
// the same run replays <dir>/<key>.json. The cache lives under test-results/, which Playwright
// empties at the start of every run, so it lasts one run.
//
// Redirects are followed here, not by Node and not by the browser. Node's fetch would follow a
// redirect to any host, the CMS included; and a 3xx handed to route.fulfill makes Chromium request
// the target without routing it (see e2e/network.mjs). So a redirect is followed only while its
// target is itself a live host, for at most MAX_REDIRECT_HOPS hops; anything else fails the request.
// The final response is cached under the original request's key; a 3xx is never cached or fulfilled.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { classifyUrl } from './network.mjs';

const MAX_REDIRECT_HOPS = 5;
const FETCH_TIMEOUT_MS = 30_000;

// Not replayed: hop-by-hop headers, and the encoding/length headers, because the body is stored
// decoded. Cookies are not replayed either.
const DROPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
  'set-cookie',
]);

function replayableHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers)
      .map(([name, value]) => [name.toLowerCase(), value])
      .filter(([name]) => !DROPPED_RESPONSE_HEADERS.has(name)),
  );
}

const isRedirect = (status) => status >= 300 && status < 400;

/** An error's message, with its cause (undici's "fetch failed" says why only there). */
function reason(err) {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause instanceof Error ? err.cause.message : err.cause;
  return cause ? `${err.message} (${cause})` : err.message;
}

/**
 * Fetch a live URL with `fetchFn` (Node's fetch by default), following redirects only to other live
 * hosts. Throws on a redirect to any other class of URL, a 3xx without a usable location, more than
 * MAX_REDIRECT_HOPS redirects, or the 30 s timeout, which covers the whole chain and the body.
 *
 * @returns {Promise<Response>} the final, non-3xx response
 */
async function fetchFollowingLiveRedirects(url, { method, contentType, body }, fetchFn) {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  let current = url;
  for (let hop = 0; ; hop++) {
    const response = await fetchFn(current, {
      method,
      headers: contentType ? { 'content-type': contentType } : {},
      body: method === 'GET' || method === 'HEAD' ? undefined : body,
      redirect: 'manual',
      signal,
    });
    const { status } = response;
    if (!isRedirect(status)) return response;
    try {
      await response.body?.cancel();
    } catch {
      // Nothing to release.
    }

    const location = response.headers.get('location');
    if (!location) throw new Error(`${status} from ${current} has no location`);
    if (hop === MAX_REDIRECT_HOPS) throw new Error(`more than ${MAX_REDIRECT_HOPS} redirects, last from ${current}`);
    let next;
    try {
      next = new URL(location, current).href;
    } catch {
      throw new Error(`${status} from ${current} has an unparsable location ${JSON.stringify(location)}`);
    }
    const kind = classifyUrl(next, []);
    if (kind !== 'live') throw new Error(`${status} from ${current} to ${next} (${kind}) not followed`);

    // As fetch does: a 303 (unless HEAD), or a 301/302 after a POST, continues as a GET with no body.
    if ((status === 303 && method !== 'HEAD') || ((status === 301 || status === 302) && method === 'POST')) {
      method = 'GET';
      body = undefined;
      contentType = undefined;
    }
    current = next;
  }
}

// Sends only what the cache key covers (method, URL, body) plus the body's content type. Browser
// headers such as cookies are not forwarded.
async function nodeFetch(route, fetchFn) {
  const request = route.request();
  const response = await fetchFollowingLiveRedirects(
    request.url(),
    {
      method: request.method(),
      contentType: request.headers?.()['content-type'],
      body: request.postDataBuffer?.() ?? request.postData() ?? undefined,
    },
    fetchFn,
  );
  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: () => response.status,
    headers: () => Object.fromEntries(response.headers),
    body: async () => body,
  };
}

export class ResponseCache {
  /**
   * @param {string} dir
   * @param {{
   *   fetch?: (route: any) => Promise<{ status(): number, headers(): Record<string,string>, body(): Promise<Buffer> }>,
   *   fetchFn?: typeof fetch,
   *   warn?: (message: string) => void,
   * }} [opts] `fetch` replaces the whole live fetch for a route; `fetchFn` replaces only Node's fetch
   *   under the redirect handling; `warn` (default console.warn, to stderr) reports a failed fetch or
   *   cache write
   */
  constructor(dir, opts = {}) {
    this.dir = dir;
    const fetchFn = opts.fetchFn ?? ((url, init) => fetch(url, init));
    this.fetch = opts.fetch ?? ((route) => nodeFetch(route, fetchFn));
    this.warn = opts.warn ?? ((message) => console.warn(message));
    this.inflight = new Map();
  }

  keyFor(method, url, postData) {
    return createHash('sha256')
      .update(JSON.stringify([method, url, postData ?? null]))
      .digest('hex');
  }

  async fulfill(route) {
    const request = route.request();
    const key = this.keyFor(request.method(), request.url(), request.postData());
    let entry;
    try {
      entry = await this.#entry(key, route);
    } catch {
      // A network failure is not cached; the browser sees a failed request.
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: entry.status,
      headers: entry.headers,
      body: Buffer.from(entry.bodyBase64, 'base64'),
    });
  }

  // Single-flight: concurrent requests for one key share one read-or-fetch.
  #entry(key, route) {
    let pending = this.inflight.get(key);
    if (!pending) {
      pending = this.#readOrFetch(key, route).finally(() => this.inflight.delete(key));
      this.inflight.set(key, pending);
    }
    return pending;
  }

  async #readOrFetch(key, route) {
    const file = join(this.dir, `${key}.json`);
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch {
      // Not cached yet (or unreadable): fetch it.
    }

    const url = route.request().url();
    let entry;
    try {
      const response = await this.fetch(route);
      const status = response.status();
      if (isRedirect(status)) throw new Error(`unfollowed ${status}`);
      const body = await response.body();
      entry = {
        url,
        status,
        headers: replayableHeaders(response.headers()),
        bodyBase64: Buffer.from(body).toString('base64'),
      };
    } catch (err) {
      this.warn(`[e2e response cache] fetching ${url} failed: ${reason(err)}`);
      throw err;
    }

    try {
      await this.#store(key, file, entry);
    } catch (err) {
      // The response itself is fine: the browser still gets it, only later requests refetch it.
      this.warn(`[e2e response cache] could not store ${url}: ${reason(err)}`);
    }
    return entry;
  }

  // Several Playwright workers share the directory: write a private temp file, then rename it into
  // place, so a reader never sees a partial entry.
  async #store(key, file, entry) {
    await mkdir(this.dir, { recursive: true });
    const tmp = join(this.dir, `.${key}.${process.pid}.${randomUUID()}.tmp`);
    try {
      await writeFile(tmp, JSON.stringify(entry));
      await rename(tmp, file);
    } catch (err) {
      await rm(tmp, { force: true }).catch(() => {});
      throw err;
    }
  }
}
