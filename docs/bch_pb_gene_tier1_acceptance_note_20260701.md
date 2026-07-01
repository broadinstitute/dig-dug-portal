# BCH pb_Gene Tier 1 Acceptance Note

Date: 2026-07-01  
Branch: `kyuryung/bch-prototype`  
Page: `/pb_Gene.html`  
Audience: reviewer who has not seen the mockup, Helen's BioIndex table, or the aggregator implementation history

## Executive Summary

Tier 1 is accepted for the first BCH `pb_Gene` slice. The Tier 1 validation work is complete.

In this context, "Tier 1" means that the existing `pb_Gene` mockup is running inside the BCH portal branch and is populated only from currently available BCH private BioIndex / aggregator data. Missing sample-level clinical fields are not fabricated. They are rendered as unavailable.

The main previously confusing issue was a DMD count mismatch. That mismatch is resolved: the mismatch came from comparing the UI against only the first BioIndex response page. Large genes such as `DMD` return continuation tokens. The frontend follows `/api/bio/cont`, so it must be compared against the full continuation output, not a direct first-page curl.

The unavailable fields are not unresolved validation items. They mean "not wired from the current live BioIndex-only Tier 1 sources." They do not necessarily mean that the data does not exist. Several fields can come from the user's prepared reference DB, CRDC/sample metadata tables, RefSeq/Ensembl-style reference resources, or later derived computations.

## What Was Implemented

The BCH branch now has a new `pb_Gene` page route and page implementation:

| File/path | Purpose |
|---|---|
| `vue.config.js` | Adds the `pbGene` page route for `/pb_Gene.html`. |
| `src/views/PbGene/` | Contains the BCH `pb_Gene` page copied/adapted from the user's mockup. |
| `src/views/PbGene/pbGeneBioIndexAdapter.js` | Converts live BioIndex responses into the page-shaped model used by the mockup. |
| `src/utils/bioIndexUtils.js` | Supports private/public BioIndex host overrides and follows continuation tokens through `processRequest`. |
| `src/modules/bioIndex.js` | Propagates `query_private` into the shared BioIndex query helper. |

The page source label is `BCH private BioIndex Tier 1`, and the page searches live private BioIndex data for the searched gene symbol.

## Source Inputs Used For Tier 1

Tier 1 is based on three input layers:

| Input layer | Role in the decision |
|---|---|
| User's `pb_Gene` mockup | Defines the intended page semantics: gene identity, cohort carrier counts, variant evidence, carrier sample table, phenotype/profile summaries, co-carrier context, and locus visualization. |
| Helen-provided BioIndex index table | Defines the available BCH private BioIndex inventory: index names, S3 prefixes, and query schemas. The source file in the original repo is `docs/not_share/helen_bioindex_api_index_table_20260625.tsv`. |
| Aggregator/private BioIndex live responses | Defines what is actually queryable today, which fields are returned, and which mockup requirements can honestly be populated in Tier 1. |

The implementation intentionally uses the private BioIndex query pattern through the portal's BioIndex utilities. It does not introduce raw VCF parsing, does not call a Direct API for this first slice, and does not invent missing sample metadata.

## Mockup Data Requirements

The original `pb_Gene` mockup expects richer page-shaped data than BioIndex currently exposes in one endpoint. The major mockup concepts are:

| Mockup concept | Intended meaning |
|---|---|
| Gene identity | Gene symbol, full name, description, cytogenetic/locus coordinates, build, Ensembl/OMIM identifiers. |
| Reference annotation | DDG2P, PanelApp, Reactome/WikiPathways, OMIM-like disease/reference support. |
| Gene-level cohort summary | Current gene carrier count, selected/queried variant carrier count, variant count, proband/affected/diagnosed counts, burden/match summary. |
| Locus visualization | Gene range, exon track, variant marker positions, per-position carrier density. |
| Variant evidence table | Variant ID, consequence, HGVSp/HGVSc detail, carrier count, gnomAD AF, CRDC/cohort AF when available, ClinVar, REVEL, AlphaMissense, LOFTEE, CADD-like values. |
| Carrier sample table | Sample ID, age, sex, genotype, HPO summary, co-carrier gene count, investigator/cohort, affected/proband, GenDx status/detail. |
| Carrier phenotype profile | HPO categories/terms observed across gene or variant carriers. |
| Co-carrier genotype profile | Other genes observed among the active carrier set. |

