import gzip
import tempfile
import unittest
from pathlib import Path
from scripts.build_pb_hpo_term_counts import build_counts


class HpoTermCountsTest(unittest.TestCase):
    def test_scoring_matrix_row_sums(self):
        with tempfile.TemporaryDirectory() as temporary:
            matrix = Path(temporary) / 'matrix.tsv.gz'
            with gzip.open(matrix, 'wt') as handle:
                handle.write('sample_id\tHP:0000118\tHP:0000707\tHP:0001250\nA\t1\t1\t1\nB\t0\t0\t0\nC\t1.0\t1\t0\n')
            result = build_counts(matrix)
            self.assertEqual(result['n_terms_by_sample'], {'A': 3, 'B': 0, 'C': 2})
            self.assertEqual(result['n_samples'], 3)
            self.assertEqual(result['n_hpo_columns'], 3)
            self.assertEqual(len(result['source_matrix_sha256']), 64)

    def test_invalid_matrix_rejected(self):
        for invalid in ['A\t2\n', 'A\t1\nA\t0\n', 'A\tNaN\n', 'A\t1\t0\n']:
            with tempfile.TemporaryDirectory() as temporary:
                matrix = Path(temporary) / 'matrix.tsv'
                matrix.write_text('sample_id\tHP:0000118\n' + invalid)
                with self.assertRaises(ValueError):
                    build_counts(matrix)


if __name__ == '__main__':
    unittest.main()
