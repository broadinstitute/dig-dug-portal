"""Join the approved HPO, metadata, roster, and PCA inputs for the Gene Context API.

The output stays private on the machine running the API. Variant carrier rows
are queried separately from the private BioIndex gene-samples index.
"""

import argparse
import csv
import gzip
from pathlib import Path


def read_rows(path):
    with open(path, newline="") as handle:
        yield from csv.DictReader(handle, delimiter="\t")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--roster", required=True)
    parser.add_argument("--pca", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    destination = Path(args.output_dir)
    if destination.exists():
        parser.error("output directory already exists")
    hpo_path = Path(args.hpo_matrix).resolve()
    opener = gzip.open if hpo_path.suffix == ".gz" else open
    hpo_ids = set()
    with opener(hpo_path, "rt") as handle:
        header = handle.readline()
        if not header.startswith("sample_id\t"):
            parser.error("HPO matrix must start with sample_id")
        for line in handle:
            hpo_ids.add(line.partition("\t")[0])

    metadata = {row["sample_id"]: row for row in read_rows(args.metadata)}
    pca = {row["sample_id"]: row for row in read_rows(args.pca)}
    roster = [row for row in read_rows(args.roster)
              if row["sample_id"] in hpo_ids
              and row["sample_id"] in metadata
              and row["sample_id"] in pca]
    if not roster:
        parser.error("no samples overlap HPO, metadata, roster, and PCA")

    destination.mkdir(parents=True)
    (destination / hpo_path.name).symlink_to(hpo_path)
    with (destination / "roster.tsv").open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(("sample_id", "overlap_status"))
        writer.writerows((row["sample_id"], "both") for row in roster)

    columns = ["sample_id", "age", "sex", "affected", "WES_WGS",
               "vcf_sample_id", *(f"PC{i}" for i in range(1, 11))]
    with (destination / "covariates.tsv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, delimiter="\t")
        writer.writeheader()
        for row in roster:
            sample_id = row["sample_id"]
            source = metadata[sample_id]
            pcs = pca[sample_id]
            vcf_id = row.get("vcf_sample_id") or pcs.get("vcf_sample_id") or ""
            platform = ("WES" if vcf_id.endswith("_E38") else
                        "WGS" if vcf_id.endswith("_G38") else
                        str(source.get("test_source") or "").strip().upper())
            if platform not in {"WES", "WGS"}:
                parser.error(f"unknown WES/WGS platform for {sample_id}")
            writer.writerow({
                "sample_id": sample_id,
                "age": source.get("age", ""),
                "sex": source.get("sex", ""),
                "affected": source.get("affected", ""),
                "WES_WGS": platform,
                "vcf_sample_id": vcf_id,
                **{f"PC{i}": pcs[f"PC{i}"] for i in range(1, 11)},
            })
    print(f"PB_GENE_INPUTS_READY samples={len(roster)} path={destination.resolve()}")


if __name__ == "__main__":
    main()
