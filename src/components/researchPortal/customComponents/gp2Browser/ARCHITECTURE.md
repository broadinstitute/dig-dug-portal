# GP2 Browser — architecture

Technical overview of **GP2 Browser** in dig-dug-portal. For UI conventions, see [`DESIGN.md`](./DESIGN.md). For agent workflow and pitfalls, see [`AGENTS.md`](./AGENTS.md).

## Shared implementation

GP2 Browser is a thin shell (`../GP2Browser.vue`) that **reuses the KP Variant Sifter component and module tree** under [`../kpVariantSifter/`](../kpVariantSifter/).

This folder keeps GP2-specific notes only. Do not duplicate identical runtime files here.

When a GP2 change touches any module or component shared with KP Variant Sifter or another project, create a new GP2-only file (named `GP2Browser*` / `gp2Browser*`) under `gp2Browser/` and import it from `GP2Browser.vue`; leave the shared file in `kpVariantSifter/` untouched.

For system structure, session model, data flow, and assistant runtime, see [`../kpVariantSifter/ARCHITECTURE.md`](../kpVariantSifter/ARCHITECTURE.md).

## Entry points & GP2-specific components

| Surface | Path | Purpose |
|---------|------|---------|
| Shell component | `../GP2Browser.vue` | Main workspace state, on-demand section data loading, and orchestration |
| Standalone page | `/gp2browser.html` (`src/views/GP2Browser/`) | Standalone entry (`main.js`, `Template.vue`) |
| Research section registration | `ResearchSectionComponents.vue` → `"GP2Browser"` | Multi-page Research portal registration |
| Section registry & GP2 config | `./gp2BrowserSections.js` | Defines `GP2_BROWSER_SECTIONS` (including `qtl-evidences`), `GP2_DEFAULT_VISIBLE_SECTION_IDS` (`["associations", "qtl-evidences", "genes"]`), `GP2_BROWSER_PHENOTYPES` (`Parkinsons`), and `GP2_ASSOCIATIONS_BIOINDEX_HOST` (`https://gp2-dev.hugeampkpnbi.org`) |
| Header menu bar | `./GP2BrowserMenuBar.vue` | **Session** (with recent searches), **Tools** (`Gene prioritization`, `Associated phenotypes`, `Literature evidence`), and **Help** (`Getting Around`) |
| Session parameter bubbles | `./GP2BrowserSessionParamBubbles.vue` | Header session parameter bubbles & popovers using `GRCh38` (`hg38`) gene/rsID resolution and GP2 phenotype dropdown |
| Tools modal | `./GP2BrowserResearchModal.vue` | Modal shell for Tools menu items |
| Welcome panel | `./GP2BrowserWelcomePanel.vue` | GP2-branded welcome search modal with dropdown `<select>` for Phenotype (`Parkinsons`) |
| Canvas | `./GP2BrowserCanvas.vue` | Workspace track stage mounting `GP2BrowserWelcomePanel` and `GP2BrowserAssociationsPlot` |
| Section drawers | `./GP2BrowserSectionDrawers.vue` | Left drawer rail and panels (including `QTL evidences` drawer) |
| QTL drawer & table | `./GP2BrowserQtlDrawer.vue`, `./GP2BrowserQtlTable.vue`, `./gp2BrowserQtlApi.js` | Type/tissue selection, p-value filter, and QTL association table. Loads `qtl-associations` for the 50 kb viewing region when the drawer closes with at least one type and one tissue |
| Associations plot | `./GP2BrowserAssociationsPlot.vue` | Dual-track Associations stack (20%-height searching region plots first, 100%-height 50 kb viewing region plots second). Nested tracks follow the 50 kb `viewRegion`; the genes track stays on the searching region |
| Association region plot | `./GP2BrowserAssociationRegionPlot.vue` | Compact 20% height (`24px`), 50 kb handle (50% blue, full blue on hover/drag, gene symbols inside the handle), bridge bracket to the viewing plot, and viewing-window panning |
| Viewing region helpers | `./gp2BrowserViewingRegion.js` | Fixed 50 kb (`±25 kb`) viewing window calculation (`computeGp2ViewingRegion`, `clampViewingCenterBp`, `extractVariantPositionBp`) |
| Associations downsampler | `./gp2BrowserAssociationsDownsample.js` | Load-time association downsampling (`downsampleAssociationRowsOnLoad`: `p <= 0.05` kept in full; `p > 0.05` kept with probability $(1 - p)^9$) and zoomed-in row merging with cached LD score reuse (`mergeZoomedAssociationRows`, `stripZoomRefetchedRows`) |
| LD server client | `./gp2BrowserLdServer.js` | GP2-specific UMich 1000G LD client configured for `GRCh38` (`hg38`) |
| Genes & recombination client | `./gp2BrowserGenesAndRecomb.js` | `GRCh38` (`hg38`) region gene track query (`source in 1`), gene-symbol-to-region resolver, and recombination rate client (`id in 16`) |
| Settings panel | `./GP2BrowserSettingsPanel.vue` | GP2-branded Settings modal (`Suggest Actions` unchecked by default; `Refetch association data for zoomed-in region` checked by default; section checkboxes drive on-demand data loading) |
| Viewport controls | `./GP2BrowserViewportControls.vue` | Header zoom/pan/table/actions/settings toolbar (positive zoom-in snaps to `100%`) |
| Actions panel | `./GP2BrowserAiAssistantPanel.vue` | GP2-branded Actions / AI assistant side panel |

