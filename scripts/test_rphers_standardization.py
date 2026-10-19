"""Small, independent checks of units and API lineage; no cohort reanalysis."""
import csv
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import numpy as np
from scipy.stats import t

from scripts.rphers_fast import score_samples
from scripts.rphers_standardization import (
    association_with_sd, mean_with_sd, standardize_scores, standardized_value,
)
from scripts.pb_gene_context_validation import ContextAnalysisEngine
from scripts.pb_phenotype_profile_api import ProfileEngine


class RphersStandardizationTest(unittest.TestCase):
    def test_documented_example_and_raw_result_preservation(self):
        # These reference scores have mean=2 and sample SD=4.
        z, reference = standardize_scores([-2, 2, 6], ['HP:0001250'], 'data', 'cohort')
        np.testing.assert_allclose(z, [-1, 0, 1])
        self.assertEqual(standardized_value(10, reference, center=True), 2)
        raw = dict(beta=8, standard_error=2, p_value=0.03, fdr=0.08, status='ok')
        gene = association_with_sd(raw, reference, gene=True)
        variant = association_with_sd(raw, reference)
        self.assertEqual((gene['beta_sd'], gene['standard_error_sd']), (2, 0.5))
        self.assertEqual((gene['beta_sd_per_0_1_grs'], gene['standard_error_sd_per_0_1_grs']), (0.2, 0.05))
        self.assertEqual((variant['beta_sd'], variant['standard_error_sd']), (2, 0.5))
        self.assertNotIn('beta_sd_per_0_1_grs', variant)
        for key, value in raw.items():
            self.assertEqual(gene[key], value)
            self.assertEqual(variant[key], value)
        self.assertNotIn('beta_sd', raw)
        self.assertEqual(association_with_sd(gene, reference, gene=True), gene, 'No double conversion')
        mean = mean_with_sd(dict(match_score=6, carrier_count=2, scored_carrier_count=2, status='ok'), reference)
        self.assertEqual(mean['mean_rphers_z'], np.mean([standardized_value(r, reference, center=True) for r in (2, 10)]))
        mean['scored_carrier_count'] = 1
        self.assertIsNone(mean_with_sd(mean, reference)['mean_rphers_z'])

    def test_direct_standardized_outcome_regression_matches_rescaled_effect_and_se(self):
        rng = np.random.default_rng(123)
        n = 80
        covariate = rng.normal(size=n)
        raw_y = rng.normal(4, 2, n) + covariate
        z, reference = standardize_scores(raw_y, ['HP:0001250'], 'data', 'cohort')
        self.assertAlmostEqual(float(np.mean(z)), 0, places=12)
        self.assertAlmostEqual(float(np.std(z, ddof=1)), 1, places=12)
        for x, gene in ((rng.uniform(0, 1, n), True), ((np.arange(n) % 3 == 0).astype(float), False)):
            design = np.column_stack([np.ones(n), x, covariate])
            def fit(y):
                coefficients = np.linalg.lstsq(design, y, rcond=None)[0]
                error = y - design @ coefficients
                se = np.sqrt((error @ error) / (n - 3) * np.linalg.inv(design.T @ design)[1, 1])
                p = float(2 * t.sf(abs(coefficients[1] / se), n - 3))
                return dict(beta=coefficients[1], standard_error=se, p_value=p, status='ok')
            raw, direct = fit(raw_y), fit(z)
            scaled = association_with_sd(raw, reference, gene=gene)
            np.testing.assert_allclose([scaled['beta_sd'], scaled['standard_error_sd']],
                                       [direct['beta'], direct['standard_error']], atol=1e-12)
            self.assertAlmostEqual(scaled['p_value'], direct['p_value'], places=12)
            if gene:
                np.testing.assert_allclose([scaled['beta_sd_per_0_1_grs'], scaled['standard_error_sd_per_0_1_grs']],
                                           [direct['beta'] * .1, direct['standard_error'] * .1], atol=1e-12)

    def test_missing_and_zero_reference_do_not_create_values_or_change_analysis_status(self):
        for scores, status in (([1, 1, 1], 'zero_or_invalid_sd'), ([np.nan, 1], 'insufficient_reference'),
                               ([np.nan, np.inf], 'insufficient_reference')):
            z, reference = standardize_scores(scores, [], 'data', 'cohort')
            self.assertEqual(reference['status'], status)
            self.assertTrue(np.all(np.isnan(z)))
            result = association_with_sd(dict(beta=1, standard_error=2, p_value=.4, status='ok'), reference)
            self.assertIsNone(result['beta_sd'])
            self.assertEqual((result['status'], result['p_value']), ('ok', .4))
        z, reference = standardize_scores([1, np.nan, 3], [], 'data', 'cohort')
        self.assertEqual(reference['reference_n'], 2)
        self.assertTrue(np.isnan(z[1]))
        self.assertIsNone(standardized_value(None, reference, center=True))

    def test_full_scoring_reference_shared_before_roster_affected_carriers_and_paging(self):
        rng = np.random.default_rng(47)
        terms = ['HP:0001250', 'HP:0001252', 'HP:0001256', 'HP:0000496']
        matrix = rng.binomial(1, [.3, .2, .4, .1], size=(80, 4))
        with TemporaryDirectory() as directory:
            root = Path(directory)
            def write(name, header, rows, delimiter='\t'):
                p = root / name
                with p.open('w', newline='') as handle:
                    writer = csv.writer(handle, delimiter=delimiter)
                    writer.writerow(header)
                    writer.writerows(rows)
                return p
            ids = [f'sample-{i}' for i in range(80)]
            hpo = write('hpo.tsv', ['sample_id', *terms], [[s, *row] for s, row in zip(ids, matrix)])
            roster = write('roster.tsv', ['sample_id', 'overlap_status'], [[s, 'both'] for s in ids[:60]])
            metadata = write('metadata.tsv', ['sample_id', 'age', 'sex', 'affected', 'WES_WGS', *[f'PC{i}' for i in range(1, 11)]],
                [[s, 10+i%17, 'Female' if i%2 else 'Male', 'Y' if i%2 else 'N', 'WES', *rng.normal(size=10)] for i, s in enumerate(ids)])
            mapping = write('cohort.csv', ['de_identified_subject', 'clean_name', 'cohort_type'], [[s, 'Example', 'Primary'] for s in ids], ',')
            evidence = write('evidence.tsv', ['sample_id', 'gene_symbol', 'Variant_ID', 'GT', 'pathogenicity_score', 'Alphamissense'],
                [[s, 'HBB', 'chr1:1:A:T', '0/1', .5, .5] for s in ids[:60:3]])
            calls = []
            def run(gene, sample_ids, y, **settings):
                calls.append((list(sample_ids), y.copy(), settings))
                return dict(beta=8., standard_error=2., p_value=.04, status='ok', score_type=settings['score_type'],
                            affected_only=settings['affected_only'], n_positive=20, n_samples=30 if settings['affected_only'] else 60)
            runner = SimpleNamespace(run=run, model='lm', run_all=lambda *args, **kw: {'HBB': dict(beta=8., standard_error=2., p_value=.04, status='ok')})
            context = ContextAnalysisEngine(hpo, roster, evidence, metadata, gene_association_runner=runner)
            profile = ProfileEngine(hpo, metadata, mapping)
            query = [terms[0], terms[1]]
            canonical = score_samples(matrix, terms, query, ids)
            reference = canonical['rphers_standardization']
            with patch('scripts.pb_gene_context_validation.score_samples', wraps=score_samples) as scorer:
                all_result = context.analyze('HBB', query, score_type='sum')
                affected_result = context.analyze('HBB', query, score_type='sum', affected_only=True)
                self.assertEqual(scorer.call_count, 1, 'One scoring pass for all/affected and carrier/association paths')
            np.testing.assert_allclose(calls[0][1], canonical['phenotype_match_score_resid'][:60])
            np.testing.assert_array_equal(calls[0][1], calls[1][1])
            self.assertEqual(len(calls), 2, 'Only the two explicitly requested raw gene fits')
            self.assertEqual((all_result['analysis_sample_count'], affected_result['analysis_sample_count']), (60, 30))
            for result in (all_result, affected_result):
                self.assertEqual(result['rphers_standardization'], reference)
                self.assertEqual(result['rphers_standardization']['reference_n'], 80)
                self.assertEqual(result['gene_association']['beta'], 8)
                self.assertEqual(result['gene_association']['p_value'], .04)
                self.assertAlmostEqual(result['gene_association']['beta_sd_per_0_1_grs'], .8/reference['reference_sd'])
                json.dumps(result, allow_nan=False)
            first = profile.phenotype_profile(query, page_size=1)
            second = profile.phenotype_profile(query, filters={'sex': 'Female'}, page=2, page_size=1)
            self.assertEqual(first['rphers_standardization'], reference)
            self.assertEqual(second['rphers_standardization'], reference)
            by_id = dict(zip(ids, canonical['rphers_z']))
            for row in first['samples'] + second['samples']:
                self.assertAlmostEqual(row['rphers_z'], by_id[row['sample_id']])
            private = context.variant_carrier_residuals('HBB', '1:1:A:T', query)
            for sample, z in private['sample_rphers_z'].items():
                self.assertAlmostEqual(z, by_id[sample])
            expected_mean = np.mean(list(private['sample_rphers_z'].values()))
            self.assertAlmostEqual(all_result['variant_match_scores']['chr1:1:A:T']['mean_rphers_z'], expected_mean)
            co = context.co_gene_associations('HBB', query, [])
            self.assertEqual(co['rphers_standardization'], reference)
            self.assertEqual(co['gene_associations']['HBB']['fdr'], .04)
            different = score_samples(matrix[:60], terms, query, ids[:60])['rphers_standardization']
            self.assertNotEqual(reference['reference_id'], different['reference_id'])


if __name__ == '__main__':
    unittest.main()
