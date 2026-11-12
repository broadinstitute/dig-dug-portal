import json
from pathlib import Path
import tempfile
import unittest

from .core import CarrierAPI, CarrierStore, age_band, build_database


class PreparedCarrierTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.metadata = self.root / "metadata.jsonl"
        self.variants = self.root / "variants.jsonl"
        self.database = self.root / "carriers.sqlite"
        self.provenance = {name: {"source": "synthetic-test-fixture", "built": "test-1"}
                           for name in ["samples-info", "gene-variants-crdc"]}
        self.rows = [
            {"SampleInVCF": "TEST-A_E38", "age_at_enrollment": 12, "gender": "female", "investigator": "PI A", "clean_name": "Project A", "initial_study_affected": "Y", "family_relationship": "proband", "genes": ["TEST", "OTHER", "OTHER"], "phenotypes": ["HP:0001250", "HP:0001250"]},
            {"SampleInVCF": "TEST-B_G38", "age_at_enrollment": 1982, "gender": "male", "investigator": "PI B", "clean_name": "Project B", "initial_study_affected": "N", "genes": ["TEST", "OTHER"], "phenotypes": []},
            {"SampleInVCF": "TEST-C_G38", "age_at_enrollment": 0, "gender": "Unknown", "clean_name": "Project A"},
        ]
        self.variant_rows = [
            {"gene": "TEST", "chromosome": "1", "position": 100, "reference": "A", "alt": "G", "samples": ["TEST-A_E38", "TEST-B_G38", "TEST-A_E38"]},
            {"gene": "TEST", "chromosome": "1", "position": 100, "reference": "A", "alt": "G", "samples": ["TEST-A_E38"]},
            {"gene": "TEST", "chromosome": "1", "position": 200, "reference": "C", "alt": "T", "samples": ["TEST-A_E38", "TEST-C_G38"]},
            {"gene": "TEST", "chromosome": "1", "position": 300, "reference": "G", "alt": "A", "samples": []},
            {"gene": "OTHER", "chromosome": "2", "position": 100, "reference": "A", "alt": "T", "samples": ["TEST-B_G38"]},
        ]
        self.write_inputs()
        self.build()

    def tearDown(self):
        self.directory.cleanup()

    def write_inputs(self):
        for filename, rows in [(self.metadata, self.rows), (self.variants, self.variant_rows)]:
            filename.write_text("".join(json.dumps(row) + "\n" for row in rows))

    def build(self, **kwargs):
        return build_database(self.metadata, self.variants, self.database, self.provenance, **kwargs)

    def test_precomputed_summary_preserves_units_and_missingness(self):
        result = CarrierStore(self.database).query("TEST")
        self.assertEqual(result["carrierTotal"], 3)
        self.assertEqual(result["matchedMetadataCount"], 3)
        self.assertEqual(result["phenotypeMetadataCount"], 2)
        self.assertEqual(result["geneListMetadataCount"], 2)
        self.assertEqual(result["observedPhenotypes"], [{"hpoId": "HP:0001250", "count": 1, "denominator": 2}])
        self.assertEqual(result["coCarrierGenes"], [{"gene": "OTHER", "count": 2, "denominator": 3}])
        demo = result["geneCarrierDemographics"]
        self.assertEqual(demo["byAge"], [{"band": "0", "count": 1}, {"band": "10-13", "count": 1}, {"band": "Unknown", "count": 1}])
        self.assertEqual(demo["byProject"], [{"project": "Project A", "count": 2}, {"project": "Project B", "count": 1}])
        self.assertEqual(demo["projectInvestigators"], {"Project A": ["PI A"], "Project B": ["PI B"]})
        self.assertNotIn("TEST-A_E38", json.dumps(result))

    def test_selected_union_deduplicates_people_and_handles_empty(self):
        store = CarrierStore(self.database)
        selected = store.query("TEST", ["chr1:100:A:G", "chr1:200:C:T"], demographics_only=True)
        self.assertEqual(selected["carrierTotal"], 3)
        self.assertNotIn("coCarrierGenes", selected)
        self.assertEqual(store.query("TEST", [], demographics_only=True)["carrierTotal"], 0)
        self.assertEqual(store.query("TEST", ["chr1:300:G:A"])["carrierTotal"], 0)
        with self.assertRaises(ValueError):
            store.query("TEST", ["chr2:100:A:T"])

    def test_api_authorizes_before_opening_data_and_validates_scope(self):
        api = CarrierAPI(self.database)
        allow = lambda gene: gene == "TEST"
        code, result = api.handle("GET", "/__gene_carrier_summary__", {"gene": "test"}, None, allow)
        self.assertEqual((code, result["carrierTotal"]), (200, 3))
        code, result = api.handle("POST", "/__gene_carrier_demographics__", {}, {"gene": "TEST", "variant_ids": ["chr1:100:A:G", "chr1:100:A:G"]}, allow)
        self.assertEqual((code, result["carrierTotal"]), (200, 2))
        code, result = api.handle("GET", "/__gene_carrier_summary__", {"gene": "TEST", "variant": "chr1:100:A:G"}, None, allow)
        self.assertEqual(result["geneListMetadataCount"], 2)
        self.assertEqual(api.handle("POST", "/__gene_carrier_demographics__", {}, {"gene": "TEST", "variant_ids": ["chr2:100:A:T"]}, allow)[0], 400)
        self.assertEqual(api.handle("POST", "/__gene_carrier_demographics__", {}, [], allow)[0], 400)
        self.assertEqual(api.handle("GET", "/__gene_carrier_summary__", {"gene": "../TEST"}, None, allow)[0], 400)
        missing_api = CarrierAPI(self.root / "not-found.sqlite")
        self.assertEqual(missing_api.handle("GET", "/__gene_carrier_summary__", {"gene": "TEST"}, None, lambda gene: False)[0], 403)
        self.assertEqual(missing_api.handle("GET", "/__gene_carrier_summary__", {"gene": "TEST"}, None, allow)[0], 503)

    def test_failed_build_keeps_previous_snapshot(self):
        previous = self.database.read_bytes()
        self.rows.pop()
        self.write_inputs()
        with self.assertRaisesRegex(ValueError, "Metadata is missing"):
            self.build()
        self.assertEqual(self.database.read_bytes(), previous)
        self.assertEqual(CarrierStore(self.database).query("TEST")["matchedMetadataCount"], 3)
        self.build(allow_missing=True)
        result = CarrierStore(self.database).query("TEST")
        self.assertEqual((result["carrierTotal"], result["matchedMetadataCount"]), (3, 2))

    def test_existing_worker_reads_new_complete_snapshot(self):
        store = CarrierStore(self.database)
        self.rows[0]["age_at_enrollment"] = 20
        self.provenance["samples-info"]["built"] = "test-2"
        self.write_inputs()
        self.build()
        by_age = store.query("TEST")["geneCarrierDemographics"]["byAge"]
        self.assertIn({"band": "18+", "count": 1}, by_age)
        self.assertNotIn({"band": "10-13", "count": 1}, by_age)

    def test_conflicting_metadata_and_absent_provenance_are_rejected(self):
        self.rows.append(dict(self.rows[0], gender="male"))
        self.write_inputs()
        with self.assertRaisesRegex(ValueError, "Conflicting metadata"):
            self.build()
        with self.assertRaisesRegex(ValueError, "Provenance"):
            build_database(self.metadata, self.variants, self.database, {})

    def test_age_boundaries(self):
        for value, expected in [(0, "0"), (1, "1-2"), (3, "3-5"), (6, "6-9"), (10, "10-13"), (14, "14-17"), (18, "18+"), (100, "18+"), (1982, "Unknown"), (-1, "Unknown"), (None, "Unknown")]:
            self.assertEqual(age_band(value), expected)

    def test_locus_counts_deduplicate_within_bins_and_apply_demographic_filters(self):
        store = CarrierStore(self.database)
        result = store.locus("TEST", {"start": 100, "end": 200, "bins": 1})
        self.assertEqual(result["distinctCarriers"], 3)
        self.assertEqual(result["carrierDensity"], [3])
        self.assertEqual(result["variantCounts"], {"chr1:100:A:G": 2, "chr1:200:C:T": 2})
        result = store.locus("TEST", {"start": 100, "end": 200, "bins": 2, "sex": "Female"})
        self.assertEqual(result["distinctCarriers"], 1)
        self.assertEqual(result["carrierDensity"], [1, 1])
        result = store.locus("TEST", {"start": 100, "end": 200, "scope": "Affected", "layout": "pb", "investigator": "PI B"})
        self.assertEqual(result["distinctCarriers"], 0)
        api = CarrierAPI(self.database)
        self.assertEqual(api.handle("GET", "/__gene_locus_filter__", {"gene": "TEST", "start": "invalid"}, None, lambda gene: True)[0], 400)


if __name__ == "__main__":
    unittest.main()
