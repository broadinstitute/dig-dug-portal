# LIGER Component Notes

This folder contains the in-progress LIGER browser component for the portal.

## Primary Files

- `LigerBrowser.vue`
  - Main working component.
  - Keep new component logic here unless there is a strong reason to split files later.
- `references/cell_state_program_explorer_v3.html`
  - Behavior and product reference.
  - Do not copy its styles directly; use it for interaction, data flow, labels, and section intent.
- `references/liger_apis.txt`
  - Source of truth for the currently intended LIGER endpoints and host.

## Component Config

`LigerBrowser.vue` accepts an optional `config` object for small per-page overrides.

Current supported keys:

- `pageTitle`
  - Overrides the hero title.
  - Default: `Cell State & Program Explorer`
- `documentationUrl`
  - Overrides the `Read Documentation` link target.
  - Default: `/research.html?pageid=kp_liger_documentation`
- `tissues`
  - Optional allowlist of tissue keys to expose in results.
  - Example values: `["liver"]`, `["liver", "pancreas"]`
  - If omitted or empty, all tissues are shown.
- `hideTissueCardIfOneOption`
  - Controls the one-tissue layout case.
  - Default: `false`
  - When only one tissue is available, that tissue is auto-selected.
  - If this flag is `true`, the tissue card is hidden in that one-option case and the expression heading changes to `Where is {GENE} expressed in {Tissue}?`

Example:

```js
config: {
  pageTitle: "Liver Cell State Explorer",
  documentationUrl: "/research.html?pageid=my_docs",
  tissues: ["liver", "pancreas"],
  hideTissueCardIfOneOption: true,
}
```

## Important Constraints

- Maintain the structure and visual language already established in `LigerBrowser.vue`.
- The HTML prototype is reference-only, not a styling source.
- New JS files or components for this tool should stay in this folder.
- Avoid reusing unrelated shared repo components for this tool unless explicitly requested.
- Use the APIs and host from `references/liger_apis.txt`.
- Progressive disclosure matters:
  - Search gene first
  - Then show tissues
  - Then show cell-type expression after tissue selection
  - Then show cell-state / gene-program sections only after cell-type selection

## API Host

LIGER now has a code-level host selection toggle in `LigerBrowser.vue`.

- Default behavior:
  - use `BIO_INDEX_HOST` from `@/utils/bioIndexUtils`
  - if the page is running on `localhost`, `127.0.0.1`, or `0.0.0.0`, force dev BioIndex at runtime
- Optional override:
  - set `LIGER_FORCE_DEV_BIOINDEX = true` to force `https://bioindex-dev.hugeamp.org` everywhere

Important implementation detail:

- `BIO_INDEX_HOST` in this repo is compile-time injected by `vue.config.js`; it is not inherently runtime-aware of localhost
- LIGER therefore adds its own localhost fallback logic

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

`gene-program-factor` now also provides a `rationale` field used in the program drawer under `Suggested label`.

### State/program relationship heatmap

- `/api/bio/query/gene-program-heatmap?q=<tissue>,<cellType>`

This powers:

- the metric-switchable state/program relationships heatmap
- curated-state match context for gene-program drawer details
- QC-state match context for gene-program drawer details

Current UI orientation:

- cell states on the left
- gene programs across the top

### Trait links heatmap

- `/api/bio/query/gene-program-cell-state-trait-factor?q=<tissue>,<cellType>,<stateId>`
- `/api/bio/query/gene-program-trait-factor?q=<datasetId>,<cellType>,<model>,<factorId>`
- `/api/portal/phenotypes?q=md`

`/api/portal/phenotypes` is served only by the hugeamp bioindex; other portals return `501`. It is therefore pinned to `LIGER_PHENOTYPES_HOST` rather than `LIGER_API_HOST`, so it stays on hugeamp regardless of which portal hosts the component. It is the only endpoint that does not follow the resolved host.

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

- grouped trait heatmap rows
- state drawer trait tables
- program drawer trait tables

Important behavior:

- trait identity should stay keyed by raw API trait values internally
- displayed trait labels should prefer phenotype `description` from `/api/portal/phenotypes?q=md`
- trait group labels should come from phenotype `group`
- rows with no matching phenotype label can now be filtered out in code via `LIGER_FILTER_UNLABELED_HEATMAP_TRAITS`
- that same filter also applies to drawer trait tables

### Program gene loadings

- `/api/bio/query/gene-program-gene-factor?q=<datasetId>,<cellType>,<model>,<factorId>`

This powers:

- gene-program drawer top-gene-loading table

### Program gene set associations

- `/api/bio/query/gene-program-gene-set-factor?q=<datasetId>,<cellType>,<model>,<factorId>`

This powers:

- gene-program drawer gene set associations table

### Program QC states

- `/api/bio/query/gene-program-qc-factor?q=<datasetId>,<cellType>,<model>,<factorId>`
- `/api/bio/query/gene-program-qc-metadata-extended?q=1`

These power:

- program drawer QC bubbles
- program drawer QC badge colors
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

### Search

