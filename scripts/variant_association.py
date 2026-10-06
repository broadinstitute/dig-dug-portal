"""Variant association with the existing residual PheRS and portal covariates.

The caller supplies the *same ordered analysis roster* used for PheRS and the
age, age_missing, sex_male, sex_unknown, PC1..PC10 matrix from
``pb_gene_context_validation.load_covariates``. This module never reads private
data or returns sample-level results. It does not replace the existing Huber
gene-burden result; ``gene_burden_ols`` is an optional OLS comparator.

For each HPO query, residualize Y against C once. For a binary carrier vector
X, Frisch-Waugh-Lovell gives beta = (X'M_C Y)/(X'M_C X). We compute the two
products from carrier indices, without building an N x variants matrix or
refitting a regression for each variant. P-values are two-sided t tests with
N - rank(C) - 1 degrees of freedom. This assumes independent errors; use an
LMM when a validated GRM analysis shows material relatedness confounding.
An absent carrier row is treated as genotype 0, so the input must represent a
complete, callable genotype roster for every tested variant; missing calls
must be resolved upstream rather than silently classified as noncarriers.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
from typing import Mapping, Sequence

import numpy as np
from numpy.typing import ArrayLike, NDArray
from scipy.stats import chi2, t


MODEL_VERSION = "portal_variant_binary_ols_covariate_v1"


def independent_covariate_design(covariates: NDArray[np.float64], names: Sequence[str]):
    """Keep the intercept and non-aliased covariates in their original order."""
    n = covariates.shape[0]
    columns = [np.ones(n)]
    q = np.ones((n, 1)) / np.sqrt(n)
    dropped = []
    for name, column in zip(names, covariates.T):
        residual = column - q @ (q.T @ column)
        residual -= q @ (q.T @ residual)
        if np.linalg.norm(residual) <= 1e-10 * max(1.0, np.linalg.norm(column)):
            dropped.append(name)
            continue
        columns.append(column)
        q = np.column_stack((q, residual / np.linalg.norm(residual)))
    return np.column_stack(columns), tuple(dropped)


@dataclass(frozen=True)
class AssociationResult:
    beta: float | None
    standard_error: float | None
    p_value: float | None
    n_samples: int
    n_carriers: int | None
    status: str
    low_carrier_count: bool
    model_version: str = MODEL_VERSION


class OLSContext:
    """Reuse a fixed sample roster and covariate QR factorization across HPOs."""

    def __init__(
        self,
        sample_ids: Sequence[str],
        covariates: ArrayLike,
        covariate_names: Sequence[str],
        *,
        low_carrier_threshold: int = 10,
    ) -> None:
        self.sample_ids = tuple(str(value) for value in sample_ids)
        n = len(self.sample_ids)
        if not n or len(set(self.sample_ids)) != n:
            raise ValueError("sample_ids must be nonempty and unique")
        self.index = {sample_id: i for i, sample_id in enumerate(self.sample_ids)}
        values = np.asarray(covariates, dtype=np.float64)
        if values.ndim != 2 or values.shape[0] != n or not np.all(np.isfinite(values)):
            raise ValueError("covariates must be a finite N x K matrix in sample order")
        self.covariate_names = tuple(covariate_names)
        if len(self.covariate_names) != values.shape[1]:
            raise ValueError("covariate_names must match the covariate columns")
        if low_carrier_threshold < 1:
            raise ValueError("low_carrier_threshold must be positive")
        self.low_carrier_threshold = low_carrier_threshold
        design, self.dropped_covariates = independent_covariate_design(values, self.covariate_names)
        if n <= design.shape[1] + 1:
            raise ValueError("covariate design has no residual degrees of freedom")
        self.q, _ = np.linalg.qr(design, mode="reduced")
        self.df = n - design.shape[1] - 1

    def outcome(self, residual_phers: ArrayLike) -> "OLSOutcome":
        """Prepare one HPO query's Y; no samples may be silently dropped."""
        y = np.asarray(residual_phers, dtype=np.float64)
        if y.shape != (len(self.sample_ids),) or not np.all(np.isfinite(y)):
            raise ValueError("residual_phers must be a finite vector aligned to sample_ids")
        y_residual = y - self.q @ (self.q.T @ y)
        return OLSOutcome(self, y_residual)


