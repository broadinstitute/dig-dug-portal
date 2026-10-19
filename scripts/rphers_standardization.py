"""Display units for existing residual PheRS; never fit or change a model."""

import hashlib
import json

import numpy as np
from scipy import sparse


VERSION = "rphers_scoring_cohort_sample_sd_v1"


def scoring_identity(matrix, columns, sample_ids):
    """Content identifiers, without exposing reference-cohort sample IDs."""
    cohort = hashlib.sha256(json.dumps(list(map(str, sample_ids)), separators=(",", ":")).encode()).hexdigest()
    content = hashlib.sha256(json.dumps(list(columns), separators=(",", ":")).encode())
    values = sparse.csr_matrix(matrix, dtype=np.float64, copy=True)
    values.sort_indices()
    for array, dtype in ((values.shape, "<i8"), (values.indptr, "<i8"),
                         (values.indices, "<i8"), (values.data, "<f8")):
        content.update(np.asarray(array, dtype=dtype).tobytes())
    return "sha256:" + content.hexdigest(), "sha256:" + cohort


def unavailable_reference(query_hpo=()):
    return {"version": VERSION, "status": "missing_reference", "reference_mean": None,
            "reference_sd": None, "reference_n": 0, "ddof": 1,
            "query_hpo": sorted(set(query_hpo)), "reference_id": None,
            "scope": "full_existing_scoring_cohort"}


def standardize_scores(residuals, query_hpo, data_release_id, scoring_cohort_id):
    """Use all finite scores before any roster, carrier, or display filtering."""
    raw = np.asarray(residuals, dtype=np.float64)
    valid = np.isfinite(raw)
    observed = raw[valid]
    reference = unavailable_reference(query_hpo)
    reference.update(data_release_id=data_release_id, scoring_cohort_id=scoring_cohort_id,
                     scoring_cohort_n=int(raw.size), reference_n=int(observed.size))
    reference["reference_id"] = hashlib.sha256(json.dumps(
        [VERSION, data_release_id, scoring_cohort_id, reference["query_hpo"]],
        separators=(",", ":"),
    ).encode()).hexdigest()
    z = np.full(raw.shape, np.nan, dtype=np.float64)
    if observed.size:
        reference["reference_mean"] = float(np.mean(observed))
    if observed.size < 2:
        reference["status"] = "insufficient_reference"
        return z, reference
    sd = float(np.std(observed, ddof=1))
    reference["reference_sd"] = sd
    # Exact constant outcomes can leave tiny round-off residuals after lstsq.
    if not np.isfinite(sd) or sd <= 1e-12:
        reference["status"] = "zero_or_invalid_sd"
        return z, reference
    reference["status"] = "ok"
    z[valid] = (observed - reference["reference_mean"]) / sd
    return z, reference


def standardized_value(value, reference, *, center=False, step=1.0):
    if not reference or reference.get("version") != VERSION or reference.get("status") != "ok":
        return None
    if value is None:
        return None
    try:
        raw = float(value)
        sd = float(reference["reference_sd"])
        mean = float(reference["reference_mean"]) if center else 0.0
    except (TypeError, ValueError, KeyError):
        return None
    if not np.isfinite(raw) or not np.isfinite(sd) or sd <= 0 or not np.isfinite(mean):
        return None
    return float(step * (raw - mean) / sd)


def association_with_sd(association, reference, *, gene=False):
    """Derive only from raw named fields; cached raw dictionaries stay intact."""
    row = dict(association)
    available = row.get("status") == "ok"
    row.update(
        beta_sd=standardized_value(row.get("beta"), reference) if available else None,
        standard_error_sd=standardized_value(row.get("standard_error"), reference) if available else None,
        predictor="gene_grs" if gene else "variant_carrier_0_1",
        display_predictor_step=0.1 if gene else 1.0,
        standardization_reference_id=reference.get("reference_id"),
        standardization_status=reference.get("status") if available else "analysis_unavailable",
    )
    if gene:
        row["beta_sd_per_0_1_grs"] = standardized_value(row.get("beta"), reference, step=0.1) if available else None
        row["standard_error_sd_per_0_1_grs"] = standardized_value(row.get("standard_error"), reference, step=0.1) if available else None
    return row


def mean_with_sd(score, reference):
    row = dict(score)
    complete = (row.get("status") == "ok" and row.get("carrier_count", 0) > 0
                and row.get("scored_carrier_count") == row.get("carrier_count"))
    row["mean_rphers_z"] = standardized_value(row.get("match_score"), reference, center=True) if complete else None
    row["standardization_reference_id"] = reference.get("reference_id")
    row["standardization_status"] = reference.get("status") if complete else "incomplete_coverage"
    return row
