# GP2 Browser — design rules

GP2 Browser reuses KP Variant Sifter runtime code under [`../kpVariantSifter/`](../kpVariantSifter/) for unchanged functionality, but **any file that needs GP2-specific changes and is shared with another project must be forked into `gp2Browser/`** (leaving the shared file untouched).

| Doc | Role |
|-----|------|
| [`AGENTS.md`](./AGENTS.md) | How agents should work in this project (entry points, pitfalls, edit map) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Shared-vs-fork structure and surfaces |
| [`../kpVariantSifter/DESIGN.md`](../kpVariantSifter/DESIGN.md) | Shared workspace UI conventions |

Visualizer / track conventions for agents also live in `.cursor/rules/kp-variant-sifter-visualizers.mdc` when present in the workspace.

---

## Product model

Same canvas-first locus workspace as KP Variant Sifter (search → explore → map; session export; Actions / Settings). GP2 only changes **branding and page chrome**, not the core interaction model.

---

## GP2 shell differences

- **Entry:** `../GP2Browser.vue` (research section `GP2Browser`; standalone `/gp2browser.html`)
- **Brand:** GP2 mark + “Browser”; welcome title “Welcome to GP2 Browser”; all user-facing strings use “GP2 Browser” (no “Variant Sifter” references across welcome panel, settings panel, viewport controls, or Actions assistant)
- **Menu bar:** `gp2Browser/GP2BrowserMenuBar.vue` — **Session** (`New session`, `Import session`, `Export session`, `Export HTML report`, plus up to 5 recent searches), **Tools** (`Gene prioritization`, `Associated phenotypes`, `Literature evidence` — each opens `GP2BrowserResearchModal.vue`), and **Help** (`Getting Around`)
- **Phenotype selector & GP2 associations BioIndex:** `GP2BrowserWelcomePanel.vue` uses a `<select>` dropdown for **Phenotype** populated from `GP2_BROWSER_PHENOTYPES` (currently `Parkinsons` only, preselected by default; extensible in `gp2Browser/gp2BrowserSections.js`). Association queries target `GP2_ASSOCIATIONS_BIOINDEX_HOST` (`https://gp2-dev.hugeampkpnbi.org`, e.g. `/api/bio/query/associations?q=Parkinsons,1:52100000-52200000`).
- **Genome build (`GRCh38` / hg38):** GP2 Browser uses `GRCh38` across all genomic services:
  - UMich 1000G LD server queries (`gp2Browser/gp2BrowserLdServer.js` → `/ld/genome_builds/GRCh38/...`)
  - Genes track & gene search resolution (`gp2Browser/gp2BrowserGenesAndRecomb.js` → UMich portaldev `annotation/genes/?filter=source in 1...`)
  - Recombination rate overlay (`gp2Browser/gp2BrowserGenesAndRecomb.js` → UMich portaldev `annotation/recomb/results/?filter=id in 16...`)
