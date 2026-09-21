# LIGER Component Notes

This folder contains the in-progress LIGER browser component for the portal.

## Primary Files

- `LigerBrowser.vue`
  - Main working component: data loading, scope state, the tissue / cell-type / state / program cards.
- `CellStateInfographic.vue`
  - The landing-state figure. Collapses via the `collapse` prop once a gene is selected.
- `StateDetails.vue` / `ProgramDetails.vue`
  - Detail panel bodies. Presentational; the parent builds their `content`.
- `HeatTable.vue`
  - The matrices: a table whose numeric columns are heat-colored, each on its own scale.
- `ligerFormat.js` / `ligerHeat.js` / `ligerDetails.css`
  - Shared number formatting, heat colors, and detail-panel styling.
- `references/liger_apis.txt`
  - Source of truth for the currently intended LIGER endpoints and host.
- `DETAIL_DATA_CATALOGUE.md`
  - Field-by-field record of what each wired endpoint actually returns, with fill rates measured against
    live responses, and the list of fields the code used to read that no index sends. Check this before
    adding anything to a detail panel.

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

## Important Constraints

- Maintain the structure and visual language already established in `LigerBrowser.vue`.
- New JS files or components for this tool should stay in this folder.
- Avoid reusing unrelated shared repo components for this tool unless explicitly requested.
- Use the APIs and host from `references/liger_apis.txt`.
- Progressive disclosure matters, and it now hides rather than overlays:
  - Search gene first
  - Then show tissues
  - Then show cell-type expression after tissue selection
  - Then show cell-state / gene-program sections only after cell-type selection
  - A downstream section is not rendered at all until its prerequisite is chosen. The old
    `card-overlay` "Select a Cell Type" placeholders are gone; `card-overlay` is now only
    a loading state.

## API Host

The host for the LIGER indexes is resolved in the `apiHost()` computed. It is a single binary choice, no
precedence chain:

- Dev when the page is served from `localhost` / `127.0.0.1` / `0.0.0.0`, or when any label of the
  hostname other than the TLD contains `dev` — `dev.pankbase.org`, `cmd.dev.hugeamp.org`,
  `bioindex-dev.hugeamp.org`, `kp4cd-dev.org`. Uses `config.devHost`.
- Prod otherwise. Uses `config.prodHost`.

Both default to the hugeamp bioindexes (`https://bioindex.hugeamp.org` /
`https://bioindex-dev.hugeamp.org`), so a page that reads LIGER from hugeamp needs no configuration. A
portal serving the LIGER indexes from its own bioindex sets both keys.

`BIO_INDEX_HOST` is deliberately not used here. It is compile-time injected per portal build, which made
the resolved host depend on how the bundle was built rather than on the page config, and it is not
overridable per page.

Two endpoints do **not** follow `apiHost`:

- `/api/portal/phenotypes?q=md`
- `/api/bio/match/gene?q=`

Only the hugeamp bioindex serves them (others return `501`), so both are pinned to `LIGER_HUGEAMP_HOST`,
which is hugeamp prod or hugeamp dev by the same dev check above. Do not route them through
`config.prodHost` / `config.devHost`: those exist to point the LIGER indexes at another portal, and
dragging these two along would send them to a host that does not serve them.

## Temporary Local Tissue Config

Portals do not agree on how a tissue is identified, so there is a temporary hardcoded mapping in `LigerBrowser.vue`.

Two things vary by portal:

- some responses carry a tissue label, others carry only a dataset ID
- the dataset ID for the same tissue differs between portals

So each tissue lists every dataset ID we know it by, and resolution runs in whichever direction the response supports:

- `artery` -> `FNIH_Artery_scRNA_v2.2`
- `heart` -> `FNIH_Heart_scRNA_v3.2`
- `hypothalamus` -> `FNIH_Hypothalamus_scRNA_v2.2`
- `kidney` -> `FNIH_Kidney_scRNA_v2.2`
- `liver` -> `FNIH_Liver_scRNA_v3.2`
- `muscle` -> `FNIH_Muscle_scRNA_v2.2`
- `pancreas` -> `FNIH_Pancreas_scRNA_v2.2`, `islet_of_Langerhans_scRNA_v3-4`
- `sat` -> `FNIH_SAT_scRNA_v2.2`
- `vat` -> `FNIH_VAT_scRNA_v2.2`

