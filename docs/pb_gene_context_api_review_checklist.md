# CRDC Gene Page Context API: Statistical Review Checklist

## Review status

**Reference implementation ready for review; not yet approved for production.**

The code contains calculation functions, not a complete HTTP service. Backend data loading, FDR application, authentication, caching, and API response assembly still belong in the production service.

## Files to review

1. `scripts/rphers_fast.py`
   - Input: full CRDC sample-by-HPO binary matrix and user HPO terms.
   - Output: one `phenotype_match_score_resid` value per sample.
   - Intended R reference: `rPheRS_for_portal_20250512.R`.
2. `scripts/context_api_fast.py`
   - `variant_match_scores()`: mean residual score across unique carriers of each variant.
   - `gene_burden_scores()`: binary-carrier weighted sum of Pathogenic Scores per sample.
   - `gene_burden_test()`: provisional Huber RLM for `Y ~ X + C`.
   - `benjamini_hochberg()`: BH-adjusted P-values for a defined test family.
3. Tests
   - `scripts/test_rphers_fast.py`
   - `scripts/test_context_api_fast.py`
   - `scripts/test_pb_gene_context_validation.py`
   - `scripts/test_pb_gene_context_ui.py`

Run:

```bash
python3 -m unittest \
  scripts.test_rphers_fast \
  scripts.test_context_api_fast \
  scripts.test_pb_gene_context_validation \
  scripts.test_pb_gene_context_ui
python3 scripts/rphers_fast.py
python3 scripts/context_api_fast.py
```

## Already checked in the reference implementation

- [x] `Wp = log((N + 1) / (n_p + 1))` is implemented.
- [x] `Fi = 1` for entered HPO terms is implemented.
- [x] Raw sample score is the weighted sum over matched HPO columns.
- [x] Residual is calculated from `lm(raw score ~ total sample HPO count)` using the equivalent least-squares projection.
- [x] Dense and SciPy sparse matrices return the same tested result.
- [x] Unknown query HPO terms do not contribute to the score.
- [x] Variant carrier IDs are deduplicated before taking the mean.
- [x] A partial variant mean is not returned when any carrier score is missing.
- [x] Negative residual scores are retained and can produce a negative variant mean.
- [x] Gene burden uses carrier presence, not genotype dosage; `0/1` and `1/1` each contribute once.
- [x] Multiple distinct carried variants are summed and duplicate sample-variant rows are deduplicated.
- [x] Gene burden X is built directly from existing `gene-samples` BioIndex rows; `alt_dosage` and `weighted_score` are ignored.
- [x] Pathogenic Score priority is `LoFTEE HC -> AlphaMissense -> REVEL -> No_score`; defined numeric zero remains scored.
- [x] The Huber RLM implementation matches one fixed `MASS::rlm`/`summary.rlm` reference example for Beta, standard error, and P-value.
- [x] Constant, singular, under-supported, invalid-SE, and non-converged fits return an explicit status rather than silently switching models.
- [x] BH adjustment matches a fixed known example and preserves input order.
- [x] Synthetic benchmarks are below one second on the development machine.

## Required decisions before production approval

### 1. P-value method — statistical blocker

- [ ] Choose and document one method:
  - current Python code: `MASS::summary.rlm`-style standard error plus two-sided normal approximation;
  - proposed analysis preference: Huber RLM with an HC3 robust/sandwich standard error.
- [ ] If HC3 is selected, define the exact estimator for an RLM fit and provide the authoritative R implementation to reproduce.
- [ ] Confirm whether the reference distribution is normal or t and how degrees of freedom are handled.
- [ ] Do not label the current result as HC3; it is not HC3.

### 2. Covariates and analysis population — statistical blocker

- [ ] Approve portal model v0 (`Y ~ X`, no covariates) or specify `C`.
- [ ] If used, define encoding and reference levels for age band and sex and confirm PC1–PC10 availability.
- [ ] Decide whether related samples, ancestry outliers, sex-chromosome analyses, and samples with missing covariates are excluded.
- [ ] Return the exact model formula, covariates, sample count, and model version with every result.

### 3. Construction of gene burden X — data/method blocker

