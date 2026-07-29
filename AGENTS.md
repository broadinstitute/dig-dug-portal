<!-- AUTO-GENERATED. Do not edit. -->
<!-- Version: 1.0.11 | Generated: 2026-06-06T15:26:15Z | Hash: 6f68bdfab502 -->
<!-- Sources: dig-dug-portal/master/AGENTS.md + dig-dug-portal/AGENTS.md -->

# dig-dug-portal — master

## Variant-Specific Guidance

## Purpose and Intended Audience

Variant-specific guidance for the `master` build of dig-dug-portal. Extends ../AGENTS.md; root rules and workflows still apply.

Upstream branch: `master` of https://github.com/broadinstitute/dig-dug-portal

## Repository Organization

This folder holds variant-specific notes only. Build and runtime instructions live in the parent AGENTS.md.

## Variant Notes

- Branch: `master`
- Differences from default: document only what diverges from parent (entry pages, env vars, deploy target).

## Quick Start (Delta Only)

Switch to this branch before running parent workflows:

```bash
git checkout master
```

Then follow setup, watch, build, and deploy from ../AGENTS.md.

For local static preview of compiled master output:

```bash
npm run preview
```

## Constraints and Non-Negotiables

- Do not duplicate parent guidance; record only variant-specific differences here.
- Use uppercase `AGENTS.md` for any nested agent docs.

## Assumptions and Known Limitations

- Variant-specific scripts or env vars not yet documented; add only when verified from source.

---

## Shared Rules (from dig-dug-portal)

## Purpose and Intended Audience

Execution-focused guidance for contributors and coding agents prototyping, building, or testing DIG-DUG portal variants in this folder.

Upstream source: https://github.com/broadinstitute/dig-dug-portal

## Repository Organization

```text
dig-dug-portal/
  AGENTS.md
  README.md
  <branch-name>/     ← one subfolder per upstream branch variant
    AGENTS.md
```

- Each immediate subfolder name corresponds to an upstream `dig-dug-portal` branch used to build a specific portal/variant.
- Each subfolder may include its own `AGENTS.md` to extend context for that variant; root rules still apply.
- Keep supporting files minimal and inside the relevant folder.
- Do not update this structure block when adding or removing variant branches; it is illustrative only.

## Code Organization

### Multi-Page Build Structure

dig-dug-portal uses Vue CLI's multi-page mode to build separate single-page applications from a single codebase:

- **Entry points**: Each page is defined as an entry in `vue.config.js` with a corresponding folder in `src/views/`.
- **Main entry** (`A2fIndex/main.js`): Home/index page.
- **Research pages** (`Research/`, `EffectorGenes/`, `PIGEAN/`, etc.): Portal-specific analysis and display pages.
- **Static pages** (`About/`, `Help/`, `Policies/`, `Publications/`, etc.): Content and navigation pages.

### `src/components/` Organization

Shared and feature-specific components are organized hierarchically:

| Folder/Component                     | Purpose                                                     |
| ------------------------------------ | ----------------------------------------------------------- |
| `PageHeader.vue`, `PageFooter.vue`   | Global layout components (header/footer across all pages)   |
| `criterion/`                         | Filter/criterion UI (P-value, enumeration, range filters)   |
| `researchPortal/`                    | Research portal visualizations (LocusZoom, heatmaps, plots) |
| `lz/`                                | LocusZoom integration and panel configuration               |
| `*SelectPicker.vue`                  | Phenotype, gene, ancestry, tissue, transcript selectors     |
| `*Table.vue`                         | Data tables (associations, genes, transcripts, PheWAS)      |
| `frontPage/`                         | Home page sections (news feed)                              |
| `PIGEAN/`, `kpDataViewer/`, `NCATS/` | Feature-specific component suites                           |
| `customComponents/`                  | Portal-unique layouts (cfdeLanding, cfdeEcoSystem, etc.)    |

### `src/modules/` (Vuex State)

State is organized by feature or portal scope:

- `bioPortal.js` — Phenotypes, genes, diseases, general portal state
- `bioIndex.js` — BioIndex server API client and caching
- `kp4cd.js` — Portal-specific menus and metadata
- `effectorGenes.js`, `lunaris.js`, `ldServer.js` — Feature-specific modules

### `src/utils/` (Utilities & Helpers)

Utility modules organize reusable functions:

| Module             | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `bioIndexUtils.js` | BioIndex API requests and response handling          |
| `plotUtils.js`     | Chart and visualization rendering helpers            |
| `formatters.js`    | Data formatting (p-values, scientific notation, etc) |
| `alertUtils.js`    | Notification/alert management                        |
| `sortUtils.js`     | Sorting and comparison utilities                     |
| `regionUtils.js`   | Genomic region parsing and validation                |
| `filterUtils.js`   | Filter expression building                           |
| `eventBus.js`      | Cross-component Vue event bus                        |
| `colors.js`        | Palette definitions for charts and visualizations    |
| `keyParams.js`     | URL and session parameter handling                   |

