# CRDC Rare Disease Portal API Guide

Date: 2026-05-26  
Repository root: this `dig-dug-portal` repository

This guide defines the API contracts that should replace the current generated-fixture layer when the mockup is connected to a backend. It is intentionally **not** a DB build guide and **not** a UI status report.

The current browser mockup still reads generated JavaScript fixtures. The target backend should expose the same information as structured API responses.

---

## 1. Shared API Principles

### 1.1 Evidence Types Must Stay Separate

Do not collapse these into one vague score:

```text
phenotype similarity
active HPO context match
same-variant recurrence
same-gene recurrence
disease/reference profile overlap
secondary annotation support
```

Each API response should keep the source and calculation type explicit.

### 1.2 Active Context Is HPO-Based

Active context represents an HPO phenotype profile. For variant/gene pages, compare active context to:

```text
carrier sample HPO profiles
carrier group HPO profile
gene/disease phenotype profiles
```

Do not compare active context directly to a variant.

### 1.3 Reference DB Path

The shared sample-free reference DB for local development is:

```text
data/reference_db/crdc_reference_db_tables.rds
```

Backend implementations can load this directly, load the table-level TSV/RDS files under `data/reference_db/`, or import them into a relational database.

---

## 2. Common Response Shapes

### 2.1 HPO Term

```json
{
  "hpo_id": "HP:0001263",
  "hpo_name": "Developmental delay",
  "label": "Developmental delay [HP:0001263]",
  "source": "sample_hpo",
  "match_type": "exact"
}
```

Allowed `match_type` values:

```text
exact
related_hpo_hierarchy
co_observed
broad_category
not_matched
```

### 2.2 Disease Profile Match

```json
{
  "disease_id": "ORPHA:2322",
  "disease_name": "Kabuki syndrome",
  "disease_source": "Orphanet",
  "matched_hpo_count": 11,
  "disease_hpo_count": 18,
  "weighted_match_score": 8.42,
  "matched_hpo_terms": [],
  "reference_note": "Reference disease-HPO profile match; not a diagnosis."
}
```

### 2.3 Candidate Gene Evidence

```json
{
  "gene_symbol": "KMT2D",
  "crdc_internal_evidence": {
    "same_gene_carrier_count": 22,
    "same_variant_carrier_count": 4,
    "carrier_phenotype_overlap_count": 9
  },
  "core_reference_evidence": {
    "has_core_rare_disease_reference": true,
    "disease_ids": ["ORPHA:2322"],
    "supporting_hpo_terms": []
  },
  "secondary_annotation": {
    "panelapp_green": true,
    "pathway_count": 3
  },
  "candidate_label": "external_and_crdc_supported"
}
```

---

## 3. Front Page APIs

The front page mainly routes searches and manages active context.

### 3.1 Search Suggestions

`GET /api/search/suggest?q=<text>&type=<sample|variant|gene|hpo|disease>`

Returns:

```json
{
  "results": [
    {
      "id": "BCH-22-44945-01",
      "label": "BCH-22-44945-01",
      "type": "sample"
    }
  ]
}
```

### 3.2 Context Lookup

`GET /api/context/reference-sources`

Should list allowed context sources:

```text
HPO
Orphanet
OMIM
MONDO
DECIPHER/DDG2P-style references
sample ID
carrier HPO profile
```

The backend should resolve these to HPO term sets.

---

## 4. Sample Page APIs

### 4.1 Sample Summary

`GET /api/sample/{sample_id}/summary`

Response fields:

```json
{
  "sample_id": "BCH-22-44945-01",
  "sex": "female",
  "age_band": "12-17",
  "proband": true,
  "affected": true,
  "diagnosed": false,
  "sample_hpo_count": 107,
  "rare_variant_gene_count": 17,
  "top_disease_profile_reference": {},
  "top_cohort_affinity": {}
}
```

DB sources:

```text
sample
sample_page_summary
sample_hpo_count
sample_variant
```

### 4.2 Sample Phenotype Profile

`GET /api/sample/{sample_id}/phenotype-profile`

Should return:

```text
total HPO count
root category composition
HPO terms per root category
query/context overlap flags if context is active
```

DB sources:

```text
sample_hpo
hpo_term
hpo_edge
hpo_ancestor
```

### 4.3 Similar Samples

`GET /api/sample/{sample_id}/similar-samples?method=<exact_hpo|weighted_profile|phers>`

Response rows:

```json
{
  "rank": 1,
  "sample_id": "BCH-18-10273-01",
  "shared_hpo_count": 42,
  "searched_sample_hpo_count": 107,
  "matched_sample_hpo_count": 208,
  "similarity_to_searched_sample": 0.72,
  "matched_hpo_terms": []
}
```

