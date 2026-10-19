# PB Gene Context Association Engineering Handoff

## Confirmed display units — October 19, 2026 follow-up

The user's final decision supersedes earlier OR-retention and pending-source proposals in this document. No new single-HPO regression is needed or authorized for this change.

| Result | Primary display | Formula |
|---|---|---|
| Precomputed binary single-HPO gene burden | β per 0.1 GRS (log-odds) | 0.1 × stored approximate β |
| Live Context Gene | Effect per 0.1 GRS (SD) | 0.1 × raw linear β / original scoring-cohort SD |
| Live Context Variant | Variant effect β (SD) | raw linear β / original scoring-cohort SD, carrier 0→1 |

Single-HPO uses the stored `beta_gene_score_sum_approx` and `se_gene_score_sum_approx`, without rPheRS SD division. Its existing coefficient CI is scaled by 0.1; where the release supplies OR bounds, the endpoint takes the log of the original one-GRS positive finite bounds before scaling. It never recovers β from an already available OR. Original score-test p/q, release selection/order, and fitted N are retained. No Wald p-values or new q-values are calculated.

`gene_hpo_association_endpoint.js` preserves legacy OR fields and adds raw `beta`, `standardError`, `betaCiLow`, `betaCiHigh`, plus `betaPer0_1Grs`, `standardErrorPer0_1Grs`, `betaCiLowPer0_1Grs`, and `betaCiHighPer0_1Grs`. Metadata includes `nSamples`, `sourceRelease` (default `gene_hpo_release_20260905`, configurable through `PB_GENE_HPO_RELEASE_ID`), `model`, `modelFormula`, `outcome=hpo_binary`, `predictor=gene_score_sum`, `effectUnit=log_odds_per_0_1_grs`, `effectApproximation=score_test`, `displayPredictorStep=0.1`, and `displayVersion=single_hpo_beta_per_0_1_grs_v1`. A missing stored β or unmatched CI remains unavailable. `singleHpoUnits.js` derives display fields only from original coefficient fields, preventing a repeated 0.1 conversion.

Gene's precomputed hero card, ranked rows, carrier-summary KPI, summary table and effect sorting use these single-HPO fields. Phenotype's single-HPO table, bars, sorting and CSV use the same fields. CSV explicitly names `beta_log_odds_per_0_1_grs`, corresponding SE/CI columns, and records analysis N/model/unit/approximation/release. Context SD fields, individual/mean Z-scores, Variant Score, GRS and disease Profile score remain separate. All historical result files are unchanged.

Deploy the Node release endpoint and frontend together and restart the Vue development server to clear its process-local release cache. Python/BioIndex changes or another HPC job restart are not needed for this follow-up. Tests `test_pb_phenotype_gene_endpoint.js` and `test_rphers_sd_ui.js` cover direct stored-β scaling, preserved p/q/N, CI conversion, same Gene/Phenotype values, CSV units, negative/zero/missing coefficients and idempotence.

### Existing entry points and added dependencies

| File | Change / responsibility |
|---|---|
| `scripts/rphers_fast.py` | Existing scorer: preserve raw calculation and add reference/Z fields after scoring. |
| `scripts/pb_gene_context_validation.py` | Existing Context engine: reuse the complete scoring reference, append display effects/means after the existing fits. |
| `scripts/variant_association.py` | Existing variant wrapper: append SD effects/SE after existing OLS. |
| `scripts/pb_phenotype_profile_api.py` | Existing profile service: append individual Z-scores and full-reference metadata; keep counts/filtering. |
| `scripts/pb_gene_context_api_server.py` | Existing routes: pass through added aggregate fields and preserve private/public boundaries. |
| `scripts/gene_hpo_association_endpoint.js` | Existing release routes: read stored β/SE and append per-0.1-GRS fields and coefficient CI. |
| **New** `scripts/rphers_standardization.py` | Shared Python reference/mean/effect conversion helpers; imported by the existing scripts above. |
| **New** `src/utils/rphersUnits.js` | Frontend validation of reference/version and standardized fields; no raw-value fallback. |
| **New** `src/utils/singleHpoUnits.js` | Shared Node/frontend scaling of stored binary-HPO β/SE/CI by 0.1. |

The three PB view models/templates and Gene's existing `geneHpoDisplay.js` consume these fields. Existing URLs, calculation commands and analysis inputs remain the integration path. Include **all three new helper files** when handing off the changed existing scripts/views; copying only the modified entry points will leave imports missing. Existing `run_gene_score_lm.R`, `run_gene_score_lmm.R` and historical single-HPO analysis scripts/results are unchanged. No replacement analysis service was introduced.

