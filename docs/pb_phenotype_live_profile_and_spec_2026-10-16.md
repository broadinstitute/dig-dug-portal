# Phenotype — test-server implementation contract

Source delivery: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). Use the Git commit containing this document together with its baseline dependencies; the checklist is not a standalone application or deployment record.

Updated: 2026-11-15. Entry: `/pb_phenotype.html`. Baseline HEAD: `859cd905d49e61f3a1e6765bb88ff0a2555c3128`; the implementation and required new files are included in the commit containing this document. This document replaces the older layout/spec instructions in this file. It does not establish deployment.

## 1. Engineer / implementation-AI starting point

1. **Use the test server's private BioIndex API as the data source:** `http://100.80.30.199:5000/api/bio/query/<index>?q=…`. Retain authentication, exact query keys and every continuation. Use a same-origin private gateway in the deployed portal.
2. Port the current source, including new files; do not implement from the mockup numbers or HEAD alone. Preserve the portal's existing routing/build configuration and merge the required handlers.
3. Reuse the test server's existing cohort/scoring integration. Where the existing API response is insufficient, implement the missing server-side adapter/aggregate/index described below. The prototype's Python/SQLite readers are reference implementations, **not an instruction to replace BioIndex with a developer's Mac files**.
4. Read the calculation/denominator table before connecting fields. Same-looking values from different cohorts or q scopes are not interchangeable.
5. Verify complete payloads, IDs, source identity, unavailable states and UI behavior on the target server. An HTTP 200 or a frontend build is insufficient.