Tier 1 does not mean all of these concepts are fully available from BioIndex alone. Tier 1 means each concept is either populated from verified live BioIndex fields or displayed as unavailable when the current BioIndex-only source does not support it. Non-BioIndex fields should be treated as Tier 2/Tier 3 handoff items, not as evidence that the data is absent.

## Helen Table To Aggregator/BioIndex Matching

The first slice uses only indexes that are both present in Helen's table and useful in live aggregator/private BioIndex responses.

| BioIndex index | Helen table query schema | Tier 1 use | Acceptance status |
|---|---|---|---|
| `gene` | `gene` | Basic gene identity and locus range: chromosome, start, end, name when present. | Used. Enough for basic locus identity, not enough for full reference annotation. |
| `gene-features` | `gene` | Optional transcript/feature context and schematic exon fallback. | Used. Explicit exon coordinates are not available in the current response, so exon display remains schematic. |
| `gene-variants2` | `gene` | Variant annotation base, variant positions, consequence/HGVSp fields, gnomAD-like fields where present. | Used as an enrichment source, but not as the carrier-count source of truth. |
| `gene-samples` | `gene_symbol` | Carrier rows, `sample_id`, `variant_id`, genotype fields, and per-sample variant annotation/severity fields. | Primary Tier 1 source. Used for carrier count, observed variant count, variant carrier counts, and carrier table rows. |
| `gene-associations-52k` | `gene` | Gene-level association/burden rows. | Queried and stored for future/optional association display; not used to fabricate per-carrier burden. |
| `patient` | `patient_id` | Would provide sample metadata if built. | Not used. Prior live check returned `Index "patient" is not built`. |
| `variant-sample` / `variant-sample-unique` | `variant_ID` | Variant-keyed carrier sample rows. | Not used for this first slice. Prior tested variant keys returned zero rows, so gene-page carrier evidence cannot depend on them. |
| `transcript-consequences` | `varId` | Optional selected-variant transcript consequence details. | Not required for acceptance. Current page gets enough first-slice annotation from `gene-samples` and `gene-variants2`. |
| `genotype-quality-metrics` / `site-quality-metrics` | `varId` | Optional QA metrics. | Not required for Tier 1 acceptance. |

## Data Matching Rules In The Implemented Page

The adapter maps BioIndex rows into the mockup's page model using these rules:

| Page value | Current Tier 1 source/rule |
|---|---|
| Searched gene symbol | User query, normalized to uppercase. |
| Basic gene locus | `gene` row fields such as chromosome/start/end. |
| Gene full name / description | Uses available `gene` name when present; otherwise displays an unavailable/reference-limited message. |
| Reference annotation | DDG2P, PanelApp, Reactome/WikiPathways are not in the current private BioIndex response, so they are displayed as unavailable/no support rather than inferred. |
| Gene-level carrier count | Distinct `sample_id` count from full `gene-samples?q={gene}` output. |
| Variant count | Distinct observed `variant_id` values from `gene-samples`, after normalizing variant IDs. |
| Variant rows | Built from observed `gene-samples.variant_id`; enriched from matching `gene-variants2` rows when available. |
| Variant-level carrier count | Distinct carrier sample IDs per variant, not raw row count. |
| Locus marker position | Parsed from genomic coordinate in `variant_id`; variants are not snapped to exon positions. |
| Intronic/UTR variants | Retained when present because the source of truth is observed `gene-samples.variant_id`. |
| Exon track | Uses explicit exon rows only if provided; otherwise displays a schematic exon track. |
| CRDC/cohort AF | Displays actual cohort AF fields if present; otherwise `--` / unavailable. It does not fall back to carrier count. |
| Age, sex, affected, proband, diagnosed, investigator | Displayed as unavailable because the needed sample metadata is not in the current built BioIndex responses. |
| HPO profile and co-carrier profile | Left empty/unavailable because sample-level HPO/co-gene data is not available in the current built BioIndex path. |

## Count Mismatch Resolution

The original mismatch came from comparing different units:

| Comparison target | What it counts |
|---|---|
| Direct first-page BioIndex curl | Only the first response page. This is incomplete for large genes with continuation tokens. |
| `pb_Gene` UI | Full output returned by `bioIndexUtils.processRequest`, including all `/api/bio/cont` continuation pages. |

Therefore, the UI should be checked against a full-continuation BioIndex extraction. It should not be checked against the first page alone.

## Live Count Verification