class OLSOutcome:
    def __init__(self, context: OLSContext, y_residual: NDArray[np.float64]) -> None:
        self.context = context
        self.y_residual = y_residual
        self.yy = float(y_residual @ y_residual)

    def _result(self, xx: float, xy: float, n_carriers: int | None) -> AssociationResult:
        context = self.context
        low_count = n_carriers is not None and n_carriers < context.low_carrier_threshold
        common = dict(n_samples=len(context.sample_ids), n_carriers=n_carriers, low_carrier_count=low_count)
        if self.yy <= 1e-12:
            return AssociationResult(None, None, None, status="constant_outcome", **common)
        if xx <= 1e-10:
            return AssociationResult(None, None, None, status="constant_or_collinear_predictor", **common)
        beta = xy / xx
        rss = max(0.0, self.yy - xy * xy / xx)
        if rss <= 1e-12:
            return AssociationResult(beta, None, None, status="zero_residual_variance", **common)
        se = float(np.sqrt(rss / context.df / xx))
        p_value = float(2 * t.sf(abs(beta / se), context.df))
        return AssociationResult(float(beta), se, p_value, status="ok", **common)

    def variant(self, carrier_ids: Sequence[str]) -> AssociationResult:
        """Fit Y ~ carrier(0/1) + C using all samples, including noncarriers."""
        context = self.context
        unique_ids = set(str(value) for value in carrier_ids)
        unknown = unique_ids.difference(context.index)
        if unknown:
            raise ValueError(f"{len(unknown)} carrier IDs are outside the analysis roster")
        indices = np.fromiter((context.index[value] for value in unique_ids), dtype=np.int64)
        count = len(indices)
        if count == 0 or count == len(context.sample_ids):
            return AssociationResult(
                None, None, None, len(context.sample_ids), count,
                "no_carriers" if count == 0 else "all_carriers", count < context.low_carrier_threshold,
            )
        qx = context.q[indices].sum(axis=0)
        xx = float(count - qx @ qx)
        xy = float(self.y_residual[indices].sum())
        return self._result(xx, xy, count)

    def variants(self, carriers_by_variant: Mapping[str, Sequence[str]]) -> dict[str, AssociationResult]:
        return {str(variant_id): self.variant(carriers) for variant_id, carriers in carriers_by_variant.items()}

    def gene_burden_ols(self, burden_score: ArrayLike) -> AssociationResult:
        """Optional OLS comparator for the existing continuous burden X.

        This is a distinct model from the current Huber RLM gene burden test.
        """
        x = np.asarray(burden_score, dtype=np.float64)
        if x.shape != (len(self.context.sample_ids),) or not np.all(np.isfinite(x)):
            raise ValueError("burden_score must be a finite vector aligned to sample_ids")
        x_residual = x - self.context.q @ (self.context.q.T @ x)
        return self._result(float(x_residual @ x_residual), float(x_residual @ self.y_residual), None)


def lambda_quantiles(p_values: ArrayLike, *, null_mask: ArrayLike | None = None) -> dict[str, float | int | None]:
    """Descriptive chi-square lambda at 50th/90th/95th percentiles.

    Supply a prespecified null/control set through ``null_mask`` for calibration.
    Unselected/all tested variants mix true signals, LD and carrier-count effects;
    these diagnostics alone cannot justify changing or filtering a P-value.
    """
    p = np.asarray(p_values, dtype=np.float64)
    if p.ndim != 1:
        raise ValueError("p_values must be one-dimensional")
    if null_mask is not None:
        mask = np.asarray(null_mask, dtype=bool)
        if mask.shape != p.shape:
            raise ValueError("null_mask must match p_values")
        p = p[mask]
    p = p[np.isfinite(p) & (p >= 0) & (p <= 1)]
    result: dict[str, float | int | None] = {"n_valid": int(p.size)}
    if not p.size:
        return {**result, "lambda_50": None, "lambda_90": None, "lambda_95": None}
    statistic = chi2.isf(np.maximum(p, np.finfo(float).tiny), 1)
    for percentile in (50, 90, 95):
        q = percentile / 100
        result[f"lambda_{percentile}"] = float(np.quantile(statistic, q) / chi2.ppf(q, 1))
    return result


def calibration_gate(
    p_values: ArrayLike,
    null_mask: ArrayLike,
    *,
    max_lambda_90: float,
    max_lambda_95: float,
    min_null_tests: int = 100,
) -> dict:
    """Hold an HPO scan's P-values if prespecified null controls fail QC.

    The caller must choose independent null/control variants and validated
    thresholds before examining the scan. This gate never labels an extremely
    small individual P-value or a large beta as an artifact on its own.
    """
    if min_null_tests < 1 or not all(np.isfinite(value) and value > 0 for value in (max_lambda_90, max_lambda_95)):
        raise ValueError("calibration thresholds and min_null_tests must be positive")
    summary = lambda_quantiles(p_values, null_mask=null_mask)
    if summary["n_valid"] < min_null_tests:
        status = "insufficient_null_tests"
    elif summary["lambda_90"] > max_lambda_90 or summary["lambda_95"] > max_lambda_95:
        status = "tail_inflation"
    else:
        status = "ok"
    return {**summary, "status": status, "release_p_values": status == "ok"}


