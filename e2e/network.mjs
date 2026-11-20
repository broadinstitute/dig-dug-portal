// Network policy for e2e runs. Every request a page makes is one of:
//   local    the static server(s) under test: passed through
//   cms      the Drupal CMS: served from a checked-in fixture (a redirect is followed through the
//            fixtures), never requested live
//   live     public data services: fetched once through the response cache, then replayed
//   blocked  everything else (analytics, fonts, CDNs, other services): aborted
import { noteMissingCms } from './cms-fixtures.mjs';

// kp4cd.org is the CMS failover host: portal branches still fall back to it and footers link it.
export const CMS_HOSTS = ['hugeampkpncms.org', 'kp4cd.org'];

export const LIVE_HOSTS = ['bioindex.hugeamp.org', 'bioindex-dev.hugeamp.org', 'ld.hugeamp.org', 'portaldev.sph.umich.edu'];

/** True when `hostname` is `host` or one of its subdomains (dot boundary respected). */
function matchesHost(hostname, host) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

/**
 * @param {string} url
 * @param {string[]} localOrigins e.g. ['http://localhost:8080', 'http://localhost:8081']
 * @returns {'local' | 'cms' | 'live' | 'blocked'}
 */
export function classifyUrl(url, localOrigins) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'blocked';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'blocked';
  if (localOrigins.some((origin) => new URL(origin).origin === parsed.origin)) return 'local';
  const hostname = parsed.hostname.toLowerCase();
  if (CMS_HOSTS.some((host) => matchesHost(hostname, host))) return 'cms';
  if (LIVE_HOSTS.some((host) => matchesHost(hostname, host))) return 'live';
  return 'blocked';
}

// A fixture that redirects is followed through the fixtures, never replayed. Chromium follows a
// redirect that route.fulfill sends, but does not route the redirect's target request again, so the
// target would be requested live. Five hops is more than the CMS has ever needed; a loop or a longer
// chain is aborted.
const MAX_REDIRECT_HOPS = 5;

/**
 * The fixture a browser would end up with for `url`, following 3xx fixtures that carry a location
 * to other CMS URLs.
 *
 * @returns {{ fixture: object } | { missing: string } | { blocked: true }} the final fixture; the CMS
 *   URL (the redirect target, when `url` redirects) that has no fixture yet; or a redirect that
 *   cannot be followed (to another host, a bad location, a loop)
 */
function followFixtureRedirects(url, cms, localOrigins) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
    const fixture = cms.get(current);
    if (!fixture) return { missing: current };
    const key = Object.keys(fixture.headers ?? {}).find((name) => name.toLowerCase() === 'location');
    const location = key === undefined ? '' : fixture.headers[key];
    if (!(fixture.status >= 300 && fixture.status < 400) || !location) return { fixture };
    let next;
    try {
      next = new URL(location, current).href;
    } catch {
      return { blocked: true };
    }
    if (classifyUrl(next, localOrigins) !== 'cms') return { blocked: true };
    current = next;
  }
  return { blocked: true };
}

/**
 * Route every request of `context` through the policy. Install it per browser context, before
 * any page navigates.
 *
 * @param {import('@playwright/test').BrowserContext} context
 * @param {{ cache: import('./response-cache.mjs').ResponseCache, cms: import('./cms-fixtures.mjs').CmsFixtures, localOrigins: string[], noteMissing?: (url: string) => void }} opts
 */
export async function installNetworkPolicy(context, { cache, cms, localOrigins, noteMissing = noteMissingCms }) {
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    switch (classifyUrl(url, localOrigins)) {
      case 'local':
        return route.continue();
      case 'cms': {
        const found = followFixtureRedirects(url, cms, localOrigins);
        if (found.fixture) return route.fulfill(found.fixture);
        if (found.missing) noteMissing(found.missing);
        return route.abort('blockedbyclient');
      }
      case 'live':
        return cache.fulfill(route);
      default:
        return route.abort('blockedbyclient');
    }
  });
}