Full continuation checks were run for `gene-samples` on DMD, KMT2D, and BRCA1.

| Gene | Continuation pages | Total rows | Unique carriers / samples | Unique variants | Duplicate variant-sample pairs | Tier 1 interpretation |
|---|---:|---:|---:|---:|---:|---|
| `DMD` | 7 | 14,927 | 6,132 | 870 | 0 | UI carrier count should be `6132`; UI variant count should be `870`. |
| `KMT2D` | 1 | 1,953 | 1,572 | 99 | 0 | No continuation mismatch; counts are first-page complete. |
| `BRCA1` | 1 | 1,222 | 1,155 | 129 | 0 | No continuation mismatch; counts are first-page complete. |

DMD top variants by unique carrier count from the full BioIndex output:

| Rank | Variant | Unique carriers |
|---:|---|---:|
| 1 | `chrX:31729904:G:C` | 431 |
| 2 | `chrX:31820242:T:G` | 404 |
| 3 | `chrX:31932285:T:G` | 385 |
| 4 | `chrX:32573412:T:C` | 333 |
| 5 | `chrX:31146108:T:C` | 326 |

The DMD page was also checked in a headless browser at `/pb_Gene.html?query=DMD`. The rendered page showed `6132` carriers, `870` variants, sortable triangle headers, and the large-gene pagination indicator `+20 more (850 remaining)`.

## Runtime Verification

| Check | Result |
|---|---|
| `npm run build` in the BCH worktree | Passed. |
| Build warning | Existing warning from `locuszoom/esm/ext/lz-tabix-source.js`: default export not found in `tabix-reader`. This is not introduced by the `pb_Gene` Tier 1 work. |
| Headless browser DOM check for DMD | Passed for key Tier 1 values: carrier count, variant count, sortable headers, and pagination. |
| Dev server | A temporary validation server was started with `BIOINDEX_HOST_PRIVATE` and stopped after validation. Vue CLI auto-selected a later port because earlier local ports were already in use. |

## Acceptance Checklist

| Criterion | Status | Evidence |
|---|---|---|
| Page exists inside BCH portal branch | Accepted | `/pb_Gene.html` route added through `vue.config.js`; implementation under `src/views/PbGene/`. |
| Uses private BioIndex / aggregator data | Accepted | Adapter queries private `gene`, `gene-features`, `gene-variants2`, `gene-samples`, and `gene-associations-52k`. |
| Carrier count is based on distinct samples | Accepted | Gene-level carriers use unique `sample_id` from `gene-samples`. |
| Variant rows are based on observed gene-sample evidence | Accepted | Variant rows come from observed `gene-samples.variant_id`, enriched from `gene-variants2` when present. |
| BioIndex continuation is followed | Accepted | `gene-samples` has no limit and the shared BioIndex utility follows `/api/bio/cont`. DMD full-continuation count matches UI. |
| DMD count mismatch is resolved | Accepted | Full continuation output gives 6,132 unique carriers and 870 variants; UI renders the same values. |
| KMT2D and BRCA1 sanity checks are consistent | Accepted | Both genes complete in one page and unique sample/variant counts are internally consistent. |
| Variant-level carrier count avoids duplicate rows | Accepted | Carrier count is unique sample IDs per variant; duplicate variant-sample pairs were 0 in checked genes. |
| Locus positions use actual genomic coordinates | Accepted | Variant positions are parsed from `variant_id`; markers are not snapped to schematic exons. |
| Missing clinical/sample metadata is honest | Accepted | Age, sex, affected, proband, diagnosed, HPO, investigator, and co-carrier fields are unavailable rather than inferred. |
| Sorting/pagination for large genes | Accepted | Variant evidence headers are sortable; DMD shows the expected `+20 more` pagination state. |
| Build/runtime sanity | Accepted | Build passed; DMD headless render check passed. |

## Tier 1 Unavailable Fields And Next Data Source

These are not pending Tier 1 validation tasks and they are not Tier 1 failures. They are fields that are not currently wired from the live BioIndex-only Tier 1 path. Most of them have a known next source category.

