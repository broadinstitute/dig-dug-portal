// CMS responses for e2e runs come from checked-in fixtures, never from the live CMS.
//
// A fixture is e2e/fixtures/cms/<cmsFixtureKey(url)>.json holding { url, status, headers, body }.
// URLs a page asked for that have no fixture are appended to test-results/missing-cms.ndjson,
// one {"url":...} per line, for the capture step to work from.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const MISSING_CMS_LOG = 'test-results/missing-cms.ndjson';

/** sha256 hex of the full URL, exactly as the page requested it. */
export function cmsFixtureKey(url) {
  return createHash('sha256').update(url).digest('hex');
}

export class CmsFixtures {
  constructor(dir = 'e2e/fixtures/cms') {
    this.dir = dir;
  }

  /** @returns {{ status: number, headers: Record<string,string>, body: string } | null} */
  get(url) {
    const file = join(this.dir, `${cmsFixtureKey(url)}.json`);
    if (!existsSync(file)) return null;
    const { status, headers, body } = JSON.parse(readFileSync(file, 'utf8'));
    return { status, headers, body };
  }
}

/** Record a CMS URL that had no fixture. Appends are line-sized, so parallel workers do not interleave. */
export function noteMissingCms(url) {
  mkdirSync(dirname(MISSING_CMS_LOG), { recursive: true });
  appendFileSync(MISSING_CMS_LOG, `${JSON.stringify({ url })}\n`);
}