- **Default visible sections:** `Associations`, `QTL evidences`, and `Genes` (`GP2_DEFAULT_VISIBLE_SECTION_IDS` in `gp2Browser/gp2BrowserSections.js`). `Credible sets`, `Global enrichment`, `Gene links`, and `SNP 2 gene links` are unchecked by default in **Settings → Show / Hide sections**.
- **QTL evidences drawer & plot:** `gp2Browser/GP2BrowserQtlDrawer.vue`, `gp2Browser/GP2BrowserQtlTable.vue`, `gp2Browser/GP2BrowserQtlRegionPlot.vue`, `gp2Browser/gp2BrowserQtlApi.js`, `gp2Browser/gp2BrowserQtlPlotData.js`. Unlike Associations/Genes, QTL data is **not** preloaded with the rest of the searching-region sections — fetching every type/tissue combination up front doesn't scale as more types and tissues are added. Raw `qtl-associations` rows for the whole searching region (from `GP2_ASSOCIATIONS_BIOINDEX_HOST`) only start loading once the user has checked at least one **Type** and one **Tissue** in the drawer (`eQTL`, `Cortex`, both unchecked by default). `qtlState` keeps **both** the true raw response (`rawRows`) and a load-time-downsampled snapshot computed once right after fetch (`downsampledRows`, via `downsampleAssociationRowsOnLoad`) — the drawer table and the searching-region plot use `downsampledRows`; the 50 kb viewing-region plot uses `rawRows` (undownsampled), mirroring how Associations shows raw data in its viewing plot. The **QTL evidences** section (header, drawer table, and plot) stays entirely hidden — no placeholder — until that first type+tissue selection is made and loading begins. Once loaded, the drawer's type/tissue/**Filter / Setting** (optional maximum p-value, plus a **Genes** checklist — options are every gene present in the type/tissue-filtered rows; leaving all unchecked shows every gene, checking one or more narrows the table and both QTL plots to just those genes) selections are applied entirely client-side — no further network call is tied to opening/closing the drawer or to changing a type/tissue/gene box. The drawer table shows the downsampled searching-region rows (not restricted to the 50 kb viewing region) plus any QTL-starred variant that would otherwise be missing (`addMissingStarredQtlRows` — starring overrides type/tissue/p-value filtering, since it's an explicit user pin). The table has a star column (header toggles "starred only"; each row can star/unstar, same as the Associations drawer table) and columns Variant, P-value, Beta, Var Beta, Std ERR, EAF, MAF, Gene, Tissue (`region`), Ancestry, and Dataset; Beta and Var Beta are colored by sign (`#048845` positive / `#ee3124` negative), and table settings (rows per page, columns, CSV/JSON) sit on the table. The QTL plot renders like Associations (same searching/viewing dual-track idea, same `~31%`-alpha dot opacity as the Associations LD dot colors, same gray recombination-signal highlight bands reusing the already-loaded `recombPeakIntervals` — no new fetch) except: no LD scores and no recombination-rate *line* (or its right-side axis) are drawn for QTL, and dots are colored by the direction of the effect (beta, `#048845`/`#ee3124` positive/negative at the same alpha) instead of LD r2. Clicking a QTL dot opens the same dot menu as Associations (set reference variant / star), reusing `VariantSifterVariantDotMenu.vue` unmodified — the emitted row is the full raw QTL row with an injected `"Variant ID"` (`qtlVariantLabel(row)`) so the shared `toggleStarredVariant`/`rowToLdVariant`/`onSetReferenceVariant` handlers work without modification; QTL stars are tagged `source: "qtl"` (`onToggleQtlStarVariant` in `GP2Browser.vue`) so the table/plot reinsertion logic can tell them apart from Associations stars. The QTL searching plot has its own draggable 50 kb view-region handle, styled identically to (and kept in sync with) the Associations handle — see **Viewing handle** below.
- **On-demand section data loading:** Initial search and region extension fetch data only for sections currently checked in **Settings → Show / Hide sections**. Checking an unchecked section in Settings loads its data on demand for the current locus.
- **Suggest Actions setting:** Unchecked (`false`) by default (`GP2BrowserSettingsPanel.vue`); the Actions panel only auto-opens after search/user actions when explicitly enabled in Settings.
- **Dual-track associations & 50 kb (`±25 kb`) viewing region:** `gp2Browser/gp2BrowserViewingRegion.js`, `gp2Browser/GP2BrowserAssociationRegionPlot.vue`, `gp2Browser/GP2BrowserAssociationsPlot.vue`, and `GP2Browser.vue`:
  - **Searching region plots (rendered first, grouped across all `phenotype × ancestry` series)**: Uses the load-time filtered dataset (`p <= 0.05` kept 100%, `p > 0.05` kept with probability $(1 - p)^9$), rendered at **20% height** (`displayHeight = 24px`) with a draggable **50 kb viewing region indicator / handle**.
  - **Viewing region plots (rendered second, grouped across all `phenotype × ancestry` series)**: Fixed **50 kb (`±25 kb`)** window initially centered around the reference variant (`refVariant`), rendered at 100% height (`displayHeight = 120px`) with raw (un-downsampled) association data and cached `GRCh38` LD scores.
  - **Other tracks (Credible sets, Global enrichment, Gene links, SNP 2 gene links)**: Aligned to the 50 kb `viewRegion`. The **Genes** track stays on the searching region (also pinned/docked at the bottom of the whole plot stack). **QTL evidences** has its own dual-track pair (searching + viewing) instead, mirroring Associations.
  - **Viewing handle:** Solid bar under the axis ticks, side edges `0.5px`, default `rgba(59,115,185,0.5)`, hover/drag `#3b73b9`. Both the Associations searching plot and the QTL searching plot render their own instance of this handle, driven by the same shared `viewingCenterBp`, so dragging either one moves every viewing-region plot in sync. The handle itself carries no gene/exon annotation.
  - **Bridge hairline:** A thin, full-plot-width three-sided connector (`gp2-view-region-bridge`) sits at the bottom of each searching plot's canvas, between the handle and whatever renders below (e.g. the Genes track). It carries collapsed exon marks (`computeBridgeExonMarks` in `gp2BrowserRegionPlotAxis.js`) for genes overlapping the 50 kb viewing region, stretched across the bridge's full width using the *viewing region's own scale* (the same scale as the 100%-height viewing plot directly beneath it) rather than the wider searching-region scale — one line, no per-gene lanes, overlapping exons from different genes simply layer on top of each other. A single vertical hairline (`gp2-view-region-connector`) runs from the bottom of the handle down to this bridge line, visually tying the 50 kb highlighted sub-range to the collapsed, zoomed-in exon line below it. Below the bridge, italic gene-symbol labels (`gp2-view-region-bridge-genes`, via `filterGenesOverlappingRegion`) name the same viewing-region-overlapping genes.
  - **Zoom level:** The old continuous "Region zoom" slider (searching-region zoom-out/zoom-in) is replaced in the top bar by a **Zoom level:** dropdown (`GP2BrowserViewportControls.vue`) choosing the 50 kb (default) / 25 kb / 10 kb **viewing-region width** (`viewingRegionWidthBp` in `GP2Browser.vue`, threaded as `viewingRegionHalfWidthBp` to every `computeGp2ViewingRegion`/`clampViewingCenterBp` call across `GP2Browser.vue`, `GP2BrowserAssociationRegionPlot.vue`, and `GP2BrowserQtlRegionPlot.vue`). `regionZoom`/`regionZoomOut` state itself is unchanged and still used for searching-region panning, but nothing in the UI sets it away from `0` anymore, so the 100%-zoom snap and "Refetch association data for zoomed-in region" Setting are effectively dormant (not removed, since `regionZoom`/`regionZoomOut` are woven through session export/restore and the AI Assistant's zoom action).
- **Settings → Information:** `toolName="GP2 Browser"`
- **Page chrome:** GP2 project header on `/gp2browser.html` (logo linking to https://gp2.broadinstitute.org/) — no portal `PageHeader` / `PageFooter`
- **Table & tooltip styling:** `/gp2browser.html` imports `/css/effectorGenes.css` and `/css/tooltipDocumentation.css` (plus scoped `.research-data-table` and `.byor-tooltip` rules in `GP2Browser.vue`) so drawer data tables and header tooltips render identically to Research Portal pages.
- **LLM:** shared Variant Sifter GE relevance path uses Bedrock (`@/utils/llmClient` → `https://llm.hugeamp.org/bedrock`)

---

## Naming (user-facing)

| Surface | Label |
|---------|--------|
| Drawer tab / section registry | **Gene links** (`id`: `variant-to-gene-links`) |
| Plot section title | Prefer **Gene links** (may still say “Variant-to-gene links” in older shared plot headers — update when touching that UI) |
| Data table mapping group | **Gene links** |
| Data table column | **Gene links** (constant `VKS_V2G_COLUMN`) |
| Mapping chip prefix | Still may use `V2G : …` unless product asks to rename |

Do not rename the internal section id without coordinating session / mapping / settings visibility.

---

## Visual / layout

Follow Variant Sifter DESIGN for drawers, track stack, Actions panel, and Settings tabs. GP2-specific CSS for the standalone header lives in `src/views/GP2Browser/Template.vue` (`.gp2-project-header*`). Keep the first canvas welcome composition consistent with VS; only swap brand strings and chrome.