| Field group | Why it is unavailable in Tier 1 BioIndex-only mode | Next source / action |
|---|---|---|
| Sample age, sex, affected, proband, diagnosis, investigator/cohort | `patient` is listed in Helen's table but the live index was not built in prior verification. `gene-samples` does not include these fields. | Use CRDC/sample metadata source or a backend/new BioIndex sample metadata index. |
| Sample-level HPO profile | Current built BioIndex path does not expose sample_id-to-HPO terms for this page. | Use sample-HPO tables or a backend/sample HPO endpoint. |
| GenDx diagnosis detail | Diagnosis detail requires sample-level metadata/detail joins not present in current BioIndex responses. | Use `data/reference_db/crdc_diagnosed_20240716.tsv` or equivalent server-side source. |
| Co-carrier genotype profile | Current `gene-samples` query is gene-scoped and does not expose all other genes per active carrier set. | Use cohort variant tables or a backend carrier-set summary computation. |
| DDG2P, PanelApp, Reactome/WikiPathways, OMIM-style reference annotation | These are mockup/reference DB concepts, not present in the current verified private BioIndex fields. | Use prepared reference DB files under `data/reference_db/`, especially `gene_annotation_summary.tsv` / `.rds`, `ddg2p_*`, `panelapp_*`, and pathway summary files. |
| Exon/base-level view | Current `gene-features` response does not provide explicit exon coordinates or sequence suitable for real base-level display. | Use `data/reference_db/gene_exon_coords.tsv`, RefSeq/Ensembl-style server-side reference resources, or equivalent reference DB tables. |
| Locus zoom centers on selected/queried variant | Clicking arbitrary empty locus positions does not yet define a new zoom center. | UX enhancement, not data correctness blocker. |
| Gene-level association rows are not the same as per-carrier burden | `gene-associations-52k` returns association/burden-style rows, not sample-level carrier burden metrics. | Keep separate unless backend defines a page-shaped burden summary. |

## Existing Reference DB / Derived Data Handoff

The original mockup was designed with a richer reference/data layer than the current live BioIndex-only Tier 1 slice. The following sources already exist in the user's portal/reference work and can be used by the BCH side as the next integration layer:

| Resource | Current location / source category | Use in `pb_Gene` |
|---|---|---|
| HGNC + NCBI gene basics | `data/reference_db/gene_basic_info.tsv`, `.rds` | Gene name, description, Ensembl ID, basic gene identity. |
| DDG2P | `data/reference_db/ddg2p_*` | Rare disease gene-disease support. |
| PanelApp | `data/reference_db/panelapp_*` | PanelApp green support, panel count, modes of inheritance. |
| Reactome / WikiPathways | `data/reference_db/pathway*`, `gene_pathway_summary.*` | Gene-level pathway annotation. |
| Collapsed gene annotation | `data/reference_db/gene_annotation_summary.tsv`, `.rds` | Combined DDG2P / PanelApp / pathway rows for the page header. |
| HPO graph and disease-gene HPO references | `data/reference_db/hpo_term.*`, `hpo_edge.*`, `hpo_ancestor.*`, `hpo_gene_annotation.*` | HPO labels, HPO hierarchy, disease/reference phenotype context. |
| Gene exon coordinates and sequence | `data/reference_db/gene_exon_coords.tsv` and equivalent RefSeq/Ensembl-style server-side resources | Real exon/base-level locus display. |
| GenDx diagnosis detail | `data/reference_db/crdc_diagnosed_20240716.tsv` | Carrier row diagnosis detail once sample IDs are joined. |
| Variant severity score | Derived from LoFTEE HC, AlphaMissense, and REVEL according to the page contract | Computed display score; ClinVar is context only, not part of the numeric score. |
| Match score | Requires an active phenotype/outcome context plus a defined comparison method | This is the main intentionally unimplemented computed score in the current page. |

## Final Decision

Tier 1 is accepted. No additional Tier 1 validation is required unless a later code change or BioIndex response change creates a regression.

The implemented page satisfies the Tier 1 goal: it runs in the BCH portal branch, uses currently available private BioIndex / aggregator data, resolves the DMD count mismatch through proper continuation handling, verifies DMD/KMT2D/BRCA1 counts, and renders missing clinical fields honestly.

The next work should not reopen Tier 1 unless a regression is found. Future work should be tracked as Tier 2 or Tier 3:

- Tier 2: add reference annotation sources such as DDG2P, PanelApp, Reactome/WikiPathways, OMIM/ClinVar/gnomAD refinements, exon coordinates, and defined variant score logic.
- Tier 3: add patient/sample metadata, sample HPO, diagnosis detail, affected/proband status, investigator/cohort, co-carrier profile, and HPO-context match score once the needed sample-level data source exists.
