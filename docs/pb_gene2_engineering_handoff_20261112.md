# Gene2 implementation specification

| Item | Contract |
|---|---|
| Updated | 2026-11-13 |
| Entry | `/pb_gene2.html?query=GJB2` |
| Frontend | Vue 2; `src/views/PbGene2/main.js`, `Template.vue`, `style.css` |
| Shared prerequisites | Commit `c98902622`: Variant identifier helpers, processed GT lookup, shared demographics, HPO OR matching |
| Delivery | Frontend + prototype server handlers + tests; production API deployment remains an integration task |
| Reference implementation | Current files listed below; older screenshots and historical handoffs do not override this specification |

## 1. Implementation map

| Responsibility | File |
|---|---|
| Page composition, filters, pins, variant sorting, profile history | `src/views/PbGene2/Template.vue` |
| Shared page state, scoring requests, numeric variant comparator | `src/views/PbGene/pageModel.js` |
| Gene/variant carrier data and GT merge | `src/views/PbGene/pbGeneBioIndexAdapter.js`, `carrierGenotypes.js` |
| Expanded annotation, lazy transcript request | `src/views/PbGene2/VariantAnnotation.vue` |
| Identifier canonicalization, transcript selection | `src/views/PbVariant/variantIdentifiers.js` |
| Variant HPO OR count request + response validation | `src/views/PbGene2/variantHpoCounts.js` |
| Carrier paging, search, numeric sorting | `src/views/PbGene2/carrierTable.js` |
| Visible carrier n_terms request + response validation | `src/views/PbGene2/carrierHpoTotals.js` |
| Individual carrier Z request + reference validation | `src/views/PbGene2/carrierScores.js` |
| Selected-variant union demographics | `src/views/PbGene2/filteredCarrierDemographics.js` |
| Demographics/project table | `src/views/PbGene2/Demographics.vue` |
| Help text/source links | `src/views/PbGene2/evidenceHelp.js`, `referenceProvenance.js` |
| Hover/focus/pinned explanation panel | `src/views/PbGene2/HelpTooltip.vue`, `InfoRail.vue` |
| Private carrier services and source/auth-scoped cache | `scripts/gene_carrier_summary_endpoint.js`, `gene_carrier_disk_cache.js` |
| n_terms + carrier numeric-value APIs | `scripts/gene_carrier_hpo_totals_endpoint.js` |
| HPO OR API | `scripts/gene_variant_hpo_counts_endpoint.js` |
| Gene-HPO precomputed result projection | `scripts/gene_hpo_association_endpoint.js` |
| Prototype route registration/proxy | `vue.config.js` |

## 2. Screen composition

| Order | Block | Required behavior |
|---:|---|---|
| 1 | Gene identity + external references | Gene/coordinates/assembly; DDG2P, PanelApp, pathways; missing summary: `NCBI summary unavailable` |
| 2 | CRDC variant overview | Consequence / In Silico Predictors / ClinVar; click categories to filter variant rows |
| 3 | Gene carrier demographics | Project / Age / Sex above Affected; selected variants use a distinct carrier union |
| 4 | Single-phenotype associations | All delivered results; search, sort, pins, 5 rows/page; gene-wise q |
| 5 | Test a phenotype profile | Multi-HPO input; Apply; settings; result history; re-run/delete |
| 6 | Variant evidence | Identifier/position search; numeric sorting; pins; 5 rows/page |
| 6.1 | Expanded variant annotation | Exact variant identity + reference evidence |
| 6.2 | Expanded carrier summary | Exact selected variant's observed carriers; project/investigator search; 4 projects/page |
| 6.3 | Expanded carrier samples | 5 samples/page; full-ID search; numeric sorting; internal sample links |

- Keep selected variant row + expanded details inside one blue outline.
- Keep existing CSS scale `0.8`; avoid additional automatic browser scaling.
- Keep help icons outside sorting buttons: clicking help must not change sorting.
- Help: hover/focus opens; click pins; Escape/close dismisses; reserve side/inline space without obscuring table content.
- Expanded project header: `Project / Investigator ⓘ [Search projects]`; search both project and investigator; preserve count sorting and pagination.
- Overview consequence chart: top 4 categories + segmented Others; consequence table retains all categories with 4 rows/page.
- Predictor annotations may overlap; Annotated expands AlphaMissense / REVEL / LoFTEE HC counts.

## 3. Column and value contracts

### 3.1 Variant evidence

