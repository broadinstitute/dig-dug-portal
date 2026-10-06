# LIGER v1

The original LIGER browser — complete and working, but **no longer the version mounted on the LIGER
page**. `src/views/LIGER/main.js` now renders `v2/CellEvolutionBrowser.vue`. v1 is kept as the reference
implementation for how these endpoints are queried and assembled, and as the fallback if v2 needs to be
backed out.

Read `../README.md` first — the endpoints, host resolution, tissue/dataset mapping and field semantics
are shared by every version and are documented there, not here. This file covers only v1's own files,
config contract and interface behavior.

## Files

- `LigerBrowser.vue`
  - Entry component and the only thing outside this folder should import. Data loading, scope state, the
    tissue / cell-type / state / program cards.
- `StateDetails.vue` / `ProgramDetails.vue`
  - Detail panel bodies. Presentational; the parent builds their `content`.
- `HeatTable.vue`
  - The matrices: a table whose numeric columns are heat-colored, each on its own scale.
- `ligerDetails.css`
  - Detail-panel styling, pulled into the detail components with `<style scoped src>`.

Shared, from the root:

- `../ligerFormat.js` — number formatting
- `../ligerHeat.js` — heat colors
- `../CellStateInfographic.vue` — the header figure, now shared with v2. Rendered here with the
  `thumbnail` prop beside the headline. **It is no longer v1's to change alone** — edits land on the v2
  page too.

## Component Config

`LigerBrowser.vue` accepts an optional `config` object for small per-page overrides.

Current supported keys:

- `pageTitle`
  - Overrides the hero title.
  - Default: `Cell State & Program Explorer`
- `documentationUrl`
  - Overrides the `Read Documentation` link target.
  - Default: `/research.html?pageid=kp_liger_documentation`
- `prodHost`
  - Bioindex serving the LIGER indexes on production pages.
  - Default: `https://bioindex.hugeamp.org`
- `devHost`
  - Bioindex serving the LIGER indexes on local / dev pages.
  - Default: `https://bioindex-dev.hugeamp.org`
  - Trailing slashes are trimmed on both, so `https://host` and `https://host/` work.
  - Neither affects `/api/portal/phenotypes` or `/api/bio/match/gene` — see the API Host section.
- `primaryColor`
  - The main accent: buttons, links, bars, selected chips. Overrides the `--blue` CSS variable within
    the component root.
  - Default: `#0277b6`
- `secondaryColor`
  - The secondary accent: detail-panel badges, filter notes, section labels.
  - Default: `#175cd3`
  - Both are set as CSS variables on the `#liger` root in the `themeStyle()` computed, so they reach
    `StateDetails` / `ProgramDetails` / `HeatTable` and `ligerDetails.css` by inheritance despite those
    styles being scoped. The category palette inside `CellStateInfographic.vue` is deliberately
    untouched — its `--blue` is one of four categorical colors, not an accent.
- `tissues`
  - Optional allowlist of tissue keys to expose in results.
  - Example values: `["liver"]`, `["liver", "pancreas"]`
  - If omitted or empty, all tissues are shown.
- `exampleGenes`
  - Genes offered as one-click examples on the landing state.
  - Default: `["PPARG", "PCSK9", "INS"]`
  - Set to `[]` to hide the row. The defaults are not verified to exist in every portal's data — override per page where they do not.
- `hideTissueCardIfOneOption`
  - Controls the one-tissue layout case.
  - Default: `false`
  - When only one tissue is available, that tissue is auto-selected.
  - If this flag is `true`, the tissue step's card is hidden in that one-option case. The scope bar still
    reports the tissue.

Example:

```js
config: {
  pageTitle: "Liver Cell State Explorer",
  documentationUrl: "/research.html?pageid=my_docs",
  prodHost: "https://bioindex.pankbase.org",
  devHost: "https://bioindex-dev.pankbase.org",
  primaryColor: "#0277b6",
  secondaryColor: "#175cd3",
  tissues: ["liver", "pancreas"],
  hideTissueCardIfOneOption: true,
}
```
## v1 Constraints

Version-wide constraints live in `../README.md`. These are v1's own:

- Maintain the structure and visual language already established in `LigerBrowser.vue`. v1 is in
  maintenance — new presentation ideas belong in a new version folder, not here.
