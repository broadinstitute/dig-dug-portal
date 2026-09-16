# PIGEAN method portal

The Vue multi-page entry `pigean_method` builds `dist/pigean-method.html`.
Serve `dist/` as the HTTP root; the page uses hash navigation and needs no
application server or route fallback. The public BioIndex hosts must permit
requests from the deployed origin. `/pigean-method.html` avoids a collision
between clean URLs and the existing `/pigean/index.html` on case-insensitive hosts.

## Pull, build, and serve locally

Run these commands from your DIG-DUG checkout. The branch is
`chase/pigean-page` in [yakaboskic/dig-dug-portal](https://github.com/yakaboskic/dig-dug-portal/tree/chase/pigean-page),
based on the upstream `dk-bird-methods-kp` bird-method template branch. Keep any
local work committed or stashed before switching branches.

Prerequisites: Git, Node.js **22.12.0 or newer**, and npm. The locked KaTeX CLI
dependency requires Node >=22.12.0. This portal was built and checked with
Node 23.11.0 and npm 10.9.2. Python is optional and is only needed for registry
generation and its tests. No database, Python application server, BioIndex
installation, or separate search service is needed to serve this page.

### macOS, Linux, or Windows with WSL / a POSIX npm script shell

```sh
git remote add pigean https://github.com/yakaboskic/dig-dug-portal.git
git fetch pigean
git switch --track pigean/chase/pigean-page
git pull --ff-only pigean chase/pigean-page
npm ci
npm run build
npm run preview
```

Add the `pigean` remote only once; if it already exists, verify its URL with
`git remote -v` and skip that line. If the branch is already checked out locally,
replace the `git switch --track` line with `git switch chase/pigean-page`.
For later updates, fetch and pull from `pigean`, then rerun `npm ci` and the build.

Keep the preview process running, then open:

**http://localhost:8080/pigean-method.html**

The preview serves `dist/`, not the repository root or `public/`. The `.html`
URL works with ordinary static servers; `/pigean-method` also works with the
bundled `serve` preview's clean URLs. Other static hosts may require `.html`.
No history-mode rewrite is required because application navigation uses `#`.
Opening the file directly with `file://` is unsupported.

For a fresh clone, start with:

```sh
git clone --branch chase/pigean-page https://github.com/yakaboskic/dig-dug-portal.git
cd dig-dug-portal
npm ci
npm run build
npm run preview
```

`npm ci` installs the committed dependency versions, including the build tools;
do not omit development dependencies on the machine doing the build. The
committed JSON catalogs, example data, articles, figure, and videos are ready
to serve. The sibling research repositories and original manuscript files are
not needed for these steps.

For an upstream pull request, the matching template branch is
`broadinstitute/dig-dug-portal:dk-bird-methods-kp`; the head is
`yakaboskic/dig-dug-portal:chase/pigean-page`.

### Native Windows PowerShell

The existing `build`, `watch`, and `deploy` npm scripts use POSIX `export`
syntax. If npm uses the default Windows shell, run the equivalent build directly
after fetching/switching/pulling the branch and running `npm ci`:

```powershell
$env:NODE_OPTIONS = "--openssl-legacy-provider"
node .\node_modules\@vue\cli-service\bin\vue-cli-service.js build --mode development
npm run preview
```

### Use another port or bind only to localhost

Instead of `npm run preview`, the installed server can be started explicitly:

```sh
node node_modules/serve/build/main.js -l tcp://127.0.0.1:8081 dist --no-clipboard
```

Open `http://127.0.0.1:8081/pigean-method.html`. Stop the server with Ctrl+C.
This command also works in PowerShell. It uses the installed dependency and
does not download another server package.

## Develop and publish a static build

For Vue/JavaScript/CSS development, run `npm run watch` in one terminal and
`npm run preview` in another. Wait for the first successful build before opening
the page. Refresh the browser after subsequent builds; this is a build watcher,
not a hot-reload development server. In native PowerShell, use the direct build
command above with `--watch` appended.

For Markdown or media edits under `public/pigean/`, run `npm run build` again
and refresh, or copy the edited asset into the corresponding `dist/pigean/`
location. Do not rely on the build watcher to notice every public-file change.
Changes made only in `dist/` are temporary and will be overwritten by a build.

For a production artifact:

```sh
npm ci
npm run deploy
```

Despite its name, `npm run deploy` only builds production files into `dist/`;
it does not upload or publish anything. In native PowerShell, set
`NODE_OPTIONS` as above and run the direct build command with
`--mode production` instead.

Upload the **contents of `dist/`** to the HTTP server's document root, or mount
`dist/` as that root. Preserve all generated directories, including `js/`,
`css/`, fonts/images, and `pigean/content/` and `pigean/registry/`. Copying only
`pigean-method.html` will not work. A static Nginx/Apache host, object-store
website, or other static file host is sufficient. Node is needed to build, but
is not needed on the hosting server unless it is also the chosen file server.

The current build assumes hosting at the origin root: content and registry
requests start with `/pigean/`, and compiled asset URLs also use the root.
Hosting under a prefix such as `/tools/` requires code/build path changes.
Serve HTML, JSON, Markdown, PNG, and WebM files normally, including
`video/webm` for the animations. Byte-range support improves video seeking.
Allow HTML/content/registry updates to revalidate rather than caching them
indefinitely; publish the HTML, compiled assets, content, and registry together.

## Runtime services and smoke check

The browser contacts these model-specific public APIs directly:

- **CFDE v2** → `https://cfde-dev.hugeampkpnbi.org`.
- **Small / Large** → `https://bioindex.hugeamp.org`, using sigma 2.

Internet access and API CORS permission for the hosted origin are needed for
live results. No API token is required for these public requests. Model hosts
are explicit in `src/utils/pigeanPortalUtils.js`; the general `BIOINDEX_HOST`
or `BIOINDEX_DEV` environment variables do not override these model choices.
Shared DIG-DUG header metadata may contact additional portal services. The
method content and Explorer have local fallback chrome if that metadata fails.

After opening the page:

1. Check **Abstract**, **Documentation**, and **Usage guide**; the figure,
   equations, and muted looping videos should render.
2. Open **Explorer**, choose a model and `T2D`, and select **Explore**. Check
   the readable phenotype name and ontology links.
3. Check the scatter's combined-support color legend, genes below the scatter,
   and gene sets to the right (stacked on narrow screens). Defaults are direct
   support >=0 and combined support >=1.
4. Select a gene set, close its sheet, and verify gene highlighting. Open a
   gene or gene-set sheet and choose **Across traits** to see named phenotypes.
   HPO traits are excluded.
5. Try **Compare** and **Copy link**. A shared link should restore its model,
   phenotype, and selection when opened on the same hosted site.
6. Use **Open saved T2D example** to check rendering independently of the live
   result APIs. The saved example is explicitly labeled and does not provide
   cross-trait or relationship browsing.

## Troubleshooting

- **404 or wrong page:** serve `dist/` as the root and open
  `/pigean-method.html`, rather than `/pigean/` (the older portal).
- **Old plot labels or styling:** rebuild, then hard-refresh the browser.
  After a remote deployment, invalidate stale HTML/content/registry caches.
- **Missing phenotype names or ontology links:** verify
  `/pigean/registry/phenotypes.json` returns JSON, not a server fallback HTML
  page. Deploy it together with `catalog.json` and `cfde-t2d.json`.
- **Missing articles or videos:** check `/pigean/content/abstract.md` and the
  `pigean/content/media/` files. Preserve their filenames and directory layout.
- **Live request failure:** use the browser Network panel to inspect the
  model-specific BioIndex response, CORS, and connectivity. Retry after the
  service recovers; the UI does not replace failed live queries with saved data.
- **Slow loading:** score filters reduce rendering, but BioIndex still returns
  complete responses. Threshold changes use the cached result. The current API
  does not accept these numeric thresholds as query predicates.
- **Node/OpenSSL or engine errors:** check the Node version above. The provided
  build scripts already set the legacy OpenSSL option required by Webpack 4.
- **`npm ci` fails fetching a GitHub dependency:** the existing lockfile includes
  Git-based dependencies. Ensure Git and the required GitHub network/SSH access
  work on the build machine; do not regenerate the lockfile to work around a
  network failure.

## Edit the written content

All three articles are ordinary Markdown files, fetched at runtime:

- `public/pigean/content/abstract.md`: author-supplied abstract and original figure.
- `public/pigean/content/documentation.md`: a methods-based draft with four videos.
- `public/pigean/content/user-guide.md`: the **Usage guide** navigation panel.

Edit these files directly. For a built site, copy the edited files into
`dist/pigean/content/` or rebuild. The original paper and presentation files are
unchanged. `public/pigean/content/sources.json` records their hashes and the
manifest values used to resolve the abstract's template variables. It is an
import record, not an automatic synchronization mechanism; future manuscript
updates must be brought into the portal content deliberately.

In the abstract, keep the figure in `pigean-abstract-figure` and the prose in
`pigean-abstract-copy`, with blank lines around the prose wrapper so Markdown
still parses normally. The wide layout places them side by side. When the card
is narrower than 960px, the figure moves above the prose and expands to the
available reading width; its full-size link opens the original image.

Use `$...$` for inline math and `$$` blocks for display math. KaTeX and its fonts
are bundled locally. Headings generate a table of contents and stable section
links. HTML is sanitized using the existing portal sanitizer. Link to the
application with `[Explore genetic support](#explorer)`; the page switches tabs.

Media paths are relative to the content folder:

```markdown
![PIGEAN overview](./media/pigean-figure-1.png)
```

```html
<figure>
<video autoplay muted loop controls playsinline preload="metadata" aria-label="Descriptive video title">
<source src="./media/regularization.webm" type="video/webm">
<a href="./media/regularization.webm">Download the animation.</a>
</video>
<figcaption>Describe the scientific point illustrated here.</figcaption>
</figure>
```

The documentation follows: regularization → gene-set regularization → formal
model → decomposition of support. Each animation has accompanying prose and a
text description. Videos autoplay silently and loop inline like GIFs. Native
controls remain available to pause, seek, or replay an animation. These playback
attributes live in the Markdown, so authors can change them per video.

## Explorer and data

`src/components/researchPortal/PIGEAN/PigeanPortalExplorer.vue` provides the
scatter, tables, entity details, cross-trait browsing and comparisons in one
page. Hash state includes model, phenotype, comparison selection and selected
entity. Switching to an article retains the loaded Explorer and its filters.

`src/utils/pigeanPortalApi.js` adapts two distinct query schemas:

- CFDE v2: `https://cfde-dev.hugeampkpnbi.org`, `(phenotype, cfde-inc-v2)`.
- Small/large: `https://bioindex.hugeamp.org`, `(phenotype, 2, model)`.

`queryComplete` follows continuation pages on the same host without a `limit`
cap. Errors, restricted records and incomplete responses fail explicitly. The
public requests omit the portal session header. Existing callers of `query`
retain their behavior.

Scores retain the source definitions: `prior` is indirect support, `log_bf`
direct support, and `combined` combined support. Missing scores stay missing.
Comparison ranks apply to the retrieved records. Conflicting repeated IDs are
not silently aggregated. Joined annotation context is labeled separately from
verified membership. The CFDE v2 membership catalog advertises only the older
`cfde` model; v2 membership is therefore reported as unavailable.

## Discovery registry

Fuzzy discovery runs in the browser against `public/pigean/registry/catalog.json`.
This static sidecar requires no continuously running service. It contains
phenotype metadata plus the captured CFDE factor keys; suggestions are not proof
of gene/gene-set availability in any model. Exact identifiers can always be typed.

`cfde-t2d.json` is a separately labeled complete T2D response capture, selected
only through **Open saved T2D example**. It is never substituted for a failed live
request. It does not include cross-trait or membership datasets.

To rebuild the registry from a newly captured source snapshot:

```sh
python3 scripts/build-pigean-registry.py \
  --cfde-source ../reveal-mechanisms/data/cfde \
  --phenotypes ../portal-data-models/versions/phenotype/v0.0.1/portal_phenotypes_flat.tsv \
  --phenotype-revision dcdb13b9ed8e39007678d8b488dc3a7197f2096b
```

This reads existing files; it does not refresh the source snapshot. Dates and
hashes come from those inputs; use the revision matching your phenotype source
when updating it. Deploy all three generated JSON files together:
`catalog.json`, `phenotypes.json`, and `cfde-t2d.json`. See
`public/pigean/registry/README.md` for metadata provenance and coverage. Registry
generation is optional maintenance, not a prerequisite for building or serving.

## Validate and preview

```sh
npm ci
node --test scripts/test-pigean-portal.cjs
python3 -m unittest discover -s scripts -p 'test_pigean_registry.py'
npm run build
npm run preview
```

Open `http://localhost:8080/pigean-method.html`. Check the four top-level tabs,
Markdown equations, figure and video playback. Exercise live T2D in each model,
gene/set details, a comparison, the saved example and browser back/forward.
Compare source failures with valid empty responses. Check the layout on mobile.

The registry, article and media assets are local. Live results and shared portal
header metadata still depend on their remote services; a failed metadata request
leaves a local method header and footer available.
