# Transcriptomics

Bulk transcriptomic gene viewer for the MATKP portal. Builds to `transcriptomics.html`.

## Overview

A gene-first viewer for differential expression results across curated bulk RNA-seq studies in human and mouse adipose tissue. The user searches a gene symbol and sees results grouped by biological outcome (age, obesity status, genotype, depot type, etc.), summarized using meta-analysis across datasets.

## Key features

- Gene search with URL sync (`?gene=LEP&outcome=age`). Defaults to ADIPOQ on first load.
- Human / mouse toggle — filters all outcome sections to the selected species.
- Dataset, depot, and adjusted P-value filters in the sticky gene bar.
- Sidebar nav with scroll-linked outcome highlighting and direct jump-to links.
- Forest plots for continuous/categorical outcomes: compact effect-size rows with CI bars, pooled meta-analysis row, and collapsible evidence table.
- Volcano plot for genotype/perturbation outcomes: log2FC vs −log10(p) scatter with significance thresholds, synchronized label list, and hover cross-linking.
- Tooltips on all rows showing study details, comparison label, effect, CI, and p-values.

## Main files

| File | Role |
|------|------|
| `main.js` | Vue root — API fetch, ortholog resolution, URL params, filtering, scroll tracking, plot data prep |
| `Template.vue` | Page layout, gene bar, sidebar nav, forest plot UI, volcano layout, evidence tables |
| `VolcanoPlot.vue` | D3-based volcano plot component (SVG only, responsive via ResizeObserver) |
| `../../utils/forestGeneApi.js` | BioIndex `single-cell-forest` query client |
| `../../utils/buildForestGenePayload.js` | API row → page payload adapter (outcome grouping, axis labels, row normalisation) |

## API

Data comes from the MATKP BioIndex endpoint:
```
GET /api/bio/query/single-cell-forest?q={gene}
```
The `OUTCOME_ORDER` constant in `buildForestGenePayload.js` controls the display order of outcome sections.