## GP2 data-loading & rendering architecture

1. **Settings-driven on-demand data loading (`GP2Browser.vue`)**:
   - Default checked sections on startup: `associations`, `qtl-evidences`, `genes`.
   - `loadInitialSearchData`, `syncRegionDataToView` (region extension), and additive phenotype/ancestry loaders only query BioIndex for sections currently checked in `visibleSectionIds`.
   - Per-section loaded region trackers (`lastAssociationsRegion`, `lastGenesRegion`, `lastCredibleSetsListRegion`, `lastGlobalEnrichmentRegion`, `lastV2gCatalogRegion`, `lastS2gRegion`) record which genomic region each feature has loaded.
   - When a user checks a previously unchecked section in Settings (`onVisibleSectionIdsUpdate` → `loadDataForCheckedSections`), `GP2Browser.vue` immediately fetches the missing data for the active locus region.

2. **Load-time association downsampling & 100% zoom refetch (`gp2BrowserAssociationsDownsample.js`, `variantSifterAssociationsApi.js`, & `GP2Browser.vue`)**:
   - **0% zoom load-time filter**: `fetchAssociations` and `fetchGwasCeAssociations` run `downsampleAssociationRowsOnLoad` as soon as BioIndex pages complete, keeping 100% of variants with `p <= 0.05` and keeping `p > 0.05` variants when `Math.random() <= Math.pow(1 - p, 9)`. Filtered-out rows are immediately discarded so full raw locus arrays are never retained in memory.
   - **100% zoom snap**: Dragging the Region zoom slider to any positive zoom-in value snaps directly to `100%` (`+100` on slider, `regionZoom = 99`).
   - **Optional zoomed-in region refetch (`refetchAssociationsOnZoom`)**: Controlled by **Settings → General → Region zoom → Refetch association data for zoomed-in region** (checked by default). When enabled and zoomed to `100%` (including after panning while zoomed in), `refetchAssociationsForZoomedView()` fetches un-downsampled (`{ downsample: false }`) association rows for `viewRegion`, copies cached LD scores from the 0%-zoom rows (`applyCachedLdScoresToRows`, without calling the LD server), and tags zoomed-only rows with `_zoomRefetched: true`. Returning to `0%` zoom (or unchecking the setting) strips `_zoomRefetched` rows (`stripZoomRefetchedRows`) to restore the 0%-zoom baseline.
