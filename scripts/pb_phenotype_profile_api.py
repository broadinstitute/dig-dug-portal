"""Local CRDC phenotype profile API using the existing residual PheRS scorer.

This serves only /phenotype-analyzer-api/profile. It does not provide the
gene/variant association routes, which require a separate analysis roster.
"""

import argparse
import re
import gzip
import json
import os
import hashlib
from pathlib import Path
from functools import lru_cache
from threading import RLock

from scripts.sample_overlap_index import SampleOverlapIndex, canonical_sample
from scripts.build_pb_genotype_index import SOURCE_SHA256

import numpy as np

from scripts.pb_gene_context_api_server import create_server
from scripts.pb_gene_context_validation import load_hpo_matrix
from scripts.rphers_fast import score_samples
from scripts.rphers_standardization import standardized_value
from scripts.pb_profile_metadata import load_profile_metadata, load_project_metadata


def default_sample_variant_source():
    if os.environ.get('PB_SAMPLE_VARIANT_SOURCE'):
        return os.environ['PB_SAMPLE_VARIANT_SOURCE']
    index = os.environ.get('PB_GENOTYPE_INDEX')
    if index:
        candidate = Path(index).parent / 'sample_variant_gene.jsonl.gz'
        if candidate.is_file():
            return str(candidate)
    # An older /private/tmp gene-only index need not have the original gzip
    # beside it. Reuse the persistent shared release installed by setup.
    cache = Path(__file__).resolve().parents[1] / '.pb-private-data/genotypes/shared/2025_crdc_16366_dp20_af001_20260907'
    return str(cache / 'sample_variant_gene.jsonl.gz')


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
        self.projects, self.project_metadata_source = load_project_metadata(cohort_mapping_path)
        self.cohort = {sample_id: row['clean_name'] for sample_id, row in self.projects.items()}
        self._overlap_lock = RLock()

    @staticmethod
    def _family(sample_id):
        found = re.fullmatch(r'(BCH-\d{2}-\d{5})-\d{2}', sample_id, flags=re.I)
        return found.group(1).upper() if found else None

    @staticmethod
    def _recorded_terms(info):
        return tuple(sorted(set(re.findall(r'HP:\d{7}', (info or {}).get('hpo_terms_raw') or ''))))

    def _overlap_index(self):
        # Lazy, once per service process; reuse the verified release already installed.
        if not hasattr(self, '_overlap_lock'):
            self._overlap_lock = RLock()
        with self._overlap_lock:
            if hasattr(self, '_sample_overlap'):
                return self._sample_overlap
            source = getattr(self, 'sample_variant_source', None)
            if not source:
                return None
            directory = Path(os.environ.get('PB_GENOTYPE_INDEX') or Path(source).parent / 'index')
            if not (directory / 'manifest.json').is_file():
                return None
            digest = hashlib.sha256()
            with Path(source).open('rb') as handle:
                for block in iter(lambda: handle.read(1024 * 1024), b''):
                    digest.update(block)
            if digest.hexdigest() != SOURCE_SHA256:
                raise ValueError('Sample variants and genotype overlap index do not use the same verified release.')
            self._sample_overlap = SampleOverlapIndex(directory)
            return self._sample_overlap

    def _match_reference(self, sample_id):
        sample_id = canonical_sample(sample_id)
        info = self.metadata.get(sample_id)
        if info is None:
            raise ValueError('Sample metadata not found.')
        terms = self._recorded_terms(info)
        missing = [term for term in terms if term not in self.column_index]
        if missing:
            raise ValueError('Recorded HPO terms missing from scoring matrix: ' + ', '.join(missing))
        return sample_id, info, terms

    def _sample_profile_scores(self, sample_id, scored):
        ids = list(map(str, self.hpo['sample_ids']))
        recorded = len(self._recorded_terms(self.metadata.get(sample_id)))
        if scored is None or sample_id not in ids:
            return {'recordedHpoCount': recorded, 'matchedHpo': None, 'rphersZ': None}
        i = ids.index(sample_id)
        if scored['total_sample_hpo_terms'][i] <= 0:
            return {'recordedHpoCount': recorded, 'matchedHpo': None, 'rphersZ': None}
        value = float(scored['rphers_z'][i])
        return {'recordedHpoCount': recorded, 'matchedHpo': int(scored['matched_query_terms'][i]),
                'rphersZ': value if np.isfinite(value) else None}

    def sample_matches(self, sample_id, *, include_project_inputs=False):
        sample_id, info, terms = self._match_reference(sample_id)
        scored = self._scoring(terms) if terms else None
        ids = list(map(str, self.hpo['sample_ids']))
        totals = np.asarray(self.hpo['matrix'].sum(axis=1)).ravel()
        family_id = self._family(sample_id)
        allowed = {i for i, sid in enumerate(ids) if sid != sample_id
                   and not (family_id and self._family(sid) == family_id)}
        ranked = [int(i) for i in scored['order'] if i in allowed and totals[i] > 0] if scored else []
        ranked_set = set(ranked)
        # Include candidates without phenotype information, after scored candidates.
        eligible = ranked + sorted(allowed - ranked_set, key=lambda i: ids[i])
        try:
            index = self._overlap_index()
            overlap = index.counts(sample_id) if index else None
            overlap_error = None if overlap else 'Processed comparison data are unavailable for this reference.'
        except (OSError, ValueError, KeyError):
            overlap = None
            overlap_error = 'Processed comparison data could not be verified.'
        rows, projects, project_inputs = [], {}, []
        for i in eligible:
            sid = ids[i]
            metadata = self.metadata.get(sid, {})
            investigator = metadata.get('investigator') or 'Unavailable'
            project = self.cohort.get(sid) or 'Unavailable'
            available = i in ranked_set
            residual = float(scored['phenotype_match_score_resid'][i]) if available else None
            if include_project_inputs:
                vcf_id = str(metadata.get('vcf_sample_id') or '').strip()
                if canonical_sample(vcf_id) != sid:
                    vcf_id = sid
                project_inputs.append({'sample_id': sid, 'vcf_sample_id': vcf_id, 'residual': residual})
            if residual is not None:
                projects.setdefault(project, []).append(residual)
            counts = overlap['by_sample'].get(sid) if overlap else None
            sex = str(metadata.get('sex') or '').lower()
            rows.append({'rank': len(rows) + 1, 'sampleId': sid,
                         'matchedHpo': int(scored['matched_query_terms'][i]) if available else None,
                         'recordedHpoCount': len(self._recorded_terms(metadata)) if metadata else None,
                         'residual': residual, 'rphersZ': float(scored['rphers_z'][i]) if available else None,
                         'phenotypeStatus': 'ready' if available else 'unavailable',
                         'sharedGenes': counts['sharedGenes'] if counts else None,
                         'sharedVariants': counts['sharedVariants'] if counts else None,
                         'genotypeStatus': 'ready' if counts else 'unavailable',
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
        result = {'sample_id': sample_id, 'reference_hpo_count': len(terms), 'reference_hpo_ids': list(terms),
                  'reference_scores': self._sample_profile_scores(sample_id, scored),
                  'eligible_sample_count': len(eligible), 'phenotype_scored_sample_count': len(ranked),
                  'genotype_comparable_sample_count': sum(row['genotypeStatus'] == 'ready' for row in rows),
                  'excluded_self_family_count': len(ids) - len(eligible),
                  'family_exclusion_method': 'canonical BCH family ID prefix',
                  'phenotypeMatches': rows, 'projectPhenotypeSummary': summaries,
                  'overlap_source': overlap['source'] if overlap else None, 'overlap_error': overlap_error,
                  'scoring_method': 'rphers_fast.score_samples; wp=IC, fi=binary; residual descending; all nonfamily candidates; missing phenotypes last',
                  'rphers_standardization': scored['rphers_standardization'] if scored else None}
        if include_project_inputs:
            reference_vcf = str(info.get('vcf_sample_id') or '').strip()
            result['_project_inputs'] = project_inputs
            result['_reference_vcf_sample_id'] = reference_vcf if canonical_sample(reference_vcf) == sample_id else sample_id
        return result

    def sample_match_detail(self, sample_id, candidate_id, *, gene_page=1, gene=None):
        sample_id, info, terms = self._match_reference(sample_id)
        candidate_id = canonical_sample(candidate_id)
        ids = list(map(str, self.hpo['sample_ids']))
        if (candidate_id not in ids or candidate_id == sample_id
                or self._family(sample_id) and self._family(candidate_id) == self._family(sample_id)):
            raise ValueError('The candidate is not an eligible comparison sample.')
        candidate = self.metadata.get(candidate_id, {})
        candidate_terms = set(self._recorded_terms(candidate))
        scored = self._scoring(terms) if terms else None
        i = ids.index(candidate_id)
        observed = set(self.hpo['matrix'].indices[self.hpo['matrix'].indptr[i]:self.hpo['matrix'].indptr[i+1]])
        phenotype_available = bool(observed) and bool(terms)
        hpos = [{'id': term, 'matched': self.column_index[term] in observed if phenotype_available else None,
                 'matchType': ('recorded' if term in candidate_terms else 'parent-expanded')
                 if self.column_index[term] in observed else 'unmatched'} for term in terms]
        try:
            index = self._overlap_index()
            genes = index.details(sample_id, candidate_id, page=gene_page, gene=gene) if index else {'status': 'unavailable', 'total': None, 'rows': []}
        except (OSError, KeyError):
            genes = {'status': 'unavailable', 'total': None, 'rows': []}
        return {'sample_id': sample_id, 'candidate_id': candidate_id, 'hpo_matches': hpos,
                'reference_scores': self._sample_profile_scores(sample_id, scored),
                'candidate_scores': self._sample_profile_scores(candidate_id, scored),
                'reference_hpo_count': len(terms), 'candidate_recorded_hpo_count': len(candidate_terms) if candidate else None,
                'genes': genes}

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

    @lru_cache(maxsize=1)
    def phenotype_term_counts(self):
        """Cohort-wide recorded-term counts for autocomplete, not filtered estimates."""
        counts = np.asarray(self.hpo['matrix'].getnnz(axis=0)).ravel()
        return {
            'counts': {term: int(count) for term, count in zip(self.hpo['hpo_columns'], counts)},
            'cohort_sample_count': len(self.hpo['sample_ids']),
            'source': 'parent-expanded CRDC HPO matrix',
        }

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
                "investigator": self.projects.get(sample_id, {}).get('investigator', ''),
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
            "project_metadata_source": self.project_metadata_source,
            "rphers_standardization": self._scoring(terms)["rphers_standardization"],
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hpo-matrix", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--cohort-mapping", required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8092)
    parser.add_argument("--sample-variant-source", default=default_sample_variant_source())
    args = parser.parse_args()
    engine = ProfileEngine(args.hpo_matrix, args.metadata, args.cohort_mapping)
    engine.sample_variant_source = args.sample_variant_source
    server = create_server((args.host, args.port), engine, profile_only=True)
    print(f"Phenotype profile API ready on {args.host}:{args.port} ({len(engine.hpo['sample_ids'])} samples)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