| Column | Value/source | Sort key | First click |
|---|---|---|---|
| Variant | Exact GRCh38 variant ID + consequence | `variant` | Ascending position |
| ClinVar | Supplied classification | `clinvar` | Ascending text |
| Total carriers | Distinct observed CRDC samples for this variant | `carriers` | Ascending |
| In Silico Predictors | LoFTEE HC → 1; otherwise available AlphaMissense; REVEL reference-only | `variantScore` | Descending |
| Carriers with HPO | Distinct carriers with at least one applied exact HPO ID recorded (OR) | `hpoCarriers` | Ascending |
| Mean carrier rPheRS Z | Analysis-eligible carrier mean, full scoring-cohort standardization | `matchScore` | Descending |
| Variant β (rPheRS SD) | Covariate-adjusted carrier/noncarrier effect in SD units | `effectScore` | Descending |
| P | Unadjusted two-sided variant regression P | `pValue` | Ascending |

- Repeat header click: reverse direction; arrows + selector reflect current key/direction.
- Numeric sorting: raw numbers, including zero, negative effects and scientific-notation P; never compare formatted strings.
- Missing numeric values: last in both directions; ties: variant ID.
- Predictor sorting: scored variants first; REVEL-only reference rows next; unannotated rows last.
- HPO sort: request the entire filtered variant set + pins; never rank only the visible 5 rows.
- Pins: stay visible across pages/sorts/search; outside-filter pins are labelled; no duplicated pinned row in current page.
- Position search: nearest variant window; HGVS/rsID search: identifier matches; preserve active identifier search during sorting.
- Display filters: update variant rows + union demographics; do not change analysis/model cohort.

### 3.2 Carrier samples

| Order | Column | Source | Header sort |
|---:|---|---|---|
| 1 | Sample | Observed carrier ID; link `/pb_sample.html?query=<encoded-id>` | Text, asc/desc |
| 2 | Age | Normalized samples-info age | Numeric, asc/desc |
| 3 | Sex | samples-info sex/gender | None |
| 4 | GT | Exact variant + canonical sample lookup in processed GT release | None |
| 5 | Total HPO terms | Full scoring-matrix row sum `n_terms` | Numeric, asc/desc |
| 6 | rPheRS Z | Applied profile's individual standardized residual | Numeric, asc/desc |
| 7 | Project | samples-info project; full label available through help/title | None |
| 8 | Affected | Normalized samples-info flag | None |

- First click on a new carrier sort column: ascending; repeat: reverse.
- Sort the entire selected variant's carrier list before slicing into 5-row pages.
- Reset to page 1 on sort/search; preserve sort during search and pagination.
- Numeric ties: sample ID ascending; missing values: last in either direction.
- Ordinary table opening: request metadata + n_terms only for visible IDs.
- Age/n_terms sort: load compact numeric values for all carrier IDs in batches ≤100; ≤4 client workers; show progress/error + Retry.
- Age sort: reuse retained gene-summary metadata when available; no browser-wide metadata dump.
- Z sort: reuse current individual score map; no new regression solely for sorting.
- Discard stale page/variant/profile responses; abort superseded requests.

### 3.3 Missing and zero values

| Condition | Display / behavior |
|---|---|
| Valid age/AF/AlphaMissense/n_terms/Z = 0 | Preserve 0; not missing |
| n_terms all-zero matrix row | `0` |
| Sample absent from scoring matrix | `Unavailable`; no metadata-length/empty-record fallback in Gene2 |
| n_terms source missing, wrong hash, malformed matrix or request failure | `Unavailable` |
| No applied profile | HPO count/variant phenotype evidence `—`; individual Z `no context` |
| Individual score loading / failed | `Loading…` / `Unavailable` |
| Individual score absent from a ready map | Current UI `none*`; do not interpret as HPO absence |
| Incomplete analysis-eligible carrier scoring coverage | Mean carrier Z `Unavailable` |
| HPO metadata partially available | Count + `(partial)`; show metadataCount / carrierTotal in help |
| HPO metadata entirely unavailable for nonempty carrier set | `Unavailable`, not 0 |
| Missing/conflicting/out-of-coverage GT | `—`; never infer genotype from carrier membership |
| Missing annotation | `Unavailable`; keep supplied valid fallback HGVS/IDs |

## 4. Expanded annotation

