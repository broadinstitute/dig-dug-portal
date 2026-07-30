"""Serve the private pb_Gene HPO context calculation over local HTTP."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from time import perf_counter

from scripts.pb_gene_context_validation import ContextAnalysisEngine


CONTEXT_PATH = "/phenotype-analyzer-api/analyze"
MAX_REQUEST_BYTES = 64 * 1024
HPO_PATTERN = re.compile(r"^HP:\d{7}$")
GENE_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9.-]*$")


def parse_context_request(payload):
    if not isinstance(payload, dict):
        raise ValueError("request body must be a JSON object")
    gene = str(payload.get("gene") or "").strip().upper()
    if not GENE_PATTERN.fullmatch(gene):
        raise ValueError("gene must be a valid HGNC symbol")

    raw_terms = payload.get("terms")
    if isinstance(raw_terms, str):
        terms = re.split(r"[\s,;]+", raw_terms.upper())
    elif isinstance(raw_terms, list):
        terms = [str(term).strip().upper() for term in raw_terms]
    else:
        raise ValueError("terms must be a string or list")
    terms = list(dict.fromkeys(term for term in terms if term))
    invalid = next((term for term in terms if not HPO_PATTERN.fullmatch(term)), None)
    if not terms or invalid:
        raise ValueError("at least one valid HPO term is required" if not invalid else f"invalid HPO term: {invalid}")

    advanced = payload.get("advanced") or {}
    if not isinstance(advanced, dict):
        raise ValueError("advanced must be a JSON object")
    metric = str(advanced.get("significance_metric") or "p_value")
    if metric not in {"p_value", "fdr"}:
        raise ValueError("significance_metric must be p_value or fdr")
    try:
        threshold = float(advanced.get("significance_threshold", 0.05))
        min_carriers = int(advanced.get("min_carriers", 5))
    except (TypeError, ValueError):
        raise ValueError("threshold and min_carriers must be numeric")
    if not 0 < threshold <= 1:
        raise ValueError("significance_threshold must be greater than 0 and no more than 1")
    if min_carriers < 1:
        raise ValueError("min_carriers must be at least 1")
    return {
        "gene": gene,
        "terms": terms,
        "metric": metric,
        "threshold": threshold,
        "min_carriers": min_carriers,
    }


def create_server(address, engine):
    class ContextHandler(BaseHTTPRequestHandler):
        def _send_json(self, status, payload):
            body = json.dumps(payload, allow_nan=False, separators=(",", ":")).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path == "/health":
                self._send_json(200, {"status": "ok"})
            else:
                self._send_json(404, {"error": "not_found"})

        def do_POST(self):
            if self.path != CONTEXT_PATH:
                self._send_json(404, {"error": "not_found"})
                return
            try:
                length = int(self.headers.get("Content-Length") or 0)
                if length <= 0 or length > MAX_REQUEST_BYTES:
                    raise ValueError("invalid request body size")
                request = parse_context_request(json.loads(self.rfile.read(length)))
                started = perf_counter()
                result = engine.analyze(
                    request["gene"],
                    request["terms"],
                    min_carriers=request["min_carriers"],
                )
                burden = result.get("gene_burden") or {}
                p_value = burden.get("p_value")
                burden.update({
                    "fdr": p_value,
                    "fdr_method": "BH",
                    "multiple_testing_scope": "single gene in current request",
                    "n_tests": 1,
                })
                result["request_ms"] = round((perf_counter() - started) * 1000, 3)
                self._send_json(200, result)
            except (ValueError, json.JSONDecodeError) as error:
                self._send_json(400, {"error": "invalid_request", "detail": str(error)})
            except Exception:
                self._send_json(500, {"error": "context_analysis_failed"})

        def log_message(self, format_string, *args):
            return

    server = ThreadingHTTPServer(address, ContextHandler)
    server.engine = engine
    return server


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--overlap-roster", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--covariates", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8092)
    args = parser.parse_args(argv)

    engine = ContextAnalysisEngine(
        args.hpo_matrix,
        args.overlap_roster,
        args.evidence,
        covariate_path=args.covariates,
    )
    server = create_server((args.host, args.port), engine)
    print(f"pb_Gene Context API listening on http://{args.host}:{server.server_port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
