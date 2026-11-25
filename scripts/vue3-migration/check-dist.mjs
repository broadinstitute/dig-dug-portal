// Dist check: confirm a production build wrote an HTML file for every page in vue.config.js.
//
//   node scripts/vue3-migration/check-dist.mjs [distDir=dist] [configPath=vue.config.js]
//
// Paths resolve against the current directory. Exit codes: 0 every page present,
// 1 one or more HTML files missing, 2 the config could not be loaded.
import { existsSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The HTML files Vue CLI writes for a `pages` map: each page's `filename`, or
 * `<key>.html` when it has none. Sorted; nested paths such as `pigean/index.html` are kept.
 *
 * @param {Record<string, { filename?: string }>} pages
 * @returns {string[]}
 */
export function expectedHtmlFiles(pages) {
  return Object.entries(pages)
    .map(([key, page]) => (page && page.filename) || `${key}.html`)
    .sort();
}

const isFile = (path) => existsSync(path) && statSync(path).isFile();

function main(argv) {
  const [distDir = 'dist', configPath = 'vue.config.js'] = argv;

  // vue.config.js drops the dev-only pages (debug, mouse_diff_exp) when NODE_ENV is
  // production, and reads it at require time, so set it before loading the config.
  process.env.NODE_ENV = 'production';
  let pages;
  try {
    ({ pages } = createRequire(import.meta.url)(resolve(configPath)));
  } catch (err) {
    console.error(`could not load ${configPath}: ${err instanceof Error ? err.message : err}`);
    return 2;
  }
  if (!pages || typeof pages !== 'object') {
    console.error(`${configPath} does not export a "pages" map`);
    return 2;
  }

  const expected = expectedHtmlFiles(pages);
  const missing = expected.filter((file) => !isFile(join(resolve(distDir), file)));
  if (missing.length > 0) {
    console.error(`${missing.length} of ${expected.length} pages missing from ${distDir}:`);
    for (const file of missing) console.error(`  ${file}`);
    return 1;
  }
  console.log(`${expected.length} pages present`);
  return 0;
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

// Run the CLI only when executed directly, so tests can import expectedHtmlFiles.
if (isMain()) {
  process.exitCode = main(process.argv.slice(2));
}
