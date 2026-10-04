"""Synthetic OLS/LMM timing only; never use these timings as cohort evidence.

Run with OPENBLAS_NUM_THREADS=1 for reproducible local comparison. Dense LMM
reference is capped at 1,500 samples; full-cohort LMM needs a scalable,
validated GRM implementation and the real aligned cohort inputs.
"""

import argparse
import json
from time import perf_counter

import numpy as np

from scripts.variant_association import OLSContext
from scripts.variant_association_lmm_reference import DenseLMMReference


def fixture(n, n_variants, seed=7, *, include_grm=True):
    rng = np.random.default_rng(seed)
    ids = [f"S{i:06d}" for i in range(n)]
    age = rng.uniform(18, 80, n)
    age_missing = rng.binomial(1, 0.06, n)
    sex = rng.choice(3, n, p=[0.48, 0.47, 0.05])
    pcs = rng.normal(size=(n, 10))
    covariates = np.column_stack((age, age_missing, sex == 1, sex == 2, pcs)).astype(float)
    latent = rng.normal(size=(n, 8))
    grm = latent @ latent.T / latent.shape[1] + 0.2 * np.eye(n) if include_grm else None
    y = 0.03 * age + 0.2 * pcs[:, 0] + 0.35 * latent[:, 0] + rng.normal(size=n)
    carriers = {
        f"v{i}": [ids[j] for j in rng.choice(n, size=min(n - 1, 3 + i % 28), replace=False)]
        for i in range(n_variants)
    }
    return ids, covariates, grm, y, carriers


def benchmark(n, n_variants, *, include_lmm):
    ids, covariates, grm, y, carriers = fixture(n, n_variants)
    names = ["age", "age_missing", "sex_male", "sex_unknown", *[f"PC{i}" for i in range(1, 11)]]
    start = perf_counter()
    ols = OLSContext(ids, covariates, names)
    ols_prepare = perf_counter() - start
    start = perf_counter()
    ols_outcome = ols.outcome(y)
    ols_hpo = perf_counter() - start
    start = perf_counter()
    ols_outcome.variants(carriers)
    ols_variants = perf_counter() - start
    result = {
        "synthetic_samples": n,
        "variants": n_variants,
        "ols_covariate_setup_s": ols_prepare,
        "ols_hpo_setup_s": ols_hpo,
        "ols_all_variants_s": ols_variants,
    }
    if include_lmm:
        start = perf_counter()
        lmm = DenseLMMReference(ids, covariates, grm, ids)
        result["dense_lmm_grm_eigendecomposition_s"] = perf_counter() - start
        start = perf_counter()
        lmm_outcome = lmm.outcome(y)
        result["dense_lmm_hpo_null_reml_s"] = perf_counter() - start
        start = perf_counter()
        for variant_carriers in carriers.values():
            lmm_outcome.variant(variant_carriers)
        result["dense_lmm_all_variants_s"] = perf_counter() - start
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", type=int, default=300)
    parser.add_argument("--variants", type=int, default=200)
    parser.add_argument("--full-size-ols-samples", type=int, default=15000)
    args = parser.parse_args()
    if not 20 <= args.samples <= 1500 or args.variants < 1 or args.full_size_ols_samples < 20:
        parser.error("samples must be 20..1500, variants >= 1, full-size OLS samples >= 20")
    # Avoid allocating a dense full-cohort GRM for the OLS-only run.
    comparison = benchmark(args.samples, args.variants, include_lmm=True)
    if args.full_size_ols_samples != args.samples:
        ids, covariates, _, y, carriers = fixture(args.full_size_ols_samples, args.variants, include_grm=False)
        names = ["age", "age_missing", "sex_male", "sex_unknown", *[f"PC{i}" for i in range(1, 11)]]
        start = perf_counter()
        outcome = OLSContext(ids, covariates, names).outcome(y)
        setup = perf_counter() - start
        start = perf_counter()
        outcome.variants(carriers)
        comparison["full_size_ols"] = {
            "synthetic_samples": args.full_size_ols_samples,
            "setup_s": setup,
            "all_variants_s": perf_counter() - start,
        }
    print(json.dumps(comparison, indent=2))


if __name__ == "__main__":
    main()
