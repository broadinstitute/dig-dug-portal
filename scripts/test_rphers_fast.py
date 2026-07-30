import time
import unittest

import numpy as np
from scipy import sparse

from scripts.rphers_fast import score_samples


class ScoreSamplesTest(unittest.TestCase):
    def test_matches_r_formula_and_ranking(self):
        matrix = np.array([
            [1, 0, 1],
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ])
        result = score_samples(
            matrix,
            ["HP:1", "HP:2", "HP:3"],
            ["HP:1", "HP:3"],
            sample_ids=["s1", "s2", "s3", "s4"],
        )

        weight = np.log(5 / 3)
        np.testing.assert_allclose(result["phenotype_match_score"], [2 * weight, weight, weight, 0])
        np.testing.assert_allclose(
            result["phenotype_match_score_resid"],
            [2 * weight / 3, -weight / 3, -weight / 3, 0],
            atol=1e-12,
        )
        np.testing.assert_array_equal(result["matched_query_terms"], [2, 1, 1, 0])
        np.testing.assert_array_equal(result["order"], [0, 3, 1, 2])
        np.testing.assert_array_equal(result["phenotype_match_rank"], [1, 3, 4, 2])

    def test_sparse_and_dense_results_are_identical(self):
        matrix = np.array([[1, 0, 2], [0, np.nan, 1], [1, 1, 0]])
        args = (["HP:1", "HP:2", "HP:3"], ["HP:3", "HP:missing"])
        dense = score_samples(matrix, *args)
        sparse_result = score_samples(sparse.csr_matrix(matrix), *args)

        for key in ("Wp", "matched_query_terms", "phenotype_match_score", "phenotype_match_score_resid"):
            np.testing.assert_allclose(dense[key], sparse_result[key])

    def test_crdc_sized_sparse_matrix_scores_under_one_second(self):
        rng = np.random.default_rng(7)
        n_samples, n_hpo, annotations_per_sample = 30_000, 10_000, 30
        rows = np.repeat(np.arange(n_samples), annotations_per_sample)
        cols = rng.integers(0, n_hpo, size=rows.size)
        matrix = sparse.csr_matrix((np.ones(rows.size), (rows, cols)), shape=(n_samples, n_hpo))
        hpo = [f"HP:{i:07d}" for i in range(n_hpo)]

        started = time.perf_counter()
        result = score_samples(matrix, hpo, hpo[:20])
        elapsed = time.perf_counter() - started

        self.assertEqual(len(result["phenotype_match_score"]), n_samples)
        self.assertLess(elapsed, 1.0)


if __name__ == "__main__":
    unittest.main()