| Left column, in order | Right column, in order |
|---|---|
| rsID (dbSNP) | Consequence |
| HGVSc | ClinVar |
| HGVSp | CRDC AF (or source-labelled CRDC carrier frequency) |
| NCBI RefSeq transcript | gnomAD AF |
| Ensembl transcript | LoFTEE |
| Ensembl protein | AlphaMissense |
| — | REVEL |

- Source: private BioIndex `transcript-consequences`; query canonical `13:position:REF:ALT` on expansion only.
- Selection: shared `buildTranscriptIdentity(rows, geneInfo)` gene/MANE rules; use supplied HGVS/rsID reference fallbacks when applicable.
- Cache: ≤32 canonical variants; no eager transcript requests for every gene variant; ignore stale response after variant change.
- Values: right-aligned; labels/values 18px; desktop transcript labels on one line; narrow layout stacks labels/values.
- Highlight CRDC AF, including valid 0; never relabel carrier frequency as allele frequency.
- HC: show `HC = 1.00` + `(variant score)`; otherwise highlight available AlphaMissense as score source; never substitute REVEL.
- ClinVar: classification colour + reference link; gnomAD: exact GRCh38 variant + `dataset=gnomad_r4`.
- Heading ↗: `/pb_variant.html?query=<exact-variant>&gene=<gene>`.
- Provenance: preserve `referenceProvenance.js` links/dates; VEP 115.1/cache 115/GRCh38.p14/GENCODE 49; ClinVar VCF date 2025-08-24; gnomAD exomes 4.1.

## 5. Phenotype/scoring rules

| Quantity | Required definition | Independence / restriction |
|---|---|---|
| HPO carrier count | Carrier has ≥1 applied exact HPO ID (OR); each carrier counted once | All observed variant carriers; independent of All/Affected and scoring eligibility |
| HPO metadata matching | `samples-info.phenotypes` → normalized `hpoIds` | Current implementation does not filter `is_observed === true`; do not claim observed-positive-only semantics |
| HPO reference count | Display-only aggregate | Not an input to GRS/rPheRS/mean Z/β/P; does not filter model cohort |
| n_terms | Sum across all columns of that sample's binary scoring-matrix row | Includes parents present in matrix; independent of applied profile and All/Affected |
| Raw/residual PheRS | `raw = Σ(binary_HPO × Wp × Fi)`; residual from `raw ~ 1 + n_terms` | `scripts/rphers_fast.py: score_samples` |
| rPheRS Z | `(residual - reference_mean) / reference_sd`, sample SD (`ddof=1`) | Full scoring cohort for that HPO profile; validate reference identity |
| Positive GRS count | Number of selected All/Affected analysis samples with gene GRS > 0 | Not HPO-positive carrier count |
| Precomputed β/CI | HPO log-odds per 0.1 Sum GRS | Binary-HPO association release |
| Custom Gene β | rPheRS SD per 0.1 GRS | Custom profile regression |
| Variant β | Carrier vs noncarrier rPheRS SD effect | Age/missing-age/sex/PC1–PC10 adjustment; <10 scored carriers exploratory |
| Gene q | `q_by_gene`; flags/counts `q_significant_by_gene`, `n_q_significant_by_gene` | BH across full PASS family before P < 0.05 export/display filters |

- Gene q absent: keep missing; never use `q_by_hpo` as fallback.
- Phenotype page q remains `q_by_hpo`; no change from Gene2 integration.
- Profile history: save HPOs, Max/Sum, All/Affected, threshold and minimum carriers per run.
- Re-run ↻: restore saved settings, calculate, append result, make new row Applied; keep earlier rows.
- Delete ×: delete one row; deleting Applied clears associated variant profile evidence.
- Disable re-run/delete during calculation; reject re-run with missing settings or different gene.

## 6. API inventory

