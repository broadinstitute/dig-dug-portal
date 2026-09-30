# LIGER

This folder holds the LIGER browser for the portal. It is a **multi-version** folder: the shared
knowledge about the LIGER data and its endpoints lives here at the root, and each UI version lives in
its own subfolder with its own components, styles and README.

## Folder Layout

```
LIGER/
  README.md                   <- this file: shared API / data knowledge
  DETAIL_DATA_CATALOGUE.md    <- field-by-field record of what each endpoint returns
  ligerApi.js                 <- the data layer: hosts, tissue keying, URL building
  ligerFormat.js              <- shared number formatting
  ligerHeat.js                <- shared color math (clamp, mixColor) + v1's heat scale
  CellStateInfographic.vue    <- the orienting figure, used by both versions' page headers
  references/                 <- source of truth for endpoints and host
  v1/                         <- the original browser
  v2/                         <- the Cell Evolution Browser, in progress (currently shipped)
```

### What belongs at the root

Anything true of the LIGER **data** regardless of how it is presented:

- the endpoint list and their query-key conventions
- host resolution
- the tissue / dataset-ID mapping
- what the returned fields mean and how they must be read
- pure, presentation-free helpers (`ligerFormat.js`)

`ligerApi.js` is the executable form of most of this document: host resolution, the tissue config, the
keying detection, the field accessors and every URL builder. A version should reach the bioindex
through it and never construct a URL or re-derive a host itself.

> **`v1` does not use `ligerApi.js`.** It still carries its own inline copy of all of it, written
> before the folder was split. Nothing is broken by this, but it means the tissue config exists in two
> places: **a new portal's dataset ID has to be added to `ligerApi.js` and to `v1/LigerBrowser.vue`
> both** until v1 is migrated. Migrating it is mechanical — v1's methods are the same functions with
> `this.` in front — but it is a large diff against a working component, so it has not been done.

Plus the one piece of presentation both versions deliberately share: `CellStateInfographic.vue`, the
orienting figure in the page header. It is self-contained (its own four categorical colors, no imports
beyond Vue) and it explains the LIGER *concept* rather than either version's workflow, which is why it
did not stay with v1. Treat it as shared: a change to it lands on both pages, so it is not the place to
experiment with v2's look.

### What belongs in a version folder

Everything about a particular interface: its components, its templates, its styles, its `config` prop
contract, its interaction flow, and its own README documenting all of that.

Version folders are independent. A version never imports from a sibling version — if two versions want
the same thing, it moves to the root. Nothing outside this folder should import a version's internals
either; the version's top-level component is its only entry point.

### Versions

| Version | Entry component | Status | Notes |
|---|---|---|---|
| `v1` | `v1/LigerBrowser.vue` | complete, not currently mounted | The full browser. Kept as the reference implementation and as the fallback. See `v1/README.md`. |
| `v2` | `v2/CellEvolutionBrowser.vue` | in progress, **mounted on the LIGER page** | The Cell Evolution Browser: fresh interface over the same endpoints. Currently the page header only. See `v2/README.md`. |

`src/views/LIGER/main.js` and `src/views/LIGER/Template.vue` point at v2. Swapping back to v1 is a
two-line change in those files (import path plus the tag in the template).

Adding a version: create the folder, put its entry component and README in it, and point the consuming
page at it. Nothing at the root should need to change unless the new version needs a genuinely shared
helper.

## Constraints That Apply to Every Version

- Use the endpoints and host from `references/liger_apis.txt`.
- Check `DETAIL_DATA_CATALOGUE.md` before rendering a field. Several fields earlier versions read do not
  exist on any index. **Do not render a value the API does not supply** — that is how v1 ended up showing
  a constant quality badge that looked like an API verdict.
- Keep new files for a version inside that version's folder.
- Avoid reusing unrelated shared portal components in this tool unless explicitly requested.
- Keep labels human-readable; do not leak raw IDs where a readable label exists.
- Every data-backed section needs its own loading and error state.
- Trait identity stays keyed by raw API trait values internally; displayed labels prefer phenotype
  `description` from `/api/portal/phenotypes?q=md`, and group labels come from phenotype `group`.

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

Portals do not agree on how a tissue is identified, so there is a temporary hardcoded mapping in `v1/LigerBrowser.vue`.

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


## Reading the Data

Everything below is a property of the LIGER data, not of any one interface. A new version inherits all
of it. Where a section names a function (`absoluteExpressionValue()`, `niceAxisMax()`, ...) those are
`v1`'s implementations, cited as the worked example — the reasoning is what carries over, not the code.

### Value Definitions

- Expression bars show `log10_cpk`, the only expression field any of these endpoints returns.
- Specificity is `log2fc_weighted_vs_all_parent`. The denominator differs by card: cell types measure against the other cell types in the tissue; cell states and gene programs measure their weighted mean against the parent cell-type background. The three header tooltips say so individually — do not collapse them back into one string.

#### Open question on `log10_cpk`

The earlier documented definition, `log10(CP10K + 1)`, is wrong on two counts: the field is per-*thousand*, and a `log1p` quantity cannot be negative while ~90% of these values are. A `log10_cp10k` field does not exist on any endpoint.

The shape of the data suggests it is a **log of a log**, roughly `log10(mean_cells(log10(1 + CPK)))`:

- housekeeping genes pin to ≈0 in every cell type (ACTB +0.02, GAPDH +0.03)
- INS spans only +0.19 (beta) to −0.43 (ductal), a 1.6× linear range, where the true ratio is ~1000×
- `10^0.188 = 1.54` is impossible as CPK for INS in beta (should be 100–400), but is the right magnitude for a mean of `log10(1+CPK)` across cells

Consequence for the UI: the bars reliably separate *expressed* from *not expressed*, but differences **within** a well-expressed gene stay compressed. INS renders 71–99% across cell types even though it is overwhelmingly beta-specific. The specificity bar is what carries that signal — which is why the cell-type card, where specificity is null, currently cannot show beta-specificity at all.

**Confirm the exact definition with the pipeline owner before relabeling the axis.** The header says `log₁₀ CPK` (the backend's own naming) rather than asserting the double-log reading.

### Current Field Assumptions

#### Expression values

- Expression: `log10_cpk` only. No fallbacks — nothing else is ever returned.
- Specificity: `log2fc_weighted_vs_all_parent`.
  - **Always `null` on `gene-program-expression-cell-type`** (verified across 58 genes). The cell-type card hides the column entirely via `showCellTypeSpecificity`, and lights it up automatically if the pipeline starts populating it.
- `p_value` is used only as a significance flag (bars below threshold are muted). It underflows to `5e-324` for the strongest hits, so it is never usable as a continuous ranking.
- There is no `pct_expressing` / `n_cells` on any endpoint. It cannot be derived client-side: `single-cell-lognorm` has per-cell arrays but carries no cell-type or cell-state labels to join on.

#### Bars

Two things about the expression bar matter and are easy to undo by accident.

**1. It is drawn from `10^log10_cpk`, not from `log10_cpk`.**

A filled bar asserts a meaningful zero — length is read as proportional to the quantity. `log10_cpk` has no such zero (`log10_cpk = 0` merely means "1 CPK") and runs negative for ~90% of values, so a bar drawn from it starts at an arbitrary point on a log axis and its length carries no meaning. Undoing the pipeline's outer log recovers a positive quantity with a true zero, so an empty bar honestly means "none detected".

This is not a new metric — it is the linear form of the value the API already returns. The raw `log10_cpk` is still shown on row hover.

The unit label reads `10^log₁₀CPK` rather than `CPK`. Calling it counts-per-thousand would assert something the magnitudes contradict: INS in beta comes out at 1.54, orders of magnitude below a real CPK reading. Stating the transform is exact and inherits the pipeline's own naming instead of inventing a unit.

**2. The axis top scales to the gene, but is anchored at zero and labeled.**

A user only ever views one gene at a time, so a globally fixed ceiling wasted most of the track: set by the islet hormones (INS 1.56), it left a mid-expressed gene like PRSS1 (max 0.24) using the bottom 15% of every bar.

`expressionAxisMax` is therefore `max(gene's own max across all three cards, LIGER_EXPRESSION_AXIS_FLOOR)`, rounded up to a readable step by `niceAxisMax()`. One axis is shared by all three cards so a cell type, a state and a program stay mutually readable.

**This is deliberately relative scaling, and it is only safe because of two properties the original lacked.** The component started out rescaling each section from its own minimum to its own maximum, which was broken twice over: the bar ran from the section *minimum* rather than zero, so an absent gene still filled the track, and the axis was unlabeled, so nothing revealed that the scale had moved. Here the bar keeps a true zero and the ticks carry real values, so a moving top is visible rather than hidden. **If either property is removed, the original bug is back.** Measured on real data under the old behavior, A1BG's bars (100/99/96/96/91…) read as *stronger* than INS's (100/57/51/50/49…).

Constants in `v1/LigerBrowser.vue`, both overridable via the `config` prop (`expressionAxis` — a scalar that pins the top — and `specificityAxis`):

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

#### `numericField()` returns null for missing, not 0

`field()` returns `null` when it finds nothing, and `Number(null)` is `0`, which is finite. Without an explicit guard every absent numeric field in the component silently became a real zero. That is why:

- cell-type **Specificity** rendered a column of `0.00` — the API sends `log2fc_weighted_vs_all_parent: null` on every row of that endpoint
- a missing `p_value` read as `0`, i.e. **maximally significant**
- filters written as `numericField(row, ["beta"]) !== null` could never fire

`numericField()` now guards `null` / `undefined` / `""` before coercing. Real zeros in the data still pass through, because `field()` only skips those three values. Do not remove this guard.

#### p_value

Used as a significance flag only — it dims the specificity bar above `LIGER_SIGNIFICANCE_P` (0.05) and appears on row hover. It is never used for ranking: it underflows to `5e-324` for the strongest hits, so it cannot order them. Anything at the floor is displayed as `<1e-300` rather than a falsely precise number.

A bar is dimmed **only when a p-value is present and fails the threshold.** Not every portal returns `p_value` on every endpoint, and dimming on missing data washes out the whole column — reading as "all low confidence" when it actually means "not reported".

It discriminates well and is worth keeping:

| gene | cell states significant | programs significant |
|---|---|---|
| INS (marker) | 83% | 91% |
| PRSS1 | 59% | 31% |
| A1BG (background) | 15% | 10% |