- Progressive disclosure matters, and it hides rather than overlays:
  - Search gene first
  - Then show tissues
  - Then show cell-type expression after tissue selection
  - Then show cell-state / gene-program sections only after cell-type selection
  - A downstream section is not rendered at all until its prerequisite is chosen. The old
    `card-overlay` "Select a Cell Type" placeholders are gone; `card-overlay` is now only
    a loading state.

## Current UI Behavior

### Page states

The page has two macro states, driven by whether a gene is selected.

**Landing** (`isLandingState`, i.e. no gene):

- title, task-focused description, documentation link, AI disclosure
- the infographic, expanded
- the Search layer, open; no other layer rendered
- no results of any kind

**Exploration** (a gene is selected):

- the infographic collapses (`:collapse="!isLandingState"`)
- the Search layer collapses to the gene name plus `Change gene`
- the remaining layers appear one level at a time

### The four layers

The page is organized as a numbered path of four sibling layers below the infographic. They share one
shape (`.liger-layer` + `.layer-head` + `.layer-body`), so the page reads as a sequence rather than as
four unrelated cards. Each head is a numbered pill, an uppercase name, and a **subtitle saying what that
layer covers**:

| # | Layer | Subtitle | Gate |
|---|---|---|---|
| 1 | Search | `Which gene do you want to explore?` | always |
| 2 | Scope | `Select a tissue and cell type to see associated states and programs` | `hasGeneContext` |
| 3 | Discover | `Cell states and gene programs associated with {GENE} in {Tissue} {CellType} cells` | `showAnalysisState` |
| 4 | Explore | `Cell state and program details, their relationships, and trait associations` | `showAnalysisState` |

Only Discover's is dynamic (`discoverQuestion`); the rest are literals in the template.

`.liger-layer.current` outlines the layer the user is meant to act on next and colors its number pill:
Search while landing, Scope until a cell type is chosen, Discover while nothing is selected, Explore
once something is.

**1. Search.** The gene is *not* part of the scope -- tissue and cell type are questions about a gene,
so the choice comes first and stands alone rather than being the first cell of the scope bar it defines.
Holds the search input, the `exampleGenes` row, and the search feedback. Once a gene resolves it
collapses to the gene name and a `Change gene` button (`searchEditing`). While reopened it also offers
`Keep {GENE}`, because the current gene stays selected until a new search actually runs -- reopening the
search must not be a one-way door.

**2. Scope.** Two parts, as before:

1. **The scope bar** -- two columns, `Tissue` and `Cell type`, separated by an arrow, each with a state
   dot rather than a step number (the layer head owns the numbering now). Each reads as an instruction
   before it is chosen (`Select a tissue`, muted) and as scope once it is.
2. **The selectors** (`.scope-selectors`) -- the tissue and cell-type cards. When they are hidden the bar
   is the whole body and its bottom divider drops via `.scope-bar:not(:last-child)`.

There is no longer a `selectionInstruction` line under the selectors: the layer subtitle already says to
pick a tissue and a cell type, and the scope bar's own muted `Select a tissue` / `Select a cell type`
placeholders say which one is still outstanding. Three copies of the same instruction was two too many.

A single `Change` reopens both selectors (`scopeEditing`) so the user can change one and leave the other
alone; it reads `Done` while editing and only appears once a cell type is selected. It no longer touches
the gene search -- changing the tissue does not invalidate the gene, so the two are separate flags.

**3. Discover.** The states/programs cards. Its subtitle names the full resolved scope, so it is the one
place `{GENE} in {Tissue} {CellType} cells` is spelled out. `#liger-body` now only supplies the
`min-width` the two side-by-side cards need; the panel chrome comes from `.liger-layer`.

**4. Explore.** The detail panels, inline. See *Detail panels* below.

Reveal rules, all computed:

- `showTissueSelector` -- open until a cell type is selected, or while `scopeEditing`. The tissue list
  stays visible while the user picks a cell type, because it is still useful context; both collapse
  only once a cell type is chosen. Also honours `shouldHideTissueCard`.
- `showCellTypeSelector` -- needs a tissue; same collapse rule.
- `showAnalysisState` -- a cell type is selected. Gates the Discover and Explore layers.
- `showGeneSearchInput` -- landing state, or `searchEditing`, or a gene that resolved to no tissues. That
  last case matters: without it a dead-end gene would leave no way to search again.
- `showScopeChange` -- only once the scope is complete.

