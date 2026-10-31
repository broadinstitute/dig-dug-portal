import csv
from pathlib import Path
import tempfile
import unittest

from scripts.pb_sample_gene_scores import SampleGeneScores, parse_request


class SampleGeneScoresTest(unittest.TestCase):
    def test_membership_uses_existing_scores_mapping_and_missing_coverage(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'roster.tsv').write_text('sample_id\toverlap_status\na\tboth\nb\tboth\nc\tboth\nd\tboth\nout\thpo_only\n')
            (root / 'cov.tsv').write_text('sample_id\tvcf_sample_id\tscore_sample_id\na\tBROWSER-A_E38\tSCORE-A\nb\tBROWSER-B_G38\tSCORE-B\nc\tBROWSER-C_G38\tSCORE-C\nd\tBROWSER-D_E38\tSCORE-D\n')
            (root / 'scores.tsv').write_text('sample_id\tgene_symbol\tgene_score_max\tgene_score_sum\nSCORE-A\tGENE1\t.2\t.5\nSCORE-A\tGENE2\t0\t0\nSCORE-B\tGENE1\t.1\t.1\nSCORE-B\tGENE3\t0\t.3\nSCORE-C\tGENE1\t0\t0\nEXCLUDED\tGENE4\t1\t1\n')
            engine = SampleGeneScores(root/'scores.tsv', root/'cov.tsv', root/'roster.tsv')
            ids = ['BROWSER-A', 'BROWSER-B', 'BROWSER-C', 'BROWSER-D', 'OUTSIDE']
            result = engine.query(ids)
            decode = lambda key: [result['genes'][i] for i in result['sample_gene_indices'][key]]
            self.assertEqual(decode('BROWSER-A'), ['GENE1'])
            self.assertEqual(decode('BROWSER-B'), ['GENE1'])
            self.assertEqual(decode('BROWSER-C'), [], 'Covered zero-score sample remains covered')
            self.assertEqual(result['unavailable_sample_ids'], ['BROWSER-D', 'OUTSIDE'])
            self.assertEqual(result['analysis_sample_count'], 4)
            matrices = engine.matrices
            other = engine.query(['BROWSER-B'], 'sum')
            self.assertEqual([other['genes'][i] for i in other['sample_gene_indices']['BROWSER-B']], ['GENE1', 'GENE3'])
            self.assertIs(engine.matrices, matrices, 'Reuse the index rather than rescanning per selection')

    def test_request_validation(self):
        self.assertEqual(parse_request({'sample_ids': ['A', 'A'], 'score_type': 'max'}), (['A'], 'max'))
        for payload in [None, {}, {'sample_ids': []}, {'sample_ids': ['../bad']}, {'sample_ids': ['A'], 'score_type': 'median'}]:
            with self.assertRaises(ValueError):
                parse_request(payload)


if __name__ == '__main__':
    unittest.main()
