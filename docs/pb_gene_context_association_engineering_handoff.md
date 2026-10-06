# PB Gene Context Association Engineering Handoff

Updated: 2026-10-02
Target branch: `kyuryung/bch-prototype`
Pages: `/pb_gene.html`, `/public_gene.html`
Audience: frontend, backend, data, and platform engineers integrating HPO-dependent Gene associations

## Decision And Scope

Submitting HPO terms computes one residual PheRS vector for the selected cohort. The same vector is the outcome for two separate analyses:

| Analysis | Predictor | Browser destination | Current API model |
|---|---|---|---|
| Script 1: variant association | Binary carrier status for each exact variant across the full analysis roster | Variant Evidence `Effect Score (β)` and `P-value`; Match Score remains the mean carrier residual PheRS | OLS |
| Script 2: gene-score association | Supplied `gene_score_max` or `gene_score_sum` | HPO Context gene-level β and p-value | LM by default; GMMAT Gaussian LMM can be configured |

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