Related current contracts: [Sample](pb_sample_engineering_integration_handoff.md), [Gene2](pb_gene2_engineering_handoff_20261112.md), [Variant](pb_variant_engineering_integration_handoff.md), [common API map](pb_front_gene_variant_merge_handoff.md#current-integration-map--2026-11-15). Full paths/checksums/catalog evidence are maintained in Obsidian `PB_BioIndex_Processed_Data_Handoff_2026-09-07`, current source registry.

## 2. Existing test-server API versus additions required

| Source / route | Verified current contract | Implementation requirement |
|---|---|---|
| BioIndex `samples-info`, key `SampleInVCF` | Metadata, observed `phenotypes[]`, `clean_name`, `investigator` | Project=`clean_name`, Investigator=`investigator`. Validate exact assay ID/canonical mapping. Do not substitute CSV project labels. |
| BioIndex `gene-hpo`, key `gene` | Original single-gene burden pairs, including `p_value`, `q_by_hpo`, original coefficient/CI/N | Statistical source for HPO-wise results; current query key is gene. Supply an efficient HPO-keyed server lookup for the new Phenotype table. Do not scan every gene in the browser. |
| BioIndex `gene-hpo15`, key `gene` | `selection_rule=top15_p_value`; 15 associations for GJB2; `q_by_hpo` | Valid legacy preview, **not the complete HPO→all-genes result**. Do not reverse this truncated list to build Phenotype results. |
| Test-server `POST /phenotype-analyzer-api/analyze` | Historical captured response: `top_matches[30]`, submitted/valid term counts | Reuse its underlying cohort/scorer where equivalent, but extend/adapt to the full sample-set contract below. Thirty matches cannot produce full projects, denominators or export. The old response is not the Gene/Variant context DTO either. |
| Static reference bundles | HPO/Orphanet/OMIM/DECIPHER/DDG2P generated source files in `PbPhenotype` | Curated references remain separate from CRDC observations and statistical tests. Ship generated files with their metadata. |

On 2026-11-15 the BioIndex catalog returned 41 indexes. Relevant built strings: `samples-info` 2026-10-05T14:59:41, `gene-hpo` 2026-09-17T18:08:16, `gene-hpo15` 2026-09-21T15:14:35. These are **index build timestamps, not API software/release versions**. A software semantic version is not established by the catalog.

## 3. Browser-facing contracts to preserve

These `/__…__` names are the current prototype gateway contracts. On the test server, implement equivalent authenticated application routes/adapters over the existing server data; they are not claimed to be already deployed BioIndex endpoints.

| Method / route | Request | Required response / behavior |
|---|---|---|
| `GET /__pb_phenotype_profile__/hpo-counts` | No sample payload | `counts: {HPO: integer}` from the complete parent-expanded CRDC search cohort. No patient IDs. Not a gene's carriers, displayed sample page or top-matches count. |
| `POST /__pb_phenotype_profile__/profile` | `{hpo_ids:[…], page, page_size:100}` | Full **union** of samples matching any input HPO, paginated without top-N truncation. Include `cohort_sample_count`, `pagination.total`, `scoring_method`, `rphers_standardization`, `samples[]`. UI applies All/Any/Custom and other filters after collecting all pages. |
| Same profile sample row | — | `sample_id`, `expanded_hpo_ids`, `exact_match_count`, `rphers_z`, `age_at_enrollment`, `gender`, `initial_study_affected`, `cohort_category`, `investigator`. Preserve nulls and canonical IDs. `scoring_method` currently equals `residual PheRS: rphers_fast.score_samples`. |
| `GET /__hpo_gene_associations__?hpo=…&view=all-genes` | One HPO | Complete existing PASS P<0.05 delivery for that HPO, both effect directions, no top-15/top-20 cap. `associations[]`, `releaseId`, `sourceSha256`, `selectionRule`, `qScope=within_hpo`, `completeDelivery`; original burden membership contract below. |
| `POST /__hpo_gene_carrier_comparison__` | `{hpo_ids, minimum, sample_ids}` | For multi-HPO only: existing Sum GRS>0 counts for the exact current group versus covered everyone-else samples. Return coverage, per-gene carrier counts, ratio, unadjusted two-sided Fisher p and per-query carrier counts. No regression beta/q and no returned sample identifiers. |

Adapter types/units: flat BioIndex `gene-hpo` can return numeric/boolean strings. Normalize these explicitly (`FALSE` is not truthy evidence). Project `p_value→pValue`, `n_samples→nSamples`, and only the correct page's q into `qValue` with an explicit `qScope`. Reuse `projectAssociation`/`singleHpoUnits`; raw `ci_lower_approx`/`ci_upper_approx` are odds-ratio bounds, not already the displayed beta CI. Preserve both effect directions.

`query`, `match=all|any|atLeastTwo`, `min_match`, `exclude`, `filters`, `gene_scope`, `source` remain supported. `atLeastTwo` is the legacy serialized name for Custom; it can carry a minimum other than two. `required:true` phenotype filters are AND requirements **outside** the included All/Any/Custom group. Preserve them through URL reload and Advanced Apply.

## 4. Values, models and q — do not mix

| Display | Correct source / denominator |
|---|---|
| Search total, common metrics, Who table | Current All/Any/Custom group after exclusions/Advanced filters, from the full 16,366-sample search cohort. Project table local filters do not change this group. |
| Individual / project mean rPheRS Z | Existing scorer's full-cohort reference for this profile. Project mean uses available individual Z values; no recentering/restandardization after display filtering. Missing is not zero. |
| Project Affected | Counts **Yes / No**, with unknown separately. Individual sample Affected is Yes/No/Unknown. Age median/Q1/Q3 use known valid ages; sex F/M retains unknown. |
| Single-HPO burden | Same original binary-HPO single-gene burden tests shown by Gene2, pivoted by HPO. Stored beta/p/N unchanged; no new regression. Current original analysis N=15,574. |
| **Gene / Gene2 q** | **`q_by_gene`: fix one gene; BH over all its valid HPO tests, before P<0.05 delivery filtering.** |
| **Phenotype q** | **`q_by_hpo`: fix one HPO; BH over all its valid gene tests, before P<0.05 delivery filtering.** |
| Same gene–HPO pair | Beta, original p and analysis N agree across views; the two q values may legitimately differ. Never rename one q as the other or recompute q on delivered/visible rows. |
| Single-HPO carrier columns | Original burden-analysis `gene_score_sum > 0` memberships and original HPO case set, aligned to the same 15,574 analysis rows. The case denominator can differ from the 16,366-cohort search matches. |
| Multi-HPO gene comparison | Separate approved Sum GRS membership snapshot aligned to the 16,366 search cohort; current covered samples=15,748. Percentages/ratio/Fisher use **covered** denominators, not all samples. |
| External diseases | Curated reference evidence, not a CRDC association input, replication or diagnosis. Missing reference disease=`None linked`. |

The live GJB2 `gene-hpo15` response has no `q_by_gene`. Its 15 p and `q_by_hpo` values matched the same pairs in the approved delivery during this audit. The missing Gene-wise q field is a **Gene integration gap**, not an error in Phenotype's HPO-wise q. Populate the server API/index from the approved complete delivery, preserving both q fields; do not refit tests or infer Gene q from the top-15 preview.

Use `src/utils/singleHpoUnits.js` for the approved per-0.1-GRS display conversion. The Phenotype header is `β`; hover explains β per 0.1 Sum GRS and the GRS definition without log-odds text. Underlying binary-HPO model/effect units do not change because the label is shorter. Custom Gene rPheRS-SD beta is a different outcome/unit.

Current single-HPO UI expects `carrierCoverage.sampleMembership` with schema `original-burden-memberships-v1`, `hpoId`, `cohortId`, `analysisN`, `nCases`, `hpoSampleIds`, `geneCarrierSampleIds`. IDs are opaque zero-based analysis-row positions, not CRDC patient IDs; keep them private. `singleBurdenCarriers.js` validates and intersects these sets. Missing/mismatched memberships yield — and must not suppress stored beta/p/q. Do not feed the multi-HPO snapshot or an all-variant carrier union into this contract.

## 5. UI acceptance contract

- Search field/Advanced behavior: one simple Include/Exclude search; green Advanced button; each Advanced phenotype row searches locally. While Advanced is open, the top search controls are disabled; changes are draft until Apply.
- Default is **All (AND)**. Two HPOs offer All/Any. Three or more also offer **Custom**, integer minimum 1…N; boundary 1 becomes Any and N becomes All. The collapsed summary and result header show the applied rule and required count. No second Match selector outside Advanced.
- Each entered HPO needs **≥1 recorded CRDC sample in the availability matrix**. Disable unavailable suggestions; validate paste, Advanced, URL and direct execution. Loading/error is not zero; provide Retry. Apply the same helper to Gene2/Variant Custom HPO, without changing their model matrices/carrier thresholds.
- Six positive-result cards: common summary → Projects → Who → Matching samples → Genes → External diseases. Summary includes four metrics **and** mutually exclusive colored combination cards for multi-HPO queries.
- Project mean Z and individual Z remain. `Phenotype match` labels the multi matched-count column. Five unpinned rows/page; pins stay fixed; numeric pagination shows at most five numbers; expanded project HPO paging uses arrows.
- Sample Project/Investigator header offers a searchable multi-select filter and A→Z/Z→A sort. It affects sample-table pins/copy/CSV only, with X of N caption; Advanced Project remains the global search condition.
- Who retains the phenotype +/− table, sorts before pagination and omits query HPOs/ancestors. Percentages use the complete matching group. `Subtype of` is an ontology relationship, not a different denominator. Require adds an external AND rule; Exclude removes matching observations.
- Zero intersection is valid even when each HPO individually exists: show a full-width gray bar, explicit no-match/rule explanation, no 0/0 age/affected figures; hide empty CRDC detail cards, retain external references. Unavailable HPO is a separate validation state before calculation.
- Keep readable desktop fonts/grid lines at the existing 80% scale. Hover/focus panels must account for zoom, stay within the viewport, flip above/below and close on Escape/navigation. Sample/Gene/Variant links retain exact encoded query IDs.

## 6. Source files and reference backend

| Layer | Carry together |
|---|---|
| UI | Entire `src/views/PbPhenotype/`, including generated ontology/reference/catalog files and new components/helpers/CSS. The reused results component is named `SinglePhenotypeResults.vue` even for multi-HPO. |
| Shared gate / units | `src/utils/crdcHpoAvailability.js`, `singleHpoUnits.js`, `rphersUnits.js`; shared Gene2 `ProfileInput.vue` / `ContextPanel.vue`, Gene2/Variant validation entry points |
| Gateway / lookup | `scripts/gene_hpo_association_endpoint.js`, `pb_hpo_gene_index.py`, `pb_burden_memberships.py`, `pb_phenotype_carrier_counts.py` |
| Profile reference | `scripts/pb_phenotype_profile_api.py`, `pb_profile_metadata.py`, `pb_gene_context_api_server.py`, `pb_gene_context_validation.py`, `rphers_fast.py`, `rphers_standardization.py`; retain their imports. Sample routes share this service: follow the Sample handoff. |
| Registration / startup | Merge `vue.config.js` handlers/proxies; retain `public/index.html` first-paint scale. `serve_pb_phenotype_local.sh` is a **local runner**, not the test server's configuration. |

Local implementation only: profile service 8093; Gene Context 8092; sample-GRS membership 8094; scoped Variant Context 8095. Frontend launcher starts at 8098 and may use the next free port; 8099 is the reviewed local screen. These are not test-server BioIndex ports. Do not redirect the whole `/phenotype-analyzer-api` base to a differently contracted API.

For a matching private reference installation, the existing readers use:

```text
<repo>/.pb-private-data/precomputed/gene_hpo_release_20261112/
  browser_gene_hpo.jsonl.gz   hpo-gene.sqlite
<repo>/.pb-private-data/precomputed/burden-original-memberships/
  membership.sqlite          provenance.json
<repo>/.pb-private-data/precomputed/grs-membership/
  metadata.json  membership.npz  hpo.npz  coverage.npy
```

The two membership directory locations are currently fixed relative to the Python/Node source, not configurable via an invented environment variable. A test-server API adapter may use equivalent private storage, but must preserve the response/cohort contracts. Source install/import paths and hashes are in the Obsidian registry; these are **server preparation provenance**, not browser files.

Local-only configuration: `PB_PHENOTYPE_HPO_MATRIX`, `PB_PHENOTYPE_METADATA`, `PB_PHENOTYPE_COHORT_MAPPING`, `PB_GENE_HPO_FILE`, `PB_HPO_GENE_INDEX`, `PB_GENE_HPO_RELEASE_ID`, `PB_INDEX_PYTHON`. Use durable server configuration. The local metadata TSV currently falls back to its matching XLSX; do not assume the TSV is a valid portable input. Missing snapshots/indexes must remain explicit errors/unavailable, not fabricated statistics. Static build output does not install Node/Python routes.

## 7. Verify before declaring the test server implemented

1. BioIndex catalog/source/auth/query keys/continuations and Project/PI mapping match the test server. Confirm the **actual** API release/fields after any DB ingestion; do not infer it from index names or built timestamps.
2. Gene2 uses Gene-wise q and Phenotype HPO-wise q; same pair beta/p/N match. Full HPO lookup is not top-15. Membership source/cohort/N match the declared table.
3. Example query HP:0025354+HP:0000365+HP:0001250: All=8, Any=3,447, Custom minimum2=332, combinations 8+192+78+54 on the reviewed source. Examples are checks, never constants.
4. Hearing abnormality+Fever+Juvenile cataract: All=0, Any=2,920, minimum2=261 on the reviewed source; zero bar stays horizontal. Verify labels, common metrics and phenotype denominators update together.
5. Missing HPO blocks calculation; a live HPO with exactly one sample is allowed. Count-service failure/retry, null/zero distinction, URL reload, +/− predictions, filters/pins/copy/CSV, exact links and zoom-aware hover work.

```sh
node scripts/test_crdc_hpo_availability.js
node scripts/test_pb_phenotype_single.mjs
node scripts/test_pb_phenotype_model.mjs
node scripts/test_pb_phenotype_selection.js
node scripts/test_pb_phenotype_input.js
node scripts/test_pb_phenotype_profile_editor.js
node scripts/test_pb_phenotype_tooltip.mjs
node scripts/test_pb_phenotype_gene_endpoint.js
node scripts/test_pb_burden_frontend_carriers.js
python3 -m unittest scripts.test_pb_phenotype_carrier_comparison
```

Local desktop/function evidence: `design-qa.md`. Target-server API wiring, authentication, release installation and deployment acceptance must be verified there; local QA is not deployment evidence.
