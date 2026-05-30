# CRDC Rare Disease Portal DB Guide

Date: 2026-05-29
Repository: `dig-dug-portal`

This document explains the data model behind the current four promoted clinical browser pages:

```text
/krFront.html
/krSample.html
/krPhenotype.html
/krVariant.html
```

The current Vue browser consumes generated JavaScript fixtures. A production implementation should expose equivalent page-shaped API responses.

Service-scale assumption: the real CRDC cohort can be tens of thousands of samples. The browser should not receive full cohort tables. The database/API layer should own cohort-scale joins, search, filtering, sorting, pagination, and summary aggregation.

---

## 1. Database Layers

The portal data model has two layers.

```text
Layer 1. Shared reference database
  HPO ontology
  MONDO ontology
  disease-HPO profiles
  disease-gene links
  gene-HPO annotations
  DDG2P
  PanelApp
  Reactome / WikiPathways

Layer 2. CRDC cohort database
  sample metadata
  sample HPO terms
  sample variant calls
  exact variant carrier sets
  same-gene carrier sets
  phenotype search result sets
  carrier phenotype profiles
  co-carrier genotype profiles
  sample/gene/variant summary tables
```

The reference database is sample-free. CRDC samples are attached later.

---

## 2. Reference Database

Location:

```text
data/reference_db/
```

Combined table bundle:

```text
data/reference_db/crdc_reference_db_tables.rds
```

Important table files:

```text
hpo_term.rds / hpo_term.tsv
hpo_edge.rds / hpo_edge.tsv
hpo_ancestor.rds / hpo_ancestor.tsv
mondo_term.rds / mondo_term.tsv
mondo_xref.rds / mondo_xref.tsv
disease.rds / disease.tsv
disease_id_map.rds / disease_id_map.tsv
disease_hpo_weight.rds / disease_hpo_weight.tsv
disease_gene_weight.rds / disease_gene_weight.tsv
hpo_gene_annotation.rds / hpo_gene_annotation.tsv
hpo_gene_disease.rds / hpo_gene_disease.tsv
ddg2p_gene_summary.rds / ddg2p_gene_summary.tsv
panelapp_gene_summary.rds / panelapp_gene_summary.tsv
gene_pathway_summary.rds / gene_pathway_summary.tsv
gene_annotation_summary.rds / gene_annotation_summary.tsv
reference_source_manifest.rds / reference_source_manifest.tsv
```

The UI does not read RDS files directly. Exporters or backend endpoints should transform these tables into the page contracts below.

---

## 3. Evidence Categories

### 3.1 CRDC Internal Evidence

Examples:

- sample metadata
- sample HPO profile
- phenotype-matched CRDC samples
- exact same-variant carriers
- same-gene carriers
- co-carrier genes
- carrier sample summary
- investigator distribution

This is the primary evidence layer.

### 3.2 Core Rare Disease Reference

Examples:

- Orphanet / Orphapacket disease-HPO and disease-gene links
- OMIM/HPOA disease annotations
- MONDO mappings
- DDG2P disease-gene information

This is reference support, not diagnosis.

### 3.3 Secondary Annotation

Examples:

- PanelApp
- Reactome
- WikiPathways
- other pathway/function annotations

Missing secondary annotation should not remove CRDC candidates from display.

---

## 4. Core Reference Tables

### 4.1 HPO Tables

| Table | Key columns | Use |
|---|---|---|
| `hpo_term` | `hpo_id`, `hpo_name`, `is_obsolete` | HPO labels |
| `hpo_edge` | `hpo_id`, `parent_hpo_id` | Direct HPO graph |
| `hpo_ancestor` | `hpo_id`, `ancestor_hpo_id`, `distance` | Hierarchy-aware grouping and broad-term exclusion |
| `hpo_frequency_score_map` | frequency fields | Optional weighted phenotype scoring |

Broad anchors to exclude from displayed evidence:

```text
HP:0000001 All
HP:0000118 Phenotypic abnormality
```

They should not be counted as key terms, phenotype profile evidence, root-category evidence, or carrier phenotype support.

### 4.2 Disease And MONDO Tables

| Table | Use |
|---|---|
| `mondo_term` | MONDO labels and definitions |
| `mondo_xref` | Cross-source disease ID mapping |
| `mondo_edge` | MONDO hierarchy |
| `disease_id_map` | Normalize disease IDs across sources |
| `disease` | Portal disease entity labels |

### 4.3 Disease-HPO And Disease-Gene Tables

| Table | Use |
|---|---|
| `disease_hpo_weight` | Disease phenotype profile matching |
| `disease_gene_weight` | Gene-disease overlap and co-carrier gene support |
| `hpo_disease_phenotype_annotation` | Raw disease phenotype annotations |
| `hpo_disease_phenotype_positive` | Positive disease-HPO annotations after excluding negated terms |

