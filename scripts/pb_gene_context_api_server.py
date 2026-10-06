"""Serve the private pb_Gene HPO context calculation over local HTTP."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from time import perf_counter

from scripts.pb_gene_context_validation import ContextAnalysisEngine
from scripts.gene_score_context_runner import GeneScoreContextRunner


CONTEXT_PATH = "/phenotype-analyzer-api/analyze"
PUBLIC_CONTEXT_PATH = "/phenotype-analyzer-api/public-analyze"
CO_GENE_PATH = "/phenotype-analyzer-api/co-gene-associations"
MAX_REQUEST_BYTES = 64 * 1024
MAX_CO_GENE_REQUEST_BYTES = 512 * 1024
MAX_CO_GENES = 25000
HPO_PATTERN = re.compile(r"^HP:\d{7}$")
GENE_PATTERN = re.compile(r"^[A-Z0-9][A-Z0-9.-]*$")
VARIANT_PATTERN = re.compile(r"^(?:chr)?(?:[0-9]{1,2}|X|Y|M|MT):[0-9]+:[A-Z*.-]+:[A-Z*.-]+$", re.I)


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
        min_carriers = int(advanced.get("min_carriers", 10))
    except (TypeError, ValueError):
        raise ValueError("threshold and min_carriers must be numeric")
    if not 0 < threshold <= 1:
        raise ValueError("significance_threshold must be greater than 0 and no more than 1")
    if min_carriers < 10:
        raise ValueError("min_carriers must be at least 10")
    variant_id = str(payload.get("variant_id") or "").strip()
    if variant_id and (len(variant_id) > 256 or not VARIANT_PATTERN.fullmatch(variant_id)):
        raise ValueError("variant_id must be an exact chr:pos:ref:alt identifier")
    score_type = payload.get("score_type", "max")
    affected_only = payload.get("affected_only", False)
    if score_type not in {"max", "sum"} or not isinstance(affected_only, bool):
        raise ValueError("score_type must be max or sum and affected_only must be boolean")
    return {
        "gene": gene,
        "terms": terms,
        "metric": metric,
        "threshold": threshold,
        "min_carriers": min_carriers,
        "variant_id": variant_id or None,
        "score_type": score_type,
        "affected_only": affected_only,
    }


def parse_co_gene_request(payload):
    request = parse_context_request(payload)
    if request["variant_id"]:
        raise ValueError("variant_id is not used for co-gene associations")
    raw_genes = payload.get("co_genes")
    if not isinstance(raw_genes, list) or len(raw_genes) > MAX_CO_GENES:
        raise ValueError("co_genes must be a list of at most 25000 symbols")
    genes = []
    for value in raw_genes:
        gene = str(value).strip().upper()
        if len(gene) > 64 or not GENE_PATTERN.fullmatch(gene):
            raise ValueError("co_genes contains an invalid HGNC symbol")
        genes.append(gene)
    request["co_genes"] = list(dict.fromkeys(genes))
    return request


def public_context_projection(result, min_support=10):
    """Return supported aggregate effects and carrier mean scores without sample evidence."""
    gene_result = result.get("gene_association") or {}
    if gene_result.get("status") == "ok" and int(gene_result.get("n_positive") or 0) >= min_support:
        public_gene = {
            key: gene_result.get(key)
            for key in ("model", "score_type", "affected_only", "beta", "p_value", "status")
        }
    else:
        public_gene = {"status": "unavailable"}
    public_variants = {}
    for variant_id, association in (result.get("variant_associations") or {}).items():
        if association.get("status") != "ok":
            continue
        public_variants[variant_id] = {
            "beta": association.get("beta"),
            "p_value": association.get("p_value"),
            "status": "ok",
        }
    public_match_scores = {}
    for variant_id, score in (result.get("variant_match_scores") or {}).items():
        if score.get("status") != "ok":
            continue
        public_match_scores[variant_id] = {"match_score": score.get("match_score")}
    return {
        "gene": result.get("gene"),
        "query_hpo": result.get("query_hpo", []),
        "gene_association": public_gene,
        "variant_associations": public_variants,
        "variant_match_scores": public_match_scores,
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
            if self.path not in {CONTEXT_PATH, PUBLIC_CONTEXT_PATH, CO_GENE_PATH}:
                self._send_json(404, {"error": "not_found"})
                return
            try:
                length = int(self.headers.get("Content-Length") or 0)
                limit = MAX_CO_GENE_REQUEST_BYTES if self.path == CO_GENE_PATH else MAX_REQUEST_BYTES
                if length <= 0 or length > limit:
                    raise ValueError("invalid request body size")
                payload = json.loads(self.rfile.read(length))
                request = parse_co_gene_request(payload) if self.path == CO_GENE_PATH else parse_context_request(payload)
                if self.path == CO_GENE_PATH:
                    started = perf_counter()
                    result = engine.co_gene_associations(
                        request["gene"], request["terms"], request["co_genes"],
                        score_type=request["score_type"], affected_only=request["affected_only"],
                    )
                    result["request_ms"] = round((perf_counter() - started) * 1000, 3)
                    self._send_json(200, result)
                    return
                if self.path == PUBLIC_CONTEXT_PATH and request["variant_id"]:
                    raise ValueError("individual variant carrier scores are private-only")
                started = perf_counter()
                result = engine.analyze(
                    request["gene"],
                    request["terms"],
                    min_carriers=request["min_carriers"],
                    score_type=request["score_type"],
                    affected_only=request["affected_only"],
                )
                burden = result.get("gene_burden") or {}
                p_value = burden.get("p_value")
                burden.update({
                    "fdr": p_value,
                    "fdr_method": "BH",
                    "multiple_testing_scope": "single gene in current request",
                    "n_tests": 1,
                })
                if self.path == PUBLIC_CONTEXT_PATH:
                    self._send_json(200, public_context_projection(result, request["min_carriers"]))
                else:
                    if request["variant_id"]:
                        result["variant_carrier_residuals"] = engine.variant_carrier_residuals(
                            request["gene"], request["variant_id"], request["terms"],
                            affected_only=request["affected_only"],
                        )
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
    parser.add_argument("--evidence")
    parser.add_argument("--bioindex-host")
    parser.add_argument("--bioindex-evidence-index", choices=("gene-variants-crdc", "gene-samples"),
                        default="gene-variants-crdc")
    parser.add_argument("--bioindex-access-token-file")
    parser.add_argument("--covariates", required=True)
    parser.add_argument("--gene-scores")
    parser.add_argument("--gene-score-covariates")
    parser.add_argument("--gene-score-platform")
    parser.add_argument("--gene-score-id-map")
    parser.add_argument("--gene-score-model", choices=("lm", "lmm"), default="lm")
    parser.add_argument("--gene-score-type", choices=("max", "sum"), default="max")
    parser.add_argument("--gene-score-affected-only", action="store_true")
    parser.add_argument("--grm-prefix")
    parser.add_argument("--rscript", default="Rscript")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8092)
    args = parser.parse_args(argv)
    if not args.evidence and not args.bioindex_host:
        parser.error("provide --evidence or --bioindex-host")
    access_token = None
    if args.bioindex_access_token_file:
        from pathlib import Path
        access_token = Path(args.bioindex_access_token_file).read_text().strip()

    gene_runner = (
        GeneScoreContextRunner(
            args.gene_scores,
            args.gene_score_covariates or args.covariates,
            model=args.gene_score_model,
            score_type=args.gene_score_type,
            affected_only=args.gene_score_affected_only,
            platform_path=args.gene_score_platform,
            score_id_map=args.gene_score_id_map,
            grm_prefix=args.grm_prefix,
            rscript=args.rscript,
        )
        if args.gene_scores else None
    )
    engine = ContextAnalysisEngine(
        args.hpo_matrix,
        args.overlap_roster,
        args.evidence,
        covariate_path=args.covariates,
        gene_association_runner=gene_runner,
        bioindex_host=args.bioindex_host,
        bioindex_access_token=access_token,
        bioindex_evidence_index=args.bioindex_evidence_index,
    )
    server = create_server((args.host, args.port), engine)
    print(f"pb_Gene Context API listening on http://{args.host}:{server.server_port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
