import unittest

import numpy as np

from scripts.context_api_fast import (
    BURDEN_PATHOGENICITY_SCORE_VERSION,
    EXTENDED_PATHOGENICITY_SCORE_VERSION,
    benjamini_hochberg,
    gene_burden_scores,
    gene_burden_test,
    variant_pathogenic_scores,
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
    def test_extended_score_keeps_revel_but_burden_score_excludes_it(self):
        scores = variant_pathogenic_scores({
            "LoF": "",
            "Alphamissense": "NA",
            "REVEL": "0.91",
        })

        self.assertEqual(scores["extended"], (0.91, "REVEL"))
        self.assertEqual(scores["burden"], (None, "REVEL_only_excluded"))

    def test_gene_burden_sums_each_distinct_carried_variant_once(self):
        result = gene_burden_scores(
            sample_ids=["S1", "S2", "S3"],
            gene_sample_rows=[
                {"sample_id": "S1", "variant_id": "V1", "GT": "1/1", "LoF": "", "Alphamissense": "NA", "REVEL": 0.8},
                {"sample_id": "S2", "variant_id": "V1", "GT": "0/1", "LoF": "", "Alphamissense": "NA", "REVEL": 0.8},
                {"sample_id": "S2", "variant_id": "V1", "GT": "0/1", "LoF": "", "Alphamissense": "NA", "REVEL": 0.8},
                {"sample_id": "S1", "variant_id": "V2", "GT": "1/1", "LoF": "", "Alphamissense": 0.4, "REVEL": 0.9},
                {"sample_id": "S2", "variant_id": "V3", "GT": "0/1", "LoF": "HC", "Alphamissense": 0.2, "REVEL": 0.7},
            ],
        )

        np.testing.assert_allclose(result["values"], [0.4, 1.0, 0.0])
        self.assertEqual(result["n_variants_scored"], 2)
        self.assertEqual(result["n_variants_unscored"], 1)
        self.assertEqual(result["n_variants_revel_only"], 1)

    def test_matches_mass_rlm_huber_reference(self):
        x = np.array([0, 0, 1, 1, 2, 2, 3, 3], dtype=float)
        y = np.array([0.1, 0.2, 1.0, 1.2, 2.0, 2.1, 3.1, 6.0], dtype=float)

        result = gene_burden_test(y, x, min_positive=2)

        self.assertEqual(result["status"], "ok")
        self.assertAlmostEqual(result["beta"], 1.01237430338601, places=6)
        self.assertAlmostEqual(result["standard_error"], 0.0432243888701358, places=6)
        self.assertAlmostEqual(result["p_value"], 2.58909919542769e-121, delta=1e-125)
        self.assertEqual(result["model_version"], "portal_huber_rlm_covariate_v2")
        self.assertEqual(
            result["extended_pathogenic_score_version"],
            EXTENDED_PATHOGENICITY_SCORE_VERSION,
        )
        self.assertEqual(
            result["burden_pathogenic_score_version"],
            BURDEN_PATHOGENICITY_SCORE_VERSION,
        )
        self.assertNotIn("pathogenicity_score_version", result)
        self.assertEqual(result["covariates"], [])

    def test_fits_requested_age_sex_and_pc_covariates(self):
        rng = np.random.default_rng(17)
        n_samples = 60
        x = np.zeros(n_samples)
        x[:20] = rng.uniform(0.1, 1.5, size=20)
        covariate_names = [
            "age",
            "age_missing",
            "sex_male",
            "sex_unknown",
            *[f"PC{i}" for i in range(1, 11)],
        ]
        covariates = rng.normal(size=(n_samples, len(covariate_names)))
        y = 0.3 * x + covariates @ rng.normal(size=len(covariate_names)) + rng.normal(size=n_samples)

        result = gene_burden_test(y, x, covariates, covariate_names)

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["covariates"], covariate_names)
        self.assertEqual(result["formula"], "Y ~ X + " + " + ".join(covariate_names))

    def test_returns_no_statistic_when_carrier_support_is_too_small(self):
        result = gene_burden_test(
            y=np.arange(6, dtype=float),
            x=np.array([0, 0, 0, 0, 1, 1], dtype=float),
            min_positive=10,
        )

        self.assertEqual(result["status"], "insufficient_carriers")
        self.assertIsNone(result["beta"])
        self.assertIsNone(result["p_value"])
        self.assertEqual(result["min_carriers"], 10)

    def test_benjamini_hochberg_preserves_input_order(self):
        adjusted = benjamini_hochberg([0.01, 0.04, 0.03, 0.002])
        np.testing.assert_allclose(adjusted, [0.02, 0.04, 0.04, 0.008])


if __name__ == "__main__":
    unittest.main()
