"""Build a private, release-bound n_terms lookup from the rPheRS input matrix.

The scorer's n_terms is the row sum of the parent-expanded binary HPO matrix.
This lookup does not use metadata total_terms or count browser tree nodes.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

VERSION = "rphers_matrix_n_terms_v1"


def build_counts(matrix_path):
    matrix_path = Path(matrix_path)
    opener = gzip.open if matrix_path.suffix == ".gz" else open
    counts = {}
    with opener(matrix_path, "rt") as handle:
        header = handle.readline().rstrip("\r\n").split("\t")
        if len(header) < 2 or header[0] != "sample_id" or len(set(header[1:])) != len(header[1:]):
            raise ValueError("Expected sample_id and unique HPO matrix columns")
        for line in handle:
            values = line.rstrip("\r\n").split("\t")
            sample_id, terms = values[0], values[1:]
            if not sample_id or sample_id in counts or len(terms) != len(header) - 1:
                raise ValueError("Invalid or duplicate matrix sample row")
            total = 0
            for value in terms:
                numeric = float(value)
                if numeric not in (0, 1):
                    raise ValueError("HPO matrix must be binary")
                total += int(numeric)
            counts[sample_id] = total
    if not counts:
        raise ValueError("HPO matrix has no samples")
    digest = hashlib.sha256()
    with matrix_path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return {"version": VERSION, "source_matrix": matrix_path.name,
            "source_matrix_sha256": digest.hexdigest(), "n_samples": len(counts),
            "n_hpo_columns": len(header) - 1, "n_terms_by_sample": counts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    payload = build_counts(args.hpo_matrix)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(output.name + ".building")
    temporary.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    temporary.replace(output)
    print(f"PB_HPO_TERM_COUNTS_READY samples={payload['n_samples']} columns={payload['n_hpo_columns']} sha256={payload['source_matrix_sha256']}")


if __name__ == "__main__":
    main()
