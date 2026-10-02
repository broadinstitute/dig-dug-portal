"""Regression checks for lossless phenotype metadata and conservative aliases."""
import csv
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("registry", Path(__file__).with_name("build-pigean-registry.py"))
registry = importlib.util.module_from_spec(spec)
spec.loader.exec_module(registry)


class PhenotypeRegistryTests(unittest.TestCase):
    def parse(self, rows):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "phenotypes.tsv"
            fields = sorted(set().union(*(row.keys() for row in rows)))
            with path.open("w") as stream:
                writer = csv.DictWriter(stream, fieldnames=fields, delimiter="\t")
                writer.writeheader()
                writer.writerows(rows)
            return registry.phenotype_metadata(path)

    def test_preserves_all_assertions_and_missing_confidence(self):
        base = dict(phenotype="T2D", phenotype_name="Type 2 diabetes", portal_id="PORTAL:1", mapping_count="2")
        rows = [dict(base, target_id="EFO:1", target_label="parent", mapping_predicate="skos:broadMatch", confidence="0", source="curated"),
                dict(base, target_id="MONDO:2", mapping_predicate="skos:exactMatch", confidence="", source="imported")]
        value = self.parse(rows)["T2D"]
        self.assertEqual(len(value["mappings"]), 2)
        self.assertEqual(value["mappings"][0]["confidence"], 0)
        self.assertIsNone(value["mappings"][1]["confidence"])
        self.assertEqual(value["mappings"][0]["predicate"], "skos:broadMatch")
        self.assertEqual(value["mappings"][1]["source"], "imported")

    def test_conflicting_names_fail_instead_of_silently_using_first_row(self):
        with self.assertRaisesRegex(ValueError, "Conflicting phenotype"):
            self.parse([dict(phenotype="T2D", phenotype_name="Type 2 diabetes"), dict(phenotype="T2D", phenotype_name="Different disease")])

    def test_unique_aliases_and_ambiguous_ids(self):
        records = self.parse([
            dict(phenotype="Condition_Orphanet_7", phenotype_name="Condition", gwas_source_category="rare_v2", target_id="ORPHANET:7", mapping_predicate="skos:exactMatch"),
            dict(phenotype="gcat_trait_Creactive", phenotype_name="C-reactive protein"),
            dict(phenotype="A", phenotype_name="A", pigean_id="shared"),
            dict(phenotype="B", phenotype_name="B", pigean_id="shared"),
        ])
        lookup = registry.phenotype_lookup(records, ["Orphanet_7", "gcat_trait_C-reactive", "unmapped", "shared"])
        self.assertEqual(lookup["Orphanet_7"]["id"], "Condition_Orphanet_7")
        self.assertEqual(lookup["gcat_trait_C-reactive"]["match"], "gcat_hyphen_variant")
        self.assertNotIn("shared", lookup)
        self.assertNotIn("unmapped", lookup)
        self.assertEqual(lookup["A"]["match"], "legacy_id")


if __name__ == "__main__":
    unittest.main()
