# CRDC Rare Disease Portal Workflow

Date: 2026-05-26  
Repository root: this `dig-dug-portal` repository

This document describes how users and developers move through the portal. It is not the DB schema guide and not the API contract.

---

## 1. User Workflow Overview

The portal supports three starting points:

```text
sample-first
phenotype-first
variant/gene-first
```

All three workflows should converge on the same interpretation principle:

```text
Inspect CRDC internal evidence first.
Then review core rare disease references.
Then use secondary annotations as supporting badges.
```

---

## 2. Front Page Workflow

Route:

```text
/krFront.html
```

User actions:

1. Choose search subject:
   - sample ID
   - variant or gene
   - HPO phenotype profile
2. Optionally set an active HPO context.
3. Start workflow.

Routing:

| Search type | Target |
|---|---|
| Sample ID | `/krSample.html?sample_id=<sample_id>` |
| Variant/gene | `/krVariant.html?query=<variant_or_gene>` |
| Phenotype profile | `/krPhenotype.html?query=<hpo_terms>` |

Context:

- Context is optional.
- Context is HPO-based.
- Context should follow the user across pages.

---

## 3. Sample-First Workflow

Route:

```text
/krSample.html
```

Primary user question:

```text
What are this sample's phenotype and genotype characteristics, and where does it lie within the CRDC cohort?
```

Recommended reading order:

1. Check sample header:
   - sample ID
   - sex
   - age band
   - proband/affected
   - GenDx status
2. Inspect sample phenotype profile:
   - total HPO terms
   - root category composition
   - specific HPO terms
3. Inspect genotype/variant evidence:
   - rare coding genes
   - same-variant recurrence
   - same-gene recurrence
   - carrier phenotype overlap
4. Review similar patients/groups:
   - similar samples by phenotype
   - 0-1 normalized phenotype profile similarity
   - investigator/cohort affinity
5. Review disease profile references:
   - sample HPO vs disease HPO profile
6. Decide next page:
   - click a similar sample -> sample page
   - click a gene/variant -> variant page
   - click disease/HPO overlap -> phenotype or reference detail

With active context:

- Compare sample HPO profile to context HPO terms.
- Keep context match separate from similarity to the searched sample.

---

## 4. Phenotype-First Workflow

Route:

```text
/krPhenotype.html
```

Primary user question:

```text
Which CRDC samples, co-observed phenotypes, disease references, genes, and variants are associated with this searched HPO profile?
```

Recommended reading order:

1. Confirm query phenotype profile.
2. Check matched sample count.
3. Review CRDC matched cohort:
   - matched samples
   - co-observed phenotypes
   - investigator-level patterns
4. Review reference-derived candidates:
   - disease profile candidates
   - gene candidates
5. Review CRDC variant overlay:
   - variants observed among phenotype-matched samples
6. Navigate to sample or variant pages for detail.

Important:

- Co-observed phenotypes are CRDC cohort-derived.
- Disease/gene reference candidates are external/reference-derived.
- Candidate variants are not inferred directly from HPO terms; they are observed in CRDC samples after phenotype-based matching.

---

## 5. Variant/Gene-First Workflow

Route:

```text
/krVariant.html
```

Primary user question:

```text
Who carries this variant or gene, and do carriers form a meaningful phenotype or cohort group?
```

Recommended reading order:

1. Confirm queried variant/gene.
2. Check exact variant carrier count.
3. Switch to gene level if needed.
4. Inspect carrier demographic summary.
5. Inspect locus/per-position carrier count.
6. Inspect carrier phenotype profile:
   - HPO root categories
   - frequent terms
   - proband/affected pattern
7. Inspect carrier sample list.
8. Review gene/disease/reference annotations.
9. If useful, set carrier HPO profile or selected carrier samples as active context.

With active context:

- Compare active HPO context to carrier HPO profiles.
- Do not treat context as direct variant similarity.

---

## 6. Context Workflow

Context can be set from:

```text
front page context control
selected disease/sample/HPO profile
selected carrier phenotype terms
selected carrier samples
```

Expected behavior:

1. User selects source items.
2. User clicks `Set Context`.
3. Edit/confirmation panel opens.
4. User reviews/removes/adds items of the same context type.
5. User clicks `Confirm Context`.
6. Context becomes active across pages.

Rules:

- Do not mix carrier sample selections and phenotype term selections in one context.
- Do not apply context immediately from a checkbox.
- Do not place context status inside page-specific headers if a global control already exists.

---

## 7. Developer Workflow for DB-Backed Mockup Review

Shared reference DB:

```text
data/reference_db/crdc_reference_db_tables.rds
```

Local CRDC input files:

```text
sample_info.tsv
sample_hpo.tsv
sample_variant.tsv
```

Build sequence:

```text
1. Load data/reference_db/crdc_reference_db_tables.rds
2. Attach sample metadata
3. Attach sample HPO profiles
4. Attach VCF-derived sample variants
5. Generate recurrence and evidence summaries
6. Export page-shaped JS/JSON fixtures
7. Run Vue dev server
8. Compare rendered pages
```

Generated fixture targets:

```text
src/views/KrSample/portalSampleData.generated.js
src/views/KrPhenotype/portalPhenotypeData.generated.js
src/views/KrVariant/portalVariantData.generated.js
src/views/KrVariant/portalVariantNewData.generated.js
```

Dev server:

```bash
./node_modules/.bin/vue-cli-service serve --mode development --port 8090 --host 0.0.0.0
```

Main URLs:

```text
http://localhost:8090/krFront.html
http://localhost:8090/krSample.html
http://localhost:8090/krPhenotype.html
http://localhost:8090/krVariant.html
```

---

## 8. Review Checklist

Before accepting a DB-backed rendering:

- Does the page show DB-derived values rather than leftover fallback mock values?
- Are denominators clear?
- Are exact query terms separated from related HPO terms?
- Are CRDC cohort signals separated from external reference annotations?
- Are PanelApp/pathway annotations shown only as secondary badges?
- Are non-calculated values labeled as `not calculated`?
- Are sample-level, carrier-level, and cohort-level summaries not mixed?
- Are clickable values blue and non-clickable values neutral?
