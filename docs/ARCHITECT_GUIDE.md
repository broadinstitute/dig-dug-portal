# CRDC Rare Disease Portal Architect Guide

Date: 2026-05-29
Repository: `dig-dug-portal`

This document is the shared architecture guide for the current clinical database search browser mockup. It is written for teammates who need to understand the promoted UI, the generated fixture bridge, and the future API boundary.

The active product surface is the four promoted Korean rare-disease pages:

```text
/krFront.html
/krSample.html
/krPhenotype.html
/krVariant.html
```

For table-level database meaning, read this together with `docs/DB_portal.md`.

---

## 1. Promoted Page Structure

| Page | URL | Entry | Template | Page model | Fixture adapter |
|---|---|---|---|---|---|
| Front search | `/krFront.html` | `src/views/KrFront/main.js` | `src/views/KrFront/Template.vue` | `src/views/KrFront/pageModel.js` | none |
| Sample search | `/krSample.html` | `src/views/KrSample/main.js` | `src/views/KrSample/Template.vue` | `src/views/KrSample/pageModel.js` | `src/views/KrSample/mockData.js` |
| Phenotype search | `/krPhenotype.html` | `src/views/KrPhenotype/main.js` | `src/views/KrPhenotype/Template.vue` | `src/views/KrPhenotype/pageModel.js` | `src/views/KrPhenotype/mockData.js` |
| Variant / gene search | `/krVariant.html` | `src/views/KrVariant/main.js` | `src/views/KrVariant/Template.vue` | `src/views/KrVariant/pageModel.js` | `src/views/KrVariant/mockData.js` |

The old `_reframe` page set is no longer part of the shared source tree or default build. It is retained only in ignored local archive storage:

```text
docs/not_share/archive/retired_reframe_views_20260529/
```

Because `docs/not_share/` is ignored, that archive is not pushed to teammates.

---

## 2. Page File Convention

Each promoted page should keep a predictable split:

```text
main.js
  Vue mount and store bootstrap.

Template.vue
  Rendered page structure, page-local UI state, and event binding.

pageModel.js
  Computed values, sort/filter helpers, URL builders, normalization helpers,
  display labels, and derived page behavior.

mockData.js
  Adapter from generated fixture data into the page-shaped object.

portal*Data.generated.js
  Generated fixture data. Do not hand-edit for UI repairs.

style.css
  Page-local CSS.
```

Use `pageModel.js` when logic goes beyond simple binding. Examples include carrier filtering, genotype query table derivation, disease reference href construction, age/sex display normalization, and count denominator formatting.

Generated fixtures currently used by the promoted pages:

```text
src/views/KrSample/portalSampleData.generated.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
src/views/KrClinicalFocus/portalDiseaseReferenceData.generated.js
```

The Vue browser does not read RDS files directly.

---

## 3. Shared Evidence Semantics

Do not collapse these concepts into one score or label.

| Concept | Meaning |
|---|---|
| Phenotype profile similarity | HPO profile similarity or overlap between samples, queries, diseases, or carrier profiles |
| Active context match | Match between the optional user-set context and the current page evidence |
| Same-variant recurrence | Other samples carrying the exact same variant |
| Same-gene recurrence | Other samples carrying qualifying variants in the same gene |
| Carrier phenotype profile | HPO profile summarized across selected variant/gene carriers |
| Co-carrier genotype profile | Other genes with qualifying variants among the selected carrier set |
| Disease reference overlap | External disease-HPO or disease-gene support |
| Secondary annotation | DDG2P, PanelApp, Reactome, WikiPathways, and similar support |

Rules:

- CRDC internal evidence is primary.
- Disease references are support, not diagnosis.
- Secondary annotations should not hide CRDC recurrence.
- Use `n/a` or `-` for unavailable data. Do not invent missing values.
- Do not infer display age from `birth_year` when `age_at_enrollment` is missing.
- Preserve known sex values. Do not replace known Male/Female with unavailable markers.
- Exclude broad HPO anchors from displayed evidence: `HP:0000001` and `HP:0000118`.
- Use regular-weight body text. Avoid bold table values.
- Use blue only for clickable links or explicit inspect/expand actions.

---

## 4. Shared Clinical Context

Shared context lives in:

```text
src/views/KrClinicalFocus/
```

