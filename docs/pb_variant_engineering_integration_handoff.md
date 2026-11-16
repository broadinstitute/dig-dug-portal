# PB Variant engineering handoff

**Reproduce the user's current prototype design and interactions exactly.** Follow the [five-page design fidelity requirement](pb_front_gene_variant_merge_handoff.md#required-design-fidelity--all-five-pages). Carry this page's Vue templates and CSS together: typography, colors, spacing, borders, card/table widths and order, icons, responsive layout and every interactive state, including the blue Genotype selector. Compare prototype and target at the same viewport/zoom before marking the UI complete.

November 15 delivery: [source delta/checksums against the baseline](pb_page_source_delivery_20261115.json). The November 16 local delta below is additional to that delivered snapshot; include its new files. Neither the manifest nor local checks establish deployment.

Updated: 2026-11-16 · Branch: `kyuryung/bch-prototype` · Entry: `/pb_variant.html`

## 2026-11-16 Variant follow-up — current local contract

Compared with the last delivered HEAD `306ded0b8`, these changes are included in this Git delivery; test-server deployment remains pending and the November 15 source manifest does not cover them.

| Change | Implement / carry |
|---|---|
| Larger Genotype control | `PbVariant/style.css`: 22px/700 label, 20px icon, minimum 46px height, 8px × 14px padding, 1.5px blue border, 7px corners and pale blue background. Darker border/background on hover, focus and open. Center it beside the carrier heading. This supersedes the yellow marker styling. Keep existing checkboxes/Cancel/Apply and genotype-scope calculations. |
| Correct actual GT request | `PbGene/pbGeneBioIndexAdapter.js`: normalize `genotypeVariantId` to `chr`-prefixed exact ID at the request/cache boundary. Variant annotation keys may omit `chr`; do not change their format or loosen endpoint authorization. Unprefixed GT requests returned 400 and made the actual browser show all 41 carriers as Unknown. |
| Recover after lookup failure | Do not retain a state containing `gtStatus: lookup_unavailable` in the successful gene-state cache. The next search retries; valid missing/low-depth calls remain Unknown. |
| Prevent regression | Include new `scripts/test_pb_variant_genotype_request.js`: actual Variant page method → shared adapter → actual route, using fixture processed/VCF calls; also check equivalent-ID cache reuse and recovery after failure. It failed before the fix and passed after it. |

