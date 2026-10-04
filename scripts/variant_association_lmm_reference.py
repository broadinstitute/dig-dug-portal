"""Small-roster Gaussian LMM comparator for variant association timing.

This dense eigendecomposition implementation is a *benchmark reference*, not a
15k-26k sample service. For the full cohort, use a validated scalable LMM
implementation and compare on the identical HPO outcome, roster and GRM.
The continuous residual PheRS calls for an LMM, not a logistic GLMM.
"""

from __future__ import annotations

import argparse
import csv
from dataclasses import asdict
import json
from pathlib import Path
from typing import Sequence

import numpy as np
from numpy.typing import ArrayLike
from scipy.optimize import minimize_scalar
from scipy.stats import t

from scripts.variant_association import AssociationResult, independent_covariate_design


LMM_MODEL_VERSION = "portal_variant_gaussian_lmm_null_reml_gls_reference_v1"


class DenseLMMReference:
    """Fit one null REML variance ratio, then approximate per-variant GLS Wald tests."""

    def __init__(
        self,
        sample_ids: Sequence[str],
        covariates: ArrayLike,
        grm: ArrayLike,
        grm_sample_ids: Sequence[str],
        *,
        max_samples: int = 1500,
    ) -> None:
        self.sample_ids = tuple(map(str, sample_ids))
        n = len(self.sample_ids)
        if not n or len(set(self.sample_ids)) != n:
            raise ValueError("sample IDs must be nonempty and unique")
        if tuple(map(str, grm_sample_ids)) != self.sample_ids:
            raise ValueError("GRM IDs/order must exactly match the analysis roster")
        if n > max_samples:
            raise ValueError(f"dense reference is limited to {max_samples} samples")
        c = np.asarray(covariates, dtype=np.float64)
        k = np.asarray(grm, dtype=np.float64)
        if c.ndim != 2 or c.shape[0] != n or not np.all(np.isfinite(c)):
            raise ValueError("covariates must be a finite N x K matrix")
        if k.shape != (n, n) or not np.all(np.isfinite(k)):
            raise ValueError("GRM must be a finite N x N matrix")
        if not np.allclose(k, k.T, rtol=1e-8, atol=1e-8):
            raise ValueError("GRM must be symmetric")
        self.c, self.dropped_covariates = independent_covariate_design(c, [f"C{i}" for i in range(c.shape[1])])
        if n <= self.c.shape[1] + 1:
            raise ValueError("covariate design has no residual degrees of freedom")
        self.eigenvalues, self.u = np.linalg.eigh((k + k.T) / 2)
        if self.eigenvalues[0] < -1e-6:
            raise ValueError("GRM is not positive semidefinite")
        self.eigenvalues = np.maximum(self.eigenvalues, 0.0)
        self.uc = self.u.T @ self.c
        self.index = {sample_id: i for i, sample_id in enumerate(self.sample_ids)}
        self.df = n - self.c.shape[1] - 1

    def outcome(self, residual_phers: ArrayLike) -> "DenseLMMOutcome":
        y = np.asarray(residual_phers, dtype=np.float64)
        if y.shape != (len(self.sample_ids),) or not np.all(np.isfinite(y)):
            raise ValueError("residual_phers must be a finite aligned vector")
        uy = self.u.T @ y
        n_minus_p = len(y) - self.c.shape[1]

        def reml(log_delta: float) -> float:
            diagonal = self.eigenvalues + np.exp(log_delta)
            root = np.sqrt(diagonal)
            wc = self.uc / root[:, None]
            wy = uy / root
            q, r = np.linalg.qr(wc, mode="reduced")
            residual = wy - q @ (q.T @ wy)
            sse = float(residual @ residual)
            if sse <= 0:
                return np.inf
            return (
                n_minus_p * np.log(sse / n_minus_p)
                + float(np.log(diagonal).sum())
                + 2 * float(np.log(np.abs(np.diag(r))).sum())
            )

        fit = minimize_scalar(reml, bounds=(-12, 12), method="bounded", options={"xatol": 1e-3})
        if not fit.success:
            raise RuntimeError("null REML optimization failed")
        delta = float(np.exp(fit.x))
        root = np.sqrt(self.eigenvalues + delta)
        wc = self.uc / root[:, None]
        q, _ = np.linalg.qr(wc, mode="reduced")
        wy = uy / root
        yr = wy - q @ (q.T @ wy)
        return DenseLMMOutcome(self, delta, root, q, yr)