| File | Role |
|---|---|
| `ClinicalFocusBar.vue` | Set/edit HPO context UI |
| `FocusResultAccordion.vue` | Expandable context comparison display |
| `focusStore.js` | Browser-session persistence |
| `focusComparison.js` | HPO comparison helpers |
| `mockFocusData.js` | Mock selectable contexts |
| `portalDiseaseReferenceData.generated.js` | Compact generated disease reference lookup |
| `style.css` | Shared context styles |

Context is an HPO profile. It may be compared against sample HPO, phenotype result sets, disease references, and carrier phenotype profiles. It is not direct variant similarity.

Future API shape:

```json
{
  "context_id": "session-local-id",
  "label": "User-visible label",
  "source": "manual | disease_reference | sample | carrier_selection",
  "hpo_terms": [
    { "hpo_id": "HP:0001250", "hpo_name": "Seizure" }
  ]
}
```

---

## 5. Page Contracts

### 5.1 Front Page

Files:

```text
src/views/KrFront/main.js
src/views/KrFront/Template.vue
src/views/KrFront/pageModel.js
src/views/KrFront/store.js
src/views/KrFront/style.css
```

Purpose:

- Entry point for sample, phenotype, and variant/gene searches.
- Optional HPO context setup.
- Routes to the other promoted pages.

Route targets:

| Search type | Target |
|---|---|
| Sample ID | `/krSample.html?sample_id=<sample_id>` |
| HPO phenotype profile | `/krPhenotype.html?query=<hpo_terms>` |
| Variant or gene | `/krVariant.html?query=<variant_or_gene>` |

Suggested API:

```text
GET /api/search/suggest?q=...
GET /api/context/reference-sources?q=...
```

### 5.2 Sample Page

Files:

```text
src/views/KrSample/main.js
src/views/KrSample/Template.vue
src/views/KrSample/pageModel.js
src/views/KrSample/mockData.js
src/views/KrSample/portalSampleData.generated.js
src/views/KrSample/store.js
src/views/KrSample/style.css
```

Core question:

```text
What phenotype and genotype evidence is available for this sample?
```

Current sections:

1. Overview.
2. Similar by phenotype.
3. Similar by genotype.
4. Disease profile matches.
5. Gene / variant evidence.

Important current UI behavior:

- Overview top metrics are plain text rows. Each metric label has an `i` popover for method text; do not render these explanations as bordered cards or triangle accordions.
- The investigator phenotype-signature affinity method remains a triangle expander because it controls a longer method section. Keep visible spacing between that method text and the rank table.
- Sample Overview should read as a line-separated analysis surface, not a stack of nested cards. Use a single vertical divider between the main analysis column and the sample metadata column, plus thin horizontal row rules. Avoid rounded bordered boxes for the three top metrics, the right-side summary table, and the investigator-affinity block.
- Similar by phenotype shows `Shared genes` as individual gene links. Each gene links separately to `/krVariant.html?query=<gene>`.
- Shared gene popovers list gene-by-gene entries, not one combined variant link.
- Similar by genotype has a query builder. Selecting a different gene/variant changes the genotype tables below.
- Same variant table means exact same variant recurrence. It may show a concise matched variant ID, not repeated `Queried sample` / `Matched sample` text.
- Same gene table means the same gene is shared, not necessarily the same variant position. It must not show a `Variant evidence` column.
- Same gene rows are derived from samples sharing the selected gene and should use phenotype overlap for that selected gene context.
- Phenotype overlap counts exclude broad HPO anchors and should not be confused with variant recurrence counts. The overlap count is clickable and opens a shared-HPO popover; if the current fixture has no non-broad shared terms, the popover must say that explicitly.
- Table headers in Sample page evidence tables are sortable: phenotype-similar samples, genotype-similar samples, disease matches, and gene/variant evidence sub-tables.
- Sample metadata should preserve `age_at_enrollment` where present and preserve known sex values.

Suggested API:

```text
GET /api/sample/{sample_id}/summary
GET /api/sample/{sample_id}/phenotype-profile
GET /api/sample/{sample_id}/similar-samples
GET /api/sample/{sample_id}/genotype-query-options
POST /api/sample/{sample_id}/genotype-similarity
GET /api/sample/{sample_id}/disease-profile-matches
GET /api/sample/{sample_id}/gene-variant-evidence
POST /api/context/compare-sample
```

Minimum summary payload:

```json
{
  "sample_id": "BCH-22-44945-01",
  "sex": "female",
  "age_at_enrollment": 16,
  "investigator": "benjamin_raby",
  "proband_status": "Yes",
  "affected_status": "Yes",
  "diagnosed_status": "Undiagnosed",
  "hpo_term_count": 131,
  "rare_coding_gene_count": 10
}
```

