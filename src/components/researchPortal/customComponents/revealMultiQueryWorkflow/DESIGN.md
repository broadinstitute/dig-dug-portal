# Multi Query REVEAL — design rules

UI and product conventions for **Multi Query REVEAL**. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for structure.

## Product model

- **Linear workflow**, not a free-form canvas: Search terms → Data → Results.
- **Gates** pause the pipeline for user review at extraction and data steps.
- **Export / Import** saves workflow JSON from the query bar at any meaningful checkpoint (query through Data).

## Tab chrome

- Tabs: **Search terms** | **Data** | **Results**
- Inactive tabs use `tab-inactive` when not yet available.
- Active tab: orange underline (`#FF6600` / `#f16822` family).

## Query bar

- **Export / Import** dropdown above the query input (outline-secondary, same style as Raw data).
- **Evidence-grounded / Exploratory** toggle controls `hypothesisGenerationMode` for mechanism LLM.

## Gates

- Reuse `reveal-gate-box` + orange **Continue** (`reveal-query-submit-btn`).
- Gate step `1`: terms review. Gate step `2`: data review before hypotheses.

## Visualizers (Data tab)

- Heatmap + graph network tabs share Group by / Data category controls (`FactorBaseRevealHeatmap2`).
- Graph network tab: 600px canvas, gene nodes orange (`#f5a623`), vis.js via `FactorBaseRevealNetwork2`.

## Adding features

1. Prefer pure functions in `revealMq*.js` with unit tests.
2. Panel components emit intents; shell patches session.
3. Extend export field list in `revealMqWorkflowExport.js` when adding persistable state.
4. Bump `workflowRunId` when import or new query invalidates in-flight async work.