| Method / route | Request | Response / consumer |
|---|---|---|
| `GET /__public_gene_variants__` | `gene`; optional locus bounds | Public annotation projection + carrier counts; never raw sample metadata |
| `GET /__gene_hpo_associations__` | `gene` | `gene, selectionRule, nQSignificant, nTestedHpos, nAssociations, associations[]`; projected gene-wise q |
| Private BioIndex `gene-variants-crdc` | Gene symbol; consume continuations | Observed variants + per-variant sample membership |
| Private BioIndex `samples-info` | Exact carrier ID; validate SampleInVCF/canonical ID | Age, sex, project, affected and recorded HPO IDs |
| Private BioIndex `transcript-consequences` | Canonical exact variant | Lazy annotation/transcript records |
| `GET /__gene_carrier_summary__` | `gene`; optional `variant`; optional `refresh` 1–2 | `status: loading|ready|error`, `completed,total`, aggregate snapshot; poll to ready |
| `POST /__gene_carrier_demographics__` | `gene, variant_ids[]` | Same job/progress pattern; distinct union summary |
| `GET /__pb_gene_genotypes__` | `gene` | Authorized carrier calls: `rows[{variant_id,sample_id,gt,status}], source` |
| `POST /__gene_variant_hpo_counts__` | §6.1 | Per-variant applied-profile OR counts |
| `POST /__gene_carrier_hpo_totals__` | §6.2 | Visible carrier n_terms + matrix provenance |
| `POST /__gene_carrier_sort_values__` | §6.3 | Compact all-carrier numeric sort values, batched |
| `POST /phenotype-analyzer-api/analyze` | §6.4 | Gene/variant effects + full-cohort standardization; optional exact-variant individual scores |

### 6.1 HPO OR count

```json
{"gene":"GJB2","variant_ids":["chr13:20189255:CCCCTTGATGAACTT:C"],"hpo_terms":["HP:0000365","HP:0001250"]}
```

```json
{
  "gene":"GJB2","hpo_terms":["HP:0000365","HP:0001250"],
  "match":"any","population":"observed_variant_carriers",
  "variants":{"chr13:20189255:CCCCTTGATGAACTT:C":{"count":2,"metadataCount":9,"carrierTotal":9,"complete":true}}
}
```

- Example counts illustrative; production values come from source.
- Limits: ≤20,000 variant IDs; 1–50 HPO IDs; JSON body ≤1MB.
- Normalize/deduplicate/sort terms; frontend rejects gene/terms mismatch and `match != any`.
- Nonempty carrier set with zero known metadata: `count: null`.
- `metadataCount`: available HPO arrays, including known empty arrays; not OR-match count.
- Empty carrier set: count 0; `complete = metadataCount == carrierTotal`.

### 6.2 Total HPO terms

```json
{"gene":"GJB2","variant":"chr13:20189255:CCCCTTGATGAACTT:C","sample_ids":["EXAMPLE_A_E38","EXAMPLE_B_G38"]}
```

```json
{
  "gene":"GJB2","variant":"chr13:20189255:CCCCTTGATGAACTT:C",
  "counts":{"EXAMPLE_A_E38":11,"EXAMPLE_B_G38":null},
  "source":{"method":"binary_hpo_matrix_row_sum","covariate":"n_terms","matrix_sha256":"<approved-sha256>","sample_count":15764,"hpo_column_count":6440}
}
```

- Example IDs synthetic; request IDs must belong to selected variant.
- Limits: 1–100 IDs; JSON body ≤128KB; current UI requests ≤5 IDs/page.
- Values: nonnegative safe integer or null; echo exact request IDs; no personal fields beyond requested IDs/counts.
- Resolve ID: exact matrix ID → explicit vcf_sample_id map → terminal `_E38`/`_G38` removal.
- Validate binary matrix dimensions/duplicate samples/duplicate columns; configured SHA mismatch fails closed.
- Reload row sums when file version changes; reuse parsed sums while unchanged; no profile regression required.
- Frontend validates echoed gene/variant, source method/covariate, requested keys, numeric types; ignores superseded responses.

### 6.3 Numeric sort values

```json
{"gene":"GJB2","variant":"chr13:20189255:CCCCTTGATGAACTT:C","field":"hpoTerms","sample_ids":["EXAMPLE_A_E38","EXAMPLE_B_G38"]}
```

```json
{"gene":"GJB2","variant":"chr13:20189255:CCCCTTGATGAACTT:C","field":"hpoTerms","values":{"EXAMPLE_A_E38":11,"EXAMPLE_B_G38":null}}
```

| Field | Source | Value |
|---|---|---|
| `hpoTerms` | Same matrix reader as §6.2 | Integer ≥0 or null |
| `age` | Retained summary metadata, else source/auth-scoped samples-info | Finite age 0–100 or null |

- Same membership/100-ID/body-size limits as §6.2.
- Client: ≤4 workers; collect full carrier set before ranking; direction changes reuse values.
- Sort requests independent of current carrier search/page and HPO profile; Z uses separate scoring map.
- Failure: abort remaining workers; show unavailable + Retry; do not present partial values as final global order.

### 6.4 Analysis