### 4.4 Gene Annotation Tables

| Table | Use |
|---|---|
| `hpo_gene_annotation` | Gene-HPO annotation |
| `hpo_gene_disease` | Gene-disease links |
| `gene_annotation_summary` | Collapsed gene reference support |
| `ddg2p_gene_summary` | DDG2P support |
| `panelapp_gene_summary` | PanelApp support |
| `gene_pathway_summary` | Reactome/WikiPathways support |

When annotation is unavailable, API payloads should return an empty array or explicit unavailable status. UI should display `-` or `n/a`.

---

## 5. CRDC Input Tables

### 5.1 Sample Metadata

Expected logical table:

```text
sample_info.tsv
```

Minimum useful fields:

| Field | Meaning |
|---|---|
| `sample_id` | Stable sample identifier |
| `sex` or `gender` | Source sex value |
| `age_at_enrollment` | Display and filtering age |
| `investigator` | Investigator/cohort |
| `affected` or `affected_status` | Affected flag |
| `Proband` or `proband_status` | Proband flag |
| `Diagnosed` or `diagnosed_status` | GenDx/diagnosis metadata |
| `fam_id` | Family ID when available |

Rules:

- Use `age_at_enrollment` when present.
- Do not derive display age from `birth_year` when `age_at_enrollment` is missing.
- Preserve known sex values.
- Use `n/a` only for absent or unknown sex.

### 5.2 Sample HPO Terms

Expected logical table:

```text
sample_hpo.tsv
```

Supported shapes:

```text
sample_id    hpo_terms
S001         HP:0000175;HP:0001263
```

or:

```text
sample_id    HP:0000175    HP:0001263
S001         1             1
```

Derived concepts:

| Concept | Meaning |
|---|---|
| `sample_hpo` | One row per sample-HPO term |
| `sample_hpo_count` | Unique HPO term count per sample |
| `sample_hpo_profile` | Display-ready sample HPO terms |
| `root_category_profile` | HPO terms grouped under broad root categories |

Phenotype overlap should exclude `HP:0000001` and `HP:0000118`.

### 5.3 Sample Variants

Expected logical table:

```text
sample_variant.tsv
```

Minimum fields:

| Field | Meaning |
|---|---|
| `sample_id` | Carrier sample |
| `variant_id` | Variant key, usually `chrom:pos:ref:alt` |
| `gene_symbol` | Gene symbol |
| `genotype` or `GT` | Sample genotype |

Useful annotation fields:

| Field | Meaning |
|---|---|
| `Consequence`, `IMPACT`, `BIOTYPE` | VEP-style annotation |
| `depth` or `DP` | Read depth |
| `gnomad_exome_af` | Population AF |
| `clinvar_clnsig` | ClinVar label |
| `lof_class` | LoF/LoFTEE |
| `revel_score` | REVEL |
| `alphamissense_score` | AlphaMissense |

The current fixture is rare/damaging-enriched. Do not imply that it contains all VCF calls unless the production backend provides all calls.

---

## 6. Sample Page Data Contracts

### 6.1 Sample Summary

Used by `/krSample.html`.

The Sample page Overview renders this payload as line-separated metadata and analysis rows. The API should return semantic groups and typed values, not presentation-specific "card" objects. The frontend decides whether a group is displayed in the main analysis column, the sample metadata column, an info popover, or a table row.

```json
{
  "sample_id": "BCH-22-44945-01",
  "sex": "female",
  "age_at_enrollment": 16,
  "investigator": "benjamin_raby",
  "affected_status": "Yes",
  "proband_status": "Yes",
  "diagnosed_status": "Undiagnosed",
  "hpo_term_count": 131,
  "rare_coding_gene_count": 10
}
```

### 6.2 Similar By Phenotype

Each row should include:

| Field | Meaning |
|---|---|
| `sample_id` | Similar sample |
| `phenotype_profile_similarity` | Normalized display score, if calculated |
| `shared_hpo_count` | Count after broad HPO exclusions |
| `shared_hpo_denominator` | Query sample HPO denominator after exclusions |
| `shared_hpo_terms` | Display terms |
| `shared_genes` | Array of genes shared between searched sample and similar sample |
| `investigator`, `sex`, `age_at_enrollment` | Metadata |

`shared_genes` must be an array, because the UI links each gene separately to Variant page.

Example:

```json
{
  "sample_id": "BCH-21-49631-01",
  "phenotype_profile_similarity": 0.504,
  "shared_hpo_count": 79,
  "shared_hpo_denominator": 129,
  "shared_genes": ["HLA-DRB5", "ITM2C", "MAML3", "PIKFYVE"],
  "age_at_enrollment": 0
}
```

