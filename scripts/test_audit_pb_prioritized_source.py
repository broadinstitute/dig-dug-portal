import csv
import gzip
import hashlib
import tempfile
import unittest
from pathlib import Path

from scripts.audit_pb_prioritized_source import audit


class PrioritizedAuditTest(unittest.TestCase):
    def test_distinct_evidence_values_and_rank_flag(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fields = ['type', 'sample_id', 'GeneSymbol', 'Variant_ID', 'GT', 'tier_label',
                      'evidence_scope', 'cohort_match', 'sample_analysis_role', 'inheritance_status',
                      'inheritance_status_review', 'phenotype_evaluation_status', 'phenotype_weighted_score',
                      'evidence_source', 'source_version', 'rcv_review_status', 'disease_id',
                      'evidence_record_id', 'evidence_value', 'inheritance_normalized',
                      'primary_fisher_odds_ratio', 'primary_fisher_p',
                      'cross_cohort_fisher_odds_ratio', 'cross_cohort_fisher_p']
            row = {key: '' for key in fields}
            row.update(type='Type_3', sample_id='SYN-1', GeneSymbol='GENE', Variant_ID='chr1:1:A:T',
                       GT='0/1', tier_label='Tier_2', evidence_source='database', evidence_record_id='e1',
                       evidence_value='Strong', disease_id='OMIM:example')
            specifications = [
                ('six_type_classification.tsv.gz', fields, [row, {**row, 'evidence_value': 'Definitive'}]),
                ('six_type_unresolved.tsv.gz', ['reason'], [{'reason': 'affected_not_Y'}]),
                ('type56_phenotype_gene_associations.tsv.gz', ['is_rank_1'], [{'is_rank_1': 'Y'}, {'is_rank_1': 'N'}]),
            ]
            manifests = []
            for name, columns, data in specifications:
                path = root / name
                with gzip.open(path, 'wt', encoding='utf-8-sig', newline='') as handle:
                    writer = csv.DictWriter(handle, fieldnames=columns, delimiter='\t')
                    writer.writeheader()
                    writer.writerows(data)
                manifests.append(hashlib.sha256(path.read_bytes()).hexdigest() + '  ' + name)
            (root / 'output_sha256.tsv').write_text('\n'.join(manifests))
            result = audit(root)
            self.assertEqual(result['counts']['classified_rows'], 2)
            self.assertEqual(result['keys']['sample_variant_disease']['duplicate_excess'], 1)
            self.assertEqual(result['keys']['evidence_identity']['duplicate_excess'], 0)
            self.assertEqual(result['exact_duplicate_excess'], 0)
            self.assertEqual(result['type56_associations']['rank_1_rows'], 1)
            (root / 'six_type_classification.tsv.gz').write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                audit(root)


if __name__ == '__main__':
    unittest.main()
