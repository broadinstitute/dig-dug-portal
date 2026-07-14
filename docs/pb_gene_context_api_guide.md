# CRDC Gene Page Context API Calculation Guide

This guide defines the two calculations triggered by the Gene Page HPO context input. The implementation is intentionally small and versioned because the burden-test covariates and final regression method may change after validation.

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

## Calculation 2: Gene-level real-time Burden Test

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
| `pathogenicity_score` | Pathogenic Score added to X |
| `score_source` | Treat `No_score` as unscored and report it diagnostically |
| `GT`, `alt_dosage`, `weighted_score` | Available for provenance/QA, but not used to calculate portal v0 X |

No new burden-specific BioIndex is required while these fields remain available. `gene-variants2` can continue to supplement display annotations, but it is not needed to construct X when `gene-samples.pathogenicity_score` is present.

```text
X_i = sum(I(sample i carries variant v) * Pathogenic_Score_v)
```

Rules:

- Carrier presence is binary: both `0/1` and `1/1` contribute the variant's Pathogenic Score once.
- A sample carrying multiple distinct variants receives the sum of their Pathogenic Scores.
- Duplicate rows for the same sample and variant contribute only once.
- Samples without a qualifying carrier record receive X=0.
- Genotype dosage and zygosity are not weights in portal model v0.
- Do not add a second ClinVar, consequence, or rarity filter in the burden function. The upstream gene-result variant set is the source of truth.
- A missing/non-numeric Pathogenic Score contributes zero and must be counted in a diagnostic field such as `n_variants_unscored`.

Python interface:

```python
burden_input = gene_burden_scores(
    sample_ids,
    complete_gene_samples_rows,
)
x = burden_input["values"]
```

### Portal model v0

```text
Y ~ X
Estimator: Huber robust linear model
Huber tuning constant: 1.345
Maximum iterations: 100
Convergence tolerance: 1e-4
Covariates: none
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
    covariates=None,
    covariate_names=None,
    min_positive=request.advanced.min_carriers,
)
```

Safety rules:

- Require at least `advanced.min_carriers` samples with X>0; the Gene Page default is 5.
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
  "min_carriers": 5,
  "iterations": 7,
  "status": "ok",
  "model_version": "portal_huber_rlm_v0",
  "model": "Huber RLM",
  "formula": "Y ~ X",
  "covariates": [],
  "huber_k": 1.345,
  "p_value_method": "summary.rlm SE with two-sided normal approximation"
}
```

`min_carriers` records the applied threshold, including when the result status is `insufficient_carriers`.

## Recommended HTTP response

The two calculations should share one Y calculation per `Go` request. A single endpoint can return two result blocks:

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
    "min_carriers": 5
  }
}
```

Rules:

- `significance_metric` must be `p_value` or `fdr`.
- `significance_threshold` must be greater than 0 and no more than 1.
- `min_carriers` must be an integer of at least 1 and maps directly to `gene_burden_test(..., min_positive=min_carriers)`.
- The threshold controls filtering, not whether the API returns the calculated statistics. Return Beta, P-value, FDR, and status so the UI can explain the result.

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

## Planned method changes

`portal_huber_rlm_v0` is provisional. Candidate future covariates include age band, sex, and PC1-PC10, but they must not be added silently.

When the method changes:

1. Create a new model version such as `portal_huber_rlm_v1`.
2. Return the exact formula and covariate list.
3. Validate the new version on a fixed benchmark set before deployment.
4. Change the method for all genes/contexts together, not selectively because one result is unexpected.
5. Keep the FDR family definition request-scoped and return its scope and test count with every result.