### Engineering delivery documents

Deliver the code and these documents from the same commit. This document is the starting point; the October 19 display-unit contract supersedes historical raw-unit labels in older examples.

| Document | Purpose |
|---|---|
| [This handoff](pb_gene_context_association_engineering_handoff.md) | Shared calculation changes, complete script/helper inventory, input sources, response fields, cache and deployment requirements. |
| [Context API calculation guide](pb_gene_context_api_guide.md) | Existing request and calculation contract, with a current-unit addendum. |
| [Variant Context/co-gene handoff](pb_variant_hpo_context_cogene_engineering_handoff_20261005.md) | Exact-variant and co-gene routes, affected-only selection, coverage and FDR family. |
| [Variant integration handoff](pb_variant_engineering_integration_handoff.md) | Variant page fields, carrier displays and frontend integration. |
| [Phenotype profile/specification](pb_phenotype_live_profile_and_spec_2026-10-16.md) | Phenotype sample/cohort displays, live versus single-HPO effects, sorting and CSV. |
| [Final implementation specification](pb_rphers_sd_agent_prompt_2026-10-19.md) | Approved formulas, scope and preservation requirements. |
| [Verification record](pb_units_verification_2026-10-19.json) | Aggregate validation results, cohort differences, changed module inventory and prototype Python hashes. |

Apply the Python entry points together with `rphers_standardization.py`; apply the Node endpoint together with `singleHpoUnits.js`; then deploy all three pages with both frontend helpers. Restart the relevant API processes and Node release cache. Preserve the existing analysis inputs and raw fields. Production BioIndex schemas and historical single-HPO result files do not need conversion for this display change.

Updated: 2026-10-19
Target branch: `kyuryung/bch-prototype`
Pages: `/pb_gene.html`, `/public_gene.html`
Audience: frontend, backend, data, and platform engineers integrating HPO-dependent Gene associations

## Decision And Scope

Submitting HPO terms computes one residual PheRS vector for the selected cohort. The same vector is the outcome for two separate analyses:

| Analysis | Predictor | Browser destination | Current API model |
|---|---|---|---|
| Script 1: variant association | Binary carrier status for each exact variant across the full analysis roster | Variant Evidence `Variant effect β (SD)` and `P-value`; `Mean rPheRS Z-score` is the carrier mean | OLS |
| Script 2: gene-score association | Supplied `gene_score_max` or `gene_score_sum` | HPO Context `Effect per 0.1 GRS (SD)` and p-value | LM by default; GMMAT Gaussian LMM can be configured |

The gene score file is an **approved server-side input**, not a GitHub deliverable. Use `CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv` from `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/custom_hpo_regression/input/`. Helen will obtain this file from that server location and move it to the test-server/S3 location she manages, then configure its mounted/local path as `PB_GENE_CONTEXT_GENE_SCORES` or `--gene-scores`. GitHub delivery consists of the scripts, this English engineering document, and the Gene view code. Do not commit cohort data, gene scores, sample-level residuals, or GRMs.

The analyst supplies the PheRS and association calculations in this package. Helen's integration task is to connect the approved BioIndex/cohort sources to those scripts and expose their result through the prototype's Context API contract. `pb_gene.html` posts to `/phenotype-analyzer-api/analyze`; `public_gene.html` posts to `/phenotype-analyzer-api/public-analyze`. An authenticated private PB Variant request may specify one exact `variant_id` and receive residual PheRS values for only that variant's carriers. The public route returns aggregate variant effects without sample IDs or carrier-count fields. Gene-level effects keep their separate support rule. Keep both routes behind the portal's appropriate access controls and same-origin proxy.

## Five-Minute Start

Place the four required approved input files in a directory with the default names shown below. Point `PB_GENE_CONTEXT_GENE_SCORES` at the separately shared gene score file. Then start the prototype from the repository root:

```bash
PB_GENE_CONTEXT_DATA_ROOT=/path/to/approved/input \
PB_GENE_CONTEXT_GENE_SCORES=/path/to/CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv \
BIOINDEX_HOST_PRIVATE=http://YOUR_PRIVATE_BIOINDEX_HOST:5000 \
NODE_OPTIONS=--openssl-legacy-provider \
npm run serve:pb-gene
```