```json
{
  "gene":"GJB2","terms":"HP:0000365,HP:0001250","score_type":"max","affected_only":false,
  "advanced":{"significance_metric":"p_value","significance_threshold":0.05,"min_carriers":10}
}
```

| Response field | Requirement |
|---|---|
| `gene`, `query_hpo` | Match submitted context |
| `gene_association` / existing result fields | Preserve shared pageModel conversion and units |
| `variant_match_scores[variant_id]` | Mean score + carrier/scored-carrier coverage |
| `variant_associations[variant_id]` | Status, beta_sd, p_value and coverage flags |
| `rphers_standardization` | Full-cohort reference identity, query HPOs, mean, SD and ddof |
| Optional request `variant_id` | Fetch individual residuals for this exact variant only |
| `variant_carrier_residuals.sample_rphers_z` | Individual score map; validate variant and matching reference |

## 7. Server integration and configuration

### 7.1 Private request boundary

- Preserve existing private BioIndex authentication/access scope.
- Prototype: cookie `session` → upstream `x-bioindex-access-token`; caches partitioned by authorization scope.
- Sample count/sort routes: validate gene + exact variant + requested carrier membership before returning values.
- Responses: `Cache-Control: private, no-store`; `X-Content-Type-Options: nosniff` for private carrier routes.
- n_terms/sort routes: 400 invalid fields/outside-carrier IDs; 502 source unavailable.
- Gene-HPO release route: 400 invalid gene; 503 unconfigured file; 502 read failure.
- Port equivalent handlers into the target backend; a frontend build alone does not install Express routes.

### 7.2 Configuration

| Variable | Purpose / requirement |
|---|---|
| `BIOINDEX_HOST_PRIVATE` | Private BioIndex base URL |
| `PHENOTYPE_ANALYZER_HOST_PRIVATE` | Existing analysis API base URL |
| `PB_GENE_HPO_FILE` | Server-side `gene_hpo_release_20261112/browser_gene_hpo.jsonl.gz` |
| `PB_GENE_HPO_RELEASE_ID` | Gene-HPO release identity |
| `PB_GENOTYPE_INDEX` | Private processed GT index directory; see builder below |
| `PB_GENE_SCORING_HPO_MATRIX` | Actual scoring release's binary TSV/TSV.gz |
| `PB_GENE_SCORING_SAMPLE_MAP` | Scoring covariates TSV with sample_id + vcf_sample_id; configure for reliable explicit aliases |
| `PB_GENE_SCORING_HPO_SHA256` | Pin approved compressed matrix hash; production integration must verify release identity |
| `PB_GENE_CARRIER_CACHE_DIR` | Durable private source/build/auth-scoped cache; 24-hour TTL |

### 7.3 Scoring matrix provenance

| Item | Verified value |
|---|---|
| Source file | `2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz` |
| Remote directory | `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc/source/` |
| Dimensions | 15,764 samples × 6,440 HPO columns |
| SHA-256 | `eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6` |
| Prototype local mirror | `/private/tmp/pb-gene2-scoring-hpo-20261113/hpo.tsv.gz`; same hash |
| Prototype ID map | Same directory `covariates.tsv`, copied from corresponding scoring inputs |
| Update contract | Replace matrix + sample map + expected hash together when scoring release changes |
| Synchronization | Release-pinned mirror; no automatic remote synchronization |

- Deployment: use durable private paths; verify temporary prototype paths still exist before reuse.
- Do not substitute the phenotype-profile service's 16,366-sample matrix.
- Do not replace Gene2 n_terms with Variant's separate metadata/empty-record fallback behavior.

### 7.4 Processed GT dependency

| Item | Contract |
|---|---|
| Source | `sample_variant_gene.jsonl.gz`, processed release `2025_crdc_16366_dp20_af001_20260907` |
| SHA-256 | `e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7` |
| Coverage | GRCh38; nonsynonymous; DP ≥20; cohort AF <0.01; filtered release, not full VCF |
| Join | Exact canonical variant + canonical sample; strip only terminal `_E38`/`_G38` assay suffix |
| GT preservation | Keep allele indices/phasing/haploid calls; conflicting/missing calls stay unavailable |
| Builder | `python3 scripts/build_pb_genotype_index.py --source /private/path/sample_variant_gene.jsonl.gz --out /private/path/genotype-index` |
| Runtime | `PB_GENOTYPE_INDEX=/private/path/genotype-index`; return only current authorized carriers |

