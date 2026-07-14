"""Fast NumPy/SciPy translation of rPheRS_for_portal_20250512.R.

The public function keeps the R definitions unchanged:
Wp = log((N + alpha) / (n_p + alpha)), Fi = 1 for entered HPO terms,
raw score = sum(sample_HPO * Wp * Fi), and residual = resid(lm(raw ~ n_terms)).
"""

from time import perf_counter

import numpy as np
from scipy import sparse


def _binary_matrix(matrix):
    if sparse.issparse(matrix):
        out = matrix.tocsr(copy=True).astype(np.float64)
        out.data = np.where(np.isfinite(out.data) & (out.data > 0), 1.0, 0.0)
        out.eliminate_zeros()
        return out
    values = np.asarray(matrix)
    if values.ndim != 2:
        raise ValueError("crdc_bin must be a 2D sample-by-HPO matrix")
    return (np.isfinite(values) & (values > 0)).astype(np.float64, copy=False)


def score_samples(crdc_bin, hpo_columns, query_hpo, sample_ids=None, alpha=1.0):
    """Return the R-equivalent sample scores and ranking as NumPy arrays."""
    matrix = _binary_matrix(crdc_bin)
    hpo_columns = list(hpo_columns)
    if matrix.shape[1] != len(hpo_columns):
        raise ValueError("hpo_columns length must equal the matrix column count")
    if len(set(hpo_columns)) != len(hpo_columns):
        raise ValueError("hpo_columns must be unique")
    if alpha <= 0:
        raise ValueError("alpha must be positive")

    n_samples = matrix.shape[0]
    if sample_ids is None:
        sample_ids = np.arange(n_samples)
    else:
        sample_ids = np.asarray(sample_ids)
        if len(sample_ids) != n_samples:
            raise ValueError("sample_ids length must equal the matrix row count")

    prevalence_count = np.asarray(matrix.sum(axis=0)).ravel()
    weights = np.log((n_samples + alpha) / (prevalence_count + alpha))
    column_index = {term: index for index, term in enumerate(hpo_columns)}
    matched_hpo = list(dict.fromkeys(term for term in query_hpo if term in column_index))
    matched_index = np.array([column_index[term] for term in matched_hpo], dtype=int)

    if matched_index.size:
        matched_matrix = matrix[:, matched_index]
        matched_query_terms = np.asarray(matched_matrix.sum(axis=1)).ravel().astype(int)
        raw_score = np.asarray(matched_matrix @ weights[matched_index]).ravel()
    else:
        matched_query_terms = np.zeros(n_samples, dtype=int)
        raw_score = np.zeros(n_samples, dtype=float)

    total_hpo_terms = np.asarray(matrix.sum(axis=1)).ravel()
    design = np.column_stack((np.ones(n_samples), total_hpo_terms))
    coefficients = np.linalg.lstsq(design, raw_score, rcond=None)[0]
    residual = raw_score - design @ coefficients

    order = np.lexsort((-raw_score, -residual))
    rank = np.empty(n_samples, dtype=int)
    rank[order] = np.arange(1, n_samples + 1)

    return {
        "sample_id": np.asarray(sample_ids),
        "matched_hpo": matched_hpo,
        "Wp": weights,
        "matched_query_terms": matched_query_terms,
        "total_sample_hpo_terms": total_hpo_terms.astype(int),
        "phenotype_match_score": raw_score,
        "phenotype_match_score_resid": residual,
        "phenotype_match_rank": rank,
        "order": order,
    }


def benchmark(n_samples=30_000, n_hpo=10_000, annotations_per_sample=30):
    """Build a CRDC-sized sparse fixture and return scoring time in seconds."""
    rng = np.random.default_rng(7)
    rows = np.repeat(np.arange(n_samples), annotations_per_sample)
    cols = rng.integers(0, n_hpo, size=rows.size)
    matrix = sparse.csr_matrix((np.ones(rows.size), (rows, cols)), shape=(n_samples, n_hpo))
    hpo = [f"HP:{i:07d}" for i in range(n_hpo)]
    started = perf_counter()
    score_samples(matrix, hpo, hpo[:20])
    return perf_counter() - started


if __name__ == "__main__":
    elapsed = benchmark()
    print(f"30,000 samples x 10,000 HPO terms: {elapsed:.3f} seconds")