Open `/pb_gene.html?query=ATL1` or `/public_gene.html?query=ATL1`, enter `HP:0011734,HP:0006827`, and select **Go**. The Vue development server starts the local Context API on port 8092 when `PB_GENE_CONTEXT_DATA_ROOT` is set and `PHENOTYPE_ANALYZER_HOST_PRIVATE` is unset. For a separately managed API, set `PHENOTYPE_ANALYZER_HOST_PRIVATE` to its base URL instead. `npm run serve:pb-gene` exits with a configuration message if neither source is set, avoiding a silent proxy 500.

The existing test-server `/phenotype-analyzer-api/analyze` endpoint observed on 2026-10-02 **does calculate HPO-based sample matching** using an earlier analyst-supplied PheRS script. Its observed response returned `top_matches`, `query_received`, and term counts. That response did not expose the new `gene_association`, `variant_associations`, or `variant_match_scores` contract. Reuse its server-side HPO/cohort integration where appropriate; connect the supplied new calculation scripts to the full residual vector server-side and return only aggregate results to the Gene pages.

The page's BioIndex variant rows and Context API association keys must use the same exact GRCh38 `chr:pos:ref:alt` identifier. A synthetic variant ID will not match a live BioIndex row, even when the API returns a valid association.

## Input Contract

Default filenames under `PB_GENE_CONTEXT_DATA_ROOT` are listed here. Override individual paths with the corresponding `PB_GENE_CONTEXT_*` environment variables in `vue.config.js`.

| File | Required columns | Meaning |
|---|---|---|
| `hpo.tsv` | `sample_id`, one binary column per available `HP:nnnnnnn` term | Sample-by-HPO matrix; the requested terms must exist as columns. |
| `roster.tsv` | `sample_id`, `overlap_status` | Rows with `overlap_status=both` define the analysis roster. |
| `variant_evidence.tsv` | `sample_id`, `gene_symbol`, `Variant_ID` or `variant_id`, `GT`, `pathogenicity_score` | Exact carrier rows for the private gene evidence source, with the annotation fields used by the existing score reconstruction. |
| `covariates.tsv` | `sample_id`, `age`, `sex`, `affected`, `WES_WGS`, `PC1`–`PC10` | One row per analysis sample. `WES_WGS` can alternatively come from a separate platform TSV. LMM also requires `vcf_sample_id` for GRM alignment. |
| `gene_scores.tsv` (or `PB_GENE_CONTEXT_GENE_SCORES`) | `sample_id`, `gene_symbol`, `gene_score_max`, `gene_score_sum` | Use the separately shared `CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv`. Without it, residual PheRS and variant associations still run, while the gene-level association is unavailable. A score ID map can be provided when these IDs differ from cohort IDs. |

`sex` is **one categorical source field** with Female, Male, and Unknown levels. Female is the reference level; the model design encodes Male and Unknown as two indicator columns. A level absent from the selected cohort is omitted when aliased. The model string's `sex_male` and `sex_unknown` describe this internal encoding, not two source sex columns. Age missingness is represented by a separate indicator after median age imputation. The gene model also includes WES/WGS platform; the variant model currently uses age, sex, and PC1–PC10.

The file inputs are the current script interface, not browser uploads. The approved processed sources include a parent-expanded HPO matrix and flat `sample_id × variant_id × gene_symbol` carrier rows. On the test server, Helen can materialize these inputs beside the API or adapt the server-side loader to equivalent private BioIndex queries. The HPO matrix must cover the full PheRS cohort; the variant evidence must preserve exact carrier rows and `GT`. Join cohort covariates and supplied gene scores by the approved sample-ID mapping. Do not make the browser fetch the sample-level matrix or carrier roster.

Helen confirmed that the working BioIndex interface is the query URL, not a separate direct-fetch API:

```http
GET http://100.80.30.199:5000/api/bio/query/<index-name>?q=<query-value>
```

For example, `gene-variants2?q=AKT1` returns variant annotation/aggregate records; it is **not** the full per-sample residual PheRS input or the new Context association response. Helen's earlier `table.tsv` lists `gene-samples` but predates the prototype's `gene-variants-crdc` index. Both `gene-samples?q=SERPINC1&limit=1` and `gene-variants-crdc?q=SERPINC1&limit=1` returned HTTP 200 on 2026-10-02. A `gene-samples` row exposes `sample_id`, `variant_id`, `GT`, `pathogenicity_score`, LoF, AlphaMissense, and REVEL fields, making it the relevant per-carrier source for the variant calculation. The current prototype's private Gene adapter queries `gene-variants-crdc` by gene for the displayed variant rows. Preserve the existing `src/utils/bioIndexUtils.js` authentication and continuation handling when integrating into the `bch-aggregator` base. The backend analysis still needs the complete approved carrier population, cohort covariates, HPO matrix, and callability rule; a displayed variant's `samples` list alone does not supply them.

