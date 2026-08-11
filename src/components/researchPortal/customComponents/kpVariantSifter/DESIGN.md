# KP Variant Sifter — design rules

This document captures UI and product conventions for **KP Variant Sifter** in dig-dug-portal. Use it when adding or changing files under `kpVariantSifter/` and `kpVariantSifter.vue`.

For system structure, session model, data flow, and assistant runtime, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) in this folder.

Visualizer / track conventions for agents also live in `.cursor/rules/kp-variant-sifter-visualizers.mdc` when present in the workspace.

---

## Product model

- **Canvas-first** locus workspace, not a linear stepper. The shared genomic plot stack is home.
- **Search → explore → map.** Users pick phenotype / ancestry / locus, then explore associations and related evidence on aligned tracks, optionally map variants across sections.
- **No forced end state** — exploration stays open-ended; export a session or HTML report when useful.
- **Single persistence concept for full work:** session JSON (`app: kp-variant-sifter`, schema v10). Recent searches are a lightweight localStorage list (≤5), not full sessions.
- **Parent-owned state.** `kpVariantSifter.vue` owns search session and all data layers; children emit intents and receive props.

### Top bar (left → right)

| Area | Role |
|------|------|
| **Brand** | KP mark + “Variant Sifter” title |
| **Search** | Reset search; Recent searches (≤5) |
| **Import / Export** | Import session, Export session, Export HTML report |
| **Help** | Getting Around (workspace guide) |
| **Session label** | Current phenotype / ancestry / region (when searching) |
| **Viewport controls** | Region zoom slider, data table, Actions (assistant), Settings |

Settings and Actions live in **viewport controls**, not the menu bar.

### Welcome

- First visit / after reset shows the **Welcome** panel on the canvas (`VariantSifterWelcomePanel`).
- Search & select: phenotype typeahead, ancestry, locus (gene / rsID / region), optional region expand, Import session.
- Optional **project** (Default KP / GIANT / **GWAS-CE**) changes BioIndex host and search fields — see `variantSifterProjects.js`.
- **GWAS-CE:** Welcome shows **Token** (for associations) plus **Phenotype** and **Ancestry** (for GE / credible sets / companion layers on the portal BioIndex). Region is still required via the gene/variant/region field.

### Projects

| Id | Label | Search UI | BioIndex | Scope |
|----|-------|-----------|----------|-------|
| `""` | Default (KP) | Phenotype + Ancestry | Portal host | Full sections |
| `giant` | GIANT | Curated phenotypes + ancestries | `https://giant.hugeampkpnbi.org` | Subset of indexes on Giant; others fall back to portal |
| `gwas-ce` | GWAS-CE | **Token** + Phenotype + Ancestry | `https://gwas-ce.kpndataregistry.org/bioidx` for associations; portal host for other indexes | Associations via token; GE/CS/genes/etc. via selected phenotype |

**GWAS-CE query shape:** associations index `associations-{token}`, `q={token},{chr:start-end}`, `fmt=row`, via **HTTP GET**. Phenotype/ancestry drive portal BioIndex layers (GE, credible sets, …). Do **not** put the token in the page URL. Session / HTML export replaces the token with `$token`. Skip per-ancestry association availability probes (token series is not multi-ancestry associations).

### Canvas vs drawers

- **Canvas** (`VariantSifterCanvas` → `VariantSifterAssociationsPlot`) is the primary surface: association region plot plus **nested** tracks (credible sets, GE annotations, V2G/S2G, genes) sharing one x-axis.
- **Section drawers** (`VariantSifterSectionDrawers`) open from the right rail for filters and selection (open width `--vks-drawer-open-width: 75vw`).
- Data table, Settings, and Actions are overlays/panels — not the primary stage.

### Sections (registry)

Order and labels live in `variantSifterSections.js`:

| Section id | Drawer | Canvas track |
|------------|--------|--------------|
| `associations` | Filters, LD, ancestry, mapping bar | Top-level association + LD plot |
| `credible-sets` | Select sets | Nested under Associations when sets selected |
| `global-enrichment` | Annotations / tissues / biosamples | Nested annotations workspace track when data present |
| `variant-to-gene-links` | Tissue / link selection | Nested V2G track when loaded |
| `snp2gene-links` | Manual Load / Clear | Nested track (reuses V2G track shell) when loaded |
| `genes` | Gene-type filters | Nested genes track |

**Visibility** is controlled in Settings → `visibleSectionIds` (default: all section ids). Nested tracks also require their data/selection gates inside `VariantSifterAssociationsPlot.vue`.

> **Gotcha:** `trackImplemented` on the registry and `VariantSifterTrackStrip` are largely stale. Real stacking is nested inside the Associations plot. Do not add a new top-level track strip without updating `sectionHasCanvasTrack` and the plot stack together — prefer the nested pattern.

