# Phenotype — test-server implementation contract

November 15 delivery snapshot: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). It describes the earlier delivered source and its dependencies, not the November 16 additions in this Git delivery. Use the current follow-up sections together with the delivered baseline; the checklist is not deployment evidence.

Updated: 2026-11-16. Entry: `/pb_phenotype.html`. Latest delivered HEAD: `306ded0b8`; the November 16 section records additional changes included in this Git delivery. The November 15 delivery used baseline `859cd905d49e61f3a1e6765bb88ff0a2555c3128`. This document replaces the older layout/spec instructions in this file. It does not establish deployment.

## 2026-11-16 results UI — current local follow-up

This section and the updated acceptance bullets supersede the November 15 result-layout rules. The session reviewed `http://127.0.0.1:8098/pb_phenotype.html?query=HP%3A0000364%2CHP%3A0031703&match=any&gene_scope=any`; this is a local entry, not a deployment URL. Baseline HEAD during documentation was `306ded0b8`. These November 16 edits are included in this Git delivery. No server deployment, data ingestion or fresh backend/catalog acceptance was performed. The November 15 source-delivery manifest describes the earlier delivery and does not certify these later edits. This delivery also includes the separately reviewed Gene2, Variant and Sample changes; preserve each current page contract.

Four-page review: the latest accepted Phenotype behavior below was retained after comparing current source with `306ded0b8`. The final UI imports **`ProjectPhenotypeTree.vue`** for both hierarchy contexts. `CohortPhenotypeTree.vue` is an unused intermediate layout; do not reconnect it or restore its five-column Require/Exclude hierarchy. Include the [shared local lifecycle files/commands](pb_front_gene_variant_merge_handoff.md#local-development-lifecycle--2026-11-16). This documentation consolidation adds no new Phenotype model/layout change or final visual/backend acceptance claim. The full frontend build passed before this Git delivery.

### Final accepted layout and hierarchy

- Card order: summary → **Who the matching samples are** → Projects → Matching samples → Genes → External diseases. Complete-group statistics come before project-level detail.
- Who defaults to **Hierarchy** with a **Table** switch. In Hierarchy, Age / Sex / Affected occupy one horizontal row above a full-width phenotype tree. In Table, the desktop split is 40% demographics stacked at left / 60% phenotype table at right. Narrow screens stack the content.
- The final Hierarchy is a connected, collapsible HPO list, using the same `ProjectPhenotypeTree.vue` presentation as expanded projects. Each line contains the term, its HPO link and `distinct samples with the term / matching samples`. **No cell grid, percentage columns or Require/Exclude actions in Hierarchy.** The intermediate 40:60 tree with five numeric/action columns is superseded. `CohortPhenotypeTree.vue` is an intermediate working-tree artifact and is no longer imported by the results page; do not use it as the accepted UI.
- HP:0000118 is initially open. Immediate categories are visible; other branches stay collapsed except paths needed to reveal the selected query phenotypes. Users expand deeper terms themselves. Counts include more-specific descendants and count each sample once per HPO, including in multiple-parent graphs. Only observed/nonzero branches and their connecting ancestors are constructed. A deterministic single-parent presentation shows each HPO once in the tree; the count still uses all ontology ancestors.
- Query rows retain the query chip/marker color and a tinted full row. Query terms appear first in a separate Selected phenotypes overview, then in their original hierarchy position. Query-containing branches precede other siblings. The table also puts selected terms first, followed by five paginated other terms; it omits query ancestors from the other-term list. Selected overview rows are intentional repeat navigation/context, not extra samples.
- Hierarchy Phenotype opens an Excel-style searchable checkbox list containing only the **displayed immediate children of HP:0000118**. Applying categories keeps their descendant subtrees and the root. All/clear/cancel/apply and a reset caption are supported; clearing every category gives an empty tree. This is a display filter, not a new sample cohort or denominator. Query overview rows respect this hierarchy filter; the Table view remains the complete matching group.
- Samples / All CRDC controls sort siblings within branches while preserving query-path priority and parent–child relationships. Table headings retain numeric sorting and Require/Exclude; Require remains an AND rule outside the included All/Any/Custom group. Do not restore Require/Exclude inside the hierarchy.
- Expanded projects retain age and show the connected HPO tree in place of the old flat Samples/Share table and five-term pagination. Their denominator is matching samples **within that project**, not every sample enrolled in that project.

### Sample table and external disease behavior

- Multi-HPO sample **Phenotype match** now opens phenotype checkboxes rather than sorting the match count. A row passes if it matches any checked input term (including parent-expanded observations), then intersects with the selected projects. Empty selection gives no rows. This local filter applies to pins, pagination, copied IDs and CSV; it does not change summary, project or gene-comparison groups. Changing input HPO IDs clears obsolete phenotype selections.
- Disease layout uses 4.5:5.5 left disease / right separating-phenotype columns on wide screens. Compact single-line headers and horizontal overflow protect narrow panels. Disease Rank/name/matched count/curated genes and separator phenotype/disease count/sample count/Require/Exclude headers sort their complete lists before pagination. Separator candidates still use the original top-ten reference ranking, not whichever disease sort/page happens to be displayed.
- Multi-HPO Rank is a small blue circular number; click to expand `DiseaseRankDetails.vue`. It shows selected terms matched / input count, the disease annotation count, the actual matching annotation, reported frequency and weight for each query, coverage arithmetic and final score. Unmatched query terms remain explicit. The Rank superscript information icon describes source-specific ordering; sorting the table does not renumber the original reference Rank.
- Orphanet: each query uses its highest-frequency exact/descendant annotation. Weights are Obligate 0.9950, Very frequent 0.8911, Frequent 0.5446, Occasional 0.1733, Very rare 0.0297; Excluded (0%) is ignored. Let S be the summed query-match weights, K the input-term count and W the existing ancestor/descendant-reduced disease denominator. Q=S/K; D=min(1,S/W); score=2QD/(Q+D), with zero when both coverages are zero. Rank is score descending, then Q descending, then name. The same annotation can explain more than one query. This is a reference score, not a diagnostic probability.
- OMIM/DECIPHER/DDG2P use existing unweighted order: number of matched disease annotations, query terms matched, disease coverage, then name. Their details state that frequency weights are not supplied/used. No ranking algorithm or data release was changed in this session.

### Carrier ratio, Fisher help and curated links

- **How much more often** superscript help shows `(matching carriers / matching GRS-covered samples) / (other carriers / other GRS-covered samples)`. Carrier means approved Sum GRS > 0. Missing GRS coverage is excluded from both denominators; visible group totals can therefore exceed the denominators used in percentages/tests.
- Multi-HPO p is labelled **Fisher p-value**, with `unadjusted` below. Its superscript help supplies the two-sided Fisher exact definition and an actual dynamic 2×2 table for the first gene under the current sort: rows=matching/everyone else, columns=carrier/non-carrier. Non-carriers equal covered N minus carriers. Shared help components accept an optional table without changing existing text-only consumers.
- This remains a simple descriptive comparison: no age/sex/ancestry/project/family adjustment and no multiple-testing correction. It is not the original burden-model p/q. Zero comparison carriers retain the existing unavailable-ratio behavior. Example from the reviewed hearing+ear-morphology OR query: OBP2B `(73/1871)/(291/13877)=1.8606`, displayed 1.9×; Fisher table `[[73,1798],[291,13586]]`, p≈5.53e-6. These are source-specific examples, not constants.
- **Reference disease** is renamed **Phenotype-matched disease links**, with help and explicit `No phenotype-matched link in loaded references`. These are qualifying curated gene–disease–phenotype links across loaded sources with available gene mappings. Orphanet multi-HPO links retain score ≥0.1. They provide context and do not enter carrier ratio/Fisher calculations. No link does not establish that a gene has no known disease association.
- Source audit for that example query: GJB2 had 11 qualifying links, ESRRB 1. OBP2B/GGACT/ISM1/TESK1 had no gene records in the loaded reference bundles; SLC30A7 had one record, but none qualifying for that phenotype search. These counts do not generalize to another query/reference release.

### Files and validation of this follow-up

- Main UI/CSS: `src/views/PbPhenotype/SinglePhenotypeResults.vue`, `singlePhenotypeResults.css`.
- Hierarchy, counting, branch selection/sorting and sample filters: `ProjectPhenotypeTree.vue`, `singlePhenotypeModel.js`, reused/configurable `ProjectTableFilter.vue`.
- Rank explanation: new `DiseaseRankDetails.vue`, `diseaseRankEvidence.js`; existing `phenotypeModel.js` scoring is unchanged.
- Superscript help and optional 2×2 table: `ResultInfo.vue`, shared `src/views/PbGene2/HelpTooltip.vue`, `InfoRail.vue`. Preserve backward-compatible defaults.
- Passed during this session: `node scripts/test_pb_phenotype_single.mjs`, `node scripts/test_pb_phenotype_model.mjs`, `node scripts/test_pb_gene2_info_rail.js`, `node scripts/test_pb_gene_reference_evidence.js`; Vue template compilation for changed components and script compilation for the methods/help changes; `git diff --check`.
- Added checks cover distinct-sample/multiple-parent counts, deep query-path opening, checkbox/project intersection, pins and page resets, immediate-category filtering, sibling ordering, query-first rows, rank evidence reproducing the actual top-ten Orphanet numerator, and Fisher-help covered denominators. Actual ranking examples were recalculated from the local reference bundle.
- Early intermediate views were checked in the browser. The user subsequently took over visual verification; the **final simplified hierarchy and final circular Rank layout were not visually reverified by the agent**. The full frontend build passed before this Git delivery; final visual and target-server acceptance remain pending. Recheck responsive placement, category checkboxes, tree disclosure, selected colors, circular-rank expansion and superscript info/2×2 table on the target implementation.

## 2026-11-15 UI follow-up — included in this delivery

The shared Guide PDF popup and default 100% scale are implemented locally. Carry the component, public PDF/preview, page imports and styles from the [common Guide contract](pb_front_gene_variant_merge_handoff.md#shared-guide-popup). Use the delivery commit containing this document and its full repository dependencies; the earlier `ddf455104` alone does not include this follow-up. APIs, data releases and analysis contracts below are unchanged.

## 1. Engineer / implementation-AI starting point

1. **Use the test server's private BioIndex API as the data source:** `http://100.80.30.199:5000/api/bio/query/<index>?q=…`. Retain authentication, exact query keys and every continuation. Use a same-origin private gateway in the deployed portal.
2. Port the complete delivered implementation commit, including its new files and baseline dependencies; mockup numbers are examples, not source data. Preserve the portal's existing routing/build configuration and merge the required handlers.
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
| External diseases | Curated reference evidence, not a CRDC association input, replication or diagnosis. Missing qualifying link=`No phenotype-matched link in loaded references`; see the November 16 source/filter explanation above. |

The live GJB2 `gene-hpo15` response has no `q_by_gene`. Its 15 p and `q_by_hpo` values matched the same pairs in the approved delivery during this audit. The missing Gene-wise q field is a **Gene integration gap**, not an error in Phenotype's HPO-wise q. Populate the server API/index from the approved complete delivery, preserving both q fields; do not refit tests or infer Gene q from the top-15 preview.

Use `src/utils/singleHpoUnits.js` for the approved per-0.1-GRS display conversion. The Phenotype header is `β`; hover explains β per 0.1 Sum GRS and the GRS definition without log-odds text. Underlying binary-HPO model/effect units do not change because the label is shorter. Custom Gene rPheRS-SD beta is a different outcome/unit.

Current single-HPO UI expects `carrierCoverage.sampleMembership` with schema `original-burden-memberships-v1`, `hpoId`, `cohortId`, `analysisN`, `nCases`, `hpoSampleIds`, `geneCarrierSampleIds`. IDs are opaque zero-based analysis-row positions, not CRDC patient IDs; keep them private. `singleBurdenCarriers.js` validates and intersects these sets. Missing/mismatched memberships yield — and must not suppress stored beta/p/q. Do not feed the multi-HPO snapshot or an all-variant carrier union into this contract.

## 5. UI acceptance contract

- Search field/Advanced behavior: one simple Include/Exclude search; green Advanced button; each Advanced phenotype row searches locally. While Advanced is open, the top search controls are disabled; changes are draft until Apply.
- Default is **All (AND)**. Two HPOs offer All/Any. Three or more also offer **Custom**, integer minimum 1…N; boundary 1 becomes Any and N becomes All. The collapsed summary and result header show the applied rule and required count. No second Match selector outside Advanced.
- Each entered HPO needs **≥1 recorded CRDC sample in the availability matrix**. Disable unavailable suggestions; validate paste, Advanced, URL and direct execution. Loading/error is not zero; provide Retry. Apply the same helper to Gene2/Variant Custom HPO, without changing their model matrices/carrier thresholds.
- Six positive-result cards: common summary → Who → Projects → Matching samples → Genes → External diseases. Summary includes four metrics **and** mutually exclusive colored combination cards for multi-HPO queries.
- Project mean Z and individual Z remain. `Phenotype match` labels the multi matched-count column. Five unpinned rows/page; pins stay fixed; numeric pagination shows at most five numbers; expanded project phenotypes use the connected hierarchy rather than term pagination.
- Sample Project/Investigator header offers a searchable multi-select filter and A→Z/Z→A sort; multi-HPO Phenotype match offers query-term checkboxes. It affects sample-table pins/copy/CSV only, with X of N caption; Advanced Project remains the global search condition.
- Who defaults to the full-width overview hierarchy below one Age/Sex/Affected row. Table retains +/− actions, puts query terms first, sorts other rows before pagination and omits query ancestors from those other rows. Percentages use the complete matching group. `Subtype of` is an ontology relationship, not a different denominator. Require adds an external AND rule; Exclude removes matching observations.
- Zero intersection is valid even when each HPO individually exists: show a full-width gray bar, explicit no-match/rule explanation, no 0/0 age/affected figures; hide empty CRDC detail cards, retain external references. Unavailable HPO is a separate validation state before calculation.
- Keep readable desktop fonts/grid lines at the existing 100% scale. Compact row-label tooltips retain zoom-aware above/below placement and Escape/navigation cleanup. Superscript information icons use the separate same-height margin rail described below. Sample/Gene/Variant links retain exact encoded query IDs.

Visible info icons accompany the six result-card headings and the Z, beta, CI, p, q and carrier headers. `ResultInfo.vue` reuses Gene2/Variant `HelpTooltip.vue` and `InfoRail.vue`: the icon is superscript and hover/focus/click opens a margin panel aligned to its top. When the margin is too narrow, reserve a side rail and keep it open until Close, Escape or an outside click so layout reflow does not dismiss it. Reserve Guide space outside the rail. Keep info clicks separate from sorting. Single-HPO q is within HPO across genes; multi-HPO carrier comparison uses unadjusted Fisher p. Help text does not change the calculations.

## 6. Source files and reference backend

| Layer | Carry together |
|---|---|
| UI | Entire `src/views/PbPhenotype/`, including generated ontology/reference/catalog files and new components/helpers/CSS. The reused results component is named `SinglePhenotypeResults.vue` even for multi-HPO. |
| Shared gate / units | `src/utils/crdcHpoAvailability.js`, `singleHpoUnits.js`, `rphersUnits.js`; shared Gene2 `ProfileInput.vue` / `ContextPanel.vue`, Gene2/Variant validation entry points |
| Gateway / lookup | `scripts/gene_hpo_association_endpoint.js`, `pb_hpo_gene_index.py`, `pb_burden_memberships.py`, `pb_phenotype_carrier_counts.py` |
| Profile reference | `scripts/pb_phenotype_profile_api.py`, `pb_profile_metadata.py`, `pb_gene_context_api_server.py`, `pb_gene_context_validation.py`, `rphers_fast.py`, `rphers_standardization.py`; retain their imports. Sample routes share this service: follow the Sample handoff. |
| Registration / startup | Merge `vue.config.js` handlers/proxies; retain `public/index.html` first-paint scale. `serve_pb_phenotype_local.sh` is a **local runner**, not the test server's configuration. |

Local implementation only: profile service 8093; Gene Context 8092; sample-GRS membership 8094; scoped Variant Context 8095. Frontend launcher starts at 8098 and may use the next free port; 8099 was the November 15 reviewed screen; this session used 8098. These are not test-server BioIndex ports. Do not redirect the whole `/phenotype-analyzer-api` base to a differently contracted API.

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
