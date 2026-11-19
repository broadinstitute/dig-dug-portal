// Network policy for e2e runs. Every request a page makes is one of:
//   local    the static server(s) under test: passed through
//   cms      the Drupal CMS: served from a checked-in fixture, never requested live
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

/**
 * Route every request of `context` through the policy. Install it per browser context, before
 * any page navigates.
 *
 * @param {import('@playwright/test').BrowserContext} context
 * @param {{ cache: import('./response-cache.mjs').ResponseCache, cms: import('./cms-fixtures.mjs').CmsFixtures, localOrigins: string[] }} opts
 */
export async function installNetworkPolicy(context, { cache, cms, localOrigins }) {
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    switch (classifyUrl(url, localOrigins)) {
      case 'local':
        return route.continue();
      case 'cms': {
        const fixture = cms.get(url);
        if (fixture) return route.fulfill(fixture);
        noteMissingCms(url);
        return route.abort('blockedbyclient');
      }
      case 'live':
        return cache.fulfill(route);
      default:
        return route.abort('blockedbyclient');
    }
  });
}
