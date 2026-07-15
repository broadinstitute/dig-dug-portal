"""Fast backend calculations for the CRDC Gene Page context APIs.

This module intentionally contains only the two portal calculations:
variant-level mean residual scores and a provisional Huber RLM gene burden test.
"""

from time import perf_counter

import numpy as np
from scipy.stats import norm


MODEL_VERSION = "portal_huber_rlm_v1"
PATHOGENICITY_SCORE_VERSION = "loftee_hc_alphamissense_revel_v1"


def benjamini_hochberg(p_values):
    """Return BH-adjusted P-values while preserving input order and missing values."""
    p_values = np.asarray(p_values, dtype=float)
    adjusted = np.full(p_values.shape, np.nan, dtype=float)
    valid = np.isfinite(p_values) & (p_values >= 0) & (p_values <= 1)
    observed = p_values[valid]
    if observed.size == 0:
        return adjusted

    order = np.argsort(observed)
    ranked = observed[order]
    ranked_adjusted = ranked * observed.size / np.arange(1, observed.size + 1)
    ranked_adjusted = np.minimum.accumulate(ranked_adjusted[::-1])[::-1]
    ranked_adjusted = np.clip(ranked_adjusted, 0, 1)
    restored = np.empty_like(ranked_adjusted)
    restored[order] = ranked_adjusted
    adjusted[valid] = restored
    return adjusted


def variant_match_scores(sample_ids, phenotype_match_score_resid, carriers_by_variant):
    """Return the mean residual score across every unique carrier per variant."""
    sample_ids = [str(sample_id) for sample_id in sample_ids]
    scores = np.asarray(phenotype_match_score_resid, dtype=float)
    if len(sample_ids) != scores.size:
        raise ValueError("sample_ids and phenotype_match_score_resid must have equal length")
    if len(set(sample_ids)) != len(sample_ids):
        raise ValueError("sample_ids must be unique")

    score_by_sample = {
        sample_id: float(score)
        for sample_id, score in zip(sample_ids, scores)
        if np.isfinite(score)
    }
    output = {}
    for variant_id, raw_carriers in carriers_by_variant.items():
        carriers = list(dict.fromkeys(str(sample_id) for sample_id in raw_carriers))
        scored = [score_by_sample[sample_id] for sample_id in carriers if sample_id in score_by_sample]
        complete = bool(carriers) and len(scored) == len(carriers)
        output[str(variant_id)] = {
            "match_score": float(np.mean(scored)) if complete else None,
            "carrier_count": len(carriers),
            "scored_carrier_count": len(scored),
            "status": "ok" if complete else "no_carriers" if not carriers else "incomplete_scores",
        }
    return output


def gene_burden_scores(sample_ids, gene_sample_rows):
    """Build X directly from complete BioIndex gene-samples carrier rows."""
    sample_ids = [str(sample_id) for sample_id in sample_ids]
    if len(set(sample_ids)) != len(sample_ids):
        raise ValueError("sample_ids must be unique")

    sample_index = {sample_id: index for index, sample_id in enumerate(sample_ids)}
    values = np.zeros(len(sample_ids), dtype=float)
    carriers_by_variant = {}
    score_by_variant = {}

    for row in gene_sample_rows:
        sample_id = str(row.get("sample_id") or "").strip()
        variant_id = str(row.get("variant_id") or "").strip()
        if not sample_id or not variant_id:
            raise ValueError("every gene-samples row requires sample_id and variant_id")
        if sample_id not in sample_index:
            raise ValueError(f"carrier sample is not in sample_ids: {sample_id}")
        carriers_by_variant.setdefault(variant_id, set()).add(sample_id)

        if str(row.get("score_source") or "").strip().lower() == "no_score":
            continue
        try:
            score = float(row["pathogenicity_score"])
        except (KeyError, TypeError, ValueError):
            continue
        if not np.isfinite(score):
            continue
        if variant_id in score_by_variant and not np.isclose(score_by_variant[variant_id], score):
            raise ValueError(f"conflicting pathogenicity_score for variant: {variant_id}")
        score_by_variant[variant_id] = score

    for variant_id, carriers in carriers_by_variant.items():
        if variant_id not in score_by_variant:
            continue
        score = score_by_variant[variant_id]
        for sample_id in carriers:
            values[sample_index[sample_id]] += score

    return {
        "values": values,
        "n_variants_scored": len(score_by_variant),
        "n_variants_unscored": len(carriers_by_variant) - len(score_by_variant),
    }


