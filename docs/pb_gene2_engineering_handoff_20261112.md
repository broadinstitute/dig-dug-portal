# Gene2 — test-server implementation contract

Source delivery: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). Use the Git commit containing this document together with its baseline dependencies; the checklist is not a standalone application or deployment record.

Updated: 2026-11-15. Entry/default Gene destination: `/pb_gene2.html?query=<encoded gene>`; bare navigation defaults to GJB2. Baseline HEAD `859cd905d49e61f3a1e6765bb88ff0a2555c3128`; the follow-up source is included in the commit containing this document. This is an implementation contract, not deployment evidence. Legacy `/pb_Gene.html` is separately addressable; do not send new Gene links there.

## 1. Connect to the existing test-server BioIndex

Base: `http://100.80.30.199:5000`. Browser access stays behind the existing same-origin private proxy/authentication. Use `GET /api/bio/query/<index>?q=…`, then every returned `/api/bio/cont?token=…`; validate returned identifiers. A `limit=1` diagnostic is not a complete data load.

| Index | Query key | Use |
|---|---|---|
| `gene` | `name` | Gene identity/coordinates |
| `gene-variants-crdc` | `gene` | Current variant rows and their observed sample membership |
| `samples-info` | `SampleInVCF` | Exact carrier metadata; Project=`clean_name`, Investigator=`investigator`; recorded observed HPO |
| `transcript-consequences` | `varId` | Exact variant transcript annotation; lazy lookup |
| `variants-annotation` | `varID` | Exact variant annotation |
| `gene-hpo` / `gene-hpo15` | `gene` | Original single-gene burden results; see q/completeness distinction below |

Do not replace current membership with historical `gene-samples`, or confuse BioIndex GET `:5000/api/bio/query/gene-variants-crdc` with Helen POST `/phenotype-analyzer-api/gene-variants-crdc`. Similar names do not establish the same DTO/population. Source/catalog/release/hash details: Obsidian `PB_BioIndex_Processed_Data_Handoff_2026-09-07`, current registry. API software semantic version is not established by index built timestamps.

## 2. Same burden test, different q scopes

| Screen | Fix | Use precomputed field | BH family, before delivery filtering |
|---|---|---|---|
| **Gene / Gene2** | One gene | **`q_by_gene`**, `q_significant_by_gene`, `n_q_significant_by_gene` | All valid HPO tests for that gene |
| **Phenotype** | One HPO | **`q_by_hpo`**, `q_significant_by_hpo` | All valid gene tests for that HPO |

The same gene–HPO pair has the same original beta/p/N in both views; q may differ legitimately. Never substitute HPO-wise q for Gene-wise q, and never recalculate q from P<0.05-delivered rows, a top-15 list or the visible page.

