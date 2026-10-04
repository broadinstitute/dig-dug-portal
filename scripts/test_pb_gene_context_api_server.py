import json
import threading
import unittest
from urllib.request import Request, urlopen

from scripts.pb_gene_context_api_server import create_server, parse_context_request, public_context_projection


class _FakeEngine:
    def analyze(self, gene, query_hpo, min_carriers=10):
        return {
            "gene": gene,
            "query_hpo": list(query_hpo),
            "variant_match_scores": {},
            "gene_burden": {
                "p_value": 0.04,
                "min_carriers": min_carriers,
                "status": "ok",
            },
        }


class PbGeneContextApiServerTest(unittest.TestCase):
    def test_public_projection_keeps_supported_effects_without_sample_evidence(self):
        result = {
            "gene": "ATL1", "query_hpo": ["HP:0001250"],
            "analysis_sample_ids": ["private-sample"],
            "gene_association": {"status": "ok", "model": "lm", "score_type": "max", "beta": 0.3,
                                 "p_value": 0.02, "n_positive": 12, "n_samples": 100},
            "variant_associations": {
                "chr14:1:A:T": {"status": "ok", "beta": -0.2, "p_value": 0.04,
                                  "n_carriers": 11, "sample_ids": ["private-sample"]},
                "chr14:2:G:C": {"status": "ok", "beta": 0.4, "p_value": 0.01, "n_carriers": 9},
            },
            "variant_match_scores": {
                "chr14:1:A:T": {"status": "ok", "match_score": 0.125, "carrier_count": 11,
                                 "scored_carrier_count": 11, "sample_ids": ["private-sample"]},
                "chr14:2:G:C": {"status": "ok", "match_score": 0.5, "carrier_count": 9},
            },
        }
        projected = public_context_projection(result)
        self.assertEqual(projected["gene_association"]["beta"], 0.3)
        self.assertEqual(list(projected["variant_associations"]), ["chr14:1:A:T", "chr14:2:G:C"])
        self.assertEqual(projected["variant_match_scores"], {
            "chr14:1:A:T": {"match_score": 0.125},
            "chr14:2:G:C": {"match_score": 0.5},
        })
        self.assertNotIn("sample_ids", json.dumps(projected))
        self.assertNotIn("n_carriers", json.dumps(projected))
        result["gene_association"]["n_positive"] = 9
        self.assertEqual(public_context_projection(result)["gene_association"], {"status": "unavailable"})

    def test_rejects_a_minimum_below_ten_carriers(self):
        with self.assertRaisesRegex(ValueError, "at least 10"):
            parse_context_request({
                "terms": "HP:0001250",
                "gene": "DMD",
                "advanced": {"min_carriers": 9},
            })

    def test_serves_the_vue_context_post_route(self):
        server = create_server(("127.0.0.1", 0), _FakeEngine())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            request = Request(
                f"http://127.0.0.1:{server.server_port}/phenotype-analyzer-api/analyze",
                data=json.dumps({
                    "terms": "HP:0001250",
                    "gene": "DMD",
                    "advanced": {
                        "significance_metric": "p_value",
                        "significance_threshold": 0.05,
                        "min_carriers": 10,
                    },
                }).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=2) as response:
                payload = json.load(response)

            self.assertEqual(payload["gene"], "DMD")
            self.assertEqual(payload["query_hpo"], ["HP:0001250"])
            self.assertEqual(payload["gene_burden"]["fdr"], 0.04)
            self.assertEqual(payload["gene_burden"]["n_tests"], 1)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