The method must be explicit. If PheRS is not available, the API should say `method: exact_hpo_overlap`.

### 4.4 Sample Disease Profile Matches

`GET /api/sample/{sample_id}/disease-profile-matches`

DB source:

```text
sample_disease_profile_match_summary
disease_hpo_weight
hpo_term
```

### 4.5 Sample Gene / Variant Evidence

`GET /api/sample/{sample_id}/gene-variant-evidence`

DB source:

```text
sample_gene_variant_evidence_summary
sample_variant
same_variant_recurrence
same_gene_recurrence
carrier_context_fit_summary
gene_annotation_summary
```

---

## 5. Phenotype Page APIs

### 5.1 Phenotype Search

`POST /api/phenotype/search`

Request:

```json
{
  "query_hpo_ids": ["HP:0004352", "HP:0031816"],
  "method": "weighted_profile",
  "include_related_terms": true,
  "active_context_hpo_ids": []
}
```

Response:

```json
{
  "query": {
    "hpo_terms": [],
    "method": "weighted_profile",
    "note": "Exact, related, and broad HPO terms are scored separately."
  },
  "matched_samples": [],
  "co_observed_phenotypes": [],
  "disease_profile_candidates": [],
  "gene_candidates": [],
  "candidate_variant_overlay": []
}
```

If the backend only supports exact overlap, return:

```json
{
  "method": "exact_hpo_overlap",
  "calculation_status": "PheRS not calculated"
}
```

### 5.2 Matched Samples

`GET /api/phenotype/query/{query_id}/matched-samples`

Rows should include:

```text
rank
sample_id
investigator/cohort
query_terms_matched
total_hpo_terms
profile_similarity or exact_overlap_score
burden_corrected_residual if available
candidate_signals
```

### 5.3 Co-Observed Phenotypes

`GET /api/phenotype/query/{query_id}/co-observed-phenotypes`

Purpose:

Show additional HPO terms recurring among phenotype-matched CRDC samples.

This is CRDC internal evidence, not an external disease annotation table.

### 5.4 Reference-Derived Candidates

`GET /api/phenotype/query/{query_id}/reference-candidates`

Should separate:

```text
disease profile candidates
gene candidates
CRDC variant overlay
```

Do not present CRDC carrier evidence as if variants were inferred directly from HPO terms.

---

## 6. Variant Page APIs

### 6.1 Variant Summary

`GET /api/variant/{variant_id}/summary`

Response:

```json
{
  "variant_id": "chr2:231222761:AT:A",
  "display_label": "chr2:231,222,761 AT>A",
  "gene_symbol": "ARMC9",
  "clinvar_clnsig": "Pathogenicity not available",
  "gnomad_exome_af": 0.00001,
  "revel_score": null,
  "alphamissense_score": null
}
```

DB source:

```text
sample_variant
variant
```

### 6.2 Exact Variant Carriers

`GET /api/variant/{variant_id}/carriers`

DB source:

```text
variant_carrier
sample
sample_hpo_count
```

### 6.3 Gene-Level Carriers

`GET /api/gene/{gene_symbol}/carriers`

DB source:

```text
gene_carrier
sample
sample_variant
```

Gene-level results must deduplicate by sample ID.

### 6.4 Carrier Phenotype Profile

`GET /api/carrier-set/{carrier_set_id}/phenotype-profile`

The carrier set can represent:

```text
exact variant carriers
same-gene carriers
selected carrier samples
selected phenotype-derived carrier subset
```

Response should include root categories, sample support, top terms, and full term lists.

### 6.5 Context Match for Carrier Set

`POST /api/context/compare-carrier-profile`

Request:

```json
{
  "context_hpo_ids": ["HP:0001263", "HP:0000175"],
  "carrier_sample_ids": ["S1", "S2"]
}
```

Response:

```json
{
  "matched_context_hpo_count": 2,
  "context_hpo_count": 5,
  "matched_terms": [],
  "position_vs_crdc": "top 9.1%"
}
```

---

## 7. Implementation Notes

Current mockup files that simulate these API responses:

```text
src/views/KrSample/portalSampleData.generated.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
```

Current adapters:

```text
src/views/KrSample/mockData.js
src/views/KrPhenotype/mockData.js
src/views/KrVariant/mockData.js
```

When replacing fixtures with API calls, preserve the same UI semantics:

- Disease profile reference is not diagnosis.
- Context is HPO-based.
- CRDC recurrence is primary internal evidence.
- PanelApp/pathways are secondary annotations.
