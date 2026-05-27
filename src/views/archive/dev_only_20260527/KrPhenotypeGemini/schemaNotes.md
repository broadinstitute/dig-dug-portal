# KrPhenotype Data Boundary

`mockData.js` currently exports `createKrPhenotypeState()`, preserving the phenotype-search fixture and UI state.

For backend integration, split this state into:

- `query`: original user-entered HPO terms, semantic context terms, and down-weighted broad terms.
- `summary`: matched cohort count, annotation-burden QC, dominant phenotype structure, molecular evidence summary.
- `retrieval`: raw weighted phenotype-similar samples, excluding any reference sample when applicable.
- `annotation_burden_qc`: residual or n_terms-corrected checks used only as QC, not as nearest-patient ranking.
- `investigator_context`: subgroup distributions and selected sample position.
- `co_observed_phenotypes`: phenotype terms enriched among matched samples.
- `score_terms`: term weights and whether each term is query, semantic context, or down-weighted context.
- `disease_context`: disease-domain summaries derived from public disease annotations.
- `molecular_evidence`: candidate genes and variants observed among phenotype-similar samples.

Keep the raw similarity score and QC residual score separate in the API contract.
