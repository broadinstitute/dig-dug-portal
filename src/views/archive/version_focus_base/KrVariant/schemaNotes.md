# KrVariant Data Boundary

`mockData.js` currently exports `createKrVariantState()`, preserving the queried-variant fixture and UI state.

For backend integration, split this state into:

- `query`: normalized variant identifier, display label, genome build, cytoband, and pathogenicity label.
- `locus_window`: coordinate window, axis ticks, disease track, exon/base/codon track, marker positions, and carrier-count density.
- `variant_evidence`: ClinVar, gnomAD AF, REVEL, AlphaMissense, LoFTEE, carrier count.
- `gene_context`: nearest gene, gene-level carrier count, P/LP variant count, disease signals.
- `carrier_reference`: variant-level and gene-level carrier sample sets.
- `carrier_phenotype_profile`: HPO root-category summaries and term lists for carrier reference sets.
- `investigator_context`: carrier phenotype reference-set position against investigator signatures.
- `demographics`: age, sex, proband, affected, GenDX summaries for the selected level.

Variant-level and gene-level summaries should be separate API scopes, not inferred only from frontend tabs.