Only classify a missing carrier row as variant genotype 0, or a missing gene-score row as score 0, when the upstream source establishes that the sample was callable for that variant or gene. A no-call is not a noncarrier. The delivered scripts do not create a callability source.

## Models And Execution Modes

Residual PheRS is calculated across the complete HPO matrix using the portal's PheRS weights and residualization, then aligned to the `both` roster. This keeps the offline runner consistent with the Context API. The two analyses share that outcome and use different predictors.

| Mode | Formula / method | Entry point | Deployment status |
|---|---|---|---|
| Variant OLS | `residual PheRS ~ variant carrier (0/1) + age + age_missing + sex + PC1..PC10` | `scripts/variant_association.py` | Used by the Context API and both pages. |
| Variant GRM LMM | Same fixed effects with a Gaussian GRM random effect | `scripts/variant_association_lmm_reference.py` | Offline small-roster reference only; dense implementation is capped at 1,500 samples and is not selected by the Context API. |
| Gene LM | `residual PheRS ~ GRS + age + age_missing + sex + WES_WGS + PC1..PC10` | `scripts/run_gene_score_lm.R` | Context API default. |
| Gene GRM LMM | Same fixed effects with a Gaussian GRM random effect; GMMAT null-model score test | `scripts/run_gene_score_lmm.R` | Select with `PB_GENE_CONTEXT_GENE_SCORE_MODEL=lmm` and `PB_GENE_CONTEXT_GRM_PREFIX`. Its reported β is a null-score approximation. |

The GRM prefix refers to existing GCTA `.grm.id` and `.grm.bin` files. The gene LMM needs `vcf_sample_id` values matching the GRM IDs and an installed GMMAT R package. The gene calculation accepts `max` or `sum` scores and an `affected_only` switch. In the original PB Gene and one-shot flow documented here, `affected_only` selects samples for the gene association while the variant association uses the full analysis roster. The later PB Variant Context API additionally applies its submitted `affected_only` setting to the exact-variant carrier mean and binary-variant OLS; see `docs/pb_variant_hpo_context_cogene_engineering_handoff_20261005.md`. No runtime comparison is asserted here because synthetic timing does not predict production timing.

## One-Shot Server Execution

Run the supplied shell from the repository root. It sources `/programs/biogrids.shrc`, selects Python 3.12.2 and R 4.4.2, and writes to a **new** output directory. It does not run an independent statistical verifier.

```bash
bash scripts/run_pb_gene_context.sh \
  --hpo-matrix /path/to/approved/input/hpo.tsv \
  --roster /path/to/approved/input/roster.tsv \
  --variant-evidence /path/to/approved/input/variant_evidence.tsv \
  --covariates /path/to/approved/input/covariates.tsv \
  --gene-scores /path/to/approved/input/gene_scores.tsv \
  --gene ATL1 --terms HP:0011734,HP:0006827 \
  --variant-model ols --gene-model lm --score-type max \
  --affected-only no --output-dir /path/to/new/output
```

For the GRM alternatives, use `--variant-model lmm --gene-model lmm --grm-prefix /path/to/existing/grm`; the variant LMM remains subject to its 1,500-sample cap. Either model can be selected independently. Optional `--platform-file` and `--score-id-map` provide platform and score sample-ID mapping.

The output directory contains:

| File | Contract |
|---|---|
| `residual_phers.tsv` | Private sample-level intermediate: `sample_id`, `residual_phers`, `raw_phers`. Never return the full file to the browser or public route. The private exact-variant request may return only its carrier residuals. |
| `variant_ols.json` or `variant_lmm.json` | `variant_associations` keyed by exact variant ID, with `beta`, `standard_error`, `p_value`, `n_samples`, `n_carriers`, and `status`. |
| `gene_lm.tsv` or `gene_lmm.tsv` | `gene_symbol`, `score_type`, `model`, `affected_only`, `n_samples`, `beta`, `standard_error`, `p_value`, `n_positive`, `status`. |

The one-shot files are useful for server-side inspection. The browser does **not** read these output files; it reads the API response after the HPO form is submitted.

## Context API And Page Mapping

Start the API directly if it is managed separately from Vue:

