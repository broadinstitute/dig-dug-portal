"""Read-only aggregate audit of a frozen six-type release for portal handoff.

Does not classify, deduplicate away evidence, or publish private sample rows.
"""
import argparse
from collections import Counter, defaultdict
import csv
import gzip
import hashlib
import json
import math
from pathlib import Path
import re


def rows(path):
    with gzip.open(path, 'rt', encoding='utf-8-sig', newline='') as handle:
        yield from csv.DictReader(handle, delimiter='\t')


def canonical_variant(value):
    return re.sub(r'^chr', '', value, flags=re.I).upper()


def audit(directory, sample_id=None, sample_variant_json=None):
    source = Path(directory)
    hashes = {}
    for line in (source / 'output_sha256.tsv').read_text().splitlines():
        expected, name = line.split()
        actual = hashlib.sha256((source / name).read_bytes()).hexdigest()
        hashes[name] = {'sha256': actual, 'matches_manifest': expected == actual}
        if actual != expected:
            raise ValueError('Source hash mismatch: ' + name)
    counts = Counter()
    categories = {key: Counter() for key in ['type', 'tier_type', 'scope_type', 'cohort_type', 'sample_analysis_role',
        'inheritance_status', 'inheritance_status_review', 'phenotype_evaluation_status',
        'phenotype_weighted_score', 'rcv_review_status_type12', 'evidence_source', 'source_version']}
    unique_keys = {key: Counter() for key in ['sample_gene_variant', 'sample_variant_disease', 'evidence_identity']}
    digests = Counter()
    samples, variants = set(), set()
    genotype_values = defaultdict(set)
    multi_types = defaultdict(set)
    target_rows = []
    missing_disease_by_type = Counter()
    nonfinite = Counter()
    for row in rows(source / 'six_type_classification.tsv.gz'):
        counts['classified_rows'] += 1
        kind = row['type']
        categories['type'][kind] += 1
        categories['tier_type'][kind + '|' + row['tier_label']] += 1
        categories['scope_type'][kind + '|' + row['evidence_scope']] += 1
        categories['cohort_type'][kind + '|' + row['cohort_match']] += 1
        for key in ['sample_analysis_role', 'inheritance_status', 'inheritance_status_review',
                    'phenotype_evaluation_status', 'phenotype_weighted_score', 'evidence_source', 'source_version']:
            categories[key][row[key] or '<empty>'] += 1
        if kind in ['Type_1', 'Type_2']:
            categories['rcv_review_status_type12'][row['rcv_review_status'] or '<empty>'] += 1
        sid, gene, variant, disease = row['sample_id'], row['GeneSymbol'], row['Variant_ID'], row['disease_id']
        for key in ['sample_id', 'GeneSymbol', 'Variant_ID', 'GT']:
            counts['missing_' + key] += not bool(row[key])
        if not re.fullmatch(r'(?:chr)?(?:[0-9]{1,2}|X|Y|M|MT):[0-9]+:[ACGTN*.-]+:[ACGTN*.-]+', variant, flags=re.I):
            counts['invalid_variant_format'] += 1
        if not disease:
            missing_disease_by_type[kind] += 1
        key = (sid, gene, variant)
        genotype_values[key].add(row['GT'])
        multi_types[key].add(kind)
        samples.add(sid)
        variants.add(variant)
        unique_keys['sample_gene_variant'][key] += 1
        unique_keys['sample_variant_disease'][(sid, variant, disease)] += 1
        unique_keys['evidence_identity'][(sid, gene, variant, kind, disease, row['evidence_scope'], row['evidence_source'], row['evidence_record_id'], row['source_version'], row['evidence_value'], row['inheritance_normalized'])] += 1
        digests[hashlib.sha256(json.dumps(list(row.values()), ensure_ascii=False).encode()).hexdigest()] += 1
        for field in ['primary_fisher_odds_ratio', 'primary_fisher_p', 'cross_cohort_fisher_odds_ratio', 'cross_cohort_fisher_p']:
            for value in row[field].split(';'):
                try:
                    if not math.isfinite(float(value)):
                        nonfinite[field] += 1
                except ValueError:
                    pass
        if sid == sample_id:
            target_rows.append(row)
    unresolved = Counter()
    for row in rows(source / 'six_type_unresolved.tsv.gz'):
        counts['unresolved_rows'] += 1
        unresolved[row['reason']] += 1
    association = Counter()
    for row in rows(source / 'type56_phenotype_gene_associations.tsv.gz'):
        association['rows'] += 1
        association['rank_1_rows'] += row['is_rank_1'].lower() in ['true', '1', 'y']
    result = {'counts': dict(counts), 'hashes': hashes, 'categories': {key: dict(value) for key, value in categories.items()},
        'classified_samples': len(samples), 'unique_variants': len(variants),
        'keys': {key: {'distinct': len(value), 'duplicate_excess': sum(n - 1 for n in value.values()),
                      'keys_with_multiple_rows': sum(n > 1 for n in value.values())} for key, value in unique_keys.items()},
        'exact_duplicate_excess': sum(n - 1 for n in digests.values()),
        'conflicting_gt_keys': sum(len(value) > 1 for value in genotype_values.values()),
        'multi_type_sample_gene_variant_keys': sum(len(value) > 1 for value in multi_types.values()),
        'missing_disease_by_type': dict(missing_disease_by_type), 'nonfinite_numeric_values': dict(nonfinite),
        'unresolved_reasons': dict(unresolved), 'type56_associations': dict(association)}
    if sample_id:
        summary = {'rows': len(target_rows), 'types': dict(Counter(r['type'] for r in target_rows)),
                   'unique_gene_variants': len({(r['GeneSymbol'], r['Variant_ID']) for r in target_rows}),
                   'distinct_diseases': len({r['disease_id'] for r in target_rows if r['disease_id']})}
        if sample_variant_json:
            current = json.loads(Path(sample_variant_json).read_text())
            current_rows = current['rows']
            if current.get('sample_id') != sample_id:
                raise ValueError('Sample variant response ID mismatch')
            gt = {(r['gene_symbol'], canonical_variant(r['variant_id'])): r['gt'] for r in current_rows}
            joined = [r for r in target_rows if (r['GeneSymbol'], canonical_variant(r['Variant_ID'])) in gt]
            summary.update({'all_source_rows': len(current_rows), 'joined_evidence_rows': len(joined),
                            'unmatched_evidence_rows': len(target_rows) - len(joined),
                            'joined_gt_conflicts': sum(r['GT'] != gt[(r['GeneSymbol'], canonical_variant(r['Variant_ID']))] for r in joined)})
        result['example_sample_audit'] = summary
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_dir')
    parser.add_argument('--sample-id')
    parser.add_argument('--sample-variant-json')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    result = audit(args.source_dir, args.sample_id, args.sample_variant_json)
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'counts': result['counts'], 'types': result['categories']['type'], 'keys': result['keys'],
                      'exact_duplicate_excess': result['exact_duplicate_excess'], 'example': result.get('example_sample_audit')}, ensure_ascii=False))
