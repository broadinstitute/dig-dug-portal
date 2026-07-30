import json
import threading
import unittest
from urllib.request import Request, urlopen

from scripts.pb_gene_context_api_server import create_server, parse_context_request


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