```bash
bash scripts/start_pb_gene_context_api.sh \
  --hpo-matrix /path/to/approved/input/hpo.tsv \
  --overlap-roster /path/to/approved/input/roster.tsv \
  --evidence /path/to/approved/input/variant_evidence.tsv \
  --covariates /path/to/approved/input/covariates.tsv \
  --gene-scores /path/to/approved/input/gene_scores.tsv \
  --host 127.0.0.1 --port 8092
```

Optional API flags: `--gene-score-model lm|lmm`, `--gene-score-type max|sum`, `--gene-score-affected-only`, `--grm-prefix`, `--gene-score-covariates`, `--gene-score-platform`, `--gene-score-id-map`, and `--rscript`. The prototype dev server passes these via `PB_GENE_CONTEXT_GENE_SCORE_MODEL`, `PB_GENE_CONTEXT_GENE_SCORE_TYPE`, `PB_GENE_CONTEXT_AFFECTED_ONLY=true`, `PB_GENE_CONTEXT_GRM_PREFIX`, and the other `PB_GENE_CONTEXT_*` settings in `vue.config.js`.

Request example:

```http
POST /phenotype-analyzer-api/analyze
Content-Type: application/json

{"gene":"ATL1","terms":["HP:0011734","HP:0006827"]}
```

Response mapping:

| Response field | `pb_gene.html` | `public_gene.html` |
|---|---|---|
| `gene_association.beta`, `.p_value`, `.status` | HPO Context gene-level row | Same row, only when public support threshold is met |
| `variant_associations[variant_id].beta`, `.p_value` | Variant Evidence Effect Score β / P-value, matched by exact variant ID | Same aggregate columns for supported variants |
| `variant_match_scores[variant_id].match_score` | Variant Evidence Match Score | Same aggregate mean for every variant with complete carrier scores |
| `gene_burden` | Existing private burden response remains available | Not returned |

The public projection requires at least 10 positive-score samples for a gene effect. It returns every valid variant effect and p-value, including single-carrier variants. Match Score is the mean residual PheRS of the variant's scored carriers and is returned for every variant with complete carrier scores, including single-carrier variants. It omits `sample_ids`, carrier counts, per-sample residual PheRS, and covariate rows. An unsupported or failed result displays as unavailable. The HPO Context gene-score p-value is unadjusted; the page does not show an FDR column for that result.

## Implementation Map

| Path | Responsibility |
|---|---|
| `scripts/run_pb_gene_context.sh` | One-shot execution of both analyses. |
| `scripts/start_pb_gene_context_api.sh` | BioGrids-aware API launcher. |
| `scripts/serve_pb_gene_context.sh` | Prototype launcher that requires a configured Context API source. |
| `scripts/pb_gene_context_api_server.py` | Private and public aggregate HTTP routes. |
| `scripts/pb_gene_context_validation.py` | Cohort alignment, cached residual PheRS, evidence loading, Context API orchestration. |
| `scripts/prepare_gene_association_phers.py`, `scripts/rphers_fast.py` | Offline and shared residual PheRS calculation. |
| `scripts/variant_association.py`, `scripts/variant_association_lmm_reference.py` | Variant OLS and small-roster GRM LMM. |
| `scripts/run_gene_score_lm.R`, `scripts/run_gene_score_lmm.R`, `scripts/gene_score_association.R` | Gene score LM/LMM. |
| `scripts/gene_score_context_runner.py` | Context API adapter for the gene R runners. |
| `src/views/PbGene/pageModel.js`, `src/views/PbGene/Template.vue` | Private API request and table binding. |
| `src/views/PublicGene/pageModel.js`, `src/views/PublicGene/Template.vue` | Public projection request and table binding. |
| `vue.config.js`, `package.json` | Local API process/proxy and `serve:pb-gene` command. |

Use the target branch for the scripts, this guide, the current frontend implementation, and existing portal dependencies. The separate lab-share gene score file is an input that Helen moves into her test-server data environment; it is not part of the repository.

## Integration Notes

1. Mount the four required approved inputs with consistent sample IDs and exact variant IDs; supply the gene-score source when available. Existing ADCY10 covariates and GRM can be reused after alignment to the browser cohort.
2. Configure private BioIndex and the same-origin Context API proxy. The local `vue.config.js` proxy is a development implementation; deploy an equivalent route in the test server.
3. Keep the public endpoint aggregate-only and apply the portal's access controls. Keep the private residual TSV on the server.
4. Choose gene LM or gene LMM from actual deployment requirements. The delivered variant GRM code is an offline reference and requires a scalable implementation before full-cohort API use.
5. A missing β or p-value is an unavailable association, not zero. Do not fill blank browser cells with fixture values.