def gene_burden_test(
    y,
    x,
    covariates=None,
    covariate_names=None,
    min_positive=5,
    huber_k=1.345,
    max_iter=100,
    tolerance=1e-4,
):
    """Fit the provisional portal model Y ~ X + C with MASS-style Huber RLM."""
    y = np.asarray(y, dtype=float).reshape(-1)
    x = np.asarray(x, dtype=float).reshape(-1)
    if y.size != x.size:
        raise ValueError("y and x must have equal length")
    if covariates is None:
        covariates = np.empty((y.size, 0), dtype=float)
    else:
        covariates = np.asarray(covariates, dtype=float)
        if covariates.ndim == 1:
            covariates = covariates.reshape(-1, 1)
        if covariates.ndim != 2 or covariates.shape[0] != y.size:
            raise ValueError("covariates must have one row per sample")

    if covariate_names is None:
        covariate_names = [f"C{index + 1}" for index in range(covariates.shape[1])]
    else:
        covariate_names = list(covariate_names)
        if len(covariate_names) != covariates.shape[1]:
            raise ValueError("covariate_names must match covariate columns")

    result = {
        "beta": None,
        "standard_error": None,
        "p_value": None,
        "n_samples": 0,
        "n_positive_burden": 0,
        "min_carriers": int(min_positive),
        "iterations": 0,
        "status": "invalid_data",
        "model_version": MODEL_VERSION,
        "pathogenicity_score_version": PATHOGENICITY_SCORE_VERSION,
        "model": "Huber RLM",
        "formula": "Y ~ X" + (" + " + " + ".join(covariate_names) if covariate_names else ""),
        "covariates": covariate_names,
        "huber_k": float(huber_k),
        "p_value_method": "summary.rlm SE with two-sided normal approximation",
    }

    complete = np.isfinite(y) & np.isfinite(x)
    if covariates.shape[1]:
        complete &= np.all(np.isfinite(covariates), axis=1)
    y = y[complete]
    x = x[complete]
    covariates = covariates[complete]
    result["n_samples"] = int(y.size)
    result["n_positive_burden"] = int(np.sum(x > 0))

    if result["n_positive_burden"] < int(min_positive):
        result["status"] = "insufficient_carriers"
        return result
    if y.size == 0 or np.var(x) == 0 or np.var(y) == 0:
        result["status"] = "constant_input"
        return result

    design = np.column_stack((np.ones(y.size), x, covariates))
    n_samples, n_parameters = design.shape
    if n_samples <= n_parameters or np.linalg.matrix_rank(design) < n_parameters:
        result["status"] = "singular_design"
        return result

    coefficients = np.linalg.lstsq(design, y, rcond=None)[0]
    residuals = y - design @ coefficients
    converged = False
    scale = np.nan

    for iteration in range(1, int(max_iter) + 1):
        previous = residuals
        scale = np.median(np.abs(previous)) / 0.6745
        if not np.isfinite(scale) or scale <= np.finfo(float).eps:
            result["status"] = "zero_residual_scale"
            return result
        weights = _huber_weights(previous / scale, huber_k)
        root_weights = np.sqrt(weights)
        coefficients = np.linalg.lstsq(design * root_weights[:, None], y * root_weights, rcond=None)[0]
        residuals = y - design @ coefficients
        delta = np.sqrt(
            np.sum((previous - residuals) ** 2)
            / max(1e-20, np.sum(previous ** 2))
        )
        result["iterations"] = iteration
        if delta <= tolerance:
            converged = True
            break

    if not converged:
        result["status"] = "non_converged"
        return result

    standard_errors = _summary_rlm_standard_errors(design, residuals, scale, huber_k)
    beta = float(coefficients[1])
    standard_error = float(standard_errors[1])
    if not np.isfinite(standard_error) or standard_error <= 0:
        result["status"] = "invalid_standard_error"
        return result

    result.update({
        "beta": beta,
        "standard_error": standard_error,
        "p_value": float(2 * norm.sf(abs(beta / standard_error))),
        "status": "ok",
    })
    return result


def _huber_weights(scaled_residuals, huber_k):
    absolute = np.abs(scaled_residuals)
    return np.where(absolute <= huber_k, 1.0, huber_k / np.maximum(absolute, np.finfo(float).tiny))


def _summary_rlm_standard_errors(design, residuals, scale, huber_k):
    """Reproduce MASS summary.rlm(method='XtX') standard errors."""
    n_samples, n_parameters = design.shape
    degrees_of_freedom = n_samples - n_parameters
    scaled = residuals / scale
    weights = _huber_weights(scaled, huber_k)
    score_residuals = residuals * weights
    score_derivative = (np.abs(scaled) <= huber_k).astype(float)
    mean_derivative = np.mean(score_derivative)
    if degrees_of_freedom <= 0 or mean_derivative <= 0:
        return np.full(n_parameters, np.nan)

    score_variance = np.sum(score_residuals ** 2) / degrees_of_freedom
    derivative_variance = np.var(score_derivative, ddof=1) if n_samples > 1 else 0.0
    kappa = 1 + n_parameters * derivative_variance / (n_samples * mean_derivative ** 2)
    standard_deviation = np.sqrt(score_variance) * (kappa / mean_derivative)

    _, upper = np.linalg.qr(design, mode="reduced")
    inverse_upper = np.linalg.inv(upper)
    row_length = np.sqrt(np.sum(inverse_upper ** 2, axis=1))
    return row_length * standard_deviation


def benchmark(n_samples=50_000, n_variants=1_000, carriers_per_variant=20):
    rng = np.random.default_rng(2026)
    sample_ids = np.array([f"S{index}" for index in range(n_samples)])
    carriers = {
        f"V{index}": sample_ids[rng.choice(n_samples, size=carriers_per_variant, replace=False)]
        for index in range(n_variants)
    }
    gene_sample_rows = [
        {
            "sample_id": sample_id,
            "variant_id": variant_id,
            "pathogenicity_score": score,
            "score_source": "benchmark",
        }
        for variant_id, variant_carriers in carriers.items()
        for score in [rng.uniform(0.1, 1.0)]
        for sample_id in variant_carriers
    ]

    started = perf_counter()
    x = gene_burden_scores(sample_ids, gene_sample_rows)["values"]
    y = 0.2 * x + rng.normal(size=n_samples)
    matches = variant_match_scores(sample_ids, y, carriers)
    burden = gene_burden_test(y, x)
    elapsed = perf_counter() - started
    return elapsed, matches, burden


if __name__ == "__main__":
    seconds, _, burden_result = benchmark()
    print(f"50,000 samples + 1,000 variants: {seconds:.3f} seconds ({burden_result['status']})")
