"""Export only gene symbols and provenance from an approved private score file."""
import argparse
from collections import Counter
import csv
import hashlib
import json
from pathlib import Path
import re


def build_catalog(source):
    digest, genes, missing, count = hashlib.sha256(), set(), Counter(), 0
    with source.open("rb") as handle:
        header = handle.readline()
        digest.update(header)
        columns = next(csv.reader([header.decode()], delimiter="\t"))
        index = columns.index("gene_symbol")
        for line in handle:
            digest.update(line)
            cells = next(csv.reader([line.decode()], delimiter="\t"))
            gene = cells[index].strip().upper()
            if not gene:
                missing[""] += 1
            elif not re.fullmatch(r"[A-Z0-9][A-Z0-9.-]{0,63}", gene):
                raise ValueError("The source contains a gene symbol unsupported by the existing API")
            else:
                genes.add(gene)
            count += 1
    if not genes or len(genes) > 25000:
        raise ValueError("The complete gene catalog must fit the existing API's 25000-gene limit")
    return {"source": source.name, "sha256": digest.hexdigest(), "n_rows": count,
            "invalid_symbols": dict(missing), "genes": sorted(genes)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gene-scores", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = build_catalog(args.gene_scores)
    content = json.dumps(result, separators=(",", ":")) + "\n"
    if args.output:
        args.output.write_text(content)
        print(f"Gene catalog: {len(result['genes'])} symbols; SHA256 {result['sha256']}")
    else:
        print(content, end="")