### `src/mixins/`

Shared component logic:

- `pageMixin.js` — Common page setup (header, footer, routing)

### `src/views/` (Page Entry Points)

Each page entry contains:

- `main.js` — Entry point; registers components, store modules, mixins
- `Template.vue` — Top-level layout
- `store.js` (optional) — Local Vuex store

**Key pages:**

| Page              | Use Case                                             |
| ----------------- | ---------------------------------------------------- |
| `A2fIndex/`       | Home page with search and featured content           |
| `Phenotype/`      | Phenotype detail: associations, PheWAS, resources    |
| `Gene/`           | Gene detail: transcript, LZ locus plot, annotations  |
| `Region/`         | Genomic region: LD visualization, variant browser    |
| `Variant/`        | Variant detail: functional consequences, annotations |
| `Research/`       | Main research portal; portal-variant-specific UI     |
| `PIGEAN/`         | Polygenic inheritance analysis                       |
| `GAIT/`, `GAIT2/` | Association and variant search interactive tools     |

### Babel/Webpack Configuration

- `babel.config.js` — ES6+ transpilation
- `vue.config.js` — Multi-page build config, asset paths, API proxy
- Webpack includes a babel-loader transpilation rule for `vis-network` and `vis-data` modules

## Tech Stack Snapshot

- Frontend: Vue 2.7 + Vuex 3
- Build: Vue CLI 4 (`@vue/cli-service`) + Webpack
- Runtime: Node.js + npm
- UI: Bootstrap 4 + BootstrapVue 2
- Data backend: BioIndex (`bioindex.hugeamp.org` / `bioindex-dev.hugeamp.org`)
- Architecture: multi-page build configured in `vue.config.js`
- Full-stack runtime: requires DIG-DUG server

### Visualization Libraries (all branches)

| Library     | Package                       | Purpose                            |
| ----------- | ----------------------------- | ---------------------------------- |
| AMCharts 4  | `@amcharts/amcharts4 ^4.10.x` | Charts and data visualization      |
| C3.js       | `c3 ^0.7.20`                  | D3-based charting                  |
| D3.js       | `d3 ^5.16.0`                  | Low-level visualization primitives |
| LocusZoom   | `locuszoom ^0.13.4`           | Genomic locus visualization        |
| vis-network | `^10.0.2` + `vis-data ^8.0.3` | Network graph rendering            |

Branch-level vis-network differences (tracked portal branches):

- **master, cfde-main, cfde-liver-main, matkp-main, pankbase-main, radiant-main, sysbio-main**: `vis-network ^10.0.2` + `vis-data ^8.0.3` direct; no `vue-vis-network` wrapper
- **radiant-main only**: additionally includes `igv 2.12.6` (IGV.js genome browser)

Webpack must include a babel-loader transpilation rule covering vis-network/vis-data modules.

## Quick Start Workflows

### 1. Setup

```bash
git clone https://github.com/broadinstitute/dig-dug-portal.git
cd dig-dug-portal
npm install
```

On Windows, `npm install --no-optional` reduces optional macOS dependency warnings.

A committed `package-lock.json` pins the dependency tree, so for a clean/reproducible install prefer `npm ci`. Installs resolve cleanly with no extra flags: `eslint` is pinned to `8.57.1`, the version every eslint plugin/config in `devDependencies` accepts (eslint-config-standard requires `^8.0.1`; the import/promise/vue plugins cap at 8). Without that explicit pin, npm auto-resolved eslint to its latest major via the plugins' open-ended `>=7` peers, which the capped plugins rejected — the `ERESOLVE` failure that previously forced `--legacy-peer-deps`.

### 2. Prototype (Watch Mode)

```bash
npm run watch
```

### 3. Choose BioIndex Target

Default targets production BioIndex. To use development BioIndex:

bash/zsh:

```bash
export BIOINDEX_DEV=1
npm run watch
```

PowerShell:

```powershell
$env:BIOINDEX_DEV = "1"
npm run watch
```

To override BioIndex hosts directly:

bash/zsh:

```bash
export BIOINDEX_HOST="http://localhost:5000"
export BIOINDEX_HOST_PRIVATE="http://localhost:5000"
```

PowerShell:

```powershell
$env:BIOINDEX_HOST = "http://localhost:5000"
$env:BIOINDEX_HOST_PRIVATE = "http://localhost:5000"
```

### 4. Secondary BioIndex Host (Per Module or Per Call)

