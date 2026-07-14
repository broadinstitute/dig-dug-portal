import unittest

import numpy as np

from scripts.context_api_fast import (
    benjamini_hochberg,
    gene_burden_scores,
    gene_burden_test,
    variant_match_scores,
)


class VariantMatchScoreTest(unittest.TestCase):
    def test_uses_unique_carriers_and_requires_complete_scores(self):
        result = variant_match_scores(
            sample_ids=["S1", "S2", "S3"],
            phenotype_match_score_resid=[1.0, 2.0, -1.0],
            carriers_by_variant={
                "V1": ["S1", "S2", "S2"],
                "V2": ["S3", "S4"],
            },
        )

        self.assertEqual(result["V1"]["carrier_count"], 2)
        self.assertEqual(result["V1"]["scored_carrier_count"], 2)
        self.assertAlmostEqual(result["V1"]["match_score"], 1.5)
        self.assertEqual(result["V1"]["status"], "ok")
        self.assertIsNone(result["V2"]["match_score"])
        self.assertEqual(result["V2"]["status"], "incomplete_scores")


class GeneBurdenTest(unittest.TestCase):
    def test_gene_burden_sums_each_distinct_carried_variant_once(self):
        result = gene_burden_scores(
            sample_ids=["S1", "S2", "S3"],
            gene_sample_rows=[
                {"sample_id": "S1", "variant_id": "V1", "GT": "1/1", "alt_dosage": 2, "pathogenicity_score": 0.8, "weighted_score": 1.6, "score_source": "REVEL"},
                {"sample_id": "S2", "variant_id": "V1", "GT": "0/1", "alt_dosage": 1, "pathogenicity_score": 0.8, "weighted_score": 0.8, "score_source": "REVEL"},
                {"sample_id": "S2", "variant_id": "V1", "GT": "0/1", "alt_dosage": 1, "pathogenicity_score": 0.8, "weighted_score": 0.8, "score_source": "REVEL"},
                {"sample_id": "S1", "variant_id": "V2", "GT": "1/1", "alt_dosage": 2, "pathogenicity_score": 0.4, "weighted_score": 0.8, "score_source": "AlphaMissense"},
                {"sample_id": "S2", "variant_id": "V3", "GT": "0/1", "pathogenicity_score": 0.0, "score_source": "No_score"},
            ],
        )

        np.testing.assert_allclose(result["values"], [1.2, 0.8, 0.0])
        self.assertEqual(result["n_variants_scored"], 2)
        self.assertEqual(result["n_variants_unscored"], 1)

    def test_matches_mass_rlm_huber_reference(self):
        x = np.array([0, 0, 1, 1, 2, 2, 3, 3], dtype=float)
        y = np.array([0.1, 0.2, 1.0, 1.2, 2.0, 2.1, 3.1, 6.0], dtype=float)

        result = gene_burden_test(y, x, min_positive=2)

        self.assertEqual(result["status"], "ok")
        self.assertAlmostEqual(result["beta"], 1.01237430338601, places=6)
        self.assertAlmostEqual(result["standard_error"], 0.0432243888701358, places=6)
        self.assertAlmostEqual(result["p_value"], 2.58909919542769e-121, delta=1e-125)
        self.assertEqual(result["model_version"], "portal_huber_rlm_v0")
        self.assertEqual(result["covariates"], [])

    def test_returns_no_statistic_when_carrier_support_is_too_small(self):
        result = gene_burden_test(
            y=np.arange(6, dtype=float),
            x=np.array([0, 0, 0, 0, 1, 1], dtype=float),
            min_positive=5,
        )

        self.assertEqual(result["status"], "insufficient_carriers")
        self.assertIsNone(result["beta"])
        self.assertIsNone(result["p_value"])
        self.assertEqual(result["min_carriers"], 5)

    def test_benjamini_hochberg_preserves_input_order(self):
        adjusted = benjamini_hochberg([0.01, 0.04, 0.03, 0.002])
        np.testing.assert_allclose(adjusted, [0.02, 0.04, 0.04, 0.008])


if __name__ == "__main__":
    unittest.main()
