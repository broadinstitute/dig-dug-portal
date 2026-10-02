#!/usr/bin/env python3
"""Build the static PIGEAN discovery sidecar and an explicitly labeled T2D example.

Inputs are captured BioIndex responses plus the portal phenotype TSV. This does
not claim factor-key coverage equals gene/gene-set coverage or refresh live data.
"""
import argparse
import csv
from datetime import datetime
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path


def read(path):
    return json.loads(path.read_text())


PHENOTYPE_FIELDS = (
    "portal_id", "description", "trait_group", "legacy_trait_group",
    "gwas_source_category", "trait_type", "is_dichotomous", "is_complex", "pigean_id",
)
MAPPING_FIELDS = {
    "target_id": "target_id", "target_label": "target_label", "target_ontology": "target_ontology",
    "predicate": "mapping_predicate", "justification": "mapping_justification", "source": "source",
}


def phenotype_metadata(path):
    """Keep every mapping assertion, including its predicate and provenance."""
    records = {}
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle, delimiter="\t"):
            key = row.get("phenotype") or row.get("legacy_phenotype_id")
            if not key:
                raise ValueError("Phenotype metadata row has no legacy identifier")
            entry = {"id": key, "name": row.get("phenotype_name") or row.get("name") or key,
                     **{field: row.get(field, "") for field in PHENOTYPE_FIELDS},
                     "mapping_count": int(row.get("mapping_count") or 0)}
            if key not in records:
                records[key] = {**entry, "mappings": []}
            elif any(records[key][field] != value for field, value in entry.items()):
                raise ValueError(f"Conflicting phenotype metadata for {key}")
            if row.get("target_id"):
                confidence = row.get("confidence", "")
                mapping = {**{field: row.get(source, "") for field, source in MAPPING_FIELDS.items()},
                           "confidence": float(confidence) if confidence else None}
                if mapping not in records[key]["mappings"]:
                    records[key]["mappings"].append(mapping)
    for record in records.values():
        record["mappings"].sort(key=lambda m: (-(m["confidence"] if m["confidence"] is not None else -1), m["target_ontology"], m["target_id"]))
    return records


