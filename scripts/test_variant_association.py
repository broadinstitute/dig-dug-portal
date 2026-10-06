import unittest
import csv
from pathlib import Path
import tempfile

import numpy as np
from scipy.stats import t

from scripts.pb_gene_context_validation import ContextAnalysisEngine
from scripts.variant_association import OLSContext, analyze_gene_variants, calibration_gate, lambda_quantiles
from scripts.variant_association_lmm_reference import DenseLMMReference


class VariantAssociationTests(unittest.TestCase):
    def setUp(self):
        rng = np.random.default_rng(23)
        self.n = 80
        self.ids = [f"S{i:03d}" for i in range(self.n)]
        age = rng.uniform(18, 80, self.n)
        pc = rng.normal(size=self.n)
        self.c = np.column_stack((age, pc))
        self.x = np.zeros(self.n)
        self.x[[2, 8, 11, 19, 30, 42, 50, 56, 63, 77]] = 1
        self.y = 1.8 * self.x + 0.04 * age - 0.3 * pc + rng.normal(scale=0.7, size=self.n)

    def test_sparse_carrier_ols_matches_direct_full_design(self):
        outcome = OLSContext(self.ids, self.c, ["age", "PC1"]).outcome(self.y)
        carriers = [self.ids[i] for i in np.flatnonzero(self.x)]
        result = outcome.variant(carriers + carriers[:2])
        design = np.column_stack((np.ones(self.n), self.x, self.c))
        coefficients = np.linalg.lstsq(design, self.y, rcond=None)[0]
        residual = self.y - design @ coefficients
        variance = residual @ residual / (self.n - design.shape[1])
        se = np.sqrt(variance * np.linalg.inv(design.T @ design)[1, 1])
        expected_p = 2 * t.sf(abs(coefficients[1] / se), self.n - design.shape[1])
        self.assertEqual(result.status, "ok")
        self.assertEqual(result.n_carriers, 10)
        self.assertAlmostEqual(result.beta, coefficients[1], places=10)
        self.assertAlmostEqual(result.standard_error, se, places=10)
        self.assertAlmostEqual(result.p_value, expected_p, places=10)

    def test_burden_ols_matches_direct_design(self):
        burden = np.linspace(0, 1.2, self.n) ** 2
        result = OLSContext(self.ids, self.c, ["age", "PC1"]).outcome(self.y).gene_burden_ols(burden)
        design = np.column_stack((np.ones(self.n), burden, self.c))
        expected = np.linalg.lstsq(design, self.y, rcond=None)[0]
        self.assertAlmostEqual(result.beta, expected[1], places=10)

    def test_carrier_and_alignment_guards(self):
        outcome = OLSContext(self.ids, self.c, ["age", "PC1"]).outcome(self.y)
        self.assertEqual(outcome.variant([]).status, "no_carriers")
        self.assertEqual(outcome.variant(self.ids).status, "all_carriers")
        self.assertTrue(outcome.variant([self.ids[0]]).low_carrier_count)
        with self.assertRaises(ValueError):
            outcome.variant(["outside-roster"])
        with self.assertRaises(ValueError):
            OLSContext(self.ids, self.c, ["age", "PC1"]).outcome(self.y[:-1])

    def test_lambda_requires_valid_p_values(self):
        values = lambda_quantiles([0.5, 0.1, 0.01, np.nan], null_mask=[True, True, False, True])
        self.assertEqual(values["n_valid"], 2)
        self.assertTrue(np.isfinite(values["lambda_95"]))
        self.assertIsNone(lambda_quantiles([np.nan])["lambda_50"])
        held = calibration_gate([0.5, 0.1], [True, True], max_lambda_90=1.5, max_lambda_95=1.5)
        self.assertEqual(held["status"], "insufficient_null_tests")
        self.assertFalse(held["release_p_values"])
        passed = calibration_gate(np.linspace(0.01, 0.99, 200), np.ones(200, dtype=bool), max_lambda_90=10, max_lambda_95=10)
        self.assertTrue(passed["release_p_values"])

    def test_dense_lmm_uses_aligned_grm_and_is_ols_at_identity(self):
        # With an identity GRM, covariance is scalar and GLS equals OLS.
        ids = self.ids[:35]
        c = self.c[:35]
        y = self.y[:35]
        carrier_ids = [ids[i] for i in np.flatnonzero(self.x[:35])]
        ols = OLSContext(ids, c, ["age", "PC1"]).outcome(y).variant(carrier_ids)
        lmm = DenseLMMReference(ids, c, np.eye(35), ids).outcome(y).variant(carrier_ids)
        self.assertAlmostEqual(lmm.beta, ols.beta, places=8)
        self.assertAlmostEqual(lmm.p_value, ols.p_value, places=8)
        with self.assertRaises(ValueError):
            DenseLMMReference(ids, c, np.eye(35), ids[::-1])

    def test_existing_context_loader_supplies_residual_phers_and_covariates(self):
        rng = np.random.default_rng(39)
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)

            def write(name, header, rows):
                path = root / name
                with path.open("w", newline="") as handle:
                    writer = csv.writer(handle, delimiter="\t")
                    writer.writerow(header)
                    writer.writerows(rows)
                return path

            hpo = write("hpo.tsv", ["sample_id", "HP:0000001", "HP:0000002", "HP:0000003"], [
                [sample_id, int(i % 3 == 0 or i % 7 == 0), int(i % 4 == 0), int(i % 5 == 0)]
                for i, sample_id in enumerate(self.ids)
            ])
            roster = write("roster.tsv", ["sample_id", "overlap_status"], [[sample_id, "both"] for sample_id in self.ids])
            covariates = write("covariates.tsv", ["sample_id", "age", "sex", "affected", *[f"PC{i}" for i in range(1, 11)]], [
                [sample_id, 20 + i % 57, ["Female", "Male", "Unknown"][i % 3], "Y" if i % 2 == 0 else "N", *rng.normal(size=10)]
                for i, sample_id in enumerate(self.ids)
            ])
            carriers = [self.ids[i] for i in np.flatnonzero(self.x)]
            evidence = write("evidence.tsv", ["sample_id", "gene_symbol", "Variant_ID", "GT", "pathogenicity_score", "Alphamissense"], [
                [sample_id, "ATL1", "V1", "0/1", 0.7, 0.7] for sample_id in carriers
            ])
            engine = ContextAnalysisEngine(hpo, roster, evidence, covariates)
            result = analyze_gene_variants(engine, "ATL1", ["HP:0000001", "HP:0000002"], variant_ids=["V1", "V2"])
            y, checksum = engine._phenotype(("HP:0000001", "HP:0000002"))
            direct = OLSContext(engine.analysis_sample_ids, engine.covariates["values"], engine.covariates["names"]).outcome(y).variant(carriers)
            self.assertEqual(result["phenotype_vector_sha256"], checksum)
            self.assertEqual(result["variant_associations"]["V1"]["n_carriers"], 10)
            self.assertAlmostEqual(result["variant_associations"]["V1"]["beta"], direct.beta)
            self.assertAlmostEqual(result["variant_associations"]["V1"]["p_value"], direct.p_value)
            self.assertEqual(result["variant_associations"]["V2"]["status"], "no_carriers")
            self.assertNotIn("sample_ids", result)
            affected = analyze_gene_variants(engine, "ATL1", ["HP:0000001", "HP:0000002"],
                                             variant_ids=["V1"], affected_only=True)
            mask = engine.covariates["affected_mask"]
            affected_ids = [sample_id for sample_id, selected in zip(engine.analysis_sample_ids, mask) if selected]
            direct_affected = OLSContext(affected_ids, engine.covariates["values"][mask], engine.covariates["names"]).outcome(y[mask]).variant(
                [sample_id for sample_id in carriers if sample_id in set(affected_ids)]
            )
            self.assertEqual(affected["analysis_sample_count"], len(affected_ids))
            self.assertAlmostEqual(affected["variant_associations"]["V1"]["beta"], direct_affected.beta)
            self.assertAlmostEqual(affected["variant_associations"]["V1"]["p_value"], direct_affected.p_value)
            context_affected = engine.analyze("ATL1", ["HP:0000001", "HP:0000002"], affected_only=True)
            self.assertEqual(context_affected["variant_match_scores"]["V1"]["carrier_count"], direct_affected.n_carriers)
            self.assertAlmostEqual(context_affected["variant_associations"]["V1"]["beta"], direct_affected.beta)


if __name__ == "__main__":
    unittest.main()