How it resolves:

- `rowTissueKey(row)` reads `tissue` / `tissue_label` first, then falls back to `dataset` / `dataset_id` via the reverse map
- the gene search records which dataset ID the portal actually used, in `observedDatasetIds`
- `tissueDatasetId(label)` returns that observed ID, falling back to the first configured ID when the portal only returned tissue labels

## Tissue vs Dataset Query Keys

Portals also disagree on what the first query argument should be. Some accept a tissue key, others require a dataset ID for the same endpoint:

- pankbase: `gene-program-expression-cell-type?q=islet_of_Langerhans_scRNA_v3-4,INS`
- hugeamp: `gene-program-expression-cell-type?q=pancreas,INS`

`detectCellStateDatasetKeying()` decides which convention applies, from the gene-level `gene-program-expression-cell-state` response:

- rows carry a `tissue` -> the portal is tissue-keyed
- rows carry only a `dataset` -> the portal is dataset-keyed

The result is stored in `cellStateUsesDatasetKey`, and `tissueQueryKey(label)` returns a dataset ID or a tissue key accordingly.

Only the cell-state response is a valid signal here. The `gene-program-expression-program` response reports dataset IDs on **both** kinds of portal, so including it makes every portal look dataset-keyed.

Use `tissueQueryKey()` for:

- `gene-program-expression-cell-type`
- `gene-program-expression-cell-state` (3-arg form)
- `gene-program-heatmap`
- `gene-program-cell-state-trait-factor`

Do **not** use it for `gene-program-cell-state-metadata` / `-extended` — those are tissue-keyed on every portal, so they keep using `tissueKeyFromLabel()`.

The `gene-program-*factor` and `gene-program-expression-program` builders take `tissueDatasetId()` and are unaffected.

Note that on a dataset-keyed portal, passing a tissue name to `gene-program-expression-cell-type` or `gene-program-expression-cell-state` returns **HTTP 500**, not an empty result, so this surfaces as a load error rather than an empty state.

Config note:

- keep this mapping consistent on `datasetIds` (an array) only
- do not mix `datasetIds`, `datasetId`, and `datasetID`
- add a new portal's dataset ID to the existing tissue entry rather than adding a new tissue

Program model currently hardcoded:

- `mouse_msigdb`

## Endpoints Currently Wired

### Gene search / first disclosure

- `/api/bio/match/gene?q=<gene prefix>`
- `/api/bio/query/gene-program-expression-cell-state?q=<gene>`
- `/api/bio/query/gene-program-expression-program?q=<gene>`

These are used to:

- power autocomplete
- select a gene
- derive the available tissue list

### Cell type expression

- `/api/bio/query/gene-program-expression-cell-type?q=<tissue>,<gene>`

This is used after tissue selection to populate the cell-type expression card.

### Cell state section

- `/api/bio/query/gene-program-expression-cell-state?q=<tissue>,<cellType>,<gene>`
- `/api/bio/query/gene-program-cell-state-metadata-extended?q=<tissue>,<cellType>`

These power:

- expression mode
- info mode

State labels should come from metadata `display_name` for the matching `state_id` whenever possible.

### Gene program section

- `/api/bio/query/gene-program-expression-program?q=<datasetId>,<cellType>,<model>,<gene>`
- `/api/bio/query/gene-program-factor?q=<datasetId>,<cellType>,<model>`

These power:

- expression mode
- info mode

Program labels should prefer metadata labels and avoid exposing raw factor IDs when a readable label exists.

`gene-program-factor` returns exactly six fields -- `dataset`, `cell_type`, `model`, `factor`, `label`,
`top_genes` -- and that is the whole program-level metadata surface. There is **no** `rationale`, no
`suggested_program_label` and no `suggested_program_quality_class`. An earlier note here claimed a
`rationale` field; the index does not send one, and the program detail panel no longer reads for it. See
`DETAIL_DATA_CATALOGUE.md`.

