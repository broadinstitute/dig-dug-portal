import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from scripts.pb_gene_context_api_server import create_server, parse_co_gene_request, parse_context_request, public_context_projection


class _FakeEngine:
    def analyze(self, gene, query_hpo, min_carriers=10, score_type="max", affected_only=False):
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

    def variant_carrier_residuals(self, gene, variant_id, query_hpo, affected_only=False):
        return {"variant_id": variant_id, "carrier_count": 1, "sample_scores": {"private-carrier": -0.125}}

    def co_gene_associations(self, gene, query_hpo, co_genes, score_type="max", affected_only=False):
        return {
            "target_gene": gene, "query_hpo": list(query_hpo), "score_type": score_type,
            "affected_only": affected_only, "n_tests": 2,
            "gene_associations": {
                gene: {"beta": 0.2, "p_value": 0.01, "fdr": 0.02, "status": "ok"},
                co_genes[0]: {"beta": -0.1, "p_value": 0.04, "fdr": 0.04, "status": "ok"},
            },
        }


class PbGeneContextApiServerTest(unittest.TestCase):
    def test_co_gene_request_validates_options_and_gene_list(self):
        parsed = parse_co_gene_request({
            "gene": "HBB", "terms": "HP:0001250", "co_genes": ["hba1", "HBA1"],
            "score_type": "sum", "affected_only": True,
        })
        self.assertEqual(parsed["co_genes"], ["HBA1"])
        self.assertEqual((parsed["score_type"], parsed["affected_only"]), ("sum", True))
        with self.assertRaises(ValueError):
            parse_co_gene_request({"gene": "HBB", "terms": "HP:0001250", "co_genes": ["HBA1"], "affected_only": "yes"})

    def test_serves_co_gene_association_route(self):
        server = create_server(("127.0.0.1", 0), _FakeEngine())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            request = Request(
                f"http://127.0.0.1:{server.server_port}/phenotype-analyzer-api/co-gene-associations",
                data=json.dumps({"gene": "HBB", "terms": "HP:0001250", "co_genes": ["HBA1"],
                                 "score_type": "sum", "affected_only": True}).encode(),
                headers={"Content-Type": "application/json"}, method="POST",
            )
            with urlopen(request, timeout=2) as response:
                payload = json.load(response)
            self.assertEqual(payload["gene_associations"]["HBB"]["fdr"], 0.02)
            self.assertEqual((payload["score_type"], payload["affected_only"]), ("sum", True))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

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

    def test_private_variant_request_includes_only_target_carrier_residuals(self):
        server = create_server(("127.0.0.1", 0), _FakeEngine())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            body = json.dumps({"terms": "HP:0001250", "gene": "HBB", "variant_id": "chr11:5227002:T:A"}).encode()
            request = Request(f"http://127.0.0.1:{server.server_port}/phenotype-analyzer-api/analyze",
                              data=body, headers={"Content-Type": "application/json"}, method="POST")
            with urlopen(request, timeout=2) as response:
                private = json.load(response)
            self.assertEqual(private["variant_carrier_residuals"]["sample_scores"], {"private-carrier": -0.125})
            public_request = Request(f"http://127.0.0.1:{server.server_port}/phenotype-analyzer-api/public-analyze",
                                     data=body, headers={"Content-Type": "application/json"}, method="POST")
            with self.assertRaises(HTTPError) as error:
                urlopen(public_request, timeout=2)
            self.assertEqual(error.exception.code, 400)
            error.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

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
