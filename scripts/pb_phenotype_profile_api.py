"""Local CRDC phenotype profile API using the existing residual PheRS scorer.

This serves only /phenotype-analyzer-api/profile. It does not provide the
gene/variant association routes, which require a separate analysis roster.
"""

import argparse
import csv
import re
import gzip
import json
from pathlib import Path
from functools import lru_cache

import numpy as np

from scripts.pb_gene_context_api_server import create_server
from scripts.pb_gene_context_validation import load_hpo_matrix
from scripts.rphers_fast import score_samples
from scripts.rphers_standardization import standardized_value
from scripts.pb_profile_metadata import load_profile_metadata


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
        self.metadata, self.metadata_source = load_profile_metadata(metadata_path)
        if not set(self.metadata).intersection(map(str, self.hpo['sample_ids'])):
            raise ValueError('CRDC metadata has no sample IDs matching the HPO matrix.')
        self.cohort = {}
        with open(cohort_mapping_path, newline="") as handle:
            for row in csv.DictReader(handle):
                sample_id = row.get("de_identified_subject")
                name = row.get("clean_name")
                if sample_id and name and (sample_id not in self.cohort or row.get("cohort_type") == "Primary"):
                    self.cohort[sample_id] = name

    def sample_matches(self, sample_id):
        sample_id = re.sub(r'_[EG]38$', '', sample_id, flags=re.I)
        info = self.metadata.get(sample_id)
        if info is None:
            raise ValueError('Sample metadata not found.')
        terms = tuple(sorted(set(re.findall(r'HP:\d{7}', info.get('hpo_terms_raw') or ''))))
        if not terms:
            raise ValueError('No recorded HPO terms for this sample.')
        missing = [term for term in terms if term not in self.column_index]
        if missing:
            raise ValueError('Recorded HPO terms missing from scoring matrix: ' + ', '.join(missing))
        scored = self._scoring(terms)
        # Metadata `family` is a relationship (index/mother/etc.), not an ID.
        def family(value):
            found = re.fullmatch(r'(BCH-\d{2}-\d{5})-\d{2}', value, flags=re.I)
            return found.group(1).upper() if found else None
        family_id = family(sample_id)
        ids = list(map(str, self.hpo['sample_ids']))
        eligible = [i for i in scored['order'] if ids[i] != sample_id
                    and not (family_id and family(ids[i]) == family_id)
                    and scored['total_sample_hpo_terms'][i] > 0]
        rows, projects = [], {}
        for i in eligible:
            sid = ids[i]
            metadata = self.metadata.get(sid, {})
            investigator = metadata.get('investigator') or 'Unavailable'
            project = self.cohort.get(sid) or 'Unavailable'
            residual = float(scored['phenotype_match_score_resid'][i])
            projects.setdefault(project, []).append(residual)
            if len(rows) < 50:
                sex = str(metadata.get('sex') or '').lower()
                rows.append({'rank': len(rows) + 1, 'sampleId': sid,
                    'matchedHpo': int(scored['matched_query_terms'][i]),
                    'residual': residual, 'rphersZ': float(scored['rphers_z'][i]),
                    'investigator': investigator, 'project': project, 'age': _age(metadata.get('age')),
                    'sex': sex if sex in {'male', 'female'} else 'Unavailable'})
        summaries = []
        for project, values in projects.items():
            q1, median, q3 = map(float, np.quantile(values, [.25, .5, .75]))
            summaries.append({'project': project, 'medianResidual': median,
                'q1': q1, 'q3': q3, 'iqr': f'{q1:.2f}–{q3:.2f}', 'n': len(values),
                'currentGroup': project != 'Unavailable' and project == self.cohort.get(sample_id)})
        summaries.sort(key=lambda row: (-row['medianResidual'], row['project']))
        for rank, row in enumerate(summaries, 1):
            row['rank'] = rank
        return {'sample_id': sample_id, 'reference_hpo_count': len(terms), 'reference_hpo_ids': list(terms),
            'eligible_sample_count': len(eligible), 'excluded_self_family_count': sum(sid == sample_id or bool(family_id and family(sid) == family_id) for sid in ids),
            'family_exclusion_method': 'canonical BCH family ID prefix',
            'phenotypeMatches': rows, 'projectPhenotypeSummary': summaries,
            'scoring_method': 'rphers_fast.score_samples; wp=IC, fi=binary; residual descending; all HPO-annotated nonfamily candidates',
            'rphers_standardization': scored['rphers_standardization']}

    @lru_cache(maxsize=8)
    def sample_variants(self, sample_id):
        sample_id = re.sub(r'_[EG]38$', '', sample_id, flags=re.I)
        if sample_id not in self.metadata:
            raise ValueError('Sample metadata not found.')
        path = getattr(self, 'sample_variant_source', None)
        if not path or not Path(path).is_file():
            raise ValueError('Processed sample variant source is not configured.')
        variants = []
        with gzip.open(path, 'rt') as handle:
            for line in handle:
                if sample_id not in line:
                    continue
                row = json.loads(line)
                if row.get('sample_id') != sample_id:
                    continue
                variants.append(row)
        return {'sample_id': sample_id, 'rows': variants,
            'data_version': '2025_crdc_16366_dp20_af001_20260907',
            'scope': 'Nonsynonymous variants, DP ≥ 20, cohort allele frequency < 0.01; processed evidence source',
            'genome_build': 'GRCh38', 'complete_genome': False}

    @lru_cache(maxsize=8)
    def _scoring(self, terms):
        missing = [term for term in terms if term not in self.column_index]
        if missing:
            raise ValueError("HPO terms are absent from the CRDC matrix: " + ", ".join(missing))
        return score_samples(
            self.hpo["matrix"], self.hpo["hpo_columns"], terms,
            sample_ids=self.hpo["sample_ids"],
        )

    @lru_cache(maxsize=8)
    def _ranked(self, terms):
        scored = self._scoring(terms)
        reference = scored["rphers_standardization"]
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
                "rphers_z": standardized_value(scored["phenotype_match_score_resid"][index], reference, center=True),
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
            "rphers_standardization": self._scoring(terms)["rphers_standardization"],
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--cohort-mapping", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8092)
    parser.add_argument("--sample-variant-source")
    args = parser.parse_args()
    engine = ProfileEngine(args.hpo_matrix, args.metadata, args.cohort_mapping)
    engine.sample_variant_source = args.sample_variant_source
    server = create_server((args.host, args.port), engine, profile_only=True)
    print(f"Phenotype profile API ready on {args.host}:{args.port} ({len(engine.hpo['sample_ids'])} samples)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
