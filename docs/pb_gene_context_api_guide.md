# CRDC Gene Page Context API Calculation Guide

This guide defines the HPO-context residual PheRS input and variant-level Match Score used by the Gene Page. The single-gene burden test is a separate analysis performed outside the browser; the page displays its returned result.

Start with `docs/pb_gene_live_handoff.md` for the BioIndex-to-frontend mapping.
Use `docs/pb_gene_context_api_review_checklist.md` for production approval gaps.

Reference Python implementation: `scripts/context_api_fast.py`

## Shared input: phenotype context vector Y

For every CRDC sample, calculate:

```text
Y = phenotype_match_score_resid
```

The shared scoring engine is `scripts/rphers_fast.py`:

1. Calculate Wp from full-CRDC HPO prevalence.
2. Set Fi=1 for every valid user-entered HPO term.
3. Calculate the raw sample phenotype score.
4. Residualize the raw score against total sample HPO count.

The API calculations below must use the full Y vector. The top 30 displayed phenotype matches are not a valid input for either calculation.

## Calculation 1: Variant-level Context-based Match Score

For each variant in the current gene result set:

```text
Match Score_v = mean(Y_i for every unique carrier i of variant v)
```

Rules:

- Deduplicate carriers by sample ID.
- Use every carrier, not only displayed rows or top phenotype matches.
- Do not calculate a partial mean when a carrier score is missing.
- A residual and therefore the mean may be negative; do not clamp it to zero.

Python interface:

```python
variant_match_scores(
    sample_ids,
    phenotype_match_score_resid,
    carriers_by_variant,
)
```

Result example:

```json
{
  "chrX:31121883:CTCTG:C": {
    "match_score": 1.284,
    "carrier_count": 10,
    "scored_carrier_count": 10,
    "status": "ok"
  }
}
```

If one or more carrier scores are missing, return `match_score: null` and `status: "incomplete_scores"`.

## Separate analysis: single-gene burden test [Updated 2026-08-24]

### X: per-sample gene burden

Use every variant returned by the full current gene search API result, including variants not yet visible because of pagination or `Show more`.

The private CEP152/DMD validation used a nonsynonymous evidence subset to test
the calculations and UI. That local validation subset is not the production
variant-universe contract. Production must use the complete approved Gene Page
carrier-variant set returned through BioIndex continuations unless the data
owner explicitly versions and approves a different upstream set.

Use the existing private BioIndex `gene-samples` query as the source. Query by HGNC gene symbol and follow every `/api/bio/cont` continuation. The current rows already contain the fields required for portal v0:

| `gene-samples` field | Use |
|---|---|
| `sample_id` | Align the carrier with the full CRDC sample/Y vector |
| `variant_id` | Deduplicate one contribution per sample and distinct variant |
| `LoF` / `LOFTEE` | LoFTEE HC evidence for the table Pathogenic Score and upper-right Extended score |
| `Alphamissense` / `AlphaMissense` | AlphaMissense evidence for the table Pathogenic Score and upper-right Extended score |
| `REVEL` | REVEL evidence for the upper-right Extended Pathogenic Score only |
| `pathogenicity_score` | Existing Extended display value for validation |
| `score_source` | Existing Extended score provenance |
| `GT`, `alt_dosage`, `weighted_score` | Genotype dosage and burden-input provenance |

`gene-variants2` can continue to supplement the variant display annotations.
The burden test is a separate analysis and is not recalculated by the browser.

```text
X_i = sum(Pathogenic_Score_v * genotype_dosage_iv)
```

Rules:

- Genotype dosage is included in the burden-test input.
- A sample carrying multiple distinct variants receives the sum of each variant's Pathogenic Score multiplied by its genotype dosage.
- Duplicate rows for the same sample and variant contribute only once.
- Samples without a qualifying carrier record receive X=0.
- This dosage-weighted burden construction is separate from the frontend display of Pathogenic Score and Extended Pathogenic Score.
- Do not add a second ClinVar, consequence, or rarity filter in the burden function. The upstream gene-result variant set is the source of truth.
- Variants without the required Pathogenic Score remain unavailable in the burden-analysis input and must be reported by the analysis output.

Python interface:

```python
burden_input = gene_burden_scores(
    sample_ids,
    complete_gene_samples_rows,
)
x = burden_input["values"]
```

### Burden-analysis output details [Updated 2026-08-24]

```text
Y ~ X + age + age_missing + sex_male + sex_unknown + PC1 + ... + PC10
Estimator: Huber robust linear model
Huber tuning constant: 1.345
Maximum iterations: 100
Convergence tolerance: 1e-4
Age: retain only finite values from 0 through 99; median-impute every other value
Age missingness: 1 when age was Unknown before imputation, otherwise 0
Sex: retain Female/Male; encode every other value as Unknown; Female reference
PCs: finite PC1-PC10 values aligned one-to-one by sample_id
```

This reproduces the core paper-analysis pattern:

1. Fit Huber RLM by iteratively reweighted least squares.
2. Calculate the MASS `summary.rlm(method="XtX")` standard error.
3. Calculate a two-sided normal-approximation P-value:

```text
z = Beta / SE
P-value = 2 * NormalSurvival(abs(z))
```

Python interface:

```python
gene_burden_test(
    y,
    burden_input["values"],
    covariates=aligned_covariate_matrix,
    covariate_names=[
        "age", "age_missing", "sex_male", "sex_unknown",
        "PC1", "PC2", "PC3", "PC4", "PC5",
        "PC6", "PC7", "PC8", "PC9", "PC10",
    ],
    min_positive=request.advanced.min_carriers,
)
```

Portal v1 fixes the inference method to the MASS
`summary.rlm(method="XtX")`-style standard error with a two-sided
normal-approximation P-value. HC3 is not used.

Safety rules:

- Require at least `advanced.min_carriers` samples with X>0; the Gene Page default and minimum are 10.
- If the threshold is not met, return null statistics with `status: "insufficient_carriers"`, `n_positive_burden`, and the applied `min_carriers` value.
- Return no Beta/P-value for constant X, constant Y, singular design, invalid SE, or non-convergence.
- Do not silently fall back to OLS or another model.
- Include zero-burden samples in the fit.
- Return the model version and actual covariate list with every result.

Result example:

```json
{
  "beta": 0.184,
  "standard_error": 0.051,
  "p_value": 0.00031,
  "n_samples": 12438,
  "n_positive_burden": 84,
    "min_carriers": 10,
  "iterations": 7,
  "status": "ok",
  "model_version": "portal_huber_rlm_covariate_v2",
  "extended_pathogenic_score_version": "loftee_hc_alphamissense_revel_v1",
  "model": "Huber RLM",
  "formula": "Y ~ X + age + age_missing + sex_male + sex_unknown + PC1 + PC2 + PC3 + PC4 + PC5 + PC6 + PC7 + PC8 + PC9 + PC10",
  "covariates": ["age", "age_missing", "sex_male", "sex_unknown", "PC1", "PC2", "PC3", "PC4", "PC5", "PC6", "PC7", "PC8", "PC9", "PC10"],
  "huber_k": 1.345,
  "p_value_method": "summary.rlm SE with two-sided normal approximation"
}
```

`min_carriers` records the applied threshold, including when the result status is `insufficient_carriers`.

## Recommended HTTP response

The Match Score calculation uses the HPO-context residual PheRS vector. The
single-gene burden result is calculated separately and may be returned or loaded
as an analysis result for display; it is not recalculated in the browser.

```json
{
  "query_hpo": ["HP:0001250", "HP:0000133"],
  "gene": "DMD",
  "variant_match_scores": {},
  "gene_burden": {},
  "analysis_sample_count": 12438
}
```

This avoids recomputing Y and avoids returning patient-level scores to the browser.

## Advanced request options

The Gene Page sends the expert controls with the same `Go` request:

```json
{
  "terms": "HP:0001250,HP:0000133",
  "gene": "DMD",
  "advanced": {
    "significance_metric": "p_value",
    "significance_threshold": 0.05,
    "min_carriers": 10
  }
}
```

Rules:

- `significance_metric` must be `p_value` or `fdr`.
- `significance_threshold` must be greater than 0 and no more than 1.
- `min_carriers` must be an integer of at least 10 and maps directly to `gene_burden_test(..., min_positive=min_carriers)`.
- The threshold controls filtering, not whether the API returns the calculated statistics. Return Beta, P-value, FDR, and status so the UI can explain the result.

The frontend keeps an under-supported result row for auditability and adds a
red Note:

```text
Below the minimum analysis sample count (10 positive-burden carriers).
Do not interpret or rely on this result.
```

### FDR

Use Benjamini-Hochberg adjustment across the explicitly defined family of burden tests returned by the request. The reference implementation is `benjamini_hochberg()` in `scripts/context_api_fast.py`.

Return these fields with each burden result:

```json
{
  "p_value": 0.00031,
  "fdr": 0.00124,
  "fdr_method": "BH",
  "multiple_testing_scope": "genes in requested analysis",
  "n_tests": 4
}
```

For a single-gene Gene Page request, the test family contains one test, so BH-FDR equals the P-value. FDR becomes informative when Advanced analysis expands to a multi-gene or PheWAS family. Never combine tests from unrelated users, contexts, or requests, and always return `multiple_testing_scope` and `n_tests`.

## Method versioning

The separately calculated single-gene burden analysis uses the approved
Pathogenic Score multiplied by genotype dosage and summed per sample. REVEL is
available only in Extended display scoring; the table Pathogenic Score uses
LoFTEE HC and AlphaMissense. The browser consumes the analysis result rather
than recalculating it.

When the method changes:

1. Create a new model version.
2. Return the exact formula and covariate list.
3. Validate the new version on a fixed benchmark set before deployment.
4. Change the method for all genes/contexts together, not selectively because one result is unexpected.
5. Keep the FDR family definition request-scoped and return its scope and test count with every result.