Cross-page review: the current source delta still matches this request/cache/control contract. Include the [shared local lifecycle update](pb_front_gene_variant_merge_handoff.md#local-development-lifecycle--2026-11-16) and existing helpers when using the prototype launcher. Stop/status manage local frontend/API processes, not the original-VCF tunnel or remote compute job. Keep exact authorization, GT provenance and selected-carrier analysis scope.

Verification: processed-GT, VCF restart-cache, live metadata adapter and Variant layout tests passed. The live API for GJB2 `chr13:20189313:A:G` returned **Homozygous 0 / Hetero 39 / Unknown 2**; both Unknown calls had `low_or_missing_depth` (DP ≥20 required). These are source results, not constants. The corrected shared bundle was served by 8098; post-fix native browser verification timed out. Reload existing tabs and verify final appearance, dropdown interaction and counts on the target implementation.

## 2026-11-15 UI follow-up — included in this delivery

The shared Guide PDF popup and default 100% scale are implemented locally. Carry the component, public PDF/preview, page imports and styles from the [common Guide contract](pb_front_gene_variant_merge_handoff.md#shared-guide-popup). Use the delivery commit containing this document and its full repository dependencies; the earlier `ddf455104` alone does not include this follow-up. APIs, data releases and analysis contracts below are unchanged.

## Test-server source and shared q rule

Use the existing test-server private BioIndex `http://100.80.30.199:5000/api/bio/query/<index>?q=…`, authenticated through the same-origin gateway. Current variant membership comes from `gene-variants-crdc` (`gene` key), metadata/Project/PI from `samples-info` (`SampleInVCF`), exact annotation from `variants-annotation` (`varID`) and `transcript-consequences` (`varId`). Consume all continuations. The similarly named Helen POST analysis route is a different contract; local input/cache paths below are server preparation provenance, not replacement API sources.

Same single-gene burden test: **Gene2 uses q_by_gene (all valid HPO tests for one gene); Phenotype uses q_by_hpo (all valid gene tests for one HPO)**, both before P<0.05 delivery filtering. Same pair beta/p/N remain identical; q can differ. Variant Custom context uses its own stated model/p, not either burden q. The live legacy gene-hpo15 response contains HPO-wise q and only a top-15 preview; do not invent Gene-wise q or full-HPO coverage from it. See [Gene2](pb_gene2_engineering_handoff_20261112.md#2-same-burden-test-different-q-scopes).

Current shared input fixes also retain Retry while typing after a count-service error and preserve Enter submission for valid profiles. Unavailable pasted HPOs never commit as chips; failed finish() stops Apply. A positive global count is availability only, not a guarantee of adequate power in the selected-carrier model. Keep its existing scope validation and explicit unavailable statistics.

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

- Place the enlarged blue-bordered `Genotype` dropdown immediately beside **N carriers observed in CRDC**. Use the existing ClinVar checkbox interaction: Homozygous / Hetero / Unknown, all checked initially, multiple selections combined with OR, Cancel / Apply. Disable Apply for an empty selection.
- Show selected / total carriers beneath the heading. Do not add “All results below…”.
- From this heading downward, use only the selected carriers: demographics, sample list/totals, HPO counts/denominators, scores, reference mean/SD and analysis. Lower display filters work inside this population. Identity annotations and cohort AF retain their source values.
- On genotype Apply, discard old analysis and recompute saved profiles for the new selection. Reject stale responses and responses without the exact requested sample-scope echo.
- Keep profile history, linked HPO IDs and phenotype-search highlighting. Remove the co-carried-gene and “Other [gene] variants observed in these carriers” sections.

## Calculation rules

| Value | Definition |
|---|---|
| Genotype groups | Equal diploid nonreference alleles → Homozygous; different alleles → Hetero. Missing, partial, reference-only or unsupported calls → Unknown. Preserve raw GT/phase in the sample table; never infer GT from carrier status. |
| Observed carriers | All exact-variant carriers in the genotype selection; distinguish these from analysis-eligible samples. |
| Carriers with HPO | Selected carriers with at least one exact recorded profile HPO ID; OR across terms, counted once per person. |
| Carrier phenotypes | Selected carriers with HPO records; count observed-positive terms and ancestors. Empty/unavailable records do not enter this denominator. |
| Total HPO terms | `n_terms` from the approved scoring matrix row sum. An explicitly empty metadata record outside the matrix may display `0 / empty_phenotype_record`; this does not establish scoring eligibility. |
| rPheRS / individual Z / mean Z | Recompute HPO prevalence, residualization and reference mean/sample SD within the selected eligible roster. The server provides the reference; the browser does not invent SD. |
| Variant β / P | A carrier/noncarrier binary predictor is constant within selected carriers. Return unavailable (`all_carriers` or insufficient degrees of freedom); do not reuse full-cohort β/P. |

`ContextAnalysisEngine.for_sample_ids()` isolates HPO rows, roster, covariates and caches. Requests without `sample_ids` retain the existing Gene API behavior. An empty/ineligible selection never falls back to the full cohort.

## Implementation and APIs

| Layer | Files / contract |
|---|---|
| Variant | `src/views/PbVariant/{Template.vue,pageModel.js,style.css,genotypeSelection.js,carrierStatistics.js,layoutHelp.js}` |
| Shared dependencies | `PbGene/{pbGeneBioIndexAdapter.js,carrierGenotypes.js}`; optional `linkHpoIds` in `PbGene2/ProfileInput.vue` (default false) |
| GT lookup | `scripts/{gene_genotype_endpoint.js,processed_genotype_source.js,variant_vcf_genotype_source.js,vcf_carrier_genotypes.py}` |
| Scoped analysis | `scripts/{pb_gene_context_api_server.py,pb_gene_context_validation.py}`; `vue.config.js` proxy |
| Scoped HPO counts | `scripts/gene_variant_hpo_counts_endpoint.js` |

- `GET /__pb_gene_genotypes__?gene=GJB2&variant=<exact-ID>`: existing processed calls plus original-VCF supplementation for missing target calls. Check authorized exact-variant/sample membership. Preserve per-row source and distinguish lookup failure from a genuine missing call.
- `POST /__pb_variant_context__/analyze`: existing profile fields plus `sample_ids`; response must echo `sample_scope.sample_ids` exactly. Return only scoped individual results.
- `POST /__gene_variant_hpo_counts__`: existing fields plus `sample_ids`; count/cache within that selection and echo its scope.
- Existing `POST /__pb_variant_carrier_metadata__`: retain membership checks, metadata and persistent `n_terms` source/status.
- Private service `POST /phenotype-analyzer-api/carrier-genotypes`: exact `variant_id` and `sample_ids`, with original-VCF provenance. Keep all sample routes private.

## GT sources and runtime

The existing committed GT connection (`c98902622`) uses **filtered processed data**. This change adds coverage from the original VCF; it does not replace or relabel that processed release.

| Source | Configuration |
|---|---|
| Processed GT | `sample_variant_gene.jsonl.gz`, release `2025_crdc_16366_dp20_af001_20260907`; GRCh38, nonsynonymous, DP ≥20, cohort AF <0.01. SHA-256 `e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7`. |
| Processed index | `PB_GENOTYPE_INDEX`, otherwise `.pb-private-data/genotypes/shared/2025_crdc_16366_dp20_af001_20260907/index`. Build using `scripts/build_pb_genotype_index.py` and the approved source. The default discovers an existing index; it does not download one. |
| Original VCF | `/lab-share/RC-Data-Science-NR-e2/Public/gnomad/helen/VEP_pipeline/cleanVCF/finalresult/Data_with_af_dp/combined_crdc.with_af_formatDP.vcf.gz`; configure the Variant API with `--genotype-vcf` and indexed `bcftools`. Query exact position/REF/ALT and requested samples, DP ≥20, preserving allele indices/phase. |
| VCF cache | `.pb-private-data/genotypes/original-vcf/`: checksum-validated exact variant/sample-selection responses, reusable after restart/offline. New selections need the service. Invalidate on a new VCF release; retain original-file/size/mtime/call provenance. |
| HPO count lookup | `PB_HPO_TERM_COUNTS_FILE`, otherwise `.pb-private-data/rphers/hpo_term_counts.json`; build with `scripts/build_pb_hpo_term_counts.py` from the same approved scoring matrix. |

`/__pb_variant_context__` proxies to `PB_VARIANT_CONTEXT_HOST_PRIVATE` (default `http://127.0.0.1:8095`), rewriting to `/phenotype-analyzer-api`. Run the scoped Variant API separately from the existing Gene/Sample service.

For the current compute demo, `run_pb_context_demo.sbatch` starts Variant on 18096 from `PB_VARIANT_API_ROOT`, the staged `variant-genotype-20261114` directory, or the demo root; stage the current API modules there. `PB_GENOTYPE_VCF_SOURCE` overrides the VCF path. `start_pb_context_demo.sh` / `connect_pb_context_demo.sh` reuse/start the job and forward 8095 →18096 alongside existing 8092/8094 forwards. Keep the tunnel terminal open.

A Git push does not deploy the service or install private inputs. Keep VCFs, matrices, indexes, caches and captures outside Git/public assets. This document specifies Variant; the other three pages have their own current contracts linked from the shared integration guide.

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
python3 -m unittest scripts.test_pb_gene_context_api_server scripts.test_pb_gene_context_validation scripts.test_vcf_carrier_genotypes
```

Live evidence (not UI constants): `GJB2 chr13:20189546:AC:A` has 294 carriers: **Homozygous 16 / Hetero 278 / Unknown 0**; analysis-eligible counts are All 286 / Homozygous 15 / Hetero 271. These calls are absent from the processed release but present in the original VCF. A fresh Node process with `PB_GENOTYPE_INDEX` unset and networking disabled returned the same 294 cached calls. `chr13:20189241:T:C` also verified All / Homozygous / Hetero / combined scopes, HPO denominators and no returned IDs outside selection. Mockup counts are not substituted for source data.
