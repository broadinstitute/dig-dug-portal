// `test` with the network policy installed on every browser context: CMS from fixtures, live data
// through a response cache shared by every test in the worker, everything else blocked.
import { test as base, expect } from '@playwright/test';
import { CmsFixtures } from './cms-fixtures.mjs';
import { installNetworkPolicy } from './network.mjs';
import { ResponseCache } from './response-cache.mjs';

// The candidate build (8080) and, for A/B runs, the baseline build (8081).
export const LOCAL_ORIGINS = ['http://localhost:8080', 'http://localhost:8081'];

export const test = base.extend({
  cache: [async ({}, use) => use(new ResponseCache('test-results/response-cache')), { scope: 'worker' }],
  cms: [async ({}, use) => use(new CmsFixtures()), { scope: 'worker' }],
  networkPolicy: [
    async ({ context, cache, cms }, use) => {
      await installNetworkPolicy(context, { cache, cms, localOrigins: LOCAL_ORIGINS });
      await use();
    },
    { auto: true },
  ],
});

export { expect };
