"""Build complete, unweighted disease HPO profiles from the local reference release."""
import argparse
from collections import defaultdict
import csv
import hashlib
import json
from pathlib import Path

from build_pb_phenotype_reference import parse_obo, sha256


def read_rows(root, filename):
    with (root / filename).open(newline="") as handle:
        yield from csv.DictReader(handle, delimiter="\t")


def build(root, obo, orphanet):
    files = ["hpo_disease_phenotype_positive.tsv", "hpo_gene_disease.tsv",
             "ddg2p_gene_disease_hpo.tsv", "disease_id_map.tsv"]
    ontology = parse_obo(obo)
    phenotypes = set()
    pending = ["HP:0000118"]
    while pending:
        term = pending.pop()
        if term in phenotypes:
            continue
        phenotypes.add(term)
        pending.extend(ontology.get(term, {}).get("children", []))
    genes = defaultdict(set)
    for row in read_rows(root, "hpo_gene_disease.tsv"):
        gene = row["gene_symbol"].strip()
        if gene and gene != "NA":
            genes[row["source_disease_id"]].add(gene)
    mondo = defaultdict(set)
    for row in read_rows(root, "disease_id_map.tsv"):
        if row["mondo_id"].startswith("MONDO:"):
            mondo[row["source_disease_id"]].add(row["mondo_id"])
    records = {}
    evidence = set()
    for row in read_rows(root, "hpo_disease_phenotype_positive.tsv"):
        if row["disease_source"] not in {"OMIM", "DECIPHER"} or row["is_negated"].upper() == "TRUE":
            continue
        identifier = row["source_disease_id"]
        if row["aspect"] != "P" or row["hpo_id"] not in phenotypes:
            continue
        record = records.setdefault(identifier, {
            "source": row["disease_source"].lower(), "id": identifier,
            "name": row["disease_name"], "hpo": set(),
            "genes": genes[identifier], "mondo": mondo[identifier],
        })
        record["hpo"].add(row["hpo_id"])
        evidence.add(row["evidence_source"])
    for row in read_rows(root, "ddg2p_gene_disease_hpo.tsv"):
        if row["hpo_id"] not in phenotypes:
            continue
        gene, mim, name = row["gene_symbol"], row["disease_mim"], row["disease_name"]
        # DDG2P profiles describe a gene-condition record, including conditions
        # without an OMIM identifier. Keep distinct records distinct.
        key = "DDG2P:" + hashlib.sha256(json.dumps([gene, mim, name]).encode()).hexdigest()[:16]
        identifier = f"OMIM:{mim}" if mim.isdigit() else ""
        record = records.setdefault(key, {
            "source": "ddg2p", "id": identifier, "name": name,
            "hpo": set(), "genes": {gene}, "mondo": mondo[identifier],
        })
        record["hpo"].add(row["hpo_id"])
    base = json.loads(orphanet.read_text().split("export const ORPHANET_REFERENCE = ", 1)[1].rstrip(";\n"))
    missing_terms = {
        identifier: [term["name"], term.get("definition", ""), term["parents"], term["children"]]
        for identifier, term in ontology.items() if identifier not in base["terms"]
    }
    profiles = [
        [key, row["source"], row["id"], row["name"], sorted(row["hpo"]),
         sorted(row["genes"]), sorted(row["mondo"])]
        for key, row in sorted(records.items())
    ]
    return {
        "meta": {
            "files": {name: sha256(root / name) for name in files},
            "hpoOBO": obo.name, "hpoSha256": sha256(obo),
            "hpoEvidence": sorted(evidence),
            "ddg2pEvidence": "DDG2P_phenotypes (local reference release)",
            "annotationScope": "Phenotypic abnormality (HP:0000118) descendants; HPOA aspect P. Inheritance and clinical modifiers are not phenotype annotations.",
            "sourceCounts": {source: sum(row[1] == source for row in profiles)
                             for source in ["omim", "decipher", "ddg2p"]},
        },
        "terms": missing_terms, "profiles": profiles,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference-dir", type=Path, required=True)
    parser.add_argument("--hpo-obo", type=Path, required=True)
    parser.add_argument("--orphanet-reference", type=Path, default=Path("src/views/PbPhenotype/orphanetReference.generated.js"))
    parser.add_argument("--output", type=Path, default=Path("src/views/PbPhenotype/additionalDiseaseReferences.generated.json"))
    args = parser.parse_args()
    result = build(args.reference_dir, args.hpo_obo, args.orphanet_reference)
    args.output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print("Additional disease references:", result["meta"]["sourceCounts"])