## BioIndex Connection Tasks For Helen

| Existing approved source | Connect to script input | Required preservation |
|---|---|---|
| Parent-expanded binary HPO matrix, or equivalent server-side HPO materialization | `hpo.tsv` / `--hpo-matrix` | Full sample roster and binary `HP:nnnnnnn` columns used by the analyst's residual PheRS calculation. |
| Private `gene-samples` query by `gene_symbol`, or its approved flat `sample_variant_gene` materialization; prototype display queries `gene-variants-crdc` | `variant_evidence.tsv` / `--evidence` | Exact GRCh38 variant ID, gene symbol, sample ID, GT, and required score annotations; all continuation pages or a complete materialized source. `gene-variants2` annotation rows alone are insufficient. |
| Approved cohort overlap roster and ADCY10-derived covariates | `roster.tsv` and `covariates.tsv` | Identical sample-ID population/order alignment, three-level source `sex`, age, WES/WGS, PC1–PC10, and `affected`. |
| Analyst-supplied sample-by-gene score source in the `custom_hpo_regression/input` share folder | `PB_GENE_CONTEXT_GENE_SCORES` / `--gene-scores` | Helen retrieves `CRDC2025_step4_sample_gene_burden_nonsyn_dosage_LOFTEE_AM.tsv` from lab-share and stages it in her data environment. Preserve `gene_score_max` and `gene_score_sum` and map IDs only if required. Never add this source to GitHub. |

Keep the supplied formulas and regression scripts as the calculation implementation. The older HPO match endpoint can continue serving its current result; wire the new aggregate Gene Context response to the page routes shown above. The `top_matches` response alone is not a substitute for the new response fields.

## October 19, 2026: rPheRS SD display contract

This addendum supersedes the raw-unit **display mapping** above for the private PB Gene, PB Variant, and PB Phenotype screens. The raw calculation and fields remain available. Implementation authority: `docs/pb_rphers_sd_agent_prompt_2026-10-19.md`; the reference and display-step choices are this implementation's specification, not an attribution of additional instructions to Jason.

### Calculation scripts and unchanged analyses

The change belongs to the supplied Python calculation scripts. `scripts/rphers_fast.py` still calculates the same weights, raw score, residual vector, ranking, and original scoring roster. It now calls `scripts/rphers_standardization.py` on that entire residual vector. `pb_gene_context_validation.py` reuses that scoring result, subsets the **unchanged raw Y** for the existing analysis roster, and adds display fields after fitting. `variant_association.py` uses the same reference. Neither the R gene runners nor the regression predictors, covariates, Max/Sum options, affected-only rule, p-values, or FDR families change. There is no extra regression for standardization.

| Value | Added field | Calculation / UI |
|---|---|---|
| Individual residual | `rphers_z` | `(raw - reference_mean) / reference_sd`; rPheRS Z-score |
| Complete carrier mean | `mean_rphers_z` | `(match_score - reference_mean) / reference_sd`; Mean rPheRS Z-score |
| Linear effect / SE | `beta_sd`, `standard_error_sd` | Raw slope / SE divided by reference SD |
| Gene primary effect / SE | `beta_sd_per_0_1_grs`, `standard_error_sd_per_0_1_grs` | Above multiplied by 0.1; **Effect per 0.1 GRS (SD)** |
| Variant primary effect | `beta_sd` | Carrier predictor 0→1; **Variant effect β (SD)**; no 0.1 multiplier |

Raw `beta`, `standard_error`, `match_score`, `residual_phers`, and private `sample_scores` retain their meanings. Gene `predictor=gene_grs` / `display_predictor_step=0.1`; variant `predictor=variant_carrier_0_1` / step 1. Existing `score_type` and analysis N fields retain their original meanings. Do not substitute the legacy evidence-derived `gene_burden` for the configured `gene_association` displayed in the Context panel.

Every response carries `rphers_standardization` with:

- `version`: `rphers_scoring_cohort_sample_sd_v1`, `status`, `ddof=1`, `scope=full_existing_scoring_cohort`;
- `reference_mean`, `reference_sd`, `reference_n` (finite scores), `scoring_cohort_n` (original rows), normalized `query_hpo`;
- `data_release_id` (SHA256 of normalized HPO matrix content and columns), `scoring_cohort_id` (SHA256 of ordered scoring IDs), and `reference_id` (version/data/cohort/context identity). These content identifiers are not human release names and contain no sample IDs.

