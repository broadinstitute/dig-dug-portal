import csv
import gzip
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np

from scripts.pb_gene_context_validation import (
    load_gene_evidence,
    load_hpo_matrix,
    load_overlap_roster,
    reconstruct_pathogenic_score,
    run_validation,
)


QUERY_HPO = ["HP:0001336", "HP:0002353", "HP:0001270", "HP:0012373"]


class PbGeneContextValidationTest(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)

    def tearDown(self):
        self.tempdir.cleanup()

    def write_gzip_tsv(self, name, header, rows):
        path = self.root / name
        with gzip.open(path, "wt", newline="") as handle:
            writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
            writer.writerow(header)
            writer.writerows(rows)
        return path

    def write_tsv(self, name, header, rows):
        path = self.root / name
        with path.open("w", newline="") as handle:
            writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
            writer.writerow(header)
            writer.writerows(rows)
        return path

    def test_loads_binary_parent_expanded_hpo_matrix_and_requires_query_terms(self):
        path = self.write_gzip_tsv(
            "hpo.tsv.gz",
            ["sample_id", *QUERY_HPO],
            [["S1", 1, 0, 1, 0], ["S2", 0, 1, 0, 1]],
        )

        loaded = load_hpo_matrix(path, QUERY_HPO)

        self.assertEqual(loaded["sample_ids"].tolist(), ["S1", "S2"])
        self.assertEqual(loaded["hpo_columns"], QUERY_HPO)
        np.testing.assert_array_equal(loaded["matrix"].toarray(), [[1, 0, 1, 0], [0, 1, 0, 1]])
        with self.assertRaisesRegex(ValueError, "missing query HPO"):
            load_hpo_matrix(path, [*QUERY_HPO, "HP:9999999"])

    def test_loads_only_validated_overlap_roster_and_returns_aggregate_qc(self):
        path = self.write_tsv(
            "roster.tsv",
            ["sample_id", "in_genotype", "in_eligibility_roster", "overlap_status"],
            [
                ["S1", 1, 1, "both"],
                ["S2", 1, 1, "both"],
                ["S3", 1, 0, "genotype_only"],
                ["S4", 0, 1, "roster_only"],
            ],
        )

        loaded = load_overlap_roster(path)

        self.assertEqual(loaded["sample_ids"], ["S1", "S2"])
        self.assertEqual(loaded["status_counts"], {"both": 2, "genotype_only": 1, "roster_only": 1})

    def test_reconstructs_existing_score_provenance_without_revel_fallback(self):
        lof = reconstruct_pathogenic_score({"LoF": "HC", "Alphamissense": "0.2", "pathogenicity_score": "1"})
        alpha = reconstruct_pathogenic_score({"LoF": "", "Alphamissense": "0.45", "pathogenicity_score": "0.45"})
        missing = reconstruct_pathogenic_score({"LoF": "", "Alphamissense": "NA", "REVEL": "0.99", "pathogenicity_score": "0"})

        self.assertEqual(lof, (1.0, "LoF_HC"))
        self.assertEqual(alpha, (0.45, "AlphaMissense"))
        self.assertEqual(missing, (None, "No_score"))
        with self.assertRaisesRegex(ValueError, "stored pathogenicity_score"):
            reconstruct_pathogenic_score({"LoF": "", "Alphamissense": "0.45", "pathogenicity_score": "0.8"})

    def test_streams_requested_gene_rows_and_excludes_non_overlap_carriers(self):
        evidence = self.write_gzip_tsv(
            "evidence.tsv.gz",
            ["sample_id", "gene_symbol", "Variant_ID", "GT", "alt_dosage", "LoF", "Alphamissense", "REVEL", "pathogenicity_score"],
            [
                ["S1", "CEP152", "V1", "0/1", 1, "", 0.4, 0.8, 0.4],
                ["S2", "DMD", "V2", "1", 1, "HC", "NA", "NA", 1],
                ["S3", "DMD", "V3", "0/1", 1, "", 0.2, 0.7, 0.2],
                ["S1", "OTHER", "V4", "0/1", 1, "", 0.9, 0.9, 0.9],
            ],
        )

        loaded = load_gene_evidence(evidence, ["CEP152", "DMD"], {"S1", "S2"})

        self.assertEqual([row["variant_id"] for row in loaded["rows_by_gene"]["CEP152"]], ["V1"])
        self.assertEqual([row["variant_id"] for row in loaded["rows_by_gene"]["DMD"]], ["V2"])
        self.assertEqual(loaded["carrier_rows_outside_analysis"], {"CEP152": 0, "DMD": 1})

    def test_one_phenotype_vector_produces_distinct_gene_results_without_dosage_weighting(self):
        hpo_rows = [
            ["S1", 1, 1, 0, 0, 0],
            ["S2", 1, 0, 1, 0, 1],
            ["S3", 0, 1, 0, 1, 0],
            ["S4", 0, 0, 1, 1, 1],
            ["S5", 1, 1, 1, 0, 0],
            ["S6", 0, 0, 0, 1, 1],
        ]
        hpo = self.write_gzip_tsv("hpo.tsv.gz", ["sample_id", *QUERY_HPO, "HP:9999998"], hpo_rows)
        roster = self.write_tsv(
            "roster.tsv",
            ["sample_id", "overlap_status"],
            [[f"S{i}", "both"] for i in range(1, 7)],
        )
        evidence = self.write_gzip_tsv(
            "evidence.tsv.gz",
            ["sample_id", "gene_symbol", "Variant_ID", "GT", "alt_dosage", "LoF", "Alphamissense", "REVEL", "pathogenicity_score"],
            [
                ["S1", "CEP152", "C1", "1/1", 2, "", 0.4, 0.8, 0.4],
                ["S1", "CEP152", "C1", "1/1", 2, "", 0.4, 0.8, 0.4],
                ["S2", "CEP152", "C1", "0/1", 1, "", 0.4, 0.8, 0.4],
                ["S1", "CEP152", "C2", "0/1", 1, "", 0.3, 0.7, 0.3],
                ["S3", "CEP152", "C3", "0/1", 1, "", "NA", 0.9, 0],
                ["S4", "DMD", "D1", "1", 1, "HC", "NA", "NA", 1],
                ["S5", "DMD", "D1", "0/1", 1, "HC", "NA", "NA", 1],
                ["S6", "DMD", "D2", "1", 1, "", 0.2, 0.5, 0.2],
            ],
        )

        audit_dir = self.root / "audit"
        result = run_validation(
            hpo,
            roster,
            evidence,
            QUERY_HPO,
            ["CEP152", "DMD"],
            min_carriers=2,
            audit_dir=audit_dir,
        )

        cep152 = result["genes"]["CEP152"]
        dmd = result["genes"]["DMD"]
        self.assertEqual(cep152["phenotype_vector_sha256"], dmd["phenotype_vector_sha256"])
        self.assertEqual(cep152["phenotype_vector_sha256"], result["phenotype_vector_sha256"])
        self.assertEqual(cep152["gene_burden"]["n_variants_total"], 3)
        self.assertEqual(cep152["gene_burden"]["n_variants_unscored"], 1)
        self.assertEqual(cep152["gene_burden"]["interpretation_scope"], "exploratory_scored_variants_only")
        self.assertIn("C3", cep152["variant_match_scores"])
        self.assertNotEqual(cep152["variant_match_scores"], dmd["variant_match_scores"])
        self.assertIn(cep152["gene_burden"]["status"], {"ok", "zero_residual_scale"})
        self.assertIn(dmd["gene_burden"]["status"], {"ok", "zero_residual_scale"})

        self.assertNotIn("sample_id", json.dumps(result))
        self.assertNotIn("S1", json.dumps(result))
        with gzip.open(audit_dir / "CEP152_sample_audit.tsv.gz", "rt") as handle:
            cep152_audit = {row["sample_id"]: float(row["gene_burden"]) for row in csv.DictReader(handle, delimiter="\t")}
        with gzip.open(audit_dir / "DMD_sample_audit.tsv.gz", "rt") as handle:
            dmd_audit = {row["sample_id"]: float(row["gene_burden"]) for row in csv.DictReader(handle, delimiter="\t")}
        self.assertEqual({key: cep152_audit[key] for key in ("S1", "S2", "S3")}, {"S1": 0.7, "S2": 0.4, "S3": 0.0})
        self.assertEqual({key: dmd_audit[key] for key in ("S4", "S5", "S6")}, {"S4": 1.0, "S5": 1.0, "S6": 0.2})


if __name__ == "__main__":
    unittest.main()