- [ ] Confirm that the variant set is every variant returned by the complete current gene search, including continuation pages.
- [ ] Confirm that the private CEP152/DMD nonsynonymous validation subset does not redefine the production BioIndex variant universe.
- [ ] Confirm the production BioIndex client follows every `/api/bio/cont` token before calculating X.
- [x] Portal v1 uses binary carrier presence; genotype dosage and zygosity do not change the weight.
- [ ] Confirm carrier classification for haploid/hemizygous, multi-allelic, no-call, and low-quality genotype records at the upstream carrier API boundary.
- [x] Use Pathogenic Score version `loftee_hc_alphamissense_revel_v1`; LoFTEE HC is 1 and AlphaMissense/REVEL are finite values in `[0,1]`.
- [x] Exclude `No_score` variants from X and report the number unscored; do not treat them as biological score zero.
- [ ] Confirm that production `gene-samples` rows were generated with this exact score version.
- [ ] Verify on individual samples that `X_i = sum(I(carrier_iv) * Pathogenic Score_v)` without duplicated sample-variant contributions.

### 4. Minimum carrier rule — product/statistical blocker

- [ ] Confirm the default threshold of 5.
- [ ] Confirm that the burden threshold means `number of samples with X > 0`.
- [ ] Decide whether the same threshold also suppresses a variant-level Match Score. Current code applies it only to the gene burden test.
- [ ] Confirm whether this is only a stability rule or also a CRDC privacy/disclosure rule.
- [ ] Return both the applied threshold and observed carrier count.

### 5. FDR family — interpretation blocker

- [ ] Define the multiple-testing family: genes in one request, phenotypes in one PheWAS request, or another explicit scope.
- [ ] Never combine tests from different users, HPO contexts, or requests.
- [ ] Return `fdr_method`, `multiple_testing_scope`, and `n_tests`.
- [ ] Confirm that a single-gene request has `n_tests = 1`, making BH-FDR equal to its P-value.
- [ ] Connect `benjamini_hochberg()` to the assembled API response; it is currently a standalone helper.

## Required parity and data checks

### rPheRS / residual score

- [ ] Run R and Python on the same frozen sample-by-HPO matrix and the same HPO queries.
- [ ] Compare `Wp`, raw score, residual score, and rank for every sample within a documented numerical tolerance.
- [ ] Include queries with one term, many terms, duplicates, unknown terms, and no matched terms.
- [ ] Include samples with zero HPO terms and matrices containing missing or non-binary source values.
- [ ] Confirm whether HPO ancestor expansion occurs before this function and use the same HPO ontology/data version in both implementations.
- [ ] Confirm that `N` is the intended full CRDC cohort denominator, including or excluding HPO-empty samples as explicitly decided.

### Variant Match Score

- [ ] Trace at least three real variants from carrier API rows to the final unique carrier list.
- [ ] Compare the Python mean against a manual mean of `phenotype_match_score_resid` for those carriers.
- [ ] Confirm that all carriers are used, not only the 30 displayed phenotype results or five displayed carrier rows.
- [ ] Confirm canonical variant ID normalization across carrier, annotation, and score inputs.
- [ ] Define behavior for no carriers, missing sample scores, duplicate carrier rows, and non-finite scores.

### Gene burden test

- [ ] Compare Python and the approved R model over a frozen suite containing ordinary data, strong outliers, skewed X, covariates, and near-singular designs.
- [ ] Compare coefficients, standard errors, P-values, convergence status, and iteration counts.
- [ ] Test exactly 4, 5, and 6 positive-burden samples around the default threshold.
- [ ] Test constant X, constant Y, all-zero X, missing values, and non-convergence.
- [ ] Confirm that zero-burden samples remain in the fit unless the approved method says otherwise.

## API and performance checks

- [ ] Validate HPO ID format and reject an empty query at the request boundary.
- [ ] Calculate the full sample vector `Y` once per request and reuse it for variant means and the burden test.
- [ ] Do not send patient-level `Y` values to the browser.
- [ ] Preload or cache the immutable HPO matrix and prevalence data; the current benchmark excludes database and file-loading time.
- [ ] Benchmark end-to-end latency with realistic carrier counts, full gene continuation pages, concurrent requests, and a cold process.
- [ ] Return structured statuses for invalid input, insufficient carriers, unavailable data, singular fit, and non-convergence.
- [ ] Log model/data versions and timings without logging patient-level phenotype or genotype data.

## Acceptance criteria

- [ ] Phenotype-method owner signs off on R/Python parity.
- [ ] Statistical reviewer signs off on the P-value/SE method, covariates, threshold, and FDR family.
- [ ] CRDC data owner signs off on carrier deduplication, binary carrier classification, variant set, and Pathogenic Score provenance.
- [ ] Privacy owner confirms the small-cell rule.
- [ ] Backend owner demonstrates one end-to-end request whose sample counts and selected variant/gene results can be independently reproduced.