Derived association/mean rows carry `standardization_reference_id` and `standardization_status`. Private exact-carrier responses add `sample_rphers_z` alongside unchanged `sample_scores`, plus their reference metadata. Public projection forwards aggregate standardized fields and reference metadata without personal scores/IDs or carrier counts. Public screens outside the three specified PB screens retain their existing bindings.

Unavailable states: `missing_reference`, `insufficient_reference` (fewer than two finite scores), `zero_or_invalid_sd` (including numerical round-off at or below 1e-12), `analysis_unavailable`, and `incomplete_coverage`. The frontend requires the current version, valid metadata, matching context/reference, and valid standardized field; it never relabels a raw fallback as SD/Z. Existing analysis and coverage status fields are not overwritten. An absent individual score remains unavailable.

### Confirmed source boundaries

| Existing path | Scoring vector / reference | Actual regression / display population |
|---|---|---|
| Current Gene/Variant Context configuration | Full 15,764-row matrix | Existing aligned 15,761-row regression roster; affected-only narrows this as before (6,913 in the inspected configuration) |
| Local Phenotype profile sidecar | Full 16,366-row matrix | Existing HPO-matching sample list, then existing display filters |
| Precomputed single-HPO gene–HPO release | Binary HPO logistic score-test results | Existing release analysis N (15,574); displayed stored β and coefficient CI are multiplied by 0.1, without rPheRS SD scaling |

The 15,764→15,761 exclusion reflects missing PCA/covariate rows in the inspected analysis inputs. It does **not** redefine the original scoring cohort. No 602 or three samples are dropped by this change. A different deployment must verify its actual input/roster contents rather than infer N from filenames. Context Y is continuous residual PheRS; gene predictor is the existing GRS, variant predictor is carrier 0/1. The single-HPO release outcome is binary HPO and is not standardized by this code.

Read-only real-input verification for `HP:0001250,HP:0001256` found raw scores, weights, residuals, ranks, and ordering **exactly unchanged** from the prior scorer. The 15,764 reference SD is `0.7109327271108082`; the 16,366 reference SD is `0.7089715430759951`. Each full reference has mean Z approximately 0 and sample SD 1. These are different references, not interchangeable denominators. The UI reports the source N and flags different sample/gene references on Phenotype; no cohort unification is attempted.

### Engineer rollout and cache handling

Ship the changed calculation scripts **including the new helper module**, API aggregate-field projection, and frontend together. Restart the Python Context and profile processes so in-memory scoring/association caches do not retain old response shapes. Cached raw gene results remain raw; conversion copies them after lookup and never rescales an already standardized field. Existing process-local caches are bounded; there is no new persistent analysis cache or rerun of the historical single-HPO release. If infrastructure adds response caching, namespace it by the standardization version, data/cohort identity, context, and the existing analysis options. Reference metadata must be consistent across paginated responses.

No BioIndex data/schema migration is required for this unit change. The calculation service behind the current localhost:8098 prototype has been updated with the five supplied Python modules and restarted with the same inputs (prototype job 29646410; previous job 29628071). Before replacement, existing scripts were backed up under runtime/sd-update-20261019/before in the existing prototype calculation directory. The localhost:8092 tunnel has been reconnected, and the local profile service on 8093 was restarted with the same inputs. This updates the current prototype only; engineering/production BioIndex and its data were not changed. Raw-only responses from any older service still produce unavailable SD cells.

### Verification

- `python3 -m unittest scripts.test_rphers_fast scripts.test_rphers_standardization scripts.test_pb_gene_context_validation scripts.test_variant_association scripts.test_context_api_fast scripts.test_pb_gene_context_ui`
- `python3 -m unittest scripts.test_pb_gene_context_api_server` (requires local listener permission)
- `node scripts/test_rphers_sd_ui.js`, `node scripts/test_pb_gene_variant_association_ui.js`, `node scripts/test_pb_variant_carrier_statistics.js`
- Phenotype model/source endpoint tests and production build.

Tests cover direct standardized-Y regression versus β/SE rescaling for continuous/binary predictors, unchanged p/q/raw Y and roster, gene 0.1 versus variant 1 scaling, mean centering/coverage, same-source cross-page reference identity, filter/paging invariance, missing/constant outcomes, UI/CSV agreement, and preserved single-HPO raw fields/p/q/N with stored-β display scaling. Large historical burden analyses were not rerun.