Genotype query option payload:

```json
{
  "sample_id": "BCH-22-44945-01",
  "query_options": [
    {
      "gene_symbol": "MAML3",
      "variant_id": "chr4:139889981:T:G",
      "consequence": "missense_variant",
      "source": "sample_rare_coding_variant",
      "is_gendx": false
    }
  ]
}
```

Genotype similarity response:

```json
{
  "sample_id": "BCH-22-44945-01",
  "selected_queries": [
    { "gene_symbol": "MAML3", "variant_id": "chr4:139889981:T:G" }
  ],
  "same_variant_rows": [
    {
      "sample_id": "BCH-21-49631-01",
      "shared_gene": "MAML3",
      "query_variant": "chr4:139889981:T:G",
      "matched_variant": "chr4:139889981:T:G",
      "phenotype_overlap": { "count": 79, "denominator": 129 },
      "phenotype_profile_similarity": 0.504,
      "shared_hpo_terms": ["Abnormality of head or neck [HP:0000152]"],
      "display_variant_evidence": "chr4:139889981:T:G"
    }
  ],
  "same_gene_rows": [
    {
      "sample_id": "BCH-21-49631-01",
      "shared_gene": "MAML3",
      "phenotype_overlap": { "count": 79, "denominator": 129 },
      "phenotype_profile_similarity": 0.504,
      "shared_hpo_terms": ["Abnormality of head or neck [HP:0000152]"]
    }
  ]
}
```

For Same gene rows, do not require a `matched_variant` field for display. The row is gene-level evidence.
For Same variant rows, keep the display compact. If `query_variant` and `matched_variant` are the same, show only the variant ID.

### 5.3 Phenotype Page

Files:

```text
src/views/KrPhenotype/main.js
src/views/KrPhenotype/Template.vue
src/views/KrPhenotype/pageModel.js
src/views/KrPhenotype/mockData.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrPhenotype/store.js
src/views/KrPhenotype/style.css
```

Core question:

```text
Which CRDC samples, co-observed phenotypes, reference diseases, genes, and variants are associated with this searched HPO profile?
```

Current behavior:

- Query phenotype profile is displayed as checked terms, one per line.
- Top Demographic Summary age histogram has been removed.
- Annotation-burden and investigator scatter cards are not displayed in the top summary area.
- Selected matched sample should show actual `age_at_enrollment` where present, not coarse bins such as `1-5`.
- Co-observed phenotype terms are additional matched-cohort terms, not the original query terms.

Suggested API:

```text
POST /api/phenotype/search
GET /api/phenotype/query/{query_id}/matched-samples
GET /api/phenotype/query/{query_id}/co-observed-phenotypes
GET /api/phenotype/query/{query_id}/disease-candidates
GET /api/phenotype/query/{query_id}/gene-candidates
GET /api/phenotype/query/{query_id}/variant-overlay
```

### 5.4 Variant / Gene Page

Files:

```text
src/views/KrVariant/main.js
src/views/KrVariant/Template.vue
src/views/KrVariant/pageModel.js
src/views/KrVariant/mockData.js
src/views/KrVariant/fixturePipeline.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
src/views/KrVariant/store.js
src/views/KrVariant/style.css
```

Core question:

```text
Who carries this exact variant or queried gene, and what phenotype/genotype patterns are visible among those carriers?
```

Current behavior:

- Top Demographic Summary histogram has been removed.
- Carrier profile is the main inspection area.
- Variant level and gene level are both supported.
- Carrier filters include carrier subset, sex, co-carrier gene, age at enrollment, and investigator.
- Age filter supports range choices plus individual age values from 0 through 17, `18+`, and unavailable age.
- Reset clears carrier filters.
- Carrier samples and carrier sample summary are paired left/right.
- Carrier sample summary shows sex, age-at-enrollment, and investigator distribution.
- Sex display uses `Female`, `Male`, and `n/a`.
- Carrier phenotype profile and Carrier Genotype profile are side-by-side sections.
- Carrier phenotype profile shows top HPO signals with `Show more`.
- Carrier Genotype profile shows co-carrier genes with counts, gene-disease overlap, secondary annotation, sorting, sample inspection, and `Show more`.
- Per-position carrier count remains in the locus area. Y-axis ticks should round to 5-count steps.

