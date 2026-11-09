import gzip
import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
from scipy import sparse
from scripts.pb_phenotype_profile_api import ProfileEngine


class SampleAnalysisTest(unittest.TestCase):
    def engine(self):
        engine = ProfileEngine.__new__(ProfileEngine)
        ids = ['BCH-22-11943-01', 'BCH-22-11943-02', 'BCH-22-12345-01', 'BCH-22-12346-01']
        terms = [f'HP:{i:07}' for i in range(1, 54)]
        matrix = np.ones((4, 53))
        matrix[2, :10] = 0
        matrix[3, :] = 0
        engine.hpo = {'sample_ids': np.array(ids), 'hpo_columns': terms, 'matrix': sparse.csr_matrix(matrix)}
        engine.column_index = {term: i for i, term in enumerate(terms)}
        engine.metadata = {sid: {'hpo_terms_raw': ','.join(terms), 'investigator': 'A', 'family': 'index', 'age': '0', 'sex': 'male'} for sid in ids}
        engine.cohort = {ids[0]: 'Project A', ids[2]: 'Project A'}
        return engine

    def test_complete_profile_and_family_exclusions(self):
        result = self.engine().sample_matches('BCH-22-11943-01_E38')
        self.assertEqual(result['reference_hpo_count'], 53)
        self.assertEqual(result['excluded_self_family_count'], 2)
        self.assertEqual(result['eligible_sample_count'], 1)
        self.assertEqual(result['phenotypeMatches'][0]['sampleId'], 'BCH-22-12345-01')
        self.assertEqual(result['phenotypeMatches'][0]['matchedHpo'], 43)
        self.assertEqual(result['phenotypeMatches'][0]['age'], 0)
        self.assertEqual(sum(row['n'] for row in result['projectPhenotypeSummary']), 1)
        self.assertEqual(result['phenotypeMatches'][0]['project'], 'Project A')
        self.assertTrue(result['projectPhenotypeSummary'][0]['currentGroup'])

    def test_missing_hpo_is_not_silently_truncated(self):
        engine = self.engine()
        engine.metadata['BCH-22-11943-01']['hpo_terms_raw'] += ',HP:9999999'
        with self.assertRaisesRegex(ValueError, 'missing'):
            engine.sample_matches('BCH-22-11943-01')

    def test_variants_exact_sample_and_scope(self):
        engine = self.engine()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'variants.jsonl.gz'
            with gzip.open(path, 'wt') as handle:
                for sid in ['BCH-22-11943-01', 'BCH-22-11943-010', 'BCH-22-11943-02']:
                    handle.write(json.dumps({'sample_id': sid, 'gt': '0/1'}) + '\n')
            engine.sample_variant_source = path
            result = engine.sample_variants('BCH-22-11943-01')
            self.assertEqual(len(result['rows']), 1)
            self.assertFalse(result['complete_genome'])
            with self.assertRaises(ValueError):
                engine.sample_variants('unknown')


if __name__ == '__main__':
    unittest.main()
