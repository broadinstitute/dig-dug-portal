"""Private, indexed GRS>0 membership from the existing gene-score source.

No regression is refit. Only samples in the approved analysis roster with
observed score-source rows have coverage; missing coverage never becomes zero.
"""
import argparse
from array import array
import csv
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import re
from threading import Lock

import numpy as np
from scipy import sparse


class SampleGeneScores:
    def __init__(self, score_path, covariate_path, roster_path):
        with open(roster_path, newline="") as handle:
            eligible = {row["sample_id"] for row in csv.DictReader(handle, delimiter="\t") if row["overlap_status"] == "both"}
        self.source_rows = {}
        self.aliases = {}
        with open(covariate_path, newline="") as handle:
            for row in csv.DictReader(handle, delimiter="\t"):
                if row["sample_id"] not in eligible:
                    continue
                score_id = row.get("score_sample_id") or row["sample_id"]
                if score_id in self.source_rows:
                    raise ValueError("duplicate score sample ID")
                index = len(self.source_rows)
                self.source_rows[score_id] = index
                for value in (row["sample_id"], row.get("vcf_sample_id", "")):
                    if not value:
                        continue
                    for alias in {value, re.sub(r"_[EG]38$", "", value, flags=re.I)}:
                        if alias in self.aliases and self.aliases[alias] != index:
                            raise ValueError("ambiguous browser sample ID")
                        self.aliases[alias] = index
        if len(self.source_rows) != len(eligible):
            raise ValueError("analysis roster/covariate mismatch")
        self.score_path = score_path
        self.lock = Lock()
        self.matrices = None

    def _load(self):
        with self.lock:
            if self.matrices is not None:
                return
            genes, gene_index, seen = [], {}, set()
            coordinates = {key: (array("I"), array("I")) for key in ("max", "sum")}
            with open(self.score_path, buffering=1024 * 1024) as handle:
                columns = handle.readline().rstrip("\r\n").split("\t")
                at = {key: columns.index(key) for key in ("sample_id", "gene_symbol", "gene_score_max", "gene_score_sum")}
                for line in handle:
                    fields = line.rstrip("\r\n").split("\t")
                    symbol = fields[at["gene_symbol"]].upper()
                    if symbol not in gene_index:
                        gene_index[symbol] = len(genes)
                        genes.append(symbol)
                    sample = self.source_rows.get(fields[at["sample_id"]])
                    if sample is None:
                        continue
                    seen.add(sample)
                    for key, (rows, cols) in coordinates.items():
                        score = float(fields[at["gene_score_" + key]])
                        if not math.isfinite(score) or score < 0:
                            raise ValueError("invalid gene score")
                        if score > 0:
                            rows.append(sample)
                            cols.append(gene_index[symbol])
            matrices = {}
            for key, (rows, cols) in coordinates.items():
                matrix = sparse.coo_matrix((np.ones(len(rows), dtype=bool), (np.asarray(rows), np.asarray(cols))), shape=(len(self.source_rows), len(genes))).tocsr()
                matrix.sum_duplicates()
                matrix.sort_indices()
                matrices[key] = matrix
            self.genes = genes
            self.covered = seen
            self.matrices = matrices

    def query(self, sample_ids, score_type="max"):
        self._load()
        matrix = self.matrices[score_type]
        available, unavailable, memberships = [], [], {}
        for sample_id in sample_ids:
            index = self.aliases.get(sample_id)
            if index is None or index not in self.covered:
                unavailable.append(sample_id)
                continue
            available.append(sample_id)
            memberships[sample_id] = matrix.indices[matrix.indptr[index]:matrix.indptr[index + 1]].tolist()
        return {"score_type": score_type, "definition": "existing gene_score > 0", "analysis_sample_count": len(self.source_rows),
                "genes": self.genes, "available_sample_ids": available, "unavailable_sample_ids": unavailable,
                "sample_gene_indices": memberships}


def parse_request(payload):
    if not isinstance(payload, dict):
        raise ValueError("expected an object")
    ids = payload.get("sample_ids")
    if not isinstance(ids, list) or not 1 <= len(ids) <= 20000:
        raise ValueError("sample_ids must contain 1 to 20000 samples")
    if any(not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_.-]{1,120}", value) for value in ids):
        raise ValueError("invalid sample ID")
    score_type = payload.get("score_type", "max")
    if score_type not in {"max", "sum"}:
        raise ValueError("invalid score_type")
    return list(dict.fromkeys(ids)), score_type


def create_server(address, engine):
    class Handler(BaseHTTPRequestHandler):
        def send(self, status, value):
            body = json.dumps(value, allow_nan=False, separators=(",", ":")).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self.send(200 if self.path == "/health" else 404, {"status": "ok"} if self.path == "/health" else {"error": "not_found"})

        def do_POST(self):
            if self.path != "/phenotype-analyzer-api/sample-gene-scores":
                self.send(404, {"error": "not_found"})
                return
            try:
                length = int(self.headers.get("Content-Length") or 0)
                if not 0 < length <= 1024 * 1024:
                    raise ValueError("invalid request size")
                ids, score_type = parse_request(json.loads(self.rfile.read(length)))
                self.send(200, engine.query(ids, score_type))
            except (ValueError, KeyError, TypeError) as error:
                self.send(400, {"error": "invalid_request", "detail": str(error)})
            except Exception:
                self.send(500, {"error": "sample_gene_scores_unavailable"})

        def log_message(self, *args):
            pass
    return ThreadingHTTPServer(address, Handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gene-scores", required=True)
    parser.add_argument("--covariates", required=True)
    parser.add_argument("--roster", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8094)
    args = parser.parse_args()
    engine = SampleGeneScores(args.gene_scores, args.covariates, args.roster)
    server = create_server((args.host, args.port), engine)
    print(f"Private GRS membership API ready on {args.host}:{server.server_port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
