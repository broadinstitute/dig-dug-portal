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
- **QTL evidences drawer:** `gp2Browser/GP2BrowserQtlDrawer.vue` has **Type / Tissue** (`eQTL`, `Cortex`, both unchecked) and **Filter / Setting** (optional maximum p-value). Data loads when at least one type and one tissue are selected and the drawer closes, querying `qtl-associations` on `GP2_ASSOCIATIONS_BIOINDEX_HOST` for the 50 kb viewing region (`chr:start-end` only; type and tissue are filtered client-side). The drawer table columns are Variant, P-value, Beta, Var Beta, Std ERR, EAF, MAF, Gene, Tissue (`region`), Ancestry, and Dataset. Beta and Var Beta are colored by sign. Table settings (rows per page, columns, CSV/JSON) sit on the table.
- **On-demand section data loading:** Initial search and region extension fetch data only for sections currently checked in **Settings → Show / Hide sections**. Checking an unchecked section in Settings loads its data on demand for the current locus.
- **Suggest Actions setting:** Unchecked (`false`) by default (`GP2BrowserSettingsPanel.vue`); the Actions panel only auto-opens after search/user actions when explicitly enabled in Settings.
- **Dual-track associations & 50 kb (`±25 kb`) viewing region:** `gp2Browser/gp2BrowserViewingRegion.js`, `gp2Browser/GP2BrowserAssociationRegionPlot.vue`, `gp2Browser/GP2BrowserAssociationsPlot.vue`, and `GP2Browser.vue`:
  - **Searching region plots (rendered first, grouped across all `phenotype × ancestry` series)**: Uses the load-time filtered dataset (`p <= 0.05` kept 100%, `p > 0.05` kept with probability $(1 - p)^9$), rendered at **20% height** (`displayHeight = 24px`) with a draggable **50 kb viewing region indicator / handle**.
  - **Viewing region plots (rendered second, grouped across all `phenotype × ancestry` series)**: Fixed **50 kb (`±25 kb`)** window initially centered around the reference variant (`refVariant`), rendered at 100% height (`displayHeight = 120px`) with raw (un-downsampled) association data and cached `GRCh38` LD scores.
  - **Other tracks (QTL evidences, Credible sets, Global enrichment, Gene links, SNP 2 gene links)**: Aligned to the 50 kb `viewRegion`. The **Genes** track stays on the searching region.
  - **Viewing handle:** Solid bar under the axis ticks, side edges `0.5px`, default `rgba(59,115,185,0.5)`, hover/drag `#3b73b9`. Overlapping gene symbols are plain italic text inside the handle. A bracket links the handle on the last searching plot to the viewing plot.
  - **Region zoom slider**: Kept in the top bar for expanding the searching region (`regionZoomOut`).
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