`scopeEditing` is cleared by `selectCellType` and `resetGeneResults`; `searchEditing` by
`resetGeneResults`. Reopening either never discards the current selection.

### Search

- Gene autocomplete is self-contained inside `LigerBrowser.vue`.
- Selecting a suggestion or pressing Enter triggers the initial gene load.
- If no tissues are available for the gene, keep the search feedback visible but render no further layer.

### Hover previews (tissue and cell type)

Hover previews answer "is this worth clicking", so they stay small: a title, a few counts, and one
instruction line. They are a separate, narrower floating card (`floatingPreviewTooltip`,
`.floating-preview-tooltip`) from the state/program metadata tooltip, not a variant of it. Both are
`position: fixed`, because the rows they describe sit in scrolling panels.

`.floating-preview-tooltip` and its `.preview-tooltip-*` children were missing from the stylesheet for a
while, which made the previews render as unstyled text at the bottom of the page rather than as a card.
If either floating tooltip appears in the page flow, check its class exists in the scoped block first --
the JS positions them entirely through inline `left` / `top`, so it never fails loudly.

**Dismissal is explicit, not just `mouseleave`.** These tooltips live outside the rows they describe, so a
row that unmounts while hovered cannot fire the event that would close them -- selecting a cell type
collapses both selector cards and used to leave its preview stranded over empty space. `hideAllTooltips()`
therefore runs from `openDetailShell`, `resetGeneResults`, and `resetCellTypeResults`, and
`selectCellType` calls `hidePreviewTooltip()` directly because no reset runs on that path. Any new control
that collapses a card holding hoverable rows needs the same treatment.

