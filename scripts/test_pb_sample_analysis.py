import gzip
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

import numpy as np
from scipy import sparse
from scripts.pb_phenotype_profile_api import ProfileEngine, default_sample_variant_source


class SampleAnalysisTest(unittest.TestCase):
    def test_sample_variant_source_survives_restart_without_temporary_path(self):
        with patch.dict('os.environ', {}, clear=True):
            path = Path(default_sample_variant_source())
            self.assertEqual(path.name, 'sample_variant_gene.jsonl.gz')
            self.assertIn('.pb-private-data/genotypes/shared', str(path))
        with patch.dict('os.environ', {'PB_GENOTYPE_INDEX': '/private/cache/release/index'}, clear=True):
            with patch('pathlib.Path.is_file', return_value=True):
                self.assertEqual(default_sample_variant_source(), '/private/cache/release/sample_variant_gene.jsonl.gz')
            with patch('pathlib.Path.is_file', return_value=False):
                self.assertIn('.pb-private-data/genotypes/shared', default_sample_variant_source())
        with patch.dict('os.environ', {'PB_SAMPLE_VARIANT_SOURCE': '/approved/custom.jsonl.gz'}, clear=True):
            self.assertEqual(default_sample_variant_source(), '/approved/custom.jsonl.gz')

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
        self.assertEqual(result['eligible_sample_count'], 2)
        self.assertEqual(result['phenotype_scored_sample_count'], 1)
        self.assertIsNone(result['phenotypeMatches'][-1]['rphersZ'])
        self.assertIsNone(result['phenotypeMatches'][-1]['sharedGenes'])
        self.assertEqual(result['phenotypeMatches'][0]['sampleId'], 'BCH-22-12345-01')
        self.assertEqual(result['phenotypeMatches'][0]['matchedHpo'], 43)
        self.assertEqual(result['reference_scores']['matchedHpo'], 53)
        detail = self.engine().sample_match_detail('BCH-22-11943-01', 'BCH-22-12345-01')
        self.assertEqual(detail['reference_scores'], result['reference_scores'])
        self.assertEqual(detail['candidate_scores']['rphersZ'], result['phenotypeMatches'][0]['rphersZ'])
        self.assertEqual(result['phenotypeMatches'][0]['age'], 0)
        self.assertEqual(sum(row['n'] for row in result['projectPhenotypeSummary']), 1)
        self.assertEqual(result['phenotypeMatches'][0]['project'], 'Project A')
        self.assertTrue(result['projectPhenotypeSummary'][0]['currentGroup'])

    def test_autocomplete_counts_use_the_whole_recorded_matrix(self):
        engine = self.engine()
        result = engine.phenotype_term_counts()
        self.assertEqual(result['cohort_sample_count'], 4)
        self.assertEqual(result['counts']['HP:0000001'], 2)
        self.assertEqual(result['counts']['HP:0000011'], 3)
        self.assertNotIn('HP:9999999', result['counts'])
        self.assertNotIn('sample_ids', result)
        self.assertIs(engine.phenotype_term_counts(), result)

    def test_missing_hpo_is_not_silently_truncated(self):
        engine = self.engine()
        engine.metadata['BCH-22-11943-01']['hpo_terms_raw'] += ',HP:9999999'
        with self.assertRaisesRegex(ValueError, 'missing'):
            engine.sample_matches('BCH-22-11943-01')

    def test_private_project_inputs_preserve_scoring_and_validate_vcf_ids(self):
        engine = self.engine()
        engine.metadata['BCH-22-12345-01']['vcf_sample_id'] = 'WRONG_G38'
        ordinary = engine.sample_matches('BCH-22-11943-01')
        private = engine.sample_matches('BCH-22-11943-01', include_project_inputs=True)
        inputs = private.pop('_project_inputs')
        self.assertEqual(private.pop('_reference_vcf_sample_id'), 'BCH-22-11943-01')
        self.assertEqual(private, ordinary)
        self.assertEqual(len(inputs), ordinary['eligible_sample_count'])
        self.assertEqual(inputs[0]['vcf_sample_id'], 'BCH-22-12345-01')
        self.assertEqual(inputs[0]['residual'], ordinary['phenotypeMatches'][0]['residual'])

    def test_all_candidates_returned_and_details_are_scoped(self):
        engine = self.engine()
        ids = ['BCH-22-11943-01'] + [f'S{i:03}' for i in range(73)]
        engine.hpo = {'sample_ids': np.array(ids), 'hpo_columns': ['HP:0000001'],
                      'matrix': sparse.csr_matrix(np.ones((74, 1)))}
        engine.column_index = {'HP:0000001': 0}
        engine.metadata = {sid: {'hpo_terms_raw': 'HP:0000001', 'age': '0'} for sid in ids}
        result = engine.sample_matches(ids[0])
        self.assertEqual(len(result['phenotypeMatches']), 73)
        self.assertEqual(result['phenotypeMatches'][-1]['rank'], 73)
        detail = engine.sample_match_detail(ids[0], ids[-1])
        self.assertEqual(detail['hpo_matches'], [{'id': 'HP:0000001', 'matched': True, 'matchType': 'recorded'}])
        self.assertEqual(detail['genes']['status'], 'unavailable')
        with self.assertRaises(ValueError):
            engine.sample_match_detail(ids[0], ids[0])
        with self.assertRaises(ValueError):
            engine.sample_match_detail(ids[0], 'UNKNOWN')

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