def analyze_gene_variants(
    engine,
    gene: str,
    query_hpo: Sequence[str],
    *,
    variant_ids: Sequence[str] | None = None,
    include_gene_ols: bool = False,
    affected_only: bool = False,
) -> dict:
    """Use the existing cached PheRS/roster/evidence loader; return aggregates only.

    ``engine`` is ``pb_gene_context_validation.ContextAnalysisEngine``.
    Existing Match Score and Huber RLM endpoints are intentionally untouched.
    """
    if engine.covariates is None:
        raise ValueError("the existing age/sex/PC1-PC10 covariate file is required")
    gene = str(gene or "").strip().upper()
    terms = tuple(sorted(set(str(term).strip().upper() for term in query_hpo if str(term).strip())))
    if not gene or not terms:
        raise ValueError("gene and at least one HPO term are required")
    y, checksum = engine._phenotype(terms)
    gene_data = engine._gene_data(gene)
    if affected_only:
        mask = engine.covariates.get("affected_mask")
        if mask is None:
            raise ValueError("affected status is not available in the covariate source")
        sample_ids = [sample_id for sample_id, selected in zip(engine.analysis_sample_ids, mask) if selected]
        selected_ids = set(sample_ids)
        covariates = engine.covariates["values"][mask]
        y = y[mask]
        checksum = hashlib.sha256(y.astype("<f8", copy=False).tobytes()).hexdigest()
    else:
        sample_ids = engine.analysis_sample_ids
        selected_ids = set(sample_ids)
        covariates = engine.covariates["values"]
    context = OLSContext(sample_ids, covariates, engine.covariates["names"])
    outcome = context.outcome(y)
    carriers_by_variant = dict(gene_data["carriers_by_variant"])
    if affected_only:
        carriers_by_variant = {
            variant_id: [sample_id for sample_id in ids if sample_id in selected_ids]
            for variant_id, ids in carriers_by_variant.items()
        }
    if variant_ids is not None:
        for variant_id in variant_ids:
            variant_id = str(variant_id).strip()
            if not variant_id:
                raise ValueError("variant_ids cannot contain empty IDs")
            carriers_by_variant.setdefault(variant_id, [])
    result = {
        "gene": gene,
        "query_hpo": list(terms),
        "analysis_sample_count": len(context.sample_ids),
        "phenotype_vector_sha256": checksum,
        "carrier_rows_outside_analysis": gene_data["outside_rows"],
        "model": "OLS residual PheRS ~ binary variant + age + age_missing + sex (female reference; male/unknown levels) + PC1-PC10",
        "affected_only": affected_only,
        "covariate_design_columns": list(context.covariate_names),
        "genotype_assumption": "Complete callable roster; absent carrier row means genotype 0",
        "dropped_aliased_covariates": list(context.dropped_covariates),
        "variant_associations": {
            variant_id: asdict(association)
            for variant_id, association in outcome.variants(carriers_by_variant).items()
        },
    }
    if include_gene_ols:
        burden_values = gene_data["burden_input"]["values"]
        result["gene_burden_ols_comparator"] = asdict(outcome.gene_burden_ols(burden_values[mask] if affected_only else burden_values))
    return result


def main(argv: Sequence[str] | None = None) -> None:
    """Offline aggregate calculation using the existing Context API input files."""
    import argparse
    import json

    from scripts.pb_gene_context_validation import ContextAnalysisEngine

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--roster", required=True)
    parser.add_argument("--gene-evidence", required=True)
    parser.add_argument("--covariates", required=True)
    parser.add_argument("--gene", required=True)
    parser.add_argument("--terms", required=True, help="Comma-separated HPO IDs")
    parser.add_argument("--include-gene-ols", action="store_true", help="Add an OLS comparator; does not replace Huber RLM")
    args = parser.parse_args(argv)
    engine = ContextAnalysisEngine(args.hpo_matrix, args.roster, args.gene_evidence, args.covariates)
    result = analyze_gene_variants(engine, args.gene, args.terms.split(","), include_gene_ols=args.include_gene_ols)
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