### State/program relationships

- `/api/bio/query/gene-program-heatmap?q=<tissue>,<cellType>`

Loaded once per cell type. This powers:

- the row-click filtering between the two cards
- the related-programs and curated-state-match tables in the detail panels
- QC signature identification (see below)

It returns **eight** fields: `dataset`, `cell_type`, `model`, `program_id`, `program_label`, `state_name`,
`gsea_p`, `gsea_q`. There is no `correlation`, `combined_match_score`, `cell_spearman_r*`,
`donor_spearman_r*`, `gsea_nes`, `loading_auc`, `metric_id` or `match_class`. The panels therefore show
GSEA P, GSEA q and -log10(q) and nothing else; the metric selector and the correlation / cell-coactivity /
match-score columns have been removed, since every one of them read a field no row carries.

`gsea_p` / `gsea_q` are `null` on a substantial fraction of rows (190 of 450 for islet beta).

**`state_name` mixes curated states and QC signatures** -- 36 of 45 distinct values for islet beta are
`qc_bad_*`. There is no field that separates them. This was previously filtered on
`state_type === "qc_state"`, which no row has, so the filter passed everything and QC signatures were
listed as curated state matches. `isQcStateRow()` now tests the `qc_` id prefix, keeping the `state_type`
test first in case the index starts sending it.


### Trait links

- `/api/bio/query/gene-program-cell-state-trait-factor?q=<tissue>,<cellType>,<stateId>`
- `/api/bio/query/gene-program-trait-factor?q=<datasetId>,<cellType>,<model>,<factorId>`
- `/api/portal/phenotypes?q=md`

`/api/portal/phenotypes` is served only by the hugeamp bioindex; other portals return `501`. It is therefore pinned to `LIGER_HUGEAMP_HOST` rather than `apiHost`, so it stays on hugeamp regardless of which portal hosts the component. Along with `/api/bio/match/gene`, it is one of the two endpoints that do not follow the resolved host.

#### Trait cell type partition — resolved, mechanism removed

