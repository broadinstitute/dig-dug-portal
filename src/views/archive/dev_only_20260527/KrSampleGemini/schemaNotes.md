# KrSample Data Boundary

`mockData.js` currently exports `createKrSampleState()`, which preserves the existing mock UI state and sample-centered evidence data.

For backend integration, split this state into:

- `query`: requested `sample_id`.
- `sample`: identity, HPO count, GenDX status, sex, age group, investigator group, affected/proband flags.
- `summary`: closest phenotype match, group affinity, public disease hypothesis.
- `cohort_position`: phenotype-neighbor retrieval and investigator phenotype-signature affinity.
- `phenotype_similarity`: similar samples by raw weighted phenotype similarity, excluding self.
- `genotype_similarity`: same variant, same gene, and same pathway/mechanism groups.
- `disease_hypotheses`: public disease profile matches with matched/missing features.
- `candidate_genes`: gene-first rare coding evidence, with variants nested under each gene.

Keep score metadata explicit: `method`, `reference_set`, `denominator`, and `score_meaning` should travel with every score shown in the UI.