### 6.3 Genotype Query Options

Used by the Sample page query builder.

```json
{
  "sample_id": "BCH-22-44945-01",
  "query_options": [
    {
      "gene_symbol": "LCA5",
      "variant_id": "chr6:79518824:A:T",
      "consequence": "stop_gained",
      "is_gendx": false,
      "source": "sample_rare_coding_variant"
    }
  ]
}
```

Changing a selected gene or variant should trigger a new genotype similarity result, or the frontend should derive it from a page-shaped fixture.
All table-shaped Sample page result sets should carry enough typed values for client-side sorting. Counts should be numeric in the API payload, with display labels added separately when needed.
For production cohorts, server-side sorting and pagination are required. Client-side sorting is acceptable only on the current returned page or compact mock fixtures.

### 6.4 Genotype Similarity

Same variant and same gene must be separate result groups.

Same variant row:

```json
{
  "group": "same_variant",
  "sample_id": "01-0400",
  "shared_gene": "LCA5",
  "query_variant": "chr6:79518824:A:T",
  "matched_variant": "chr6:79518824:A:T",
  "display_variant_evidence": "chr6:79518824:A:T",
  "phenotype_overlap": {
    "count": 1,
    "denominator": 129,
    "method": "sample_hpo_overlap_excluding_broad_roots"
  },
  "phenotype_profile_similarity": 0.004,
  "shared_hpo_terms": ["Constitutional symptom [HP:0025142]"]
}
```

Same gene row:

```json
{
  "group": "same_gene",
  "sample_id": "BCH-21-49631-01",
  "shared_gene": "MAML3",
  "phenotype_overlap": {
    "count": 79,
    "denominator": 129,
    "method": "sample_hpo_overlap_excluding_broad_roots"
  },
  "phenotype_profile_similarity": 0.504,
  "shared_hpo_terms": [
    "Abnormality of head or neck [HP:0000152]",
    "Abnormality of the head [HP:0000234]",
    "Abnormality of the face [HP:0000271]"
  ]
}
```

Important distinction:

- Same variant rows may show variant evidence, but the display value should be concise. If `query_variant` and `matched_variant` are the same, show only one variant ID.
- Same gene rows should not require or display variant position evidence.
- Same gene rows should update when the selected gene changes.
- `shared_hpo_terms` drives the phenotype-overlap popover.
- If `phenotype_overlap.count` is 0, the API should still make clear whether the compared sample has no HPO terms, only broad excluded HPO terms, or no overlap after broad-term exclusion.
- In the current test DB, `BCH-17-02291-01` has one raw `sample_hpo` row and zero non-broad HPO terms after excluding `HP:0000001` and `HP:0000118`; therefore its overlap with `BCH-21-24935-01` is displayed as 0 in the current fixture. If production data has more HPO terms for that sample, the source export must be corrected before UI display.

---

## 7. Phenotype Page Data Contracts

Phenotype search starts from a query HPO profile and returns:

| Result group | Meaning |
|---|---|
| matched samples | CRDC samples whose HPO profile overlaps the query |
| selected matched sample | One matched sample inspected in detail |
| co-observed phenotypes | Additional HPO terms recurring among matched samples |
| disease candidates | External disease profiles matching the query/matched set |
| gene candidates | Genes from reference evidence and/or CRDC matched-sample carrier evidence |
| variant overlay | Variants observed among phenotype-matched samples |

Matched sample row:

```json
{
  "sample_id": "BCH-19-90796-01",
  "sex": "Female",
  "age_at_enrollment": 16,
  "investigator": "clinical_sequencing",
  "query_terms_matched": 4,
  "profile_similarity": 0.72,
  "score_method": "exact_hpo_overlap",
  "residual_status": "not_calculated"
}
```

Use actual `age_at_enrollment` when present. Do not display old coarse bins as the primary age value.

---

## 8. Variant Page Data Contracts

### 8.1 Carrier Sample Row

```json
{
  "sample_id": "BCH-18-97460-03",
  "age_at_enrollment": 48,
  "sex": "Male",
  "genotype": "1/1",
  "hpo_term_count": 0,
  "carrier_gene_count": 10,
  "investigator": "scott_snapper",
  "proband_status": "non-Proband",
  "affected_status": "No",
  "diagnosed_status": "n/a",
  "variant_genes": ["SLC6A7", "ARMC9", "LUZP1"]
}
```

### 8.2 Carrier Sample Summary

Computed after current carrier filters.

```json
{
  "current_count": 13,
  "total_count": 13,
  "sex_distribution": {
    "all": 13,
    "female": 6,
    "male": 6,
    "unknown": 1
  },
  "age_at_enrollment_distribution": [
    { "age": 7, "female": 0, "male": 1, "unknown": 0, "total": 1 },
    { "age": null, "label": "n/a", "female": 5, "male": 2, "unknown": 1, "total": 8 }
  ]
}
```