### Mapping (associations ↔ evidence)

Mapping has **three layers** (`variantSifterMappingData.js`). Mapping / workspace filter must never mutate layers 1 or 2:

1. **Raw workspace data** — association rows, CS variants, GE `annoData`, V2G/S2G `tissueData`, biosample caches, …
2. **Mappable option state** — chips from track selections; `mappingState.selectedCategoryIds` + And/Or mode
3. **Derived filter** — optional `workspaceMappingFilter` when “Filter workspace to mapped data” is on

UI: `VariantSifterMappingBar` in the Associations drawer and Data table modal. Extra table columns: Cred. sets, Annotation/Biosample Overlap, V2G, S2G.

### Plot markers

- **Starred variants** and **position markers** live in `plotMarkersState` and render across tracks via `variantSifterPlotMarkers.js` / `renderPlotMarkerLines()`.
- Dot menus and tooltips must stay inside their plot container (`variantSifterPopupPosition.js`) so they never sit under drawer tabs or off-screen.

### Region navigation (user-facing)

| Control | Meaning |
|---------|---------|
| **Search region** | Original locus from the search |
| **Zoom in** | Magnify within the active loaded region |
| **Zoom out** | Expand beyond the search region (capped; see Architecture) |
| **Pan / shift** | Slide the active window along the chromosome |
| **Zoom-center marker** | Bias the zoomed-in view (`regionViewArea`) |

Users think in locus + zoom; internals split search / active / view regions — see `ARCHITECTURE.md`.

### Actions (assistant)

- Panel: Request + Actions tabs (`VariantSifterAiAssistantPanel`).
- **Today:** keyword-matched catalog actions (commands + research steps). Not a full Canvas-style LLM planner yet (`matchVksAssistantRequest` can be replaced later).
- **Commands** run immediately (export/import, reset, zoom, open drawers, …).
- **Research** steps (`filter_ge_relevance`, `find_understudied_bottom_line`, `find_genetic_correlations`) may create a short plan and Execute / Execute all.

---

## Visual design

### Borders

**Do not use borders for grouping content.** Borders are visual noise in most cases.

- Prefer spacing, typography, and background tints only when hierarchy needs it.
- Use borders only for affordance or structure (modal shell, inputs, floating menus, drawer chrome).
- Do **not** add decorative borders around canvas plots, tracks, or drawer content areas.
- Buttons/chips may use `--cfde-border` as a control outline — that is structural, not decorative grouping.

### Typography

- **Minimum font size for readable UI copy: `13px`.** Do not go below 13px for labels, body text, meta lines, or button labels.
- Shared chrome in `vksSharedStyles.css` uses 13px for tabs, buttons, and section titles; chips may use 12px only for dense chip labels when already established.
- Headings and brand text may be larger.

### Color (CFDE Knowledge Center palette)

Define and consume tokens on `.kp-variant-sifter-workspace` (`vksSharedStyles.css`) so children inherit:

| Token | Value | Use |
|-------|-------|-----|
| `--cfde-orange` | `#e07b39` | Brand accent, primary actions |
| `--cfde-orange-dark` | `#c2662b` | Hover / emphasis |
| `--cfde-orange-soft` | `#fbeee3` | Soft highlights |
| `--cfde-blue` | `#2c5c97` | Titles, secondary emphasis |
| `--cfde-border` | `#e6e1d6` | Structural borders only |
| `--cfde-bg` | `#ffffff` | Surfaces |
| `--cfde-header-bg` | `#f6f5f2` | Header / muted fills |
| `--cfde-ink` | `#33363d` | Body text |
| `--cfde-muted` | `#6b6b6b` | Secondary text |
| `--vks-danger` / `--vks-danger-bg` | `#b42318` / `#fdebec` | Destructive / errors |

Layout tokens: `--vks-drawer-open-width` (75vw), `--vks-drawer-tab-width` (30px), `--vks-header-height` (53px), radii sm/md.

Font stack: `"Inter", "Segoe UI", system-ui, -apple-system, sans-serif`.

### Modals / panels

- Backdrop + elevation; avoid heavy bordered “cards inside cards.”
- Section separation via vertical rhythm (`gap`), not outlined boxes.
- Prefer shared classes in `vksSharedStyles.css` (`.vks-ui-btn`, `.vks-ui-tabs`, …) over one-off styles.

---

## Persistence tiers