- Tissue: cell types, cell states, gene programs, then `Select to explore {GENE} across {tissue} cell types.`
- Cell type: `{GENE} expression` (the row's own bar number), cell states, gene programs, then
  `Select to explore its cell states and gene programs.`

Per the flow doc, tissue hover deliberately does **not** show individual states or programs -- that
jumps the hierarchy. Only counts.

**Where the counts come from.** `submitGeneSearch` already fetches gene-level
`gene-program-expression-cell-state` and `gene-program-expression-program` across every tissue to derive
the tissue list; those rows are now kept in `geneLevelCellStateRows` / `geneLevelProgramRows` instead of
being discarded. `geneScopeCounts` folds them once into per-tissue and per-tissue-per-cell-type buckets.
No extra requests, at any point.

Two things this depends on:

- Program rows are filtered to `LIGER_PROGRAM_MODEL` on the way in. The program section queries a single
  model, so unfiltered counts would overcount.
- Buckets are keyed by tissue **label**, not tissue key. `availableTissues` holds labels, and an
  unrecognized tissue has a label but no key -- keying by key would report zeros for it.

The counts are of rows that exist *for the current gene*, which is exactly what the section shows after
the click, so hover and the section's count badge agree. Verified against the live API for
pancreas/PPARG -- `macrophage` 4 states / 0 programs, `beta_cell` 9 / 14, `endothelial` 5 / 24,
`pancreatic_active_stellate` 3 / 24 -- each matching the corresponding 3-arg section query exactly. The
tissue-level cell-type count (union of state and program rows) likewise matched
`gene-program-expression-cell-type` across four gene/tissue pairs.

### Tissue card

- Shows human-readable tissue names only.
- Header is the numbered step `1 Select a tissue (N)`.
- There is deliberately no tissue-level expression bar: no endpoint returns a tissue-level value, and
  deriving one from the gene-level state/program rows would invent a metric. Do not add one without a
  real field to back it.
- No downstream sections should render real data before tissue / cell-type selection.

### Cell type expression card

- Loads only after tissue selection.
- Header is the numbered step `2 Select a cell type (N)`.
- Uses bars plus numeric `ABS` and `SPEC`.
- `ABS` and `SPEC` headers now use custom hover tooltips instead of native HTML `title`.
- Labels are prettified for display:
  - underscores replaced with spaces
  - words capitalized

### Cell state / gene program cards

- Not rendered until a cell type is selected.
- Support `Show Expression` / `Show Info` toggle.
- Expression and info ordering should match.
- Expression-card labels should truncate with ellipsis.
- Info-card labels can wrap normally.
- Count badges should reset to `0` unless a cell type is currently selected.
- Expression rows now also have metadata hover tooltips:
  - cell-state rows open a tooltip to the right
  - gene-program rows open a tooltip to the left
  - tooltip footer says `Click row to filter the other card · Details for full metadata`
  - The card is centered on its row **after** it renders (`alignExpressionRowTooltip`, called on
    `$nextTick`), because its height depends on how many chips its columns wrap to. The earlier fixed
    `tooltipHeight = 220` guess is what left the arrow pointing at a different row than the one hovered.
  - The arrow position is a separate `--arrow-y` custom property, not the card's own `50%`, so a tooltip
    that had to be pushed away from a viewport edge still points at the row it describes.
  - `mousemove` re-fires constantly across a row, so `floatingExpressionTooltip.rowKey` makes a move
    within the same row a no-op. The tooltip is anchored to the row, not the cursor, so there is nothing
    to recompute -- and re-measuring per move made the card twitch.
- Keep `Show Info` and the info-card layouts in place for now even though tooltip previews now exist.
- Clicking a row opens its detail panel in the Explore layer.
- Each row ends in a filter icon (`.row-filter-button`) which instead filters the *other* card. It is a
  real nested `<button>` with `@click.stop`, so the row and the action are separately clickable.
- The icon has its **own** tooltip (`floatingActionTooltip`) -- `Filter matching programs` on a state row,
  `Filter matching states` on a program row. It is a fixed-position element like the other tooltips
  here, not a native `title`: the rows live in a `.scroll-panel` that would clip a positioned bubble.
  Hovering the button hides the row's metadata tooltip and stops `mousemove` from re-showing it, so the
  two never overlap; scrolling the panel dismisses both.
- The icon renders filled while its filter is the active one; the trailing grid track is 20px so the
  action costs the row almost nothing.
- The selected row stays highlighted in both expression and info views, following the open panel.
  The filter has its own affordance -- the filled icon and the filter note -- so the two do not compete
  for the same highlight.

### The matrices live inside the detail panels

There are no standalone relationships / trait-links sections any more. Each matrix is scoped to the
entity whose panel it is in:

- `StateDetails` -> `Related programs` tab: this state's row of the relationship matrix, one cell per
  program. `Traits` tab: this state's trait associations.
- `ProgramDetails` -> `State matches` tab: this program's column of the relationship matrix, one cell per
  curated state. `Traits` tab: this program's trait associations.

**The table is the heatmap** (`HeatTable.vue`). There is no separate colored strip: every numeric
column keeps its number *and* carries its own color scale, drawn under the column header the way the
expression cards draw their axis. Rows are clickable and swap the panel to that counterpart.

Each column scales independently, computed across the rows currently on screen -- a p-value column and a
correlation column share no units, so one range would make one of them unreadable. Filtering rescales
the colors.

Column kinds:

- `pvalue` -- colored on `-log10(p)` so a strong hit is a strong color, but still *printed* as the
  p-value. Its legend runs weak to strong left to right, so the ticks read `0.995` then `0.002`.
- `diverging` -- symmetric about a true zero, orange / white / blue, ticks `-max, 0, +max`.
- `sequential` -- white to teal from the minimum.

Missing values render `—` on a neutral cell, never `0.00` on a colored one.

The trait tables are the same component, **grouped by phenotype `group`** from
`/api/portal/phenotypes?q=md`, as the old trait matrix was. `topTraitRows()` carries a `group` on every
row via `traitGroupLabel()`; traits with no phenotype match fall into a single `Other` bucket rather than
one bucket each. Empty groups are dropped. Measured on pancreas / beta_cell mature-beta-identity: 96
trait rows in, top 20 displayed across GLYCEMIC (17), ANTHROPOMETRIC, REPRODUCTIVE TRAITS and
HEMATOLOGICAL.

Program labels are not unique -- several factors can carry the same suggested label, which produced three
identical `Adipocyte Regulatory Program` rows. `disambiguateLabels()` appends the factor id, but only to
labels that actually repeat.

**Every match is shown by default.** `relatedProgramsForState` and `curatedStateMatchesForProgram` no
longer pre-filter to `gsea_p < 0.05`; they return everything, sorted by significance, and each detail
component has an `All matches / GSEA P < 0.05 / GSEA q < 0.05` control. The header reports
`3 of 14 · <metric>` so a filtered view is never mistaken for the whole set. The relationship metric
selector moved into these tabs too, using `metricValues` precomputed per row by `metricValuesForRow()` --
switching metric is client-side, with no refetch.

Because nothing is pre-filtered, the overview panels say so explicitly when the top match does not clear
a threshold ("This is the best of 14 matches, but it does not reach GSEA P < 0.05"). This is the common
case, not an edge case: on pancreas / beta_cell, the mature-beta-identity state has 14 program matches of
which 3 clear `P < 0.05` and **none** clear `q < 0.05`.

**What this deleted.** The bulk trait heatmap is gone entirely -- `loadTraitHeatmap`, `traitHeatmapRows`,
`traitHeatmapColumns`, `buildTraitColumns`, `traitHeatmapDisplay`, `availableTraitColumns`, and the
per-column trait fetches with them. It issued **one request per state and per program** to fill a matrix
most sessions never scrolled. Detail panels fetch traits for the one entity they are about, which they
already did. Also removed: `relationshipHeatmapDisplay`, both heatmap tooltip builders, the floating
heatmap tooltip, `heatRowsForMetric`, `quantile`, and the `relationship` / `association` detail types with
`RelationshipDetails.vue` -- a matrix cell now lives inside an entity panel, so "open the relationship
between these two" no longer has anywhere to be clicked from.

The relationship heatmap query itself is still loaded on cell-type selection: it drives the row filtering
and both detail matrices.

### Detail panels

Details are the **Explore layer** -- an inline section at the bottom of the page, not a modal. The
panel answers a question about the row that was clicked, and a dialog that has to be dismissed before you
can look at that row again breaks that reading. The layer renders as soon as a cell type is scoped, so
step 4 is visible as part of the workflow before anything is selected; until then its body is a dashed
placeholder.

They were originally a modal (`.liger-modal-wrap`), which was itself a reaction to an earlier inline
version that sat *between* the cards and the matrices -- that one pushed everything below far down the
page and gave no signal that anything had happened. Neither problem applies here: the matrices now live
inside the panels themselves, so nothing is pushed down, and `revealExploreLayer` scrolls the layer
into view on open, which is the signal the modal used to provide for free.

They are opened by clicking a state or program row, or a row in one of the matrices inside another
panel. The row's filter icon does not open a panel -- it filters the other card.

`Clear selection` lives in the layer head; the panels no longer carry their own `Close` button, which was
a modal affordance. `Escape` still clears the selection.

**Changing scope clears the panel.** `selectTissue` gets this via `resetCellTypeResults`, but
`selectCellType` loads the new sections directly, so it clears the panel and the `linkedSelection`
itself -- otherwise the Explore layer keeps showing a state belonging to the cell type the user just left,
and the programs card stays filtered against a state that does not exist in the new one.

Two entry points, deliberately: `closeDetail()` clears the panel **and** writes the cleared
`cell_state` / `gene_program` query params; `clearDetailState()` only clears the panel. Callers that
already clear those params in their own `syncQueryParams` (`selectCellType`, `resetGeneResults`,
`resetCellTypeResults`) use the latter, because `syncQueryParams` **pushes** a history entry -- going
through `closeDetail` there made one click cost two presses of Back.

Two components for entities, both in this folder:

- `StateDetails.vue` -- tabs `Overview | Marker genes | Related programs | Traits | Methods`
- `ProgramDetails.vue` -- tabs `Overview | Gene loadings | State matches | Traits | Gene sets | QC signatures`

They are **presentational**. The parent still does all the fetching and assembling and passes the
finished payload in as `content`; the components only render it and emit:

- `open-program` (from `StateDetails`) / `open-state` (from `ProgramDetails`) -- the parent swaps the
  panel to the other entity, which is how the two cross-link

#### Panel header

Eyebrow (`Cell state` / `Inferred program`), title, description, and -- on the state panel -- the
curation record opposite the title plus the interpretation guidance as hover notes.

- **The state's description is a lede under the title** (`.detail-lede`), not an overview section. It says
  what the entity *is*, which is header material.
  - `biological_description` is **not** shown. It is the same text as the description on most states, and
    on the rest it says the same thing at greater length, so the old `About this state` overview column
    restated the header.
- **The curation record sits in `.detail-curation-summary`** (240px, right of the header): curation status
  (`quality.quality_label`), curated by, curation version, manual review. Four fields, deliberately.
  - The metadata index also returns state class, interpretation status, release class, portal visibility,
    QC sensitivity, establishment level and hard-call policy, all populated. They are **not shown**: they
    are pipeline classifications rather than anything a portal reader can act on. `provenance_warnings`
    (pipeline rule tags) is out for the same reason. Do not add them back without a reason a reader would
    recognize.
- **Interpretation guidance is two hover notes** (`.detail-note`) under the description: `What this means
  for <gene>` and `How to read this state`. Each opens a bubble **below** the label -- these sit near the
  top of the panel, where an upward bubble would open off the top of the section. The content is several
  paragraphs of prose; inline in the overview it pushed the actual associations out of view.
- **The program header mirrors the state header.** Eyebrow, title, a lede saying the program is
  factorization-inferred with no curation record behind it, and the program identity
  (`Program ID`, `Model`) in the same `.detail-curation-summary` corner. No `Program label` row -- it is
  the title.
- **The program header carries no badges at all.** It used to show a quality class read from
  `suggested_program_quality_class` / `quality_class` / `release_recommendation` / `qc_recommendation`,
  none of which any index returns, falling back to a regex over `match_class`, which the heatmap does not
  return either. Both regex branches tested the empty string, so the badge was the constant
  `Exploratory biological` on **every program in every tissue** while looking like an API-reported
  verdict. `inferredProgramQuality()`, `programDetailBadges()`, `stateDetailBadges()`,
  `buildLabeledDetailBadges()`, `buildDetailBadges()` and `detailBadgeTone()` are all gone, along with the
  `badges` prop on both components.
- Do not reintroduce a badge or field whose value the API does not supply.

#### Overview

Overview is a **digest**, not a dump: the full tables live behind their own tabs.

**The overview is associations only.** Base info, curation record and interpretation guidance all live in
the header, so the overview is not competing with them.

It is **one row with a column per section** (`.detail-overview-row`), not a stack -- the whole digest
should be readable at once. `grid-auto-flow: column` means neither component declares how many sections it
has.

- State: marker genes, top related programs, top trait anchors. Three columns.
  - `Top related programs` is a preview list of the best three (the parent sorts by GSEA P ascending),
    each clickable through to that program, with a note when none reach P < 0.05. It replaced a single
    `Strongest related program` block, which was the odd one out next to two plural columns.
  - The guidance rows the header hover notes render are still built by `stateInterpretationRows()` (the
    four `gene_expression_*` fields) and `stateReadingRows()` (`recommended_portal_summary`,
    `interpretation_caveat`, `do_not_overinterpret_as`, `curation_notes`). The latter two used to sit
    behind `||` fallbacks after their always-populated gene-facing counterparts, so neither was ever
    shown.
- Program: gene loadings, state matches, trait anchors. Three columns -- program identity moved to the
  header, and QC and gene sets moved to tabs only, for the same reason the state overview shed its
  curation columns.

**Every overview preview names its selection rule** across from the section heading -- `Top 3 by GSEA P`,
`Top 3 by GSEA q`, `Top 4 by |beta|`, `Top 5 by loading`. Gene sets have no preview and therefore no
rule note -- the tab is the only place they appear. These previews **rank, they do not filter**:
no significance threshold is applied, so the note names the ranking statistic rather than a cutoff.
`previewProgramsAreSignificant` / `previewMatchesAreSignificant` is what adds the separate
"None of these reach ..." line when the best rows still are not significant. Do not label these with a
threshold value -- there is not one.

**Preview lists are not clickable and carry no statistics.** Names only; the tab behind them has the
numbers and the click-through. Trait previews are `.detail-pair-list` rows -- trait name with its
phenotype group across from it -- rather than wrapped chips, because the group is what makes a bare trait
code like `BSandFG` readable and chips lost the pairing.
  - `summaryFields` is now program ID / program label / model -- the only program-level fields the index
    returns. `Suggested label`, `Rationale` and `Quality` are gone: no index sends any of them.
  - `qcEvidence` reports **counts, not a verdict**: signatures tested, enriched at q < 0.05, enriched at
    P < 0.05, plus `selfLabelledQc` -- whether the factorization's own `label` says QC or artifact, which
    it does for 7 of the 10 islet beta programs. That is the honest replacement for the fabricated
    quality badge.

Columns have a **180px floor** and the row scrolls past that rather than shrinking further, so it stays a
row at every width instead of collapsing six program sections into unreadable slivers.

Content is tuned for column width inside `.detail-overview-row` only; the same markup on a full-width tab
keeps its roomier defaults:

- `.detail-field-grid` **stacks** label over value instead of `170px + 1fr` -- these labels are sentences
  (`If your gene is enriched here`), and at column width the label column wrapped them to three lines while
  starving the value beside them.
- `.detail-marker` chips get `overflow-wrap: anywhere`, because a chip is often one long unbroken token
  (`HALLMARK_TNFA_SIGNALING_VIA_NFKB`, trait names) that would otherwise force its column wider.
- The strongest-program statistics are a `.detail-stat-list` (one per line) rather than one
  `GSEA P · GSEA q · Match` line, which rewrapped into an unreadable ribbon.

`StateDetails` no longer renders a `State ID / Tissue / Cell type` field list, and the parent no longer
builds one for states. The title names the state and the Discover layer above already states the tissue
and cell type in scope, so the block repeated the page back at itself.

Switching entity resets the active tab to Overview -- a new entity should be read from the top.

Shared code, to keep the two components and the parent from drifting:

- `../ligerFormat.js` -- `formatMetric`, `formatPValue`, `isFiniteNumber`. The parent's methods are now
  these same functions, so a number formats identically wherever it appears.
- `ligerDetails.css` -- the panel styling, pulled into both components with
  `<style scoped src="./ligerDetails.css">`. Scoped, so each component gets its own `data-v` hash and
  nothing leaks page-wide; one file, so there is no second copy to drift. It also carries scoped copies
  of the few generic helpers the detail markup needs (`.empty-state`, `.table-wrap`, `.clickable-cell`),
  because the parent's scoped styles do not reach into a child component's markup.

Coverage:

- Curated state: what this state represents (header lede); curation record (header, opposite the title);
  gene interpretation and state-level reading guidance (header hover notes); marker genes; marker
  provenance with linked citations; related programs; human genetic trait anchors; scoring and methods
- Inferred program: program identity; QC signature evidence; top gene loadings; curated-state matches; QC
  signature detail; gene set associations; top anchor traits

**New tabs, both consuming data the API already returned and the panels were dropping:**

- `StateDetails` **Methods** -- `portal_methods_details`, primary / secondary score, score scope,
  hard-call policy and notes, required supporting evidence, and `scoring.activity_weights[]`
  (id / label / description). `stateMethodsDetail()` already existed and built all of this; nothing
  rendered it.
- `ProgramDetails` **QC signatures is the last tab**, and the color legend leads it. QC is a caveat on the
  program rather than one of its biological associations, so it reads as the end of the list. The tinted
  bubbles are gone with the overview column that held them -- the table shows the same 19 signatures with
  tier, recommended use and exclude-when as columns, and its signature labels keep the tone colors. The
  `qcEvidence` counts moved above the table, which they summarize. `programQcBadge()` /
  `programQcBubbleLabel()` and the `.detail-qc-tooltip` styles are gone with them.
- `StateDetails` **marker citations are links in the provenance table**, and there is no References tab.
  `state_level_citations` is the same set of papers the markers cite -- the pipeline rolls them up -- so a
  separate list restated the provenance table with the gene attribution thrown away. `markerCitationsText()`
  became `markerCitationLinks()` (label + url per citation); `stateReferenceDetail()` is gone.
- `ProgramDetails` **QC signatures** -- the QC bubbles promoted to a table, joined to
  `gene-program-qc-metadata-extended` on the signature id (19/19 rows join for islet beta Factor1). The
  bubbles only ever exposed display name, category and markers; `tier`, `recommended_use` and
  `exclude_when` are populated on every signature and say whether a hit disqualifies the program.

Behavior worth keeping:

- program title uses the readable label only, not `FactorN - label`
- the program panel does not show `Collection`
- program QC results come from `gene-program-qc-factor`. The old fallback chain ended in a synthetic
  `QC pass` badge when every source was empty, which asserted a pass the API never reported; an empty QC
  result now says so. Gene-set truncation (25 rows) lives in `ProgramDetails.vue`.
- top-N tables report what they are a slice of (`Top 30 of 4895 genes with a positive loading`). The
  gene-loading fallback mode -- used when the loading index is empty and the ordered `top_genes` string is
  all there is -- shows rank and gene only. It used to also print a `rankScore` counted down from the list
  length, which was invented in the component.
- `Escape` and `Clear selection` both dismiss the panel
- `cell_state` / `gene_program` query params behave as before: present on load, the matching panel opens
  automatically, and it does not wait on the trait heatmap

Naming: everything formerly `drawer*` is now `detail*` (`detailOpen`, `detailContent`, `openStateDetail`,
`isDetailTarget`, `.detail-badge`, ...). The query params keep their names.

### Filter icon links the two cards

The filter icon on a cell-state row filters the gene-program card to the programs that significantly
match it, and the icon on a gene-program row filters the cell-state card. Pressing the same icon again
clears it; only one side can be active at a time (`linkedSelection`, `toggleLinkedSelection`).

"Significant" is `gsea_p < LIGER_SIGNIFICANCE_P` (0.05) on the relationship heatmap rows, excluding QC
signatures via `isQcStateRow()` -- the same rule the detail panels use for related programs and curated
state matches, so the cards and the panels cannot disagree about what a match is. This filter was also
affected by the missing `state_type` field, so QC signatures counted toward the linked-card matches too. `significantMatchIndex` folds the rows
into both directions once.

While a filter is active the card header reads `(3 of 14)` and a note names what it is filtered by, with
a `Clear` control. When nothing matches the card says so by name rather than rendering empty -- this is
common: on pancreas / beta_cell only 7 of 14 states have any significant program at all.

**This is why the relationship heatmap is not lazily loaded.** Its rows drive the filtering and the
detail panels whether or not its own section is open.

### Query-string state

The page now syncs primary interaction state into the query string.

Currently supported params:

- `gene`
- `tissue`
- `cell_type`
- `cell_state`
- `gene_program`

Example:

- `?gene=PCSK9&tissue=artery&cell_type=fibroblast&cell_state=artery_fibroblast_adipogenic_preadipocyte_like_fibroblast`

Expected behavior:

- clicking/searching should update the URL progressively
- loading the page with these params should restore the same selection path
- `cell_state` and `gene_program` are mutually exclusive in the URL and should clear each other when the detail target changes
- a detail target in the URL opens its panel directly; nothing else has to load first

## Loading State Expectation

Every data-backed section should have its own loading state.

Currently this applies to:

- gene search / tissue derivation
- cell type expression
- cell state section
- gene program section
- relationship data for the selected cell type
- detail panel fetches

If new sections are added, add explicit section-level loading and error states too.

## Known Rough Edges / Follow-ups

- Internal card scrolling is still relatively simple.
- Some layout behavior is intentionally lightweight and may still need polish.
- Detail-panel layout has not been fully reworked -- every value is API-backed and the sections are in a
  sensible order, but column widths and spacing are still largely inherited.
- **Open question: is the state `Methods` tab worth keeping?** Everything in it is populated
  (`portal_methods_details`, primary/secondary score, score scope, hard-call policy and notes, required
  supporting evidence, `scoring.activity_weights[]`), but whether a portal reader needs AUCell/UCell
  scoring detail is a call for someone who reads these scores. It is cheap to drop -- one tab plus
  `stateMethodsDetail()`.
- Program-level metadata is thin by nature: six fields, no curation record. If the pipeline ever starts
  returning a real quality class or rationale, that is where the program overview should grow.
- Trait-to-phenotype matching depends on API naming consistency between trait rows and `/api/portal/phenotypes?q=md`.
  **Unverified:** the effective match rate has not been measured -- Cloudflare blocks scripted access to
  both hugeamp bioindex hosts, so this needs a browser check. It decides whether the trait tabs show ~350
  rows or a handful, since `LIGER_FILTER_UNLABELED_HEATMAP_TRAITS` drops unmatched traits.
- Deep-link restoration should be browser-checked after any major interaction-flow changes.

## Resume Checklist

If starting cold, do this first:

1. Open `LigerBrowser.vue`.
2. Open `../README.md` and `../references/liger_apis.txt`.
3. Verify current progressive-disclosure behavior still works:
   - search gene
   - select tissue
   - select cell type
   - toggle expression/info
   - filter one card with the filter icon on a row in the other
   - open both detail panels and their matrix tabs
4. Verify deep-link behavior:
   - `gene`
   - `tissue`
   - `cell_type`
   - `cell_state`
   - `gene_program`
5. Keep labels human-readable and avoid leaking raw IDs unless absolutely necessary.