### 8.3 Carrier Phenotype Profile

Fields:

| Field | Meaning |
|---|---|
| `hpo_id`, `hpo_name` | Term or root category |
| `all_count`, `all_denominator` | Count among all carriers at selected level |
| `subset_count`, `subset_denominator` | Count after current filters |
| `representative_terms` | Supporting descendant HPO terms |
| `supporting_sample_ids` | Samples supporting the term |

### 8.4 Co-Carrier Genotype Profile

Fields:

| Field | Meaning |
|---|---|
| `gene_symbol` | Co-carrier gene |
| `carrier_count` | Selected carriers with a qualifying variant in the gene |
| `carrier_denominator` | Current carrier denominator |
| `carrier_sample_ids` | Supporting sample IDs |
| `gene_disease_overlap` | Disease-gene reference overlap |
| `secondary_annotation` | DDG2P/PanelApp/pathway support |

Example:

```json
{
  "gene_symbol": "ARMC9",
  "carrier_count": 6,
  "carrier_denominator": 6,
  "carrier_sample_ids": ["BCH-19-13617-02", "BCH-21-43457-02"],
  "gene_disease_overlap": [
    {
      "source": "ORPHA",
      "disease_id": "ORPHA:475",
      "disease_name": "Isolated Joubert syndrome",
      "overlap_gene_count": 1,
      "linked_gene_count": 30
    }
  ],
  "secondary_annotation": [
    { "source": "DDG2P", "label": "Joubert syndrome" }
  ]
}
```

This is reference evidence for gene overlap, not diagnosis.

### 8.5 Per-Position Carrier Count

The Variant page locus area needs position-level count rows:

| Field | Meaning |
|---|---|
| `position` | Genomic coordinate |
| `carrier_count` | Count after current density filters |
| `queried_variant` | Whether this is the searched variant |
| `sex_filter`, `age_filter`, `investigator_filter` | Applied filters |

Y-axis ticks should round up to 5-count steps. Example: max count 141 should render to 145.

---

## 9. Generated Fixture Bridge

Current generated files:

```text
src/views/KrSample/portalSampleData.generated.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
src/views/KrClinicalFocus/portalDiseaseReferenceData.generated.js
```

Current export command:

```bash
Rscript scripts/export_portal_test_fixtures.R
```

Fixture size guidance:

- Current generated fixtures are small mock fixtures for UI validation. The fixture size may change whenever the test DB is regenerated.
- A several-thousand-sample page-shaped mock fixture is useful for local realism and long-tail behavior checks.
- Tens of thousands of samples should be served through API endpoints, not bundled into JavaScript fixtures.
- Do not export all sample-HPO, sample-variant, and carrier rows to the browser. Export or serve only the rows and summaries required for the current page, current query, and current filters.

The exporter or API should own:

- sample metadata joins
- known sex preservation
- `age_at_enrollment` preservation
- broad HPO root exclusion
- phenotype overlap calculations
- exact variant recurrence
- same-gene recurrence
- carrier sample summaries
- carrier phenotype profile calculations
- co-carrier gene calculations
- disease-gene overlap and secondary annotation

The Vue page layer should own:

- local UI state
- display sorting/filtering on page-shaped data
- popovers and accordions
- route construction
- `n/a` and `-` display normalization

Production API responsibilities:

- index sample metadata by `sample_id`, investigator, sex, age, proband, affected, diagnosis, and cohort fields
- index `sample_hpo` by sample and HPO term, with broad HPO roots excluded from overlap displays
- index variants by exact variant key and gene symbol
- precompute or efficiently compute phenotype overlap candidates
- precompute or efficiently compute same-variant and same-gene recurrence
- return table rows with `total_available`, `filtered_total`, `limit`, `offset`, and typed sort fields
- return popover payloads, such as shared HPO terms or supporting sample IDs, lazily when the user opens them if they are too large for the base response

---

## 10. Guardrails

- Do not treat disease references as diagnosis.
- Do not hide CRDC evidence because secondary annotation is missing.
- Do not derive age from `birth_year` when `age_at_enrollment` is absent.
- Do not overwrite known sex values.
- Do not show `Sex NA`; use `n/a`.
- Do not mix exact variant carrier counts with same-gene carrier counts.
- Do not count broad HPO anchors as evidence.
- Do not use variant-position evidence as a required column for same-gene rows.
- Do not expose ignored `docs/not_share/` files as shared docs.

---

## 11. Validation

Patch hygiene:

```bash
git diff --check
```

Build:

```bash
npm run build
```