| Action | Storage | Contents |
|--------|---------|----------|
| **Export session** | JSON download | Full layers when available. `version` 10, `app` `kp-variant-sifter`. **GWAS-CE:** token replaced with `$token` everywhere in the payload. |
| **Import session** | JSON file | Restores snapshot; may skip live API when `importedFromSnapshot` is complete. GWAS-CE exports with `$token` are view-only for re-fetch. |
| **Export HTML report** | Self-contained HTML | Canvas PNG snapshots + mapping options + mapped variants table (read-only). **GWAS-CE:** token redacted to `$token`. |
| **Recent searches** | Browser `localStorage` | Phenotype / region / ancestry / project / sub-ancestries / timestamp — full token is stored for GWAS-CE so re-run works; labels show `GWAS-CE` not the token. |

**Not persisted:** assistant thread, panel open flags (except what session UI snapshot covers), region-load progress bubble, chrome pin geometry, LLM health.

**Export readiness:** `validateSessionExportReady` blocks while visible layers are still loading and requires associations + genes track ready. Extend the validator when adding new loadable layers that must finish before export.

When adding persistable state:

1. Snapshot in `variantSifterSession.js` (and bump `VKS_SESSION_VERSION` + support list if shape changes).
2. Normalize on import.
3. Keep recent-search shape separate and small.

---

## Code layout (quick map)

See **`ARCHITECTURE.md`** for hierarchy, data flow, and module tables.

| Path | Purpose |
|------|---------|
| `../kpVariantSifter.vue` | Shell: header, canvas, drawers, session, fetches, assistant |
| `VariantSifterMenuBar.vue` | Search / Import·Export / Help |
| `VariantSifterViewportControls.vue` | Zoom, data table, Actions, Settings |
| `VariantSifterCanvas.vue` | Welcome vs plot stage + data table modal |
| `VariantSifterAssociationsPlot.vue` | Nested track stack (x-aligned) |
| `VariantSifterSectionDrawers.vue` | Right-rail drawers for all sections |
| `VariantSifterAiAssistantPanel.vue` | Actions assistant UI |
| `VariantSifterMappingBar.vue` | Mapping chips + filter toggle |
| `variantSifterSections.js` | Section registry |
| `variantSifterSession.js` | Export / import + readiness |
| `variantSifterProjects.js` | Default vs GIANT project routing |
| `variantSifterMappingData.js` | Three-layer mapping model |
| `variantSifterAssistantActionCatalog.js` | User-facing Actions catalog |
| `vksSharedStyles.css` | Tokens + shared chrome |

Registration: `ResearchSectionComponents.vue` case `'kpVariantSifter'`. Portal section JSON uses `"component": "kpVariantSifter"`.

---

## Visualizers (required pattern)

When adding a new visualizer or track:

**Do**

- Add a new `VariantSifter*.vue` under this folder
- Extract non-trivial canvas/render logic into a sibling `variantSifter*.js` module
- Wire visibility via `variantSifterSections.js` + nested stack in `VariantSifterAssociationsPlot.vue` (or parent layout as appropriate)
- Reuse `variantSifterPlotShared.js`, region zoom/pan helpers, `VARIANT_SIFTER_PLOT_MARGIN`
- Accept `sharedCanvasWidth` so x-axis alignment stays correct
- Accept `plotMarkers` and call `renderPlotMarkerLines()` after the main draw
- Clamp menus/tooltips with `variantSifterPopupPosition.js`

**Do not**

- Modify `ResearchGenesTrack.vue`, `ResearchRegionPlot.vue`, or other legacy `researchPortal/` visualizers for VS features
- Add VS-only props/hacks to shared portal components
- Fork behavior inside an existing VS visualizer when the feature is a distinct track — give it its own component

Reference pattern: `VariantSifterGenesTrack.vue` + `variantSifterGenesTrackRender.js`.

---

## Implementation checklist (new UI)

- [ ] No sub-13px readable UI copy
- [ ] No decorative borders on plots / content groups
- [ ] Uses CFDE / VKS CSS variables from `.kp-variant-sifter-workspace`
- [ ] New tracks are VS-local components + sibling render modules
- [ ] Plot markers and popup clamping wired for new tracks
- [ ] Mapping layers respected (do not mutate raw data or chip state from the derived filter)
- [ ] Persistable fields added to session export/import + version bump if needed
- [ ] BioIndex calls go through existing `variantSifter*Api.js` / `bioIndexUtils` with `bioIndexHostFor(index)` for project routing

---

## Changelog

| Date | Note |
|------|------|
| 2026-08-11 | Initial DESIGN.md for agent handoff (canvas-first VS rebuild on `dk-ai-based-VS`) |
| 2026-08-11 | GWAS-CE: Token + Phenotype + Ancestry; associations via token, companion layers via phenotype on portal BioIndex |
| 2026-08-11 | GWAS-CE: skip ancestry-association availability probes; LD falls back past I/D lead variants |