Both trait endpoints once returned 0 rows for a real cell type on pankbase and served everything under a single synthetic cell type, `combined_signatures`. The component probed at runtime and substituted that key for cell-state traits, while deliberately leaving program traits on the real cell type (the combined partition was a separate decomposition whose `Factor1` was not any cell type's `Factor1`, so substituting would have misattributed trait associations across programs).

**The pipeline now returns real cell type names, and the whole mechanism has been deleted.** Verified against `islet_of_Langerhans_scRNA_v3-4` / `beta`:

| query | before | now |
|---|---|---|
| `gene-program-cell-state-trait-factor?q=<ds>,beta,<state>` | 0 rows | **207 rows** |
| `gene-program-cell-state-trait-factor?q=<ds>,combined_signatures,<state>` | had data | **0 rows** |
| `gene-program-trait-factor?q=<ds>,beta,<model>,Factor1` | 0 rows | **103 rows** |

Rows carry `cell_type: "beta"`. The `combined_signatures` partition is now empty, so the fallback had no data to fall back to.

Removed: `LIGER_COMBINED_TRAIT_CELL_TYPE`, `traitCellTypeKeys`, `traitCellTypeKey()`, `resolveTraitCellTypeKey()`, and the probe in `loadTraitHeatmap`. Both trait endpoints now take `cellType.key` directly, which also drops one probe request per cell type.

Program traits returning data against the real cell type is new — the old note that they "come back empty on a combined-partition portal" no longer applies.

These power:

- state detail trait tables and trait matrix
- program detail trait tables and trait matrix

They are fetched per entity, when its detail panel opens, and cached. There is no bulk trait matrix any
more, so nothing fans these out across every state and program up front.

Important behavior:

- trait identity should stay keyed by raw API trait values internally
- displayed trait labels should prefer phenotype `description` from `/api/portal/phenotypes?q=md`
- trait group labels should come from phenotype `group`
- rows with no matching phenotype label can now be filtered out in code via `LIGER_FILTER_UNLABELED_HEATMAP_TRAITS`
- that same filter also applies to detail-panel trait tables

### Program gene loadings

- `/api/bio/query/gene-program-gene-factor?q=<datasetId>,<cellType>,<model>,<factorId>`

This powers:

- gene-program detail top-gene-loading table

### Program gene set associations

- `/api/bio/query/gene-program-gene-set-factor?q=<datasetId>,<cellType>,<model>,<factorId>`

This powers:

- gene-program detail gene set associations table

### Program QC states

- `/api/bio/query/gene-program-qc-factor?q=<datasetId>,<cellType>,<model>,<factorId>`
- `/api/bio/query/gene-program-qc-metadata-extended?q=1`

These power:

- program detail QC bubbles
- program detail QC badge colors
- QC bubble hover tooltips

Important behavior:

- QC bubble colors are driven directly from QC GSEA values:
  - green when `gsea_p >= 0.05`
  - yellow when `gsea_p < 0.05`
  - red when `gsea_q < 0.05`
- keep the API sort order, but initially truncate the visible QC bubbles after the second green bubble
- use the `See N more` control to expand the remaining QC bubbles
- QC bubble tooltips should show:
  - metadata `display_name`
  - metadata `category`
  - metadata marker genes
- QC metadata joins on `qc_signature_id` matching QC row `state_name`

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

- `ligerFormat.js` -- `formatMetric`, `formatPValue`, `isFiniteNumber`. The parent's methods are now
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

## Value Definitions

- Expression bars show `log10_cpk`, the only expression field any of these endpoints returns.
- Specificity is `log2fc_weighted_vs_all_parent`. The denominator differs by card: cell types measure against the other cell types in the tissue; cell states and gene programs measure their weighted mean against the parent cell-type background. The three header tooltips say so individually — do not collapse them back into one string.

### Open question on `log10_cpk`

The earlier documented definition, `log10(CP10K + 1)`, is wrong on two counts: the field is per-*thousand*, and a `log1p` quantity cannot be negative while ~90% of these values are. A `log10_cp10k` field does not exist on any endpoint.

The shape of the data suggests it is a **log of a log**, roughly `log10(mean_cells(log10(1 + CPK)))`:

- housekeeping genes pin to ≈0 in every cell type (ACTB +0.02, GAPDH +0.03)
- INS spans only +0.19 (beta) to −0.43 (ductal), a 1.6× linear range, where the true ratio is ~1000×
- `10^0.188 = 1.54` is impossible as CPK for INS in beta (should be 100–400), but is the right magnitude for a mean of `log10(1+CPK)` across cells

Consequence for the UI: the bars reliably separate *expressed* from *not expressed*, but differences **within** a well-expressed gene stay compressed. INS renders 71–99% across cell types even though it is overwhelmingly beta-specific. The specificity bar is what carries that signal — which is why the cell-type card, where specificity is null, currently cannot show beta-specificity at all.

**Confirm the exact definition with the pipeline owner before relabeling the axis.** The header says `log₁₀ CPK` (the backend's own naming) rather than asserting the double-log reading.

## Current Field Assumptions

### Expression values

- Expression: `log10_cpk` only. No fallbacks — nothing else is ever returned.
- Specificity: `log2fc_weighted_vs_all_parent`.
  - **Always `null` on `gene-program-expression-cell-type`** (verified across 58 genes). The cell-type card hides the column entirely via `showCellTypeSpecificity`, and lights it up automatically if the pipeline starts populating it.
- `p_value` is used only as a significance flag (bars below threshold are muted). It underflows to `5e-324` for the strongest hits, so it is never usable as a continuous ranking.
- There is no `pct_expressing` / `n_cells` on any endpoint. It cannot be derived client-side: `single-cell-lognorm` has per-cell arrays but carries no cell-type or cell-state labels to join on.

### Bars

Two things about the expression bar matter and are easy to undo by accident.

**1. It is drawn from `10^log10_cpk`, not from `log10_cpk`.**

A filled bar asserts a meaningful zero — length is read as proportional to the quantity. `log10_cpk` has no such zero (`log10_cpk = 0` merely means "1 CPK") and runs negative for ~90% of values, so a bar drawn from it starts at an arbitrary point on a log axis and its length carries no meaning. Undoing the pipeline's outer log recovers a positive quantity with a true zero, so an empty bar honestly means "none detected".

This is not a new metric — it is the linear form of the value the API already returns. The raw `log10_cpk` is still shown on row hover.

The unit label reads `10^log₁₀CPK` rather than `CPK`. Calling it counts-per-thousand would assert something the magnitudes contradict: INS in beta comes out at 1.54, orders of magnitude below a real CPK reading. Stating the transform is exact and inherits the pipeline's own naming instead of inventing a unit.

**2. The axis top scales to the gene, but is anchored at zero and labeled.**

A user only ever views one gene at a time, so a globally fixed ceiling wasted most of the track: set by the islet hormones (INS 1.56), it left a mid-expressed gene like PRSS1 (max 0.24) using the bottom 15% of every bar.

`expressionAxisMax` is therefore `max(gene's own max across all three cards, LIGER_EXPRESSION_AXIS_FLOOR)`, rounded up to a readable step by `niceAxisMax()`. One axis is shared by all three cards so a cell type, a state and a program stay mutually readable.

**This is deliberately relative scaling, and it is only safe because of two properties the original lacked.** The component started out rescaling each section from its own minimum to its own maximum, which was broken twice over: the bar ran from the section *minimum* rather than zero, so an absent gene still filled the track, and the axis was unlabeled, so nothing revealed that the scale had moved. Here the bar keeps a true zero and the ticks carry real values, so a moving top is visible rather than hidden. **If either property is removed, the original bug is back.** Measured on real data under the old behavior, A1BG's bars (100/99/96/96/91…) read as *stronger* than INS's (100/57/51/50/49…).

Constants in `LigerBrowser.vue`, both overridable via the `config` prop (`expressionAxis` — a scalar that pins the top — and `specificityAxis`):

- `LIGER_EXPRESSION_AXIS_FLOOR = 0.5` (linear, axis always runs from 0)
- `LIGER_SPECIFICITY_AXIS_FLOOR = 1.5` (symmetric, log₂FC)

Calibrated against a 58-gene sweep of the islet dataset — 14,107 values across all three endpoints, spanning markers, housekeeping genes and background:

| | min | p1 | p5 | p50 | p75 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|---|
| `log10_cpk` | −8.05 | −4.03 | −3.28 | −1.06 | −0.33 | −0.003 | +0.067 | **+0.193** |
| `10^log10_cpk` | ~0 | | 0.0005 | 0.088 | 0.470 | 0.992 | 1.167 | **1.561** |
| `log2fc…parent` | −2.51 | −1.72 | −1.03 | −0.058 | +0.115 | +0.571 | +1.08 | +1.44 |

Why these numbers:

- **expression floor 0.5** — this is what stops a barely-expressed gene from filling its own bar. A1BG peaks at 0.029; without the floor the axis would scale down to it and it would render at 100%, reading as strongly expressed. At 0.5 it tops out at 5% and ADIPOQ at 0.4%. Chosen against the distribution above: a gene must reach roughly the upper quartile (p75 = 0.47) before the axis starts tracking it.
- **specificity floor ±1.5** — on the pankbase sweep the values cluster hard at zero (p75 = +0.115), so without a floor a card whose values are all tiny would scale up and imply enrichment that isn't there.

**The specificity axis is per-card, and this matters.** Cell-type specificity is measured against the other cell types in the tissue; state and program specificity is measured against the parent cell type. Different denominators — those numbers were never comparable, so they must not share a scale. (The expression axis *is* shared across cards, because it is the same metric everywhere.)

The ranges differ enormously between portals, which is why a hardcoded top does not survive. Same gene, PRSS1 in pancreas:

| card | portal A | portal B |
|---|---|---|
| Cell Types | field is `null` — column hidden | −4.65 … **+7.56** → axis ±8 |
| Cell States | −0.0 … +1.35 → axis ±1.5 | +1.04 … +1.17 → axis ±1.5 |
| Gene Programs | −1.31 … +1.38 → axis ±1.5 | −1.33 … +1.18 → axis ±1.5 |

A fixed ±1.5 clamped every one of portal B's cell-type rows to a full half-track, making +7.56 and −4.65 visually identical — the same failure the expression bars originally had, in the other column.

Values outside either domain clamp and get an overflow marker (squared-off edge) rather than being silently squashed. Missing values render as `—`, never `0.00`.

Verified behavior across the sweep — housekeeping stays flat and high, markers spread, background collapses:

| gene | axis top | ticks | top bar | bottom bar |
|---|---|---|---|---|
| INS | 1.6 | 0 / 0.8 / 1.6 | 98% | 24% |
| GCG | 1.5 | 0 / 0.75 / 1.5 | 90% | 16% |
| GAPDH | 1.2 | 0 / 0.6 / 1.2 | 90% | 79% |
| COL1A1 | 1.2 | 0 / 0.6 / 1.2 | 84% | 0.01% |
| PRSS1 | 0.5 | 0 / 0.25 / 0.5 | 49% | 1.2% |
| A1BG | 0.5 | 0 / 0.25 / 0.5 | 5% | 0.1% |

**The axis steps once mid-load.** Cell types render first; states and programs arrive together and can raise the max, resizing the bars once at that moment. This is a single predictable reflow rather than each card drifting independently.

**Known limitation.** Because `log10_cpk` is compressed (see the open question above), differences *within* a well-expressed gene stay small. INS across the beta cell states is 1.505–1.545 — the states genuinely are near-identical there, so specificity, not magnitude, is the informative column on those two cards.

If bars look visually wrong again, inspect:

- `absoluteExpressionValue()`
- `axisFill()`
- `niceAxisMax()`
- `toExpressionList()`
- `expressionAxisMax` / `specificityAxis` computed properties

**Regression check:** compare `INS` against `A1BG` on the islet dataset. INS must show long bars peaking on beta; A1BG must show near-empty bars everywhere (~5% top). Under the original code these two looked identical. Check `ADIPOQ` too — it is absent from islet, so every bar should be effectively empty while still printing a real number (`0.002`, `<0.001`) rather than `—`, which is reserved for genuinely missing data.

### `numericField()` returns null for missing, not 0

`field()` returns `null` when it finds nothing, and `Number(null)` is `0`, which is finite. Without an explicit guard every absent numeric field in the component silently became a real zero. That is why:

- cell-type **Specificity** rendered a column of `0.00` — the API sends `log2fc_weighted_vs_all_parent: null` on every row of that endpoint
- a missing `p_value` read as `0`, i.e. **maximally significant**
- filters written as `numericField(row, ["beta"]) !== null` could never fire

`numericField()` now guards `null` / `undefined` / `""` before coercing. Real zeros in the data still pass through, because `field()` only skips those three values. Do not remove this guard.

### p_value

Used as a significance flag only — it dims the specificity bar above `LIGER_SIGNIFICANCE_P` (0.05) and appears on row hover. It is never used for ranking: it underflows to `5e-324` for the strongest hits, so it cannot order them. Anything at the floor is displayed as `<1e-300` rather than a falsely precise number.

A bar is dimmed **only when a p-value is present and fails the threshold.** Not every portal returns `p_value` on every endpoint, and dimming on missing data washes out the whole column — reading as "all low confidence" when it actually means "not reported".

It discriminates well and is worth keeping:

| gene | cell states significant | programs significant |
|---|---|---|
| INS (marker) | 83% | 91% |
| PRSS1 | 59% | 31% |
| A1BG (background) | 15% | 10% |

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
2. Open `references/liger_apis.txt`.
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