Upstream supports an optional `host` override so a specific Vuex module or call can read from a different BioIndex without forking `bioIndexUtils.js` / `bioIndex.js`. Anything that omits `host` keeps using the build-time default.

Per Vuex module (3rd factory argument):

```js
import bioIndex from "@/modules/bioIndex";

specialData: bioIndex("special-index", undefined, { host: "https://secondary.example.org" }),
```

Per call (options object):

```js
import { query } from "@/utils/bioIndexUtils";

const rows = await query("special-index", q, {
    host: "https://secondary.example.org",
    limit: 100,
});
```

Reuse the existing private host constant when targeting the internal server:

```js
import { BIO_INDEX_HOST_PRIVATE } from "@/utils/bioIndexUtils";

privateData: bioIndex("bar", undefined, { host: BIO_INDEX_HOST_PRIVATE }),
```

Notes:

- `host` is optional everywhere; existing modules and calls behave exactly as before.
- `BIO_INDEX_HOST` / `BIO_INDEX_HOST_PRIVATE` exports and the `query_private` flag on `apiUrl` are unchanged.
- Override is threaded through `query` / `match` → `request` → `rawUrl` → `apiUrl`, including continuation fetches.
- Branches pulling from `master` need no edits unless they want to use a secondary host.

### 5. Build / Deploy

```bash
npm run build    # development-mode build
npm run deploy   # production build
```

### 6. Cache Cleanup (Optional)

```bash
./build-clean.sh build   # bash
.\build-clean.ps1 build  # PowerShell
```

### 7. Testing

Upstream defines no automated `test` script. Validate by:

- Successful `npm run build`
- Smoke-load critical routes: index, phenotype, region, variant, gene
- Run against BIOINDEX_DEV and default BioIndex once each
- Verify integration with DIG-DUG server when full runtime is required

### 8. Local Static Preview (No dig-dug-server)

For static smoke-testing of compiled output, serve build artifacts locally:

```bash
npm run preview
```

If a portal branch outputs to a non-`dist/` folder, use:

```bash
npm run preview:dir -- <output-dir>
```

Use the exact branch-specific output directory command from that branch's `AGENTS.md`.

Note: static preview does not replace remote API dependencies (BioIndex/CMS). It only replaces DIG-DUG server as a static file host.

## Branching Strategy

Portal branches (e.g. `matkp-main`, `cfde-main`) follow a **one-way merge-down** model:

- `master` is the shared baseline. Changes intended for all portals live here.
- Portal branches receive changes from `master` via merge-down; they are **never merged back** to `master`.
- Portal-specific changes (portal-unique pages, configs, UI customizations) stay in the portal branch permanently.
- If new functionality needs to be shared across more than one portal:
    1. Branch off `master` into a short-lived `dev/<feature>` branch.
    2. Implement and review on the dev branch.
    3. Merge the dev branch back into `master`.
    4. Merge `master` down into each portal branch that needs the change.

```
master  ──── dev/<feature> ────► master
   │                                │
   ▼                                ▼
matkp-main (receives merge-down, never merges back)
cfde-main  (same)
...
```

## Constraints and Non-Negotiables

- Use uppercase `AGENTS.md` for all agent docs in this folder and its subfolders.
- Do not invent build steps or scripts not present in upstream `package.json`.
- When maintaining upstream `package.json`, include static preview support with `serve` and scripts `preview` + `preview:dir` so contributors can validate built pages without DIG-DUG server.
- Keep variant-specific instructions inside the variant subfolder's `AGENTS.md`.
- Reuse-first rule for new functionality:
    1. Check whether equivalent logic already exists in `src/modules/`, `src/components/`, `src/utils/`, or `src/mixins/` before creating new files.
    2. If a framework/library is already in use (e.g., BootstrapVue, existing chart wrappers, existing selector/table patterns), use available components/patterns before writing custom ones.
    3. If new code is still required, place it in the same folder and naming conventions used by existing code (feature-aligned organization, no parallel ad-hoc structure).
- Provide OS-agnostic commands only where bash and PowerShell diverge.
- Do not open PRs from portal branches targeting `master`; portal-branch changes are intentionally isolated.
- If building a shared feature for multiple portals, follow the dev branch workflow outlined above.

## Integration References

- Frontend repo: https://github.com/broadinstitute/dig-dug-portal
- Backend dependency: https://github.com/broadinstitute/dig-dug-server
- Public deployments: https://hugeamp.org, https://a2f.hugeamp.org, https://t2d.hugeamp.org

## Assumptions and Known Limitations

- Variant subfolders correspond to branch-oriented portal builds.
- No dedicated upstream `test` script exists; testing is manual/build-based.
- Full runtime requires DIG-DUG server availability and correct BioIndex configuration.
