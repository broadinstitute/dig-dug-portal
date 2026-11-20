# BCH aggregator integration

The frontend port uses prototype commit `c48649298` and starts from Helen’s `bch-aggregator` commit `3ebf3af8c`. The five page URLs are `/index.html`, `/generesult.html`, `/phenotyperesult.html`, `/variantresult.html` and `/sampleresult.html`.

## Service configuration

Use the existing portal ingress for `/phenotype-analyzer-api/`. Keep its legacy Flask routes on Helen’s port 4999. Route the more specific `/phenotype-analyzer-api/pb/` prefix to the Node gateway without removing the prefix. Both rules require the portal’s existing authenticated CRDC cohort access policy.

Start the gateway with `npm run serve:neph-api` on the same machine as the authenticating ingress, using a service supervisor. It listens on loopback and defaults to port 8100 (`PB_API_PORT`). Store a random `PB_INGRESS_SECRET` of at least 32 bytes in the gateway and ingress secret configuration. The ingress must strip client-supplied `X-CRDC-Ingress` and set it from that secret **after** validating session and cohort access on every request. The gateway returns 401 if the credential is absent or invalid. Keep the scoring services and BioIndex upstreams private.

| Setting | Upstream or source |
| --- | --- |
| `SERVICE_HOST_PRIVATE` | Local Neph proxy target for Helen’s existing Flask service on port 4999 |
| `BIOINDEX_HOST_PRIVATE` | Helen’s private BioIndex on port 5000. The gateway forwards the existing BioIndex session scope and follows the browser’s continuation requests. |
| `PB_PHENOTYPE_PROFILE_HOST_PRIVATE` | Profile service for HPO counts, profile samples, Sample variants and Sample comparisons. Start with `python3 -m scripts.pb_phenotype_profile_api --help`. |
| `PB_GENE_CONTEXT_HOST_PRIVATE` | Gene2 context and all-gene rPheRS. Start with `python3 -m scripts.pb_gene_context_api_server --help`. |
| `PB_VARIANT_CONTEXT_HOST_PRIVATE` | Variant context and exact original-VCF GT lookup. Use the same context module with the matching roster, covariates and `--genotype-vcf`. |
| `PB_GENE_QUALITY_HOST_PRIVATE` | Original-VCF calls for Gene2 DP ≥20 and cohort AF <1%. Start with `python3 -m scripts.pb_vcf_quality_api --help`. |
| `PB_SAMPLE_GENE_SCORE_HOST` | Gene scores for selected Phenotype samples. Start with `python3 -m scripts.pb_sample_gene_scores --help`. |
| `PB_GENE_HPO_FILE`, `PB_HPO_GENE_INDEX`, `PB_GENE_HPO_RELEASE_ID` | Complete PASS p<0.05 release, the HPO-keyed SQLite index of the same file, and `gene_hpo_release_20261112`. Keep `hpo_lambda_gc.json` next to the release gzip. |
| `PB_BURDEN_MEMBERSHIP_ROOT`, `PB_GRS_MEMBERSHIP_SNAPSHOT` | Version-matched single-HPO original model membership and multi-HPO shared gene comparison snapshots. |
| `PB_GENOTYPE_INDEX`, `PB_SAMPLE_VARIANT_SOURCE` | Verified processed GT index and source for `2025_crdc_16366_dp20_af001_20260907`. Configure the source in the profile service and the index in both the gateway and the profile service. |
| `PB_GENE_SCORING_HPO_MATRIX`, `PB_GENE_SCORING_SAMPLE_MAP`, `PB_GENE_SCORING_HPO_SHA256`, `PB_HPO_TERM_COUNTS_FILE` | The matched 15,764-sample scoring cohort for carrier metadata and ranking. Configure the separate 16,366-sample HPO matrix in the profile service. |
| `PB_GENE_CARRIER_CACHE_DIR`, `PB_VARIANT_GT_CACHE_DIR` | Private writable gateway cache directories. |

Use the same variant scoring reference and eligible noncarrier cohort for Gene2 and Variant. The Python analysis processes use NumPy and SciPy. The Gene2 score runner also needs R and the dependencies listed in `scripts/gene_score_association.R`. Build the HPO-keyed index with `python3 -m scripts.pb_hpo_gene_index --source "$PB_GENE_HPO_FILE" --database "$PB_HPO_GENE_INDEX"`. Build the processed GT index with `python3 -m scripts.build_pb_genotype_index --source "$PB_SAMPLE_VARIANT_SOURCE" --out "$PB_GENOTYPE_INDEX"`. Keep inputs, indices, caches and credentials outside the static web root and Git.

