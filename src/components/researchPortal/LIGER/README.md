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

The program endpoints return dataset IDs instead of tissue labels, so there is a temporary hardcoded mapping in `LigerBrowser.vue`.

- `artery` -> `FNIH_Artery_scRNA_v2.2`
- `heart` -> `FNIH_Heart_scRNA_v3.2`
- `hypothalamus` -> `FNIH_Hypothalamus_scRNA_v2.2`
- `kidney` -> `FNIH_Kidney_scRNA_v2.2`
- `liver` -> `FNIH_Liver_scRNA_v3.2`
- `muscle` -> `FNIH_Muscle_scRNA_v2.2`
- `pancreas` -> `FNIH_Pancreas_scRNA_v2.2`
- `sat` -> `FNIH_SAT_scRNA_v2.2`
- `vat` -> `FNIH_VAT_scRNA_v2.2`

Config note:

- keep this mapping consistent on `datasetId` only
- do not mix `datasetId` and `datasetID`

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

These definitions were explicitly called out during implementation and should remain the interpretation basis unless the API changes.

- Bars show absolute expression.
- Absolute expression is `log10(CP10K + 1)`, where CP10K is gene counts normalized per 10,000 total cell counts and averaged within the cell type.
- Specificity is log2 fold-change of the cell-type mean expression versus the other cell types in the tissue.

## Current Field Assumptions

### Expression values

Current preferred fields in the component:

- ABS / expression basis:
  - `log10_cpk`
  - fallback `log10_cp10k`
- SPEC:
  - `log2fc_weighted_vs_all_parent`
  - then nearby fold-change fallbacks

### Bars

Bars are intended to scale consistently within a section from the section minimum ABS value to the section maximum ABS value, using the same absolute-expression metric shown in the `ABS` column.

If bars look visually wrong again, inspect:

- `absoluteExpressionValue()`
- `metricRange()`
- `barWidth()`
- `toExpressionList()`
- `availableCellTypes()`

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
