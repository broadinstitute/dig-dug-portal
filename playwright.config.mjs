import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const viewport = { width: 1366, height: 900 };

// A project's `use` overrides the top-level `use`, and every device preset carries its own
// 1280x720 viewport, so each project sets the viewport again after the preset.
const project = (name, device, extra = {}) => ({ name, use: { ...devices[device], viewport }, ...extra });

// The A/B comparison (e2e/compare.spec.mjs) was calibrated in Chromium only (its screenshot
// thresholds, masks and skips were never checked in the other engines), so Firefox and WebKit run
// the single-build smoke test only, even when dist-baseline/ exists.
const smokeOnly = { testIgnore: /compare\.spec\.mjs/ };

// serve's default cleanUrls 301-redirects /gene.html?gene=PCSK9 to /gene and drops the query.
// e2e/serve.json turns that off; the -c path must be absolute.
const serveConfig = path.resolve('e2e/serve.json');

// The candidate build (dist/) on 8080 and, once `npm run e2e:baseline -- <ref>` has built one, the
// baseline build (dist-baseline/) on 8081 for e2e/compare.spec.mjs.
const webServer = [
  {
    command: `npx serve -l 8080 -c ${serveConfig} dist`,
    url: 'http://localhost:8080/about.html',
    reuseExistingServer: !process.env.CI,
  },
];
if (fs.existsSync('dist-baseline')) {
  webServer.push({
    command: `npx serve -l 8081 -c ${serveConfig} dist-baseline`,
    url: 'http://localhost:8081/about.html',
    reuseExistingServer: !process.env.CI,
  });
}

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.mjs',
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:8080',
    viewport,
  },
  projects: [
    project('chromium', 'Desktop Chrome'),
    project('firefox', 'Desktop Firefox', smokeOnly),
    project('webkit', 'Desktop Safari', smokeOnly),
  ],
  webServer,
  reporter: [['list'], ['html', { open: 'never' }]],
});
