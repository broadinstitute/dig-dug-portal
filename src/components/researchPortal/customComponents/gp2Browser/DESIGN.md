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
- **Default visible sections:** `Associations`, `QTL evidences`, and `Genes` (`GP2_DEFAULT_VISIBLE_SECTION_IDS` in `gp2Browser/gp2BrowserSections.js`). `Credible sets`, `Global enrichment`, `Gene links`, and `SNP 2 gene links` are unchecked by default in **Settings → Show / Hide sections**.
- **On-demand section data loading:** Initial search and region extension fetch data only for sections currently checked in **Settings → Show / Hide sections**. Checking an unchecked section in Settings loads its data on demand for the current locus.
- **Suggest Actions setting:** Unchecked (`false`) by default (`GP2BrowserSettingsPanel.vue`); the Actions panel only auto-opens after search/user actions when explicitly enabled in Settings.
- **Load-time association downsampling & 100% zoom refetch:** `gp2Browser/gp2BrowserAssociationsDownsample.js`, `variantSifterAssociationsApi.js`, `GP2BrowserViewportControls.vue`, `GP2BrowserSettingsPanel.vue`, and `GP2Browser.vue`:
  - **0% zoom load-time filter**: As association data is fetched (`fetchAssociations` / `fetchGwasCeAssociations`), rows are immediately downsampled (`downsampleAssociationRowsOnLoad`: 100% of variants with `p <= 0.05` kept, and `p > 0.05` variants kept with probability $(1 - p)^9$, i.e. thrown away when `Math.random() > Math.pow(1 - p, 9)`) and filtered-out rows are discarded so full raw locus arrays are not retained in memory.
  - **100% zoom-in snap**: Positive zoom-in on the Region zoom slider snaps directly to `100%` (`+100` on slider, `regionZoom = 99`).
  - **Settings → Region zoom (`Refetch association data for zoomed-in region`)**: Checked (`true`) by default. When checked, zooming in to `100%` (or panning while zoomed in) refetches full (un-downsampled) association data for the zoomed-in `viewRegion`, reuses existing LD scores from the 0%-zoom load (`applyCachedLdScoresToRows`, no LD server refetch), and restores the 0%-zoom downsampled dataset when zooming back out to `0%`. When unchecked, no association refetch is performed on zoom.
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
