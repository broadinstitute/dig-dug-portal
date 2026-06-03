/** Fallback CMS copy when gene.cell-state-expression.* keys are not loaded. */

export const CELL_STATE_EXPRESSION_TOOLTIP_DEFAULT = `Gene program / LIGER cell state expression for {{gene}} across tissues and cell types. Each row is one cell state with log10 CPK, log2 fold change vs its parent program, and a p-value. Filter by tissue, then cell type; use the scatter plots to compare significance with expression.`;

export const CELL_STATE_EXPRESSION_SUBHEADER_DEFAULT = `This table summarizes **cell state program expression** for **{{gene}}** from LIGER / gene-program analysis in human single-cell data. Each row is one combination of tissue, cell type, and cell state program.

- **Log10 CPK** - expression level for the gene in that cell state.
- **Log2 FC (weighted vs all parent)** - change relative to the parent program.
- **P-value** - statistical test for that contrast.

Select a **tissue** to enable **cell type** filtering. Scatter plots show **−log10(p)** on the y-axis versus log2 FC or log10 CPK on the x-axis (points colored by tissue). Hover for tissue, cell type, and state details. Download filtered rows as CSV.`;