**Verified current API gap:** `gene-hpo15?q=GJB2` returns `selection_rule=top15_p_value`, 15 rows and `q_by_hpo`; it does not contain `q_by_gene`. Those 15 original p and HPO-wise q values match the approved complete delivery. They are not wrong Phenotype q values, but are insufficient for the complete Gene2 table/Gene-wise q. Import/connect the approved complete release to the test-server association API/index and expose both q scopes. Do not claim that ingestion is already deployed or refit the tests. The existing import specification is [precomputed DB import](pb_gene_context_association_engineering_handoff.md#precomputed-association-db-import--november-12-2026).

Normalize flat BioIndex numeric/boolean strings before projection; never treat `FALSE` as a true flag. Use the existing `projectAssociation`/`singleHpoUnits` conversion for per-0.1-GRS beta and log-transformed/scaled original odds-ratio CI bounds, and connect only Gene-wise q to `qValue`.

Current prototype gateway `GET /__gene_hpo_associations__?gene=…` exposes `gene, selectionRule, nQSignificant, nTestedHpos, nAssociations, associations[]`. It currently reads a server-side release file. For the test server, supply the equivalent BioIndex-backed API projection, preserving all PASS P<0.05 rows, both effect directions, original p/N and approved display units. Its presence in local Node code does not mean that route is deployed.

Single-HPO burden outcome is binary HPO, predictor Sum GRS; current original analysis N=15,574. Custom profile Gene beta instead relates the continuous residual PheRS to Max/Sum GRS and is displayed in rPheRS SD per 0.1 GRS. These are not reversed versions of the same regression. Reference diseases are curated context, not statistical replications/diagnoses.

## 3. Screen and value contract

Order: Gene identity → CRDC variant overview → carrier demographics → single-phenotype associations → Test a phenotype profile/history → variant evidence/expanded annotation/carrier details.

| Surface | Required behavior |
|---|---|
| Navigation | Gene uses `pb_gene2.html?query=…`; Sample and Variant preserve their exact IDs in `query`. Phenotype name is dark text; only the adjacent HPO ID links to Phenotype. |
| Overview | Consequence, annotated predictors, ClinVar. Category counts are exact; bounded segment widths prioritize readability and are not percentages. Uniform 22px count labels; Others has evenly spaced subdivisions. Predictor sources can overlap. |
| Demographics | Distinct observed gene carriers; selecting variant display filters uses the distinct union of those variants' carriers, without changing the analysis cohort. |
| Associations | Complete delivered rows; Gene-wise q; sortable/searchable/pinned, five rows/page. Missing q stays unavailable. |
| Custom HPO | Apply waits for validated terms/settings; preserve result history, rerun/delete and Applied state. Rerun restores settings. Removing Applied clears its downstream profile evidence. |
| Variant evidence | Five rows/page plus pins; exact identifier/nearest-position search; numeric sorting across the full result set, missing last in both directions; ties by variant ID. Preserve identifier search while sorting. |
| ClinVar filter | Shared state with overview: P/LP, VUS, B/LB, Conflict, No ClinVar plus real extra categories. Draft checkboxes/Select all/Clear/Cancel/Apply; empty Apply disabled. OR within facet, AND across facets; preserve original annotation and model/GT data. |
| Expanded carrier samples | Sample, Age, Sex, GT, Total HPO terms, individual rPheRS Z, Project, Affected. Five rows/page; full-ID search and global numeric Age/n_terms/Z sort. |
| GT | Exact variant + canonical sample join; only strip terminal `_E38`/`_G38` when allowed. Preserve allele indices/phase and unavailable/conflict; never infer GT from carrier presence. |
| Predictor score | LoFTEE HC=1, otherwise available AlphaMissense; REVEL reference-only. Valid zero is not missing. Do not substitute REVEL into the burden predictor. |
| HPO reference count | Exact recorded applied IDs combined with **OR**, person counted once. Different from n_terms and rPheRS coverage. |
| Total HPO terms | Full approved scoring-matrix row sum `n_terms`; not metadata list length or HPO match count. Missing row is unavailable; a measured zero remains zero. |
| Help / scale | 80% before first paint through `public/index.html`; do not apply a second mounted zoom. Hover/focus should not move its icon by resizing the page; pin may reserve a rail. Preserve zoom-aware InfoRail behavior. |

## 4. Shared HPO availability — new dependency

`ProfileInput.vue`, `ContextPanel.vue`, `Template.vue` and `src/utils/crdcHpoAvailability.js` work together. The same ProfileInput is used by Variant.

- `GET /__pb_phenotype_profile__/hpo-counts` must expose full parent-expanded CRDC cohort counts. A term needs **at least one** recorded sample; this is not a ten-carrier threshold or a requirement that this gene's carriers contain the term.
- Disable zero/absent terms; raw draft typing must not commit chips. Validate paste, Apply, direct execution and reruns; `finish() === false` stops submission. Enter still submits a valid completed profile.
- Loading/lookup failure is not zero; preserve Retry while typing, then recover selection after a successful check. Cache only a successful source response.
- This 16,366-sample availability dataset is distinct from the approved 15,764-sample Gene scoring matrix and 15,574 original binary-HPO analysis. Do not replace one with another to force equal counts. Keep backend eligibility checks too.

The browser contract is new local functionality; implement/reuse an equivalent test-server aggregate over its existing approved cohort data. It is not a verified pre-existing BioIndex index. [Phenotype handoff](pb_phenotype_live_profile_and_spec_2026-10-16.md) specifies the shared matching/count adapter.

## 5. Application API adapters

These are current prototype routes to port/adapt, not already verified test-server routes.

| Route | Request / essential result |
|---|---|
| `GET /__public_gene_variants__` | `gene`, optional locus; public annotation/aggregate projection only |
| `GET /__gene_carrier_summary__` | `gene`, optional `variant`/`refresh`; loading/ready/error + progress; poll to ready |
| `POST /__gene_carrier_demographics__` | `{gene,variant_ids}`; distinct union summary with progress |
| `GET /__pb_gene_genotypes__` | `gene`; authorized exact variant/sample GT rows with source/status |
| `POST /__gene_variant_hpo_counts__` | `{gene,variant_ids,hpo_terms}`; `match:any`, exact terms/gene, per-variant `count,metadataCount,carrierTotal,complete`. Unknown metadata is not zero. |
| `POST /__gene_carrier_hpo_totals__` | `{gene,variant,sample_ids}`; counts or null per requested ID, source method `binary_hpo_matrix_row_sum`, covariate `n_terms`, source hash/dimensions |
| `POST /__gene_carrier_sort_values__` | Same scoped IDs plus `field:age|hpoTerms`; complete numeric values map before global ranking |
| `POST /phenotype-analyzer-api/analyze` | `{gene,terms,score_type,affected_only,advanced:{significance_metric,significance_threshold,min_carriers}}`; Gene/Variant association fields plus full-cohort `rphers_standardization`. Optional exact `variant_id` requests individual carrier scores. |

HPO count limits: up to 20,000 variants, 1–50 HPOs, body ≤1MB. n_terms/sort limits: 1–100 authorized sample IDs, body ≤128KB; ordinary visible page requests ≤5 IDs, global numeric sorts use ≤4 workers. Validate every echoed gene/variant/term/reference, numeric types and scope; abort stale requests. A partial load is not a complete ordering.

The historical test-server `/analyze` response with only sample `top_matches` is not this context-analysis DTO. Reuse its cohort integration and implement the required adapter/output; do not simply redirect the whole base URL. Gene model/display filtering must not silently change the scoring reference. [Calculation/API reference](pb_gene_context_association_engineering_handoff.md) contains the model implementation details; this document's current BioIndex membership/q rules override its older index examples.

## 6. Files and server setup

Carry all current `src/views/PbGene2/` and existing `PbGene`/`PbVariant` imports, including `carrierScores`, `filteredCarrierDemographics`, `variantHpoCounts`, `carrierHpoTotals`, `carrierTable`, `variantFacets`, `associationRows`, identifier/navigation helpers, shared input and units. Keep generated identity/reference files. The shared helpers are included in this source delivery.

Server handlers: `scripts/{gene_carrier_summary_endpoint.js,gene_carrier_disk_cache.js,gene_carrier_hpo_totals_endpoint.js,gene_variant_hpo_counts_endpoint.js,gene_hpo_association_endpoint.js,gene_genotype_endpoint.js,processed_genotype_source.js}` plus their imported dependencies. Merge `vue.config.js` registration/proxies into the target server; static build alone supplies none of these routes.

| Configuration | Meaning |
|---|---|
| `BIOINDEX_HOST_PRIVATE` | Test-server BioIndex base, currently `http://100.80.30.199:5000`; retain source/auth-scoped caches and continuation |
| `PHENOTYPE_ANALYZER_HOST_PRIVATE` | Compatible Gene Context service; local example 8092, not an API version |
| Common profile/count adapter | Shared availability service; local example 8093. It is also needed in a Gene2/Variant-only migration. |
| `PB_GENE_SCORING_HPO_MATRIX`, `PB_GENE_SCORING_SAMPLE_MAP`, `PB_GENE_SCORING_HPO_SHA256` | Approved Gene n_terms/scoring source and exact ID mapping; replace/version together |
| `PB_GENE_HPO_FILE`, `PB_GENE_HPO_RELEASE_ID` | Local reference reader's precomputed source; on test server ingest/expose the same approved release through the association API |
| `PB_GENOTYPE_INDEX`, `PB_GENE_CARRIER_CACHE_DIR` | Private processed-GT cache and source/auth/build-scoped metadata cache; never public assets |

Approved source provenance, not a new browser data source: Gene matrix server file `.../share/dig-dug-portal/pb_context_demo/20261007-5a9ab06cc/source/2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz`, 15,764×6,440, SHA-256 `eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6`; full paths in the Obsidian registry. The local `/private/tmp` mirror is not a portable installation path.

Current approved processed GT release is `2025_crdc_16366_dp20_af001_20260907`, nonsynonymous/DP≥20/cohort AF<0.01/GRCh38. The approved share source and hash are in [Sample runtime](pb_sample_engineering_integration_handoff.md#6-private-inputs-and-startup). `setup_pb_genotypes.py`/`prepare_pb_genotypes.sh` verify and reuse a private persistent cache; no personal `/ref/` fallback. Existing valid caches can work offline; this does not change the BioIndex carrier universe. Original-VCF supplementation/scoped analysis belongs to the separate [Variant contract](pb_variant_engineering_integration_handoff.md).

## 7. Acceptance

1. Query current BioIndex with full continuation, preserve exact identity/sample membership and Project/PI fields. Do not compare counts from different releases as if identical.
2. Complete association rows and Gene-wise q; same pair beta/p/N and HPO-wise q match the source. Do not use a top-15 preview as the entire table.
3. Global sorting/pins/search/pagination, unknown versus zero, ClinVar draft/Apply/Cancel and off-page numeric maxima work; source 0 and negative/scientific numeric values sort correctly.
4. Missing HPO blocks all entry paths; exactly one globally recorded sample is allowed; service failure/Retry and valid Enter submission work. No actual model needs to be run solely to validate input gating.
5. Target-service context reference/scope, exact variant IDs, GT source/cache reuse and restart/auth behavior pass. Verify 80% first paint and hover/pin placement on desktop.

```sh
node scripts/test_pb_gene2.js
node scripts/test_crdc_hpo_availability.js
node scripts/test_pb_gene2_carrier_table.js
node scripts/test_pb_gene2_numeric_sorting.js
node scripts/test_pb_gene2_hpo_counts.js
node scripts/test_pb_gene2_carrier_hpo_totals.js
node scripts/test_pb_gene2_info_rail.js
node scripts/test_gene_variant_hpo_counts.js
node scripts/test_processed_genotypes.js
node scripts/test_pb_prototype_scale.js
```

Current local checks do not prove the test-server adapter, source ingestion, authorization or deployment. Record that evidence after implementation.
