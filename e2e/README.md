# e2e: the Vue 3 migration safety net

Playwright tests that open every production page (the catalog in `e2e/catalog.mjs`) in a built
site. They exist to catch what a migration step breaks before it ships.

## What it checks

- **Smoke** (`e2e/smoke.spec.mjs`, one build): each page's landmark becomes visible, and the
  query string the page was opened with is still the query string it ends on.
- **Compare** (`e2e/compare.spec.mjs`, A/B): each page is opened in a baseline build
  (`dist-baseline/`, port 8081) and in the candidate (`dist/`, port 8080). It fails when the
  candidate has a landmark that does not render, page errors, console errors or failed requests
  that the baseline did not have, or a screenshot that differs by more than `E2E_MAX_DIFF`
  (default 0.002, the share of pixels). Without `dist-baseline/` the compare tests skip.
- Deviation from the migration plan's smoke definition: nothing asserts zero console errors.
  Master's pages already log some, so only errors new relative to the baseline fail.

Every request goes through the network policy (`e2e/network.mjs`): the local servers pass
through, the CMS is served from fixtures, live data (BioIndex and the other `LIVE_HOSTS`) is
fetched once per run and replayed to both builds, and everything else is aborted.

## Run the strong gate locally

From a network BioIndex accepts (not a GitHub runner), in the repo root:

1. `npm ci`
2. `npx playwright install chromium`
3. `npm run deploy`: builds the candidate into `dist/`. Without it the web server never answers
   and Playwright gives up after 60 s.
4. `npm run e2e:baseline -- origin/master`: builds the baseline into `dist-baseline/` (run
   `git fetch origin` first so `origin/master` is current).
5. `npm run e2e -- --project=chromium`
6. `npx playwright show-report`

Results land in `playwright-report/` (HTML) and `test-results/` (per-test screenshots, diff
images, probe attachments). Playwright empties `test-results/` at the start of every run.

### Pitfalls

- Don't have `npm run preview` running on port 8080. Locally Playwright reuses a server already
  on that port (`reuseExistingServer`), and `preview` keeps serve's `cleanUrls`, which redirects
  `/gene.html?gene=PCSK9` to `/gene` and drops every query string. Stop it before a run.
- Only Chromium is calibrated for compare. Firefox and WebKit run smoke only
  (`playwright.config.mjs` ignores `compare.spec.mjs` for them).

## What CI runs, and what it can't catch

- `.github/workflows/ci.yml`, on PRs into `master` and `dev/**` and on pushes to `master`: script
  unit tests, the Vue 3 lint ratchet, the production build and `check:dist`; then a job that
  builds the baseline (the PR's base) and runs `npx playwright test --project=chromium`.
- `.github/workflows/nightly-builds.yml`: each portal branch's production build, master's extra
  configs, and smoke in Firefox and WebKit.
- GitHub-hosted runners get a Cloudflare challenge from BioIndex, so CI sets `E2E_NO_LIVE_DATA=1`.
  Live requests are aborted and the `needsLiveData` pages are skipped, so CI compares empty
  states only. A change that only shows once data loads passes CI. The local run above is the
  strong gate.

## Environment variables

- `E2E_NO_LIVE_DATA=1`: abort every live-data request; smoke skips `needsLiveData` pages.
- `E2E_CMS_DISCOVERY=1`: smoke probes the "needs CMS fixtures" pages without asserting, so the CMS
  URLs they ask for are logged to `test-results/missing-cms.ndjson`.
- `E2E_MAX_DIFF`: the default screenshot diff ratio for compare (0.002); a page's `maxDiff` wins.
- `E2E_ALLOW_CMS_CAPTURE=yes`: lets `capture-cms.mjs` request the CMS. Only with the project
  owner's explicit go.

## The page catalog (`e2e/catalog.mjs`)

One entry per page in `vue.config.js`, in the same order. Adding a page means adding an entry:
`e2e/catalog.test.mjs` (part of `npm run test:scripts`) fails until you do.

- `landmark`: a selector that is visible once the page body has rendered. Default `.mdkp-body`.
  Never `#app`: Vue 2 replaces that element on mount, Vue 3 renders inside it.
- `query`: the URL parameters the page needs, in the canonical form the page writes back (sorted
  keys, defaults filled in), so the URL it ends on is the one it was opened with.
- `mask`: selectors painted over in compare screenshots, for content that changes on every load
  (a random session ID, a physics-laid-out graph). Keep them narrow.
- `maxDiff`: this page's screenshot diff ratio, when the default is too tight for it.
- `skip`: why the page cannot be checked yet. A reason starting `needs CMS fixtures: ` marks a page
  that the CMS capture below can unblock.
- `needsLiveData: true`: the landmark only renders with live BioIndex data.

**Accepting an intended visual change.** Compare fails when a PR changes how a page looks on
purpose. Add a narrow `mask` for the changed region, or a page `maxDiff` just above the measured
ratio (the failure message prints it), with a comment saying why. Reviewers check it in the PR.
Once the change is in the baseline, a later PR can drop it.

## CMS fixtures

The CMS (`hugeampkpncms.org`, `kp4cd.org`) is never requested live, by tests or by tools, except by
the capture step below after the owner's go. A CMS request with a fixture in `e2e/fixtures/cms/`
is served from it; one without is aborted and its URL logged to `test-results/missing-cms.ndjson`.

To add fixtures:

1. `rm -f test-results/missing-cms.ndjson`
2. Discover what the pages ask for (no live CMS request):
   `E2E_CMS_DISCOVERY=1 npx playwright test e2e/smoke.spec.mjs --project=chromium`
3. Print the plan, which makes no request:
   `node scripts/vue3-migration/capture-cms.mjs --dry-run`
4. Get the project owner's explicit go on that plan.
5. Capture: `E2E_ALLOW_CMS_CAPTURE=yes node scripts/vue3-migration/capture-cms.mjs`
6. Rerun step 2. The log should now be empty or absent; a redirect whose target had no fixture
   shows up here and needs another round. Then remove the "needs CMS fixtures" skips from the
   catalog and commit `e2e/fixtures/cms/`.

Run steps 2 to 5 back to back: any Playwright run empties `test-results/`, log included.

Capture limits: `hugeampkpncms.org` URLs only, at most 50 per run (a bigger plan is refused),
2 s apart, no retries. It stops at the first 429, 5xx or network error.

## Portal branches

This workflow is not yet enabled for PRs into portal branches. See the "Portal branches
(merge-down)" block at the top of `.github/workflows/ci.yml` for what a portal's wave must change
first.