- Gene autocomplete is self-contained inside `LigerBrowser.vue`.
- Selecting a suggestion or pressing Enter triggers the initial gene load.
- If no tissues are available for the gene, keep the search feedback visible but do not render `#liger-body`.

### Tissue card

- Shows human-readable tissue names only.
- Count is shown in header: `Tissue (N)`.
- No downstream sections should render real data before tissue / cell-type selection.

### Cell type expression card

- Loads only after tissue selection.
- Count is shown in header: `Cell Type (N)`.
- Uses bars plus numeric `ABS` and `SPEC`.
- `ABS` and `SPEC` headers now use custom hover tooltips instead of native HTML `title`.
- Labels are prettified for display:
  - underscores replaced with spaces
  - words capitalized

### Cell state / gene program cards

- Remain behind overlay until a cell type is selected.
- Support `Show Expression` / `Show Info` toggle.
- Expression and info ordering should match.
- Expression-card labels should truncate with ellipsis.
- Info-card labels can wrap normally.
- Count badges should reset to `0` unless a cell type is currently selected.
- Expression rows now also have metadata hover tooltips:
  - cell-state rows open a tooltip to the right
  - gene-program rows open a tooltip to the left
  - tooltip footer says `Click row for full metadata`
- Keep `Show Info` and the info-card layouts in place for now even though tooltip previews now exist.
- When a drawer is open, the matching state/program row should stay highlighted in both expression and info views.

### Relationships heatmap

- Loads only after cell-type selection.
- Has its own loading and error state.
- Supports metric switching based on the available heatmap payload fields.
- Uses sticky headers / row labels and click-through into drawer details.
- Cell tooltips are custom floating overlays, not native `title`, to avoid clipping by the scroll container.
- Cell states are row headers.
- Gene programs are column headers.

Current cell tooltip content includes:

- cell state
- gene program
- active metric value
- marker score
- GSEA NES
- GSEA P
- GSEA q

### Trait links heatmap

- Loads only after cell-type selection.
- Has its own loading and error state.
- Supports:
  - `joint beta`
  - `marginal beta`
  - `states + factors`
  - `factors only`
  - `states only`
- Trait rows are selected from the union of each visible column's top absolute beta values.
- Trait rows are grouped by phenotype `group` from `/api/portal/phenotypes?q=md`.
- Trait labels should show phenotype `description` when available.
- Cell tooltips are custom floating overlays, not native `title`, to avoid clipping by the scroll container.

Current cell tooltip content includes:

- trait
- linked cell state or gene program
- joint score
- marginal score

### Side drawer

- Clicking a cell state or gene program from cards or heatmaps can open a right-side drawer.
- If a `cell_state` query param is present on load, open the cell-state drawer automatically.
- If a `gene_program` query param is present on load, open the gene-program drawer automatically.
- On query-string hydration, the drawer should open before the full trait heatmap finishes loading; phenotype labels needed by the drawer are loaded separately.

Current drawer coverage should match the prototype:

- Curated state drawer:
  - what this state represents
  - gene interpretation / caveats / follow-up / overinterpretation guidance
  - marker genes
  - marker provenance
  - curation + references
  - related programs with significant matches
  - human genetic trait anchors
- Inferred program drawer:
  - summary
  - suggested label + AI badge
  - rationale
  - quality / QC badges
  - curated-state matches
  - top gene loadings
  - top anchor traits
  - gene set associations

Current drawer-specific behavior:

- inferred program drawer title should use the readable label only, not `FactorN - label`
- state drawer no longer shows the `Advanced / methods details` accordion
- program drawer no longer shows `Collection`
- `Suggested label` has an `AI` pill with a placeholder tooltip that can be revised later
- program drawer QC bubbles now prefer the dedicated QC API over inferred relationship-heatmap QC rows
- if the dedicated QC API is unavailable, fall back to the older QC-match-derived bubbles

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
- `cell_state` and `gene_program` are mutually exclusive in the URL and should clear each other when drawer target changes
- if a drawer target is present in the URL, do not block the drawer on the trait heatmap load

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
- relationship heatmap
- trait heatmap
- drawer detail fetches

If new sections are added, add explicit section-level loading and error states too.

## Known Rough Edges / Follow-ups

- Internal card scrolling is still relatively simple.
- Some layout behavior is intentionally lightweight and may still need polish.
- Program descriptions / summaries still rely on a mix of inferred labels and available metadata.
- Trait-to-phenotype matching depends on API naming consistency between trait rows and `/api/portal/phenotypes?q=md`.
- Deep-link restoration should be browser-checked after any major interaction-flow changes.

## Resume Checklist

If starting cold, do this first:

1. Open `LigerBrowser.vue`.
2. Open `references/liger_apis.txt`.
3. Open `references/cell_state_program_explorer_v3.html`.
4. Verify current progressive-disclosure behavior still works:
   - search gene
   - select tissue
   - select cell type
   - toggle expression/info
   - load relationships heatmap
   - load grouped trait heatmap
   - open both drawer types
5. Verify deep-link behavior:
   - `gene`
   - `tissue`
   - `cell_type`
   - `cell_state`
   - `gene_program`
6. Keep labels human-readable and avoid leaking raw IDs unless absolutely necessary.