### Current prototype Context verification

The current prototype calculation process was restarted with the same inputs. For SYNGAP1, `HP:0001250,HP:0001256`, Sum GRS and affected-only, the existing 6,913-row analysis and all 965 variant association rows were preserved. Gene raw β/SE/p were identical before/after; the primary gene SD effect per 0.1 GRS is `0.08001574485085873`, p `0.0442650857098572`, reference N `15,764`, SD `0.7109327271108082`. Some variant float results differ only at machine precision after moving the same process to another compute node (validated with relative tolerance 1e-10 / absolute 1e-12). This is not evidence of a different regression or cohort; do not describe those cross-node floats as bitwise identical.

Browser verification on localhost:8098 confirmed the SYNGAP1 Context primary effect displays `0.080` and p `0.044`. For exact variant `chr6:33432683:A:C` under the same Sum/affected HPO context, the screen displays mean carrier Z `0.394`, carrier coverage `2/2`, variant SD effect `0.194`, p `0.849`, and the same 15,764-score reference. Phenotype sample Z-scores and its separate 16,366-score reference were also visually verified. The precomputed single-HPO cards use the separate stored-β scaling described in the confirmed display table; no new regression was needed.

The user subsequently supplied the complete release directory `/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/single_gene_burden_with_HPO/gene_hpo_release_20260905`. Inspection of `all_gene_hpo_results.tsv.gz` (not only the browser projection), `source_inventory.tsv`, and `validation.json` confirmed 2,774 HPOs, 17,952 genes, and 49,798,848 result rows. The full table already contains `beta_gene_score_sum_approx` and `se_gene_score_sum_approx`; the issue is their model/outcome, not absent beta columns or incomplete prior analysis. Its `model_formula` uses `hpo_binary`. Source R code fits `GMMAT::glmmkin(..., family=binomial(link="logit"))`; the GPU source uses the corresponding binomial working weights. Therefore these completed coefficients cannot be interpreted as continuous residual-PheRS SD slopes by dividing them by the Context rPheRS SD. No additional burden analysis was started during this source audit.

### Final single-HPO browser acceptance on localhost:8098

The Vue development server was restarted with its original BioIndex, Context proxy, and release-file settings. Live release endpoints returned the new coefficient fields. SYNGAP1 / HP:0000751 retains 36 release rows, original analysis N 15,574, raw β `56.1762258940778`, p `1.39013754174241e-13`, q `3.56411406595015e-11`; its Gene card now displays β `5.618` and coefficient CI `4.129–7.106` per 0.1 GRS. Phenotype single-HPO HP:0000751 visibly shows the same unit and existing significant-gene selection; DEDD displays β `55.9`, CI `51.2–60.6`, p `3.52e-120`, q `6.32e-116`. These large binary-model coefficients are not residual-PheRS Z-scores. Individual rPheRS Z-scores themselves are unbounded; centering to mean 0 / sample SD 1 does not impose a 0–1 or −1–1 range.

The endpoint and UI/CSV integration tests passed for the final distinction; the production build passed with the existing LocusZoom/tabix-reader warning. No new single-HPO analyses, historical refits, or BioIndex data changes were made.

### Reverification and handoff audit — October 19, 2026

The existing entry points and new helper dependencies were traced again. The Context prototype's five Python modules have identical SHA256 hashes to this working tree. The existing R runners and historical single-HPO analysis scripts/results remain unchanged. 59 Python calculation/UI tests plus 8 HTTP tests passed; six Node test commands passed, including the real view-method/CSV consumers. `git diff --check` passed. The prior successful build applies to the same implementation code; this audit changed documentation only.

Live 8098 checks independently compared all 36 returned SYNGAP1 rows and all 20 returned HP:0000751 gene rows with the stored release β/SE/CI/p/q/N; row order was preserved. All 965 returned Context variant effects were checked for SD scaling, along with the gene 0.1-GRS scaling, raw-result preservation against the pre-change aggregate snapshot (floating-point tolerance), private individual Z-scores and complete carrier mean. Profile paging/sex-filter requests retained the same 16,366-score reference. Context retains its separate 15,764-score reference. No historical single-HPO fits were run.

The aggregate-only machine-readable record is `docs/pb_units_verification_2026-10-19.json`. It contains no individual sample records. This validates the current prototype and supplied code; engineering production rollout still requires carrying the modified entry points, frontend, and all added helper files together.
