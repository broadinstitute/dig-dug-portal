# PB Variant engineering handoff

Updated: 2026-11-14 · Branch: `kyuryung/bch-prototype` · Entry: `/pb_variant.html`

## Behavior

- Place the yellow `Genotype` dropdown immediately beside **N carriers observed in CRDC**. Use the existing ClinVar checkbox interaction: Homozygous / Hetero / Unknown, all checked initially, multiple selections combined with OR, Cancel / Apply. Disable Apply for an empty selection.
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

A Git push does not deploy the service or install private inputs. Keep VCFs, matrices, indexes, caches and captures outside Git/public assets. Other page layouts are outside this delivery.

## Verification

```sh
node scripts/test_pb_variant_layout.js
node scripts/test_pb_variant_profile_history.js
node scripts/test_pb_variant_carrier_statistics.js
node scripts/test_gene_variant_hpo_counts.js
node scripts/test_processed_genotypes.js
node scripts/test_variant_vcf_genotype_cache.js
node scripts/test_pb_live_metadata.js
python3 -m unittest scripts.test_pb_gene_context_api_server scripts.test_pb_gene_context_validation scripts.test_vcf_carrier_genotypes
```

Live evidence (not UI constants): `GJB2 chr13:20189546:AC:A` has 294 carriers: **Homozygous 16 / Hetero 278 / Unknown 0**; analysis-eligible counts are All 286 / Homozygous 15 / Hetero 271. These calls are absent from the processed release but present in the original VCF. A fresh Node process with `PB_GENOTYPE_INDEX` unset and networking disabled returned the same 294 cached calls. `chr13:20189241:T:C` also verified All / Homozygous / Hetero / combined scopes, HPO denominators and no returned IDs outside selection. Mockup counts are not substituted for source data.
