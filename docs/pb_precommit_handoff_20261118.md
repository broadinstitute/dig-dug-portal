# PB browser changes for review

Compare with `ece680bde`. The [local setup guide](pb_local_browser_setup.md) is the reviewer entry point. Use the Vue templates and CSS for exact layout and interaction behavior.

| Page | Changes and implementation decisions |
| --- | --- |
| Front and Front2 | Existing entry points. Verify gene search routes to Gene2 and multi-HPO search routes to Phenotype. |
| Gene2 | Original-VCF evidence uses ALT calls with DP ≥20 and cohort AF <0.01. Reuse that membership for overview, demographics, variant and gene carrier HPO counts. Zero qualifying rows retain the gene page. A service failure gets its own error state. |
| Gene2 single HPO | Use released phenotype case count and `q_by_gene` for A–D. Case range and grade filters apply before pagination. HPO λ is a diagnostic from all valid tests in the approved release. Read the matched `hpo_lambda_gc.json` sidecar. |
| Gene2 custom profile | Use the same rPheRS test settings for the all-gene BH q and Profile λ. Display standardized β and server-supplied 95% CI. Count exact recorded HPO matches as an OR within the observed gene carrier total. Variant rows show the match numerator. Apply sorts variants by mean carrier rPheRS Z descending. Consequence uses multi-select on exact annotation values, including compound labels. |
| Phenotype | Existing views. The shared profile gene API accepts Max/Sum and All/Affected for Gene2. The Phenotype entry keeps Max/All. |
| Variant | Resolve overlapping genes using coding, VEP pick, direct overlap, impact and symbol tie-break. Retain the explicit Gene2 context from variant links. Keep the compact GT selector. Default the samples card to Phenotype profile, with the genotype-filtered Carrier details tab available before Apply. |
| Sample | Column search filters rows for Gene, Consequence, Score source, ClinVar and GT. Combine text and checkbox filters. Resolve unambiguous HPO aliases using the committed `configs/hpo_aliases_20260216.json` before Sample matching. |

## Runtime

- `npm run start:pb` installs missing dependencies, verifies the 16 runtime files, builds the processed GT index, opens the e3 tunnel and starts the frontend. The HPO λ sidecar is included in the pinned private release. The complete VCF, R scores and analysis roster stay on e3.
- `start_pb_context_demo.sh` stages the current API code into the caller's private e3 home and starts a personal job. The job publishes its actual loopback ports for the four app tunnels. An existing personal job with a different code hash must be stopped before updating it.
- Stage Python and R together for the Gene 95% CI. Use the current `Groups/gnomad` original VCF and its index for both quality and GT. Gene2 quality and Variant GT use separate services.
- Include the new quality route/API, `AssociationFilter.vue`, `profileAssociationQc.js`, the HPO alias table and the deployment helpers. `CohortPhenotypeTree.vue` is an unreferenced scratch component outside this delivery.

## Pre-commit review

| Check | Acceptance |
| --- | --- |
| Fresh setup | Use `npm run start:pb`. The launcher waits for the four analysis APIs and starts the frontend. Check inputs with `npm run setup:pb-runtime -- --verify-only`. |
| Front | Front and Front2 load. Gene and HPO searches open the intended pages. |
| Gene2 | SLC26A4 consequence filter applies exact choices. Apply sorts Z high to low. The TBCB three-HPO example reads 326 / 2,018. HPDL loads with zero qualifying variants. Its three indexed variants have zero ALT calls at DP ≥20. |
| Phenotype | A single HPO and a multi-HPO profile load, with pagination and gene results. |
| Variant | One-carrier SLPI has Carrier details before Apply. Direct overlap search resolves its gene. CASP5 supplements processed GT using the current original VCF. |
| Sample | Sample variant text searches combine with checkboxes. A profile with a known legacy HPO ID runs similarity search. |
| Delivery | `git diff --check` and page/runtime tests pass. Review the staged list for required new files, with private inputs, scratch files and local settings outside Git. |

Verified in this review: fresh npm install and full build, installer download of the new λ file with GT index creation, seven local entry routes, 39 JavaScript checks, 70 Python tests and the R association test. A personal Slurm job returned Gene CI, Sample membership, Variant GT and Gene2 quality responses. All five CASP5 supplemental calls returned `low_or_missing_depth`.

Gene2 API timing with fresh local and personal VCF caches: GJB2 7.5 s and IDUA 37.6 s, including 30.4 s for IDUA's VCF step. Warm results on the existing local HTTP API took 0.015–0.023 s. First-look latency depends on BioIndex and original VCF I/O.
