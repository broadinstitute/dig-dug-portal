# GP2 Browser — agent notes

Execution-focused guidance for agents working on **GP2 Browser**. Root [`AGENTS.md`](../../../../../../AGENTS.md) still applies for install, watch, build, and BioIndex env vars.

Companion docs in this folder:

- [`DESIGN.md`](./DESIGN.md) — GP2 UI / brand conventions
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — entry points and shared-vs-fork rule

Shared Variant Sifter runtime (most behavior lives here):

- [`../kpVariantSifter/DESIGN.md`](../kpVariantSifter/DESIGN.md)
- [`../kpVariantSifter/ARCHITECTURE.md`](../kpVariantSifter/ARCHITECTURE.md)

---

## What GP2 Browser is

A **thin shell** over KP Variant Sifter:

| Piece | Location |
|-------|----------|
| Shell component | [`../GP2Browser.vue`](../GP2Browser.vue) |
| Standalone page | [`src/views/GP2Browser/`](../../../../views/GP2Browser/) → `/gp2browser.html` |
| Research section id | `"GP2Browser"` in `ResearchSectionComponents.vue` |
| Vue CLI page | `vue.config.js` → `pages.gp2browser` |

Do **not** copy the whole `kpVariantSifter/` tree into `gp2Browser/`. However, **never modify a file that is shared with KP Variant Sifter (`kpVariantSifter/`) or any other project** for GP2-specific changes. Whenever a file to be altered is shared with another project, create a new GP2-specific component/module under `gp2Browser/` (named `GP2Browser*` / `gp2Browser*`), wire it into `GP2Browser.vue`, and leave the original shared file untouched.

---

## Local run

Same as portal Quick Start (`npm install`, `npm run watch`). Open the built page:

- Standalone: `/gp2browser.html` (or `http://localhost:<port>/gp2browser.html` under watch)
- Research embed: use a research page whose section type is `GP2Browser`

BioIndex host for research/VS/GP2 shells that call `uiUtils.biDomain()`:

- **Local port** or hostname label containing `"dev"` (except TLD) → `https://bioindex-dev.hugeamp.org`
- Otherwise → `https://bioindex.hugeamp.org`

Logic: [`src/utils/uiUtils.js`](../../../../utils/uiUtils.js) → `biDomain()`.

Optional override still works: `BIOINDEX_DEV=1`, `BIOINDEX_HOST=…` (see root AGENTS.md).

---

## Known pitfalls (do not “fix” without checking)

1. **gene-links schema on bioindex-dev**  
   Dev BioIndex rows have omitted `targetGene` / `targetGeneStart` / `targetGeneEnd` at times (gene may only appear inside `state`, e.g. `chr2:…_STAT1`). Client table/track builders skip rows without `targetGene`/`gene`. Prefer waiting for the data/index fix over a one-off client parser unless product asks for it. Production BioIndex still returns those fields.

2. **Nested tracks, not `trackImplemented`**  
   Gene links / enrichment / etc. render inside the Associations plot stack. `trackImplemented` / `sectionHasCanvasTrack` are largely stale for mounting nested tracks — see Variant Sifter ARCHITECTURE.

3. **Naming**  
   User-facing section is **Gene links** (drawer label + mapping group + data-table column). Internal id remains `variant-to-gene-links`. Prefer not renaming ids without a migration plan.

4. **Branch naming**  
   Avoid `-main` in feature branch names (e.g. use `dk-gp2-browser-project`, not `…-main`).

---

## Where to edit what

| Goal | Prefer |
|------|--------|
| GP2 brand, welcome title, tool name, page header | `GP2Browser.vue`, `src/views/GP2Browser/Template.vue` |
| Any component or module shared with KP Variant Sifter or other projects | Create a new GP2-only file in `gp2Browser/` (e.g. `GP2BrowserMenuBar.vue`) and import it in `GP2Browser.vue` — do **not** edit shared files in `kpVariantSifter/` |
| BioIndex host by hostname | `uiUtils.biDomain()` |

Before editing any file, check whether it is imported by `kpVariantSifter.vue` or another project. If it is shared, fork only that file into `gp2Browser/` for GP2 Browser and keep the original file in its untouched state.

---

## Validation

No dedicated upstream unit-test script. Smoke:

1. `npm run watch` (or build) succeeds  
2. Load `/gp2browser.html` — welcome, phenotype search, associations plot  
3. Gene links: select a tissue; table + track populate against the BioIndex host you expect  
4. Confirm Settings → Information shows **GP2 Browser**

---

## Constraints

- **Shared-file isolation rule:** If any file to be altered is shared with KP Variant Sifter or any other project, create a new GP2-only file in `gp2Browser/` and leave the original shared file untouched.
- Use uppercase `AGENTS.md` for agent docs in this tree  
- Do not invent npm scripts not in root `package.json`  
- Do not open PRs from portal branches targeting `master` with portal-only noise; GP2 page changes that should ship with the portal follow the usual PR flow for this repo  
