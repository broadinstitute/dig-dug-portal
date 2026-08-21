# PB Sample prototype integration handoff

For production implementation, start with
[`pb_sample_engineering_integration_handoff.md`](pb_sample_engineering_integration_handoff.md).
It defines the required sample-keyed variant source, separately precomputed
Tier/Type artifact, phased agent workflow, stop conditions, and acceptance
checks. This document remains the shorter prototype behavior and payload record.

This document records the production-facing contract of the PB Sample mockup.
The current page is a UI fixture; none of its sample, family, HPO, variant,
disease, PheRS, percentile, investigator, or ClinVar values are production data.

## Entry point

- Page: `pb_sample.html?query=<sample_id>`
- Vue view: `src/views/PbSample/`
- Connected pages: PB Front, Phenotype, Gene, and Variant
- Local review URL:
  `http://127.0.0.1:8095/pb_sample.html?query=BCH-00-00000-01&fixture=1`

## BCH prototype integration status (2026-08-21)

- `patient_id` and `sample_id` are treated as the same canonical identifier.
- The private `patient` index is advertised with query key `patient_id`, but the
  live query currently returns HTTP 400: `Index "patient" is not built`.
- `gene-samples` and `gene-variants-crdc` are both keyed by gene, not sample.
  They cannot discover a sample's complete variant set from a sample ID alone.
- Gene and Variant carrier links pass only the canonical sample ID. They do not
  attach a gene to the Sample page.
- `gene-variants-crdc` is a reference for the annotation fields and row format
  already used on Gene/Variant pages. It is not the source for discovering a
  sample's All variants.
- Sample `All` requires a sample-keyed variant source. The browser must not scan
  every gene or present an arbitrary gene context as the sample's All call set.
- Tier/Type is not derived from either BioIndex. Types 1–6 remain unavailable
  until the separate classifier result is supplied and connected at
  variant-disease grain.
- Mock data is opt-in only with `fixture=1`; live routes never fall back to it.

## Final mockup behavior

### Sample summary

- Shows affected status, sex, age at enrollment, investigator, total HPO count,
  and the dominant direct child of `Phenotypic abnormality [HP:0000118]`.
- Omits proband, diagnosis status, and rare-coding-carrier-gene count.
- Groups family members by family ID and displays them as case, twin, sibling,
  mother, and father. Mother and father have equal ordering priority.

### Phenotype profile

- Uses a 4.5:5.5 composition-to-similarity layout on wide screens and stacks on
  narrow screens.
- Groups all sample HPO terms under direct children of `HP:0000118`; a tied
  maximum is allowed for the dominant group.
- Each group is expandable, initially shows five terms, and can show or hide the
  remainder.
- `Similar phenotype profiles` starts with investigator summaries, followed by
  sample matches. Both tables are sortable and reveal five more rows at a time.
- Sample matches show rank, sample ID, matched HPO count, investigator, age, and
  sex. The current sample and its family are excluded. Only the top 50 matches
  are displayed.
- Investigator summaries show median residual PheRS, IQR, and eligible sample
  count. These summaries use the full eligible set, not only the displayed top
  50 samples.

### Genotype profile: All

- Groups the sample's variant calls by gene and expands to Gene-page-compatible
  variant rows.
- Shows variant, GT, CRDC carrier frequency, classification/consequence,
  Pathogenic Score, and mean carrier residual PheRS.
- Links directly to the Gene page and to the Variant page.
- Pathogenic Score follows the existing PB Gene display contract: LoFTEE HC is
  `1.00`; otherwise AlphaMissense is used; REVEL-only values are displayed as
  `—*` and excluded from this score.
- Mean carrier residual PheRS is the mean score among carriers when the current
  sample's HPO set is used as the reference phenotype. It is not the old generic
  context-based match score.

### Genotype profile: Type findings

- Filters are All, Types 1–2, Types 3–4, and Types 5–6. Selecting the active
  filter again closes it.
- Type 1–2 represents ClinVar RCV pathogenic/likely pathogenic evidence;
  Type 3–4 represents qualifying known-gene evidence; Type 5–6 represents
  high-impact unknown-gene discovery evidence.
- Tier and ClinVar VCV review stars remain visible evidence fields.
- A variant can have more than one disease. PheRS and HPO overlap are therefore
  rendered per disease, never as one variant-level aggregate.
- Each disease row shows `matched_hpo_count / disease_hpo_count`,
  `phenotype_coverage`, sample disease-specific percentile, investigator mean
  percentile, and their percentile-point difference.
- Lower than the investigator mean is green; higher is red. The investigator
  marker is a vertical line and the sample marker is a blue circle.
- The former `Investigator cohort fit` sentence was removed. For Type 1–4,
  classifier `MATCH/OUTSIDE` describes investigator-declared disease/HPO scope;
  it is not a comparison with an aggregate investigator patient phenotype.

## Required production payloads

Do not invent missing values or fall back to fixture values. Return unavailable
fields as null and render `Unavailable` or `—` as appropriate.

### Sample and family

- `sample_id`, `affected`, `sex`, `age_at_enrollment`, `investigator`
- `family_id` and family members with `sample_id` and normalized `role`

### Phenotype

- Sample HPO IDs and labels
- HPO ontology ancestry needed to map terms to direct children of `HP:0000118`
- Similar-sample rows: rank, sample ID, matched HPO count, investigator, age, sex
- Investigator rows: rank, investigator, median residual PheRS, Q1, Q3, and n
- Eligible denominator and exclusions used for the similarity calculation

The phenotype similarity calculation uses the current sample's HPO set as the
reference. The scoring script uses `wp = HPO information content` and binary
`fi = 0/1`; production integration must preserve the script's eligibility and
residualization rules instead of reproducing them in Vue.

### All genotype variants

- Variant ID, gene, transcript, consequence, GT
- CRDC carrier frequency, gnomAD AF, LoFTEE, AlphaMissense, REVEL, ClinVar
- Tier/Type when available
- Mean carrier residual PheRS and the carrier denominator used to calculate it

The full per-sample call set can be large. The API must support server-side
pagination or incremental loading; the three fixture rows are not a size model.

### Type findings, at variant-disease grain

- Variant ID, gene, consequence, GT, Tier, Type
- ClinVar classification and VCV review status/stars
- Disease ID
- `matched_hpo_count`, `disease_hpo_count`, `phenotype_coverage`
- Disease-specific residual PheRS, eligible denominator, and sample percentile
- Investigator leave-one-out comparison value and eligible n
- Type 1–4 scope result and basis; Type 5–6 discovery/cohort fields from the
  classifier output

The same sample-disease pair must have the same PheRS and HPO-overlap values
wherever it appears, regardless of how many variants point to that disease.

## Remaining backend boundary

The PB Sample view is present in `bch-prototype` and uses the existing private
BioIndex helper with `query_private=true`. A complete production page still
requires built sample-keyed sources for metadata/family, HPO, residual PheRS,
complete sample variants, and classifier results. Do not replace these missing
sources with a browser-side scan of every gene or with fixture values.

## Verification

Run from the repository root:

```bash
node src/views/PbSample/familyModel.test.js
node src/views/PbSample/variantEvidence.test.js
node src/views/PbSample/tableSort.test.js
node src/views/PbSample/sampleRecord.test.js
node src/views/PbFront/searchModel.test.js
npm run build
```

The existing `tabix-reader` default-export warning is unrelated to PB Sample.