- Keep GT variant-specific; never put it in a sample-only metadata cache.
- Keep cohort matrices, GT indexes, raw sample payloads, screenshots and generated builds outside Git/public assets.
- Optional prebuilt carrier API: [backend/gene_carrier_api](../backend/gene_carrier_api/README.md); separate deployment choice.
- Gene-HPO import: [association delivery contract](pb_gene_context_association_engineering_handoff.md#precomputed-association-db-import--november-12-2026).

## 8. Acceptance and verification

### 8.1 Acceptance cases

| ID | Action / input | Expected |
|---|---|---|
| G01 | Open GJB2 | All six main blocks; missing values explicit |
| G02 | Select category filters | Variant list + distinct union demographics update; model population unchanged |
| G03 | Pin, paginate, sort, search | Pinned comparison remains visible exactly once |
| G04 | Apply 3 HPO terms; carrier has 1/2/3 matches | Included once under OR; zero matches excluded |
| G05 | HPO sort with off-page higher count | Correct global order; no five-row-only ranking |
| G06 | Open/reopen carrier table; change page | Fetch current visible n_terms; ignore stale previous-page replies |
| G07 | Matrix zero row / missing row | 0 / Unavailable; no metadata-length substitution |
| G08 | Sort carrier age/n_terms | Full variant carrier population; stable ties; page reset; bounded numeric requests |
| G09 | Sort Z/β with negatives; P in scientific notation | Numeric ordering; missing last in both directions |
| G10 | Expand annotation; then another variant | Lazy transcript identity; no stale overwrite; valid 0 AF highlighted |
| G11 | HC / non-HC + AlphaMissense / REVEL-only | 1.00 / AlphaMissense / no GRS predictor substitution |
| G12 | Re-run saved history; delete Applied | Saved settings restored; appended Applied row; deletion clears profile evidence |
| G13 | Missing scoring source/wrong hash/outside carrier ID | Explicit unavailable/400/502 as applicable; no fabricated zeros |
| G14 | Build target frontend + install backend handlers | All new endpoints reachable; static-only deployment is insufficient |

### 8.2 Regression commands

```bash
for test_file in \
  scripts/test_pb_gene2.js \
  scripts/test_pb_gene2_carrier_table.js \
  scripts/test_pb_gene2_numeric_sorting.js \
  scripts/test_pb_gene2_carrier_hpo_totals.js \
  scripts/test_gene_carrier_hpo_totals.js \
  scripts/test_pb_gene2_carrier_scores.js \
  scripts/test_pb_gene2_hpo_counts.js \
  scripts/test_gene_variant_hpo_counts.js \
  scripts/test_pb_gene2_filtered_demographics.js \
  scripts/test_pb_gene2_info_rail.js \
  scripts/test_gene_carrier_summary_endpoint.js \
  scripts/test_gene_carrier_disk_cache.js \
  scripts/test_gene_carrier_restart_cache.js \
  scripts/test_pb_variant_identifiers.js \
  scripts/test_processed_genotypes.js \
  scripts/test_pb_live_metadata.js \
  scripts/test_pb_variant_layout.js \
  scripts/test_pb_phenotype_gene_endpoint.js
do
  if ! node "$test_file"; then
    printf 'Failed: %s\n' "$test_file" >&2
    exit 1
  fi
done
NODE_OPTIONS=--openssl-legacy-provider npm run build -- --dest /private/tmp/pb-gene2-integration-build
```

### 8.3 Source-derived sanity checks (not UI constants)

| Fixture / check | Reference observation |
|---|---|
| GJB2 observed variants / distinct gene carriers | 392 / 16,143 |
| GJB2 largest variant carrier count | 15,374 |
| Gene-HPO release | 119 delivered rows; 2,774 PASS tests; 9 gene-q-significant rows |
| Variant `chr13:20189255:CCCCTTGATGAACTT:C` | 9 observed carriers |
| Same variant, first five Sample-ascending n_terms | 11, 0, 0, 79, 29; independent source-row sum + live UI verified |
| Same variant, n_terms descending first five | 135, 79, 33, 29, 11; off-page carrier moves to first row |
| Same variant, age ascending first five | 1, 2, 4, 7, 9 |
| Synthetic numeric test | 207 carriers; 3 compact ≤100-ID batches; zero/negative/missing/tie/search cases |
| Build warning baseline | Existing locuszoom/tabix-reader export warning; assess new warnings separately |
| Remaining deployment QA | Target backend auth/source configuration + narrow-screen visual verification |
