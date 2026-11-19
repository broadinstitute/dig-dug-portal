import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const viewport = { width: 1366, height: 900 };

// A project's `use` overrides the top-level `use`, and every device preset carries its own
// 1280x720 viewport, so each project sets the viewport again after the preset.
const project = (name, device) => ({ name, use: { ...devices[device], viewport } });

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.mjs',
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:8080',
    viewport,
  },
  projects: [project('chromium', 'Desktop Chrome'), project('firefox', 'Desktop Firefox'), project('webkit', 'Desktop Safari')],
  webServer: {
    // serve's default cleanUrls 301-redirects /gene.html?gene=PCSK9 to /gene and drops the query.
    // e2e/serve.json turns that off; the -c path must be absolute.
    command: `npx serve -l 8080 -c ${path.resolve('e2e/serve.json')} dist`,
    url: 'http://localhost:8080/about.html',
    reuseExistingServer: !process.env.CI,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