Variant fixture layering:

```text
portalVariantData.generated.js
  -> base DB fixture
portalVariantNewData.generated.js
  -> carrier correction and promoted carrier profile additions
fixturePipeline.js
  -> explicit layer order
mockData.js
  -> page-shaped state
```

Suggested API:

```text
GET /api/variant/{variant_id}/summary
GET /api/variant/{variant_id}/carriers
GET /api/gene/{gene_symbol}/carriers
POST /api/carrier-set/summary
POST /api/carrier-set/phenotype-profile
POST /api/carrier-set/co-carrier-genes
POST /api/carrier-set/per-position-counts
POST /api/context/compare-carrier-profile
```

Carrier-set request shape:

```json
{
  "query": {
    "type": "variant",
    "variant_id": "chr5:150203773:T:A",
    "gene_symbol": "SLC6A7",
    "genome_build": "GRCh38"
  },
  "level": "variant",
  "filters": {
    "carrier_subset": "all",
    "sex": "all",
    "co_carrier_gene": "all",
    "age_at_enrollment": "all-ages",
    "investigator": "all"
  }
}
```

---

## 6. Backend API Principles

When replacing fixtures with backend endpoints, return page-shaped DTOs rather than raw tables.

The production service should assume tens of thousands of CRDC samples. Do not ship all sample, HPO, variant, or carrier rows to the browser. The backend should perform search, filtering, sorting, pagination, and aggregate summaries, then return only the current page slice plus the counts needed to explain that slice. Current generated fixtures are small UI-validation fixtures and may change when the test DB is regenerated. A several-thousand-sample page-shaped mock fixture can be useful for local realism, but it is still a fixture strategy, not the production serving strategy.

Every count-like value should include:

```text
count
denominator
scope
filters
source evidence type
calculation method
not calculated / unavailable status
```

Example:

```json
{
  "label": "Abnormality of the nervous system [HP:0000707]",
  "all_carriers": { "count": 4, "denominator": 13, "percent": 31 },
  "current_subset": { "count": 2, "denominator": 6, "percent": 33 },
  "method": "exact_sample_hpo_overlap",
  "source": "crdc_sample_hpo"
}
```

Do not label a value as PheRS, residual, weighted similarity, or diagnosis unless that exact calculation exists.

Recommended response pattern:

```json
{
  "query": { "sample_id": "BCH-22-44945-01" },
  "total_available": 23842,
  "filtered_total": 614,
  "page": { "limit": 25, "offset": 0, "sort": "phenotype_profile_similarity:desc" },
  "summary": { "sex": "female", "age_at_enrollment": 16 },
  "rows": []
}
```

The UI may cache small reference dictionaries, such as HPO labels or gene labels, but cohort-scale observations should be fetched as scoped results.

---

## 7. Development And Validation

Install:

```bash
npm install
```

Run the existing dev server:

```bash
./node_modules/.bin/vue-cli-service serve --mode development --port 8090 --host 0.0.0.0
```

Build:

```bash
npm run build
```

Patch hygiene:

```bash
git diff --check
```

Do not start a separate Python static server for this project. Use the existing `localhost:8090` dev server for rendering checks.

---

## 8. Review Checklist

Before sharing changes:

- Default promoted pages are still `/krFront.html`, `/krSample.html`, `/krPhenotype.html`, `/krVariant.html`.
- `_reframe` and private comparison files are not part of the shared source tree.
- Generated fixtures are not hand-edited for UI display fixes.
- Sample page Shared genes are individual gene links.
- Sample page genotype query builder changes the displayed genotype rows.
- Same variant and Same gene tables remain semantically distinct.
- Same gene rows do not show variant evidence as if position-level recurrence were required.
- Same variant rows show concise matched variant evidence without repeated prose.
- Genotype phenotype-overlap counts open a shared-HPO popover.
- Sample Overview top metric explanations use `i` popovers and plain text rows, not bordered cards.
- The investigator phenotype-signature affinity expander keeps spacing before the rank table.
- Sample Overview uses line separators and a column divider instead of nested rounded card borders.
- Sample page table headers remain sortable.
- API contracts support production-scale cohorts through backend pagination, sorting, and scoped summaries.
- Phenotype overlap excludes broad HPO anchors.
- Variant carrier sample summary, phenotype profile, and genotype profile use the same carrier filter denominator.
- `age_at_enrollment` and sex values are preserved from source data.
- `git diff --check` passes.
- `npm run build` passes.