def phenotype_lookup(records, keys):
    """Resolve source keys without changing the keys sent to BioIndex.

    Exact legacy/PIGEAN IDs take priority. CFDE uses embedded Orphanet IDs and
    retains hyphens that are absent from some portal GWAS Catalog IDs. These
    limited aliases must identify exactly one metadata record; fuzzy name or
    ontology-equivalence matching is deliberately not used.
    """
    aliases = defaultdict(set)
    for key, row in records.items():
        if row["pigean_id"]:
            aliases[("pigean_id", row["pigean_id"])].add(key)
        match = re.search(r"(Orphanet_\d+)$", key)
        if row["gwas_source_category"] == "rare_v2" and match:
            target = "ORPHANET:" + match[1].split("_")[-1]
            if any(m["target_id"].upper() == target and m["predicate"] == "skos:exactMatch" for m in row["mappings"]):
                aliases[("embedded_orphanet_id", match[1])].add(key)
                aliases[("embedded_orphanet_id", "rare_v2_" + match[1])].add(key)
        if key.startswith("gcat_trait_"):
            aliases[("gcat_hyphen_variant", key.replace("-", ""))].add(key)
    lookup = {}
    source_aliases = {key for (method, key) in aliases if method in {"pigean_id", "embedded_orphanet_id"}}
    for key in set(keys) | set(records) | source_aliases:
        if key in records:
            lookup[key] = {"id": key, "match": "legacy_id"}
            continue
        candidates = [("pigean_id", key), ("embedded_orphanet_id", key)]
        if key.startswith("gcat_trait_"):
            candidates.append(("gcat_hyphen_variant", key.replace("-", "")))
        for method, candidate in candidates:
            matches = aliases[(method, candidate)]
            if len(matches) == 1:
                lookup[key] = {"id": next(iter(matches)), "match": method}
                break
            if matches:
                break  # An ambiguous explicit alias must never fall through to a weaker match.
    return lookup


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cfde-source", type=Path, required=True)
    parser.add_argument("--phenotypes", type=Path, required=True)
    parser.add_argument("--phenotype-revision", help="Source repository commit for provenance")
    parser.add_argument("--output", type=Path, default=Path("public/pigean/registry"))
    args = parser.parse_args()
    keys_path = args.cfde_source / "factor-keys.json"
    manifest = read(args.cfde_source / "manifest.json")
    keys = read(keys_path)["keys"]
    discovered = {key[0] for key in keys if key[1] == "cfde-inc-v2"}
    metadata = phenotype_metadata(args.phenotypes)
    lookup = phenotype_lookup(metadata, discovered)
    traits = {}
    # Keep the advertised BioIndex keys intact, even when metadata uses an alias.
    for key in set(metadata) | discovered:
        resolved = lookup.get(key)
        row = metadata.get(resolved["id"]) if resolved else None
        traits[key] = {"id": key, "name": row["name"] if row else key,
                       "portal_id": row["portal_id"] if row else "",
                       "group": row["gwas_source_category"] if row else "",
                       "metadataId": resolved["id"] if resolved else None,
                       "metadataMatch": resolved["match"] if resolved else None,
                       "searchTerms": sorted({value for m in (row["mappings"] if row else []) for value in (m["target_id"], m["target_label"]) if value}),
                       "models": ["cfde-inc-v2"] if key in discovered else []}
    catalog_date = datetime.fromisoformat(manifest["finished_at"]).date().isoformat()
    phenotype_source = {"name": "DIG portal phenotype data model", "version": args.phenotypes.parent.name,
                        "file": "versions/phenotype/" + args.phenotypes.parent.name + "/" + args.phenotypes.name,
                        "sha256": hashlib.sha256(args.phenotypes.read_bytes()).hexdigest(),
                        "revision": args.phenotype_revision}
    registry = {"schemaVersion": 2, "snapshotDate": catalog_date,
        "scope": "Phenotype metadata plus CFDE v2 factor-key discovery. Model membership describes factor-key discovery only, not exhaustive gene or gene-set coverage. Small/large availability is checked by querying the selected source.",
        "sources": {"cfde": manifest["source"], "factorKeysSha256": hashlib.sha256(keys_path.read_bytes()).hexdigest(),
            "phenotypesSha256": phenotype_source["sha256"], "phenotypes": phenotype_source},
        "traits": sorted(traits.values(), key=lambda row: row["id"])}
    phenotype_export = {"schemaVersion": 1, "source": phenotype_source, "lookup": lookup,
                        "coverage": {"phenotypes": len(metadata), "mappings": sum(len(r["mappings"]) for r in metadata.values()),
                                     "discoveredKeys": len(discovered), "resolvedKeys": len(discovered & lookup.keys())},
                        "phenotypes": metadata}
    snapshot = {"model": "cfde-inc-v2", "phenotype": "T2D", "source": manifest["source"]}
    retrieval_dates = []
    for name, index in [("genes", "pigean-gene-phenotype"), ("geneSets", "pigean-gene-set-phenotype")]:
        result = read(args.cfde_source / "t2d" / (index + ".json"))
        if not result["complete"] or result["restricted"] or len(result["data"]) != result["row_count"]:
            raise ValueError("Incomplete source fixture: " + index)
        snapshot[name] = {"data": result["data"], "source": result["url"], "complete": True,
            "retrievedAt": result["retrieved_at"], "pages": result["pages"]}
        retrieval_dates.append(datetime.fromisoformat(result["retrieved_at"]).date().isoformat())
    snapshot["snapshotDate"] = max(retrieval_dates)
    args.output.mkdir(parents=True, exist_ok=True)
    # Construct all artifacts before replacing either output.
    for name, content in [("catalog.json", registry), ("phenotypes.json", phenotype_export), ("cfde-t2d.json", snapshot)]:
        temp = args.output / (name + ".tmp")
        temp.write_text(json.dumps(content, separators=(",", ":")) + "\n")
        temp.replace(args.output / name)
    print(f"Wrote {len(traits)} suggestions, {len(metadata)} phenotype records, {phenotype_export['coverage']['mappings']} ontology mappings, and the captured CFDE T2D example.")


if __name__ == "__main__":
    main()
