"""Measure a proposed list/detail payload without serving or changing classifications.

Private sample rows remain in memory; only aggregate byte counts are written.
"""
import argparse
import csv
import gzip
import json
from pathlib import Path


def wire_bytes(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()


def list_record(row, ordinal):
    # IDs are release-local. The release/hash belongs once in the response envelope.
    result = {'id': ordinal, 'type': int(row['type'].split('_')[1]),
              'gene': row['GeneSymbol'], 'variant_id': row['Variant_ID'], 'gt': row['GT']}
    if row['disease_id']:
        result['disease'] = {'id': row['disease_id'], 'name': row['disease_name']}
    if row['evidence_source']:
        result['evidence_source'] = row['evidence_source']
    return result


def detail_record(row, ordinal):
    result = list_record(row, ordinal)
    result['evidence'] = {key: row[key] or None for key in [
        'evidence_value', 'evidence_record_id', 'source_version',
        'rcv_accession', 'rcv_classification', 'rcv_review_status']}
    result['context'] = {key: row[key] or None for key in [
        'investigator', 'investigator_disease', 'cohort_match', 'cohort_match_basis']}
    result['overlap'] = {key: row[key] or None for key in [
        'matched_hpo_count', 'disease_hpo_count', 'phenotype_coverage', 'phenotype_evaluation_status']}
    result['matched_hpo_terms'] = [value for value in row['matched_hpo_terms'].split(';') if value]
    result['inheritance_assessment'] = row['inheritance_status'] or None
    # Omit absent score values; one explicit status is sufficient.
    result['disease_score_status'] = 'not_calculated'
    if result['type'] >= 5:
        result['discovery'] = {key: value for key, value in row.items()
                               if (key.startswith('primary_') or key.startswith('cross_cohort_')) and value}
    return result


def measure(source_path, sample_id, page_size=20):
    sample_rows = []
    all_projected_raw = 0
    count = 0
    with gzip.open(source_path, 'rt', encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle, delimiter='\t')
        column_count = len(reader.fieldnames or [])
        for count, row in enumerate(reader, 1):
            all_projected_raw += len(wire_bytes(list_record(row, count))) + 1
            if row['sample_id'] == sample_id:
                sample_rows.append((count, row))
    raw_size = 0
    with gzip.open(source_path, 'rb') as handle:
        while chunk := handle.read(1024 * 1024):
            raw_size += len(chunk)
    full = [row for _, row in sample_rows]
    listing = [list_record(row, ordinal) for ordinal, row in sample_rows[:page_size]]
    summary = {str(kind): sum(row['type'] == f'Type_{kind}' for _, row in sample_rows) for kind in range(1, 7)}
    first_page = {'release': 'six_types_20260816', 'counts_by_type': summary,
                  'total': len(sample_rows), 'page': 1, 'page_size': page_size, 'records': listing}
    first_detail = detail_record(sample_rows[0][1], sample_rows[0][0]) if sample_rows else None
    measurements = {}
    for label, value in [('sample_all_source_columns', full), ('sample_first_page', first_page),
                          ('first_selected_detail', first_detail),
                          ('first_page_with_first_detail', {**first_page, 'selected_detail': first_detail})]:
        encoded = wire_bytes(value)
        measurements[label] = {'json_bytes': len(encoded), 'gzip_bytes': len(gzip.compress(encoded, mtime=0))}
    return {'source_rows': count, 'source_columns': column_count, 'source_gzip_bytes': Path(source_path).stat().st_size,
            'source_tsv_bytes': raw_size, 'list_projection_all_rows_jsonl_bytes': all_projected_raw,
            'example_sample_record_count': len(sample_rows), 'list_fields': list(listing[0]) if listing else [],
            'measurements': measurements,
            'note': 'One sample; serialization/compression measurements, not network latency or complete storage estimates. All-row list projection excludes detail/QC/provenance storage.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_path')
    parser.add_argument('--sample-id', required=True)
    parser.add_argument('--page-size', type=int, default=20)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    if args.page_size < 1:
        parser.error('page size must be positive')
    result = measure(args.source_path, args.sample_id, args.page_size)
    Path(args.output).write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(result, ensure_ascii=False))
