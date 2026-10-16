"""Local CRDC phenotype profile API using the existing residual PheRS scorer.

This serves only /phenotype-analyzer-api/profile. It does not provide the
gene/variant association routes, which require a separate analysis roster.
"""

import argparse
import csv
from functools import lru_cache

import numpy as np

from scripts.pb_gene_context_api_server import create_server
from scripts.pb_gene_context_validation import load_hpo_matrix
from scripts.rphers_fast import score_samples


def _age(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if np.isfinite(number) and 0 <= number <= 100 else None


class ProfileEngine:
    def __init__(self, hpo_matrix, metadata_path, cohort_mapping_path):
        self.hpo = load_hpo_matrix(hpo_matrix, [])
        self.column_index = {term: index for index, term in enumerate(self.hpo["hpo_columns"])}
        self.metadata = {}
        with open(metadata_path, newline="") as handle:
            for row in csv.DictReader(handle, delimiter="\t"):
                sample_id = row.get("sample_id")
                if sample_id:
                    self.metadata[sample_id] = row
        self.cohort = {}
        with open(cohort_mapping_path, newline="") as handle:
            for row in csv.DictReader(handle):
                sample_id = row.get("de_identified_subject")
                name = row.get("clean_name")
                if sample_id and name and (sample_id not in self.cohort or row.get("cohort_type") == "Primary"):
                    self.cohort[sample_id] = name

    @lru_cache(maxsize=8)
    def _ranked(self, terms):
        missing = [term for term in terms if term not in self.column_index]
        if missing:
            raise ValueError("HPO terms are absent from the CRDC matrix: " + ", ".join(missing))
        scored = score_samples(
            self.hpo["matrix"], self.hpo["hpo_columns"], terms,
            sample_ids=self.hpo["sample_ids"],
        )
        matrix = self.hpo["matrix"]
        rows = []
        for index in scored["order"]:
            matched = int(scored["matched_query_terms"][index])
            if not matched:
                continue
            sample_id = str(self.hpo["sample_ids"][index])
            info = self.metadata.get(sample_id, {})
            sex = str(info.get("sex") or "").strip().lower()
            affected = str(info.get("affected") or "").strip().upper()
            observed = [self.hpo["hpo_columns"][column] for column in matrix.indices[matrix.indptr[index]:matrix.indptr[index + 1]]]
            rows.append({
                "sample_id": sample_id,
                "unique_sample_ID": sample_id,
                "residual_phers": float(scored["phenotype_match_score_resid"][index]),
                "exact_match_count": matched,
                "matches": f"{matched}/{len(terms)}",
                "expanded_hpo_ids": observed,
                "age_at_enrollment": _age(info.get("age")),
                "gender": "female" if sex in {"female", "f"} else "male" if sex in {"male", "m"} else "unknown",
                "initial_study_affected": affected if affected in {"Y", "N"} else "",
                "cohort_category": self.cohort.get(sample_id, ""),
            })
        return rows

    def phenotype_profile(self, query_hpo, filters=None, page=1, page_size=25):
        terms = tuple(sorted(set(query_hpo)))
        rows = self._ranked(terms)
        filters = filters or {}
        sex = filters.get("sex")
        exact_age = filters.get("exact_age")
        if sex:
            rows = [row for row in rows if row["gender"].capitalize() == sex]
        if exact_age is not None:
            rows = [row for row in rows if row["age_at_enrollment"] == exact_age]
        ages = [row["age_at_enrollment"] for row in rows if row["age_at_enrollment"] is not None]
        offset = (page - 1) * page_size
        return {
            "query_hpo_ids": list(terms),
            "summary": {
                "eligible_sample_count": len(rows),
                "complete_match_sample_count": sum(row["exact_match_count"] == len(terms) for row in rows),
                "median_exact_age": float(np.median(ages)) if ages else None,
            },
            "samples": rows[offset:offset + page_size],
            "pagination": {
                "page": page, "page_size": page_size, "total": len(rows),
                "next": page + 1 if offset + page_size < len(rows) else None,
            },
            "scoring_method": "residual PheRS: rphers_fast.score_samples",
            "cohort_sample_count": len(self.hpo["sample_ids"]),
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--cohort-mapping", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8092)
    args = parser.parse_args()
    engine = ProfileEngine(args.hpo_matrix, args.metadata, args.cohort_mapping)
    server = create_server((args.host, args.port), engine, profile_only=True)
    print(f"Phenotype profile API ready on {args.host}:{args.port} ({len(engine.hpo['sample_ids'])} samples)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
