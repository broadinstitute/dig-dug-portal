import concurrent.futures

from fastapi import FastAPI
from fastapi.testclient import TestClient

from .fastapi_router import create_router
from .test_core import PreparedCarrierTests


class FastAPICarrierTests(PreparedCarrierTests):
    def test_http_routes_preserve_auth_headers_and_concurrent_selection(self):
        app = FastAPI()
        app.include_router(create_router(self.database, lambda request, gene: request.headers.get("x-test-access") == "allowed"))
        with TestClient(app) as client:
            denied = client.get("/__gene_carrier_summary__?gene=TEST")
            self.assertEqual(denied.status_code, 403)
            headers = {"x-test-access": "allowed"}
            result = client.get("/__gene_carrier_summary__?gene=TEST", headers=headers)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["carrierTotal"], 3)
            self.assertEqual(result.headers["cache-control"], "private, no-store")
            self.assertEqual(client.post("/__gene_carrier_demographics__", content="broken-json", headers=headers).status_code, 400)
            self.assertEqual(client.post("/__gene_carrier_demographics__", content="x" * (1024 * 1024 + 1), headers=headers).status_code, 413)
            def selected(ids):
                response = client.post("/__gene_carrier_demographics__", json={"gene": "TEST", "variant_ids": ids}, headers=headers)
                self.assertEqual(response.status_code, 200)
                return response.json()["carrierTotal"]
            choices = [["chr1:100:A:G"], [], ["chr1:100:A:G", "chr1:200:C:T"], ["chr1:300:G:A"]] * 2
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                self.assertEqual(list(pool.map(selected, choices)), [2, 0, 3, 0] * 2)
            locus = client.get("/__gene_locus_filter__?gene=TEST&start=100&end=200&sex=Female", headers=headers)
            self.assertEqual(locus.json()["distinctCarriers"], 1)
        prefixed = FastAPI()
        prefixed.include_router(create_router(self.database, lambda request, gene: True), prefix="/api/bio")
        with TestClient(prefixed) as client:
            self.assertEqual(client.get("/api/bio/__gene_carrier_summary__?gene=TEST").json()["carrierTotal"], 3)
