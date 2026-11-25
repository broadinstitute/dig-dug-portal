# PB Variant engineering handoff

## Current browser behavior — 2026-11-18

- Honor the gene passed in a Variant link. When choosing a gene from transcript rows, rank protein coding, VEP pick, direct overlap, impact and gene symbol in that order.
- Keep the genotype segments at the right of the carrier heading. The **Phenotype profile** tab opens by default. **Carrier details** shows the current genotype selection before Apply, including carriers without profile scores.
- Reuse processed GT and supplement missing rows from the current indexed VCF. Preserve the distinction between a failed lookup and a completed lookup with insufficient depth. [Pre-commit checks](pb_precommit_handoff_20261118.md#pre-commit-review).

**Reproduce the user's current prototype design and interactions exactly.** Follow the [five-page design fidelity requirement](pb_front_gene_variant_merge_handoff.md#required-design-fidelity--all-five-pages). Carry this page's Vue templates and CSS together: typography, colors, spacing, borders, card/table widths and order, icons, responsive layout and every interactive state, including genotype-specific colours. Compare prototype and target at the same viewport/zoom before marking the UI complete.

## Current UI contract — 2026-11-17

Use this section for layout/state; keep the regression/source contracts below.

| Area | Implement |
|---|---|
| Order/grouping | Variant identity → **one carrier information card** containing CRDC demographics, a thin divider and Carrier phenotypes → profile-results/carrier-samples card. No separate border/background between demographics and observed phenotypes. |
| Genotype | Show the selected carrier count in the heading and right-align the **All / Het / Hom** segments. Show Unknown when its count is positive. All includes Unknown. Apply the selection immediately and preserve raw GT. |
| Colours | All `#204de3`, Het `#16835d`, Hom `#e3b72d`; selected button and demographics progress fills follow selection. Het/Hom phenotype-tree fills use the same colour. Hom button text `#14213d`. |
| Observed phenotypes | Own demographic/HPO display filters within selected genotype carriers. Profile Apply must not highlight terms, expand branches, navigate pages, insert unlisted-profile labels or change these filters. Denominator remains carriers with phenotype data. |
| Profile input | Right-aligned input/Apply/Advanced options in the carrier-samples card; retain Max/Sum and All/Affected. No repeated Variant/ClinVar/total-carrier/predictor columns. |
| Result columns | Expand / Phenotype profile (linked HPO chips) / Carriers with profile HPO / Mean carrier rPheRS Z / β (rPheRS SD) / P / Settings / delete. One row per successful run; immutable terms, aggregates, settings and **individual `residualById` scores**. Failed/late requests do not replace valid results. |
| Expansion | One run open at a time (`expandedProfileRunId`); latest successful run opens automatically. Detail cell spans all eight columns with zero outer cell padding; sample grid uses its full width. Expanding a historical run uses its saved scores without refitting/replacing the latest analysis. |
| Individual rows | List only selected genotype carriers with a finite score in the expanded run; independent of phenotype-browser display filters. Default descending rPheRS Z; five rows/page. Missing HPO/scoring-reference/ineligible carriers are not listed; show their excluded count without equating all exclusions to absent HPO data. |
| Individual columns | Sample / Age / Sex / GT / rPheRS Z / Profile terms matched / Total HPO terms / Affected / Project. Matched terms count profile IDs present in the metadata hierarchy; unavailable metadata is not zero. `Total HPO terms` remains scorer `n_terms`. |
| HPO reference counts | Keep exact-recorded-ID OR counts distinct from scored-carrier counts and observed-positive hierarchy counts. Cache by run; validate gene/terms/variant/sample-scope before accepting; preserve partial/unavailable states. |
| Lifecycle | GT selection clears scoped results and recomputes saved profiles; rerun adds a new row; deleting a row clears its expansion/cache and clears current analysis only when that row is current. Variant change resets runs, expanded ID and HPO cache. |
| Shared control | [Pagination contract](pb_front_gene_variant_merge_handoff.md#shared-pagination--2026-11-17). |

Carry `PbVariant/{Template.vue,pageModel.js,style.css,layoutHelp.js}`, `PbGene2/Demographics.vue`, `PbGene/SummaryPager.vue` and existing API/GT dependencies. Checks: `test_pb_variant_layout.js`, `test_pb_variant_carrier_statistics.js`, `test_pb_variant_profile_history.js`, `test_pb_variant_genotype_request.js`, `test_pb_pagination.js`. No new regression model, data release, q family or API endpoint.

## Current correction — shared Gene/Variant regression, 2026-11-16

**Variant must use the same adjusted carrier-versus-noncarrier linear regression and full-cohort phenotype scoring reference as the Gene2 variant-evidence table.** Compare the same exact variant, HPO profile and All/Affected setting. With `GT All`, Variant beta, P, carrier mean Z and reference must agree with Gene2. The separate **Gene beta** models gene GRS and is not the variant effect.

The November 14 genotype change (`859cd905d`) incorrectly restricted the regression roster to carriers, removed noncarrier controls and recomputed the scoring reference inside that group. This caused `all_carriers`, a near-zero carrier mean or a constant-score reference. **Do not port that carrier-only regression/reference behavior or describe it as normal.** Preserve genotype selection for the carrier group while retaining eligible noncarrier controls.

- **Genotype subset:** compare selected eligible carriers with eligible noncarriers of the exact variant. Exclude unselected carriers entirely; never relabel them as controls. All/Affected applies to both groups. Unknown/out-of-roster samples do not become controls.
- **Scores:** reuse the full scoring-cohort IC weights, residual PheRS and mean/sample-SD reference used by Gene2. Summarize/return individual scores only for selected eligible carriers. Keep observed carrier/HPO metadata denominators separate from regression eligibility.
- **API:** `sample_ids` selects the carrier group, not the entire regression roster. Preserve the exact requested-ID echo. Require `sample_scope.kind=selected_carriers_vs_noncarriers` and `reference_scope=full_scoring_cohort`, with `selected_carrier_count`, `noncarrier_count`, `analysis_sample_count`, `scoring_sample_count` and `excluded_carrier_count`. `analysis_sample_count` includes both fitted groups after All/Affected. Reject legacy carrier-only responses even if their ID echo matches.
- **Input layout:** shared `PbGene2/ProfileInput.vue` owns `position:relative; min-width:0`; its absolute suggestion list anchors below the input at the same width and scrolls within `max-height:min(320px,50vh)`. Vue `extends` does not supply the parent component's scoped CSS. Carry this shared fix to both Gene2 and Variant.
- **Result states:** show numeric values when estimable. Retain `Not estimable` with a specific reason only for genuine model degeneracy; request/missing-source failures remain `Unavailable`. Mean-Z floating-point noise below `1e-12` displays as zero; raw stored values and beta/P formatting are unchanged.

**Delivery/runtime:** the commit containing this document includes these corrections, source and tests after `47d7159c6`; that earlier commit and the November 15 manifest alone do not include them. The isolated prototype Variant API (local 8095 → compute 18096) was backed up, updated and restarted. Gene/Sample services, source releases and the production portal were not deployed or changed. Existing result-history rows require rerun/reload.

### Implement and verify together

Carry `scripts/pb_gene_context_api_server.py` and `pb_gene_context_validation.py` (`for_variant_comparison`, not `for_sample_ids`, for an exact-variant selected-carrier comparison); `PbVariant/{pageModel.js,Template.vue,layoutHelp.js}`; shared `PbGene2/ProfileInput.vue`; and updated API/engine/layout/history tests. Preserve their existing imports, auth, source/GT checks and private proxy. Installing only frontend files leaves the old analysis bug active; updating only the API leaves incompatible scope checks/help.

Passed: 29 Python tests across API/engine/variant OLS and four JavaScript commands (Variant layout/history/statistics and Gene2). Shared autocomplete placement was browser-verified; the user confirmed the repaired screen. Live parity with the Gene calculation was checked within `1e-12` numerical tolerance for the examples below; a real genotype subset retained 15,699 noncarriers, selected 3 eligible carriers, excluded 59 other carriers and retained the 15,764-score reference. These are source-specific checks, not constants or new model thresholds.

| GJB2 variant; HPO `HP:0000364`, All, GT All | Variant beta (SD) | P | Carrier mean Z |
|---|---:|---:|---:|
| `chr13:20189005:CTG:C` | -0.607573534 | 0.539821359 | -0.549421009 |
| `chr13:20189174:G:T` | -0.022635357 | 0.981765408 | -0.106479431 |
| `chr13:20189234:CT:C` | 1.576013284 | 0.024422165 | 1.624770650 |
| `chr13:20189313:A:G` | 0.223208888 | 0.159892607 | 0.266049307 |

The last example fits 15,761 samples: 39 carriers + 15,722 noncarriers; scoring reference N=15,764. The first example has two observed carriers but only one eligible regression carrier. Low carrier count remains exploratory; it is not automatically suppressed. No new full frontend build or production-server acceptance is claimed for this correction.

November 15 delivery: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). The November 16 local delta below is additional to that delivered snapshot; include its new files. Neither the manifest nor local checks establish deployment.

Updated: 2026-11-17 · Branch: `kyuryung/bch-prototype` · Entry: `/pb_variant.html`

## 2026-11-16 Variant follow-up — current local contract

The earlier GT/control changes below were delivered after baseline `306ded0b8` and are retained in `47d7159c6`. The regression correction delivered with this document takes precedence over the earlier genotype-population implementation. The November 15 manifest covers neither follow-up.

| Change | Implement / carry |
|---|---|
| Genotype control | Superseded by the November 17 segmented selector above; retain the GT request/cache fixes below. |
| Correct actual GT request | `PbGene/pbGeneBioIndexAdapter.js`: normalize `genotypeVariantId` to `chr`-prefixed exact ID at the request/cache boundary. Variant annotation keys may omit `chr`; do not change their format or loosen endpoint authorization. Unprefixed GT requests returned 400 and made the actual browser show all 41 carriers as Unknown. |
| Recover after lookup failure | Do not retain a state containing `gtStatus: lookup_unavailable` in the successful gene-state cache. The next search retries; valid missing/low-depth calls remain Unknown. |
| Prevent regression | Include new `scripts/test_pb_variant_genotype_request.js`: actual Variant page method → shared adapter → actual route, using fixture processed/VCF calls; also check equivalent-ID cache reuse and recovery after failure. It failed before the fix and passed after it. |

Cross-page review: retain the request/cache/control fixes and the [shared local lifecycle update](pb_front_gene_variant_merge_handoff.md#local-development-lifecycle--2026-11-16). Stop/status manage local frontend/API processes, not the original-VCF tunnel or remote compute job. Keep exact authorization, GT provenance, selected-carrier display and noncarrier regression controls.

Earlier GT verification: processed-GT, VCF restart-cache, live metadata adapter and Variant layout tests passed. The live API for GJB2 `chr13:20189313:A:G` returned **Homozygous 0 / Hetero 39 / Unknown 2**; both Unknown calls had `low_or_missing_depth` (DP ≥20 required). These are source results, not constants. Native verification timed out in that earlier session; the latest correction's checks/user confirmation are recorded above. Verify final appearance, segmented-selector interaction and counts on the target implementation.

## 2026-11-15 UI follow-up — included in this delivery

The November 15 delivery introduced the PDF preview and default 100% scale. The current [sticky CRDC header](pb_front_gene_variant_merge_handoff.md#shared-guide-and-data-sources) opens `/pb_guide.html#variant` in a new tab. That walkthrough explains how to apply a custom HPO profile and interpret carrier-versus-noncarrier β, mean carrier rPheRS Z and P.

## Test-server source and shared q rule

Use the existing test-server private BioIndex `http://100.80.30.199:5000/api/bio/query/<index>?q=…`, authenticated through the same-origin gateway. Current variant membership comes from `gene-variants-crdc` (`gene` key), metadata/Project/PI from `samples-info` (`SampleInVCF`), exact annotation from `variants-annotation` (`varID`) and `transcript-consequences` (`varId`). Consume all continuations. The similarly named Helen POST analysis route is a different contract; local input/cache paths below are server preparation provenance, not replacement API sources.

Same single-gene burden test: **Gene2 uses q_by_gene (all valid HPO tests for one gene); Phenotype uses q_by_hpo (all valid gene tests for one HPO)**, both before P<0.05 delivery filtering. Same pair beta/p/N remain identical; q can differ. Variant Custom context uses its own stated model/p, not either burden q. The live legacy gene-hpo15 response contains HPO-wise q and only a top-15 preview; do not invent Gene-wise q or full-HPO coverage from it. See [Gene2](pb_gene2_engineering_handoff_20261112.md#2-same-burden-test-different-q-scopes).

Current shared input fixes also retain Retry while typing after a count-service error and preserve Enter submission for valid profiles. Unavailable pasted HPOs never commit as chips; failed finish() stops Apply. A positive global count is availability only, not a guarantee of adequate power in the carrier/noncarrier comparison. Keep its existing scope validation and explicit unavailable statistics.

## Changes relative to the baseline

Baseline: `859cd905d49e61f3a1e6765bb88ff0a2555c3128`. The genotype-scope implementation below is already in that commit. **Changes included in this delivery** are HPO availability validation in `src/views/PbVariant/pageModel.js`, shared `PbGene2/ProfileInput.vue` / `src/utils/crdcHpoAvailability.js`, first-paint scale in `public/index.html`, and approved-share GT startup preparation.

- Profile input/Apply/rerun now use `GET /__pb_phenotype_profile__/hpo-counts`; each HPO must have count ≥1. Zero/missing/loading/error prevents application; provide retry on failure. Respect failed `finish()` and stale-request checks.
- The common private profile service (default 8093) serves `/phenotype-analyzer-api/hpo-counts`. Port its proxy and required inputs as well as the dedicated Variant 8095 service. See [Sample runtime](pb_sample_engineering_integration_handoff.md#6-private-inputs-and-startup).
- These are **16,366-sample parent-expanded availability counts**, not selected-carrier counts or Variant scoring statistics. Keep scoped backend validation and the approved scoring input. Do not replace the Variant matrix with the availability matrix.
- Default prototype display is 100% before first paint, including WebKit; keep shared help positioning. This does not change the browser's own zoom preference.
- `serve:pb-gene` / `serve:pb-phenotype` now prepare/reuse the persistent verified GT cache using `prepare_pb_genotypes.sh` and `setup_pb_genotypes.py`. Only the approved `/share/dig-dug-portal/sample_variant_gene.jsonl.gz` may be downloaded; existing valid caches work offline. The reader alone still does not download. No private `/ref/` fallback.

- The new dependencies are included in this delivery commit. The baseline commit alone is incomplete; static build output alone does not install private gateway handlers or Python services. This audit does not establish test-server deployment. Do not point the existing Gene Context base at Helen's differently contracted analysis endpoint.

Additional checks: `node scripts/test_crdc_hpo_availability.js`, `node scripts/test_pb_prototype_scale.js`, plus the existing Variant checks below. Source/index names, keys, built timestamps and exact hashes are recorded in the existing Obsidian shared source note; no semantic BioIndex API version has been established.

## Behavior

Use the [current UI contract](#current-ui-contract--2026-11-17); older dropdown, profile-tree highlighting and separate variant-evidence-row layouts are superseded. Genotype changes carrier selection and refits profiles with noncarrier controls retained. Identity/AF retain source values.

## Calculation rules

| Value | Definition |
|---|---|
| Genotype groups | Equal diploid nonreference alleles → Homozygous; different alleles → Hetero. Missing, partial, reference-only or unsupported calls → Unknown. Preserve raw GT/phase in the sample table; never infer GT from carrier status. |
| Observed carriers | All exact-variant carriers in the genotype selection; distinguish these from analysis-eligible samples. |
| Carriers with HPO | Selected carriers with at least one exact recorded profile HPO ID; OR across terms, counted once per person. |
| Carrier phenotypes | Selected carriers with HPO records; count observed-positive terms and ancestors. Empty/unavailable records do not enter this denominator. |
| Total HPO terms | `n_terms` from the approved scoring matrix row sum. An explicitly empty metadata record outside the matrix may display `0 / empty_phenotype_record`; this does not establish scoring eligibility. |
| rPheRS / individual Z / mean Z | Full scoring-cohort weights, residualization and mean/sample SD, shared with Gene2. Mean/individual outputs cover selected eligible carriers only. The server provides the reference. |
| Variant β / P | Same adjusted OLS as the Gene2 variant table: selected carriers = 1, eligible exact-variant noncarriers = 0. Unselected target carriers are excluded. With GT All, values agree with Gene2; a subset is refitted with controls retained. |

`ContextAnalysisEngine.for_variant_comparison()` preserves the full scoring reference and selects the regression roster as described above. Generic carrier-only `for_sample_ids()` remains available for separate legacy/co-gene requests; do not use it for the exact-variant comparison. Requests without `sample_ids` retain the existing Gene API behavior. An empty/ineligible carrier selection never falls back to all carriers.

## Implementation and APIs

| Layer | Files / contract |
|---|---|
| Variant | `src/views/PbVariant/{Template.vue,pageModel.js,style.css,genotypeSelection.js,carrierStatistics.js,layoutHelp.js}` |
| Shared dependencies | `PbGene/{pbGeneBioIndexAdapter.js,carrierGenotypes.js}`; optional `linkHpoIds` in `PbGene2/ProfileInput.vue` (default false) |
| GT lookup | `scripts/{gene_genotype_endpoint.js,processed_genotype_source.js,variant_vcf_genotype_source.js,vcf_carrier_genotypes.py}` |
| Scoped analysis | `scripts/{pb_gene_context_api_server.py,pb_gene_context_validation.py}`; `vue.config.js` proxy |
| Scoped HPO counts | `scripts/gene_variant_hpo_counts_endpoint.js` |

- `GET /__pb_gene_genotypes__?gene=GJB2&variant=<exact-ID>`: existing processed calls plus original-VCF supplementation for missing target calls. Check authorized exact-variant/sample membership. Preserve per-row source and distinguish lookup failure from a genuine missing call.
- `POST /__pb_variant_context__/analyze`: existing profile fields plus selected-carrier `sample_ids`; preserve the exact echo and the comparison/reference metadata defined above. Include controls in the model, return individual results only for selected carriers.
- `POST /__gene_variant_hpo_counts__`: existing fields plus `sample_ids`; count/cache within that selection and echo its scope.
- Existing `POST /__pb_variant_carrier_metadata__`: retain membership checks, metadata and persistent `n_terms` source/status.
- Private service `POST /phenotype-analyzer-api/carrier-genotypes`: exact `variant_id` and `sample_ids`, with original-VCF provenance. Keep all sample routes private.

## GT sources and runtime

The existing committed GT connection (`c98902622`) uses **filtered processed data**. This change adds coverage from the original VCF; it does not replace or relabel that processed release.

| Source | Configuration |
|---|---|
| Processed GT | `sample_variant_gene.jsonl.gz`, release `2025_crdc_16366_dp20_af001_20260907`; GRCh38, nonsynonymous, DP ≥20, cohort AF <0.01. SHA-256 `e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7`. |
| Processed index | `PB_GENOTYPE_INDEX`, otherwise `.pb-private-data/genotypes/shared/2025_crdc_16366_dp20_af001_20260907/index`. Build using `scripts/build_pb_genotype_index.py` and the approved source. The default discovers an existing index; it does not download one. |
| Original VCF | `/lab-share/RC-Data-Science-NR-e2/Groups/gnomad/helen/VEP_pipeline/cleanVCF/finalresult/Data_with_af_dp/combined_crdc.with_af_formatDP.vcf.gz` (moved from `Public/gnomad/helen` on 2026-11-18); configure the Variant API with `--genotype-vcf` and indexed `bcftools`. Query exact position/REF/ALT and requested samples, DP ≥20, preserving allele indices/phase. |
| VCF cache | `.pb-private-data/genotypes/original-vcf/`: checksum-validated exact variant/sample-selection responses, reusable after restart/offline. New selections need the service. Invalidate on a new VCF release; retain original-file/size/mtime/call provenance. |
| HPO count lookup | `PB_HPO_TERM_COUNTS_FILE`, otherwise `.pb-private-data/rphers/hpo_term_counts.json`; build with `scripts/build_pb_hpo_term_counts.py` from the same approved scoring matrix. |

`/__pb_variant_context__` proxies to `PB_VARIANT_CONTEXT_HOST_PRIVATE` (default `http://127.0.0.1:8095`), rewriting to `/phenotype-analyzer-api`. Run the scoped Variant API separately from the existing Gene/Sample service.

For local review, `npm run start:pb` stages the current Python and R code into the user's personal e3 deployment. The compute job publishes the Variant port and the launcher forwards it to local 8095. Configure the VCF on the compute node with `PB_GENOTYPE_VCF_SOURCE` when overriding the approved path. [Local setup](pb_local_browser_setup.md).

A Git push does not deploy the service or install private inputs. Keep VCFs, matrices, indexes, caches and captures outside Git/public assets. This document specifies Variant; the other four pages have their own current contracts linked from the shared integration guide.

## Verification

```sh
node scripts/test_pb_variant_layout.js
node scripts/test_pb_variant_profile_history.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_gene_variant_hpo_counts.js
node scripts/test_processed_genotypes.js
node scripts/test_pb_variant_genotype_request.js
node scripts/test_variant_vcf_genotype_cache.js
node scripts/test_pb_live_metadata.js
python3 -m unittest scripts.test_pb_gene_context_api_server scripts.test_pb_gene_context_validation scripts.test_variant_association scripts.test_vcf_carrier_genotypes
```

Earlier GT evidence (not UI constants): `GJB2 chr13:20189546:AC:A` has 294 carriers: **Homozygous 16 / Hetero 278 / Unknown 0**; eligible **carrier** counts are All 286 / Homozygous 15 / Hetero 271, not the total regression N. These calls are absent from the processed release but present in the original VCF. A fresh Node process with `PB_GENOTYPE_INDEX` unset and networking disabled returned the same 294 cached calls. Earlier carrier-only regression/reference-size assertions are superseded by the current comparison contract; retain the GT/cache provenance evidence. Mockup counts are not substituted for source data.