Set the PB ingress read timeout to at least 600 seconds for a full Sample comparison on a cold metadata cache. Preserve the existing private BioIndex session scope and retain the gateway cache across restarts. Each cache namespace incorporates the BioIndex index versions and access scope.

## Local verification

Set the relevant variables in an ignored `.env.development.local` and run `NODE_OPTIONS=--openssl-legacy-provider npm run serve:neph -- --host 127.0.0.1 --port 8080` with the Vue CLI 4 dependency tree. The local Vue server mounts the gateway for loopback testing. Use `NODE_OPTIONS=--openssl-legacy-provider npm run deploy:neph` for the production build. Set the existing legacy pages’ private BioIndex host through `BIOINDEX_HOST_PRIVATE` at build time. The five new pages send cohort requests to the portal origin.

After Helen deploys, verify all five pages under an authorized session. In a clean session, repeat one sensitive request for each namespace and confirm that the ingress denies access without returning cohort data. Record the deployed commit and tested source versions in the PR.

## Local acceptance record

Chrome checked both apps at 1440 × 900 and 100% zoom with matching queries. The result pages retain Helen’s BCH masthead. Layout comparison aligned the content below each app’s masthead. Browser captures are stored locally outside Git.

| Check | Input and observed result |
| --- | --- |
| Baseline and final routes | All five HTML entries and their JavaScript bundles loaded on port 8080. The four legacy POSTs returned HTTP 200. For `HP:0000539`, the responses held 30 top matches, 20 top phenotypes and 186 sample phenotypes. The `AKT1` variant response matched the 2,150-record baseline. |
| Index | `GJB2` opened Gene2. Seizure and Hypotonia opened Phenotype with `match=all`. The unavailable `HP:0010010` stayed in the input with an editable error. |
| Gene2 | `GJB2` had 320 eligible variants and 2,387 distinct carriers in the table, summary and demographics in both apps. `HPDL` loaded with zero eligible variants. A forced quality-service failure showed an error. On `SLC26A4`, the exact `3_prime_UTR_variant` filter retained 130 rows. Applying `HP:0011387` and `HP:0000407` sorted the 128 available carrier means by descending Z. |
| Phenotype | `HP:0001250` returned 2,059 matches. Adding `HP:0001252` with AND returned 553. Both apps returned gene results and the same sample counts after paging and filtering. The selected project filter retained four single-HPO rows and five multi-HPO rows. |
| Released burden | For `GJB2` and `HP:0012714`, both pages returned raw β 2.2938761412, p 1.16048377e-7 and N 15,574. Gene2 used `q_by_gene` 0.0003219182 and Phenotype used `q_by_hpo` 0.0003472167. |
| Variant | The SLPI singleton `chr20:45252212:C:G` displayed one carrier before Apply. CASP5 `chr11:104995788:G:A` returned 89 matched GT calls and five low-or-missing-depth calls. The GT tests also cover the separate no-call label. Applying Seizure in both browsers with Max, all samples and all GTs gave β 0.06860470, p 0.50681773 and mean carrier Z 0.06508617 with the same reference. Selecting Het and applying again retained 15,667 eligible noncarrier controls for the 87 selected carriers and left out the seven unselected carriers. |
| Sample | Text and checkbox filters together retained the same variant row in both apps. The reviewed sample’s comparison returned 16,363 candidates and 40 project summaries. Ranked candidates, project aggregates and shared comparison detail matched the prototype. A second approved-release record resolved `HP:0002438` to `HP:0001317`, rendered results for 16,362 candidates and 40 projects, and opened the shared comparison. The first full comparison reached the earlier browser timeout on a cold cache. Live parity was confirmed once metadata was cached. |
| Local API authorization and recovery | The standalone gateway rejected missing or invalid ingress credentials with HTTP 401, including for a Sample request. The timeout regression test verifies that an interrupted upstream body returns HTTP 504. The portal’s deployed sign-in and authorization checks require Helen’s deployment. |

The two apps used private BioIndex builds `gene-variants-crdc` 2026-07-31T16:13:18 and `samples-info` 2026-10-05T14:59:41. The burden release was `gene_hpo_release_20261112`, the processed GT release was `2025_crdc_16366_dp20_af001_20260907` and the HPO alias release was `hp/releases/2026-02-16`. The CASP5 runs shared rPheRS reference `df9fd4e1f3d791d494be40ce12d2398a6f75ba3f0a7971b0e8deaeb516286125`.

`npm run deploy:neph` completed with CSS order and bundle size warnings. The targeted 49 JavaScript commands, 44 Python tests, the R association test and `git diff --check` passed.