class DenseLMMOutcome:
    def __init__(self, engine: DenseLMMReference, delta, root, q, yr) -> None:
        self.engine = engine
        self.delta = delta
        self.root = root
        self.q = q
        self.yr = yr
        self.yy = float(yr @ yr)

    def variant(self, carrier_ids: Sequence[str]) -> AssociationResult:
        unique = set(map(str, carrier_ids))
        unknown = unique.difference(self.engine.index)
        if unknown:
            raise ValueError(f"{len(unknown)} carrier IDs are outside the GRM roster")
        count = len(unique)
        n = len(self.engine.sample_ids)
        if count == 0 or count == n:
            return AssociationResult(None, None, None, n, count, "no_carriers" if count == 0 else "all_carriers", count < 10, LMM_MODEL_VERSION)
        indices = [self.engine.index[value] for value in unique]
        wx = self.engine.u[indices, :].sum(axis=0) / self.root
        xr = wx - self.q @ (self.q.T @ wx)
        xx = float(xr @ xr)
        if xx <= 1e-10 or self.yy <= 1e-12:
            return AssociationResult(None, None, None, n, count, "constant_input", count < 10, LMM_MODEL_VERSION)
        beta = float(xr @ self.yr / xx)
        rss = max(0.0, self.yy - beta * beta * xx)
        if rss <= 1e-12:
            return AssociationResult(beta, None, None, n, count, "zero_residual_variance", count < 10, LMM_MODEL_VERSION)
        se = float(np.sqrt(rss / self.engine.df / xx))
        p = float(2 * t.sf(abs(beta / se), self.engine.df))
        return AssociationResult(beta, se, p, n, count, "ok", count < 10, LMM_MODEL_VERSION)


def read_grm_subset(prefix: str, wanted: Sequence[str]) -> np.ndarray:
    """Read only the requested GCTA GRM rows in the supplied sample order."""
    with open(prefix + ".grm.id") as handle:
        grm_ids = [line.split()[1] for line in handle]
    index = {sample_id: i for i, sample_id in enumerate(grm_ids)}
    if len(index) != len(grm_ids) or any(sample_id not in index for sample_id in wanted):
        raise ValueError("GRM IDs are duplicate or a requested sample is absent")
    positions = np.asarray([index[sample_id] for sample_id in wanted], dtype=int)
    matrix = np.zeros((len(wanted), len(wanted)), dtype=float)
    with open(prefix + ".grm.bin", "rb") as handle:
        for j in np.argsort(positions):
            i = int(positions[j]) + 1
            handle.seek(i * (i - 1) // 2 * 4)
            values = np.fromfile(handle, dtype="<f4", count=i)
            if len(values) != i:
                raise ValueError("Truncated GRM")
            take = np.flatnonzero(positions < i)
            matrix[j, take] = values[positions[take]]
            matrix[take, j] = values[positions[take]]
    return matrix


def analyze_gene_variants_lmm(engine, gene: str, terms: Sequence[str], grm_prefix: str, covariate_path: str) -> dict:
    """Small-roster GRM comparison using the same HPO/variant inputs as OLS."""
    if engine.covariates is None:
        raise ValueError("LMM requires covariates")
    ids = engine.analysis_sample_ids
    if len(ids) > 1500:
        raise ValueError("dense variant LMM reference supports at most 1500 samples")
    with open(covariate_path, newline="") as handle:
        covariate_rows = {row["sample_id"]: row for row in csv.DictReader(handle, delimiter="\t")}
    grm_ids = [covariate_rows[sample_id]["vcf_sample_id"] for sample_id in ids]
    if not all(grm_ids) or len(set(grm_ids)) != len(grm_ids):
        raise ValueError("vcf_sample_id must be present and unique for the GRM")
    k = read_grm_subset(grm_prefix, grm_ids)
    k += 1e-4 * np.mean(np.diag(k)) * np.eye(len(k))
    context = DenseLMMReference(ids, engine.covariates["values"], k, ids)
    query_hpo = tuple(sorted(set(term.strip().upper() for term in terms if term.strip())))
    y, checksum = engine._phenotype(query_hpo)
    gene_data = engine._gene_data(gene)
    outcome = context.outcome(y)
    design_names = engine.covariates["names"]
    return {
        "gene": gene,
        "query_hpo": list(query_hpo),
        "analysis_sample_count": len(ids),
        "phenotype_vector_sha256": checksum,
        "model": "Gaussian LMM residual PheRS ~ binary variant + age + age_missing + sex (female reference; male/unknown levels) + PC1-PC10 + GRM",
        "grm_prefix": grm_prefix,
        "grm_ridge": "1e-4 * mean(diagonal)",
        "covariate_design_columns": design_names,
        "dropped_aliased_covariates": [design_names[int(name[1:])] for name in context.dropped_covariates],
        "variant_associations": {
            variant_id: asdict(outcome.variant(carriers))
            for variant_id, carriers in gene_data["carriers_by_variant"].items()
        },
    }


def main() -> None:
    from scripts.pb_gene_context_validation import ContextAnalysisEngine

    parser = argparse.ArgumentParser(description="Small-roster Gaussian variant LMM reference")
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--roster", required=True)
    parser.add_argument("--gene-evidence", required=True)
    parser.add_argument("--covariates", required=True)
    parser.add_argument("--grm-prefix", required=True)
    parser.add_argument("--gene", required=True)
    parser.add_argument("--terms", required=True, help="Comma-separated HPO IDs")
    args = parser.parse_args()
    engine = ContextAnalysisEngine(args.hpo_matrix, args.roster, args.gene_evidence, args.covariates)
    result = analyze_gene_variants_lmm(engine, args.gene.upper(), args.terms.split(","), args.grm_prefix, args.covariates)
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
