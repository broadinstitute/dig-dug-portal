#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from pathlib import Path


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_obo(path):
    terms = {}
    for block in Path(path).read_text(encoding="utf-8").split("\n\n"):
        if not block.startswith("[Term]\n"):
            continue
        term = {"parents": []}
        for line in block.splitlines()[1:]:
            if line.startswith("id: "):
                term["id"] = line[4:]
            elif line.startswith("name: "):
                term["name"] = line[6:]
            elif line.startswith("def: "):
                match = re.match(r'def: "(.*)" \[', line)
                if match:
                    term["definition"] = match.group(1).replace(r'\"', '"')
            elif line.startswith("is_a: "):
                term["parents"].append(line[6:].split(" ! ", 1)[0])
        if term.get("id"):
            terms[term["id"]] = term

    children = defaultdict(list)
    for term_id, term in terms.items():
        for parent_id in term["parents"]:
            children[parent_id].append(term_id)
    for term_id, term in terms.items():
        term["children"] = sorted(children[term_id], key=lambda item: terms[item].get("name", item))
    return terms


def product6_genes(path):
    root = ET.parse(path).getroot()
    genes_by_disorder = {}
    for disorder in root.findall(".//Disorder"):
        code = disorder.findtext("OrphaCode")
        genes, seen = [], set()
        for association in disorder.findall("DisorderGeneAssociationList/DisorderGeneAssociation"):
            symbol = association.findtext("Gene/Symbol")
            if not symbol or symbol in seen:
                continue
            seen.add(symbol)
            genes.append([
                symbol,
                association.findtext("DisorderGeneAssociationType/Name") or "",
                association.findtext("DisorderGeneAssociationStatus/Name") or "",
            ])
        if code:
            genes_by_disorder[code] = genes
    return root.attrib, genes_by_disorder


def product4_index(path, genes_by_disorder):
    root = ET.parse(path).getroot()
    diseases, associations = [], defaultdict(list)
    for status in root.findall(".//HPODisorderSetStatus"):
        disorder = status.find("Disorder")
        if disorder is None:
            continue
        code = disorder.findtext("OrphaCode") or ""
        disease_associations = disorder.findall("HPODisorderAssociationList/HPODisorderAssociation")
        diagnostic_ids = [
            item.findtext("HPO/HPOId")
            for item in disease_associations
            if item.findtext("DiagnosticCriteria/Name") and item.findtext("HPO/HPOId")
        ]
        disease_index = len(diseases)
        diseases.append([
            code,
            disorder.findtext("Name") or f"ORPHA:{code}",
            genes_by_disorder.get(code, []),
            diagnostic_ids,
        ])
        for item in disease_associations:
            hpo_id = item.findtext("HPO/HPOId")
            if not hpo_id:
                continue
            associations[hpo_id].append([
                disease_index,
                item.findtext("HPOFrequency/Name") or "Unknown",
                1 if item.findtext("DiagnosticCriteria/Name") else 0,
            ])
    return root.attrib, diseases, associations


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--product4", required=True)
    parser.add_argument("--product6", required=True)
    parser.add_argument("--hpo-obo", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    terms = parse_obo(args.hpo_obo)
    product6_meta, genes_by_disorder = product6_genes(args.product6)
    product4_meta, diseases, associations = product4_index(args.product4, genes_by_disorder)

    referenced_ids = set(associations)
    for term_id in list(referenced_ids):
        term = terms.get(term_id, {})
        referenced_ids.update(term.get("parents", []))
        referenced_ids.update(term.get("children", []))
    term_index = {
        term_id: [
            terms[term_id].get("name", term_id),
            terms[term_id].get("definition", ""),
            terms[term_id].get("parents", []),
            terms[term_id].get("children", []),
        ]
        for term_id in sorted(referenced_ids)
        if term_id in terms
    }

    seizure = associations["HP:0001250"]
    counts = Counter(item[1] for item in seizure)
    assert len(seizure) == 1060
    assert sum(item[2] for item in seizure) == 5
    assert counts["Obligate (100%)"] == 9
    assert len(term_index["HP:0001250"][2]) == 1
    assert len(term_index["HP:0001250"][3]) == 12

    payload = {
        "meta": {
            "hpoOBO": Path(args.hpo_obo).name,
            "product4Date": product4_meta.get("date", ""),
            "product4Version": product4_meta.get("version", ""),
            "product4Sha256": sha256(args.product4),
            "product6Date": product6_meta.get("date", ""),
            "product6Version": product6_meta.get("version", ""),
            "product6Sha256": sha256(args.product6),
        },
        "terms": term_index,
        "diseases": diseases,
        "associations": associations,
    }
    output = "// Generated by scripts/build_pb_phenotype_reference.py.\n"
    output += f"export const ORPHANET_REFERENCE = {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))};\n"
    Path(args.output).write_text(output, encoding="utf-8")
    print(
        "PB_PHENOTYPE_REFERENCE_PASS",
        len(associations), "HPO terms",
        len(diseases), "diseases",
        sum(map(len, associations.values())), "associations",
    )


if __name__ == "__main__":
    main()
