# pb_Gene Context API Calculation Guide

This document defines the calculation contract behind the HPO Context panel.
Use the running mockup at
<http://127.0.0.1:8095/pb_Gene.html?query=DMD> to verify how aggregate results
and per-variant Match Scores appear in the page.

## Request and Response

```http
POST /phenotype-analyzer-api/analyze
Content-Type: application/json
```

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

The API returns `variant_match_scores`, `gene_burden`, and
`analysis_sample_count`. It must not return sample IDs, patient HPO terms,
genotypes, patient-level residuals, or covariate rows.

## Shared Outcome Vector

For the fixed analysis roster, calculate the residual PheRS once per HPO
request and reuse it for the variant and gene calculations:

```text
Y_i = phenotype_match_score_resid_i
```

The reference implementation is `scripts/rphers_fast.py`. Production must
validate it against the approved R implementation on the same frozen HPO
matrix, ontology/ancestor-expansion version, and sample roster.

## Variant Match Score

```text
MatchScore_v = mean(Y_i for every unique carrier i of variant v)
```

- Deduplicate carrier IDs.
- Use all carriers, not only displayed rows.
- Preserve negative values.
- Do not return a partial mean if any carrier lacks a residual score.
- The gene-burden minimum of 10 currently applies to the RLM, not to the
  variant mean. If 10 is later adopted as a disclosure rule, suppress variant
  means below 10 in the backend as a separately versioned policy.

## Per-Sample Gene Burden

The score contracts must remain separate:

| Score | Priority |
|---|---|
| Extended Pathogenic Score | LoFTEE HC, AlphaMissense, REVEL |
| Burden Pathogenic Score | LoFTEE HC, AlphaMissense; REVEL excluded |

```text
X_i = sum(I(sample i carries distinct variant v) * BurdenScore_v)
```

- Follow all `gene-samples` continuation pages.
- Count a sample/variant pair once, regardless of duplicate rows or dosage.
- A sample carrying several distinct scored variants receives their sum.
- Keep zero-burden samples in the model.
- Exclude REVEL-only and unscored variants from X, but report their counts.

## Covariate Contract

```text
Y ~ X + age + age_missing + sex_male + sex_unknown + PC1 + ... + PC10
```

### Age

Age comes from approved metadata.

- Valid: finite numeric age from 0 through 99.
- Unknown: missing, non-numeric, negative, or greater than 99.
- Unknown values are replaced by the median of valid ages in the fixed roster.
- `age_missing=1` means age was Unknown before imputation.
- Do not exclude a sample solely because age is Unknown.

### Sex

Sex also comes from approved metadata.

- Female and Male are retained case-insensitively (`F`/`M` are accepted).
- Every other value is encoded as Unknown.
- Female is the reference category.
- Model columns are `sex_male` and `sex_unknown`.
- Do not exclude a sample solely because sex is Unknown.

### PC1-PC10

PCA is an offline cohort operation, not a per-request calculation. The
handoff should provide the versioned PCA algorithm/script and its parameters;
the production service still needs the resulting PC1-PC10 values aligned by
`sample_id`.

Reuse the team's approved cohort PCA workflow. At minimum, its record must
identify:

1. genotype dataset/build and fixed analysis roster;
2. sample and variant QC rules;
3. autosomal biallelic SNP selection and LD-pruning parameters;
4. allele-frequency standardization;
5. PCA software, version, command, random seed if applicable, and output hash;
6. one-to-one sample-ID mapping for the final PC1-PC10 table.

Do not invent new pruning/MAF/HWE thresholds in the portal. Missing or
non-finite PCs are an input error because the current decision is not to drop
analysis samples.

## Huber RLM and Standard Error

Portal v1 uses Huber M-estimation with `k=1.345`, at most 100 iterations, and
convergence tolerance `1e-4`. The minimum is 10 samples with `X > 0`.

Recommended v1 inference:

```text
SE: MASS summary.rlm(method="XtX")-style
P-value: two-sided normal approximation for beta / SE
```

Why retain this for v1:

- it matches the existing `rlm` analysis pattern and the checked Python/R
  reference example;
- the implementation and failure states already have regression tests;
- HC3 is standard for OLS-style estimating equations but is not a drop-in,
  uniquely defined replacement for an `rlm` M-estimator;
- changing to HC3 without an authoritative R formula would create an
  unvalidated hybrid estimator.

This does not make the P-value exact. Return the method name and approximation
in every response. If the statistical owner later requires sandwich inference,
first specify the exact M-estimator sandwich bread, score contributions,
leverage correction, reference distribution, and an authoritative R parity
suite; then version it as a new model.

## Required Result Metadata

Return at least:

- `beta`, `standard_error`, `p_value`, and structured `status`;
- `n_samples`, `n_positive_burden`, and `min_carriers`;
- the exact formula and covariate names;
- RLM and score-version identifiers;
- numbers of total, scored, unscored, and REVEL-only variants;
- request timing without patient-level log data.

Do not fall back silently to OLS for insufficient carriers, constant inputs,
singular design, invalid SE, or non-convergence.
