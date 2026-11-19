// Disk cache for live data requests (BioIndex and friends) made during e2e runs.
//
// The A/B comparison probes the baseline build and then the candidate build with the same page,
// and both must see the same data. So the first request for a (method, URL, body) goes to the
// network once, even when both builds ask for it at the same moment, and every later request,
// in this run or the next, replays <dir>/<key>.json.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

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

// Node's fetch, sending only what the cache key covers (method, URL, body) plus the body's
// content type. Browser headers such as cookies are not forwarded.
async function nodeFetch(route) {
  const request = route.request();
  const method = request.method();
  const postData = request.postDataBuffer?.() ?? request.postData();
  const contentType = request.headers?.()['content-type'];
  const response = await fetch(request.url(), {
    method,
    headers: contentType ? { 'content-type': contentType } : {},
    body: method === 'GET' || method === 'HEAD' ? undefined : (postData ?? undefined),
  });
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
   * @param {{ fetch?: (route: any) => Promise<{ status(): number, headers(): Record<string,string>, body(): Promise<Buffer> }> }} [opts]
   */
  constructor(dir, opts = {}) {
    this.dir = dir;
    this.fetch = opts.fetch ?? nodeFetch;
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

    const response = await this.fetch(route);
    const body = await response.body();
    const entry = {
      url: route.request().url(),
      status: response.status(),
      headers: replayableHeaders(response.headers()),
      bodyBase64: Buffer.from(body).toString('base64'),
    };

    // Several Playwright workers share the directory: write a private temp file, then rename
    // it into place, so a reader never sees a partial entry.
    await mkdir(this.dir, { recursive: true });
    const tmp = join(this.dir, `.${key}.${process.pid}.${randomUUID()}.tmp`);
    await writeFile(tmp, JSON.stringify(entry));
    await rename(tmp, file);
    return entry;
  }
}
