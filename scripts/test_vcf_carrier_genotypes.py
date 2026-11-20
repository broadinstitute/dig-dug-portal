from pathlib import Path
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch
from scripts.vcf_carrier_genotypes import VcfCarrierGenotypes


class VcfCarrierGenotypesTest(unittest.TestCase):
    def test_quality_cache_survives_restart_and_bypasses_cold_work(self):
        with tempfile.TemporaryDirectory() as directory:
            filename = Path(directory)/'source.vcf.gz'
            filename.write_bytes(b'fixture')
            cache = Path(directory)/'cache'
            source = VcfCarrierGenotypes(filename, cache_directory=cache)
            query = lambda args: ('A_E38\n' if args == ['query','-l'] else
                'chr1\t100\t1\n' if args == ['index','-s'] else 'chr1\t10\tC\tT\t0/0:30\n')
            source._query = query
            result = source.qualify(['chr1:10:C:T'], ['A_E38'])
            restarted = VcfCarrierGenotypes(filename, cache_directory=cache)
            restarted._query = lambda _: self.fail('A verified persistent cache must not query the VCF again')
            pool = ThreadPoolExecutor(max_workers=1)
            restarted._quality_lock.acquire()
            try:
                self.assertEqual(pool.submit(restarted.qualify, ['chr1:10:C:T'], ['A_E38']).result(timeout=1), result)
            finally:
                restarted._quality_lock.release()
                pool.shutdown(wait=True)
            with patch.object(restarted, '_query', side_effect=RuntimeError('source read required')):
                with self.assertRaisesRegex(RuntimeError, 'source read required'):
                    restarted.qualify(['chr1:10:C:T'], ['OTHER'])
                filename.write_bytes(b'new-source-release')
                with self.assertRaisesRegex(RuntimeError, 'source read required'):
                    restarted.qualify(['chr1:10:C:T'], ['A_E38'])

    def test_gene_quality_depth_frequency_denominator_and_authorized_samples(self):
        with tempfile.TemporaryDirectory() as directory:
            filename = Path(directory)/'source.vcf.gz'
            filename.write_bytes(b'fixture')
            source = VcfCarrierGenotypes(filename)
            names = ['A_E38', 'LOW_E38', 'PARTIAL_E38', *[f'R{i}' for i in range(99)]]
            refs = ['0/0:20'] * 99
            lines = [
                'chr1\t10\tC\tT\t' + '\t'.join(['0|1:20', '1/1:19', '0/.:30', *refs]),
                'chr1\t20\tC\tT\t' + '\t'.join(['1/1:20', '0/0:.', './.:30', *refs]),
                'chr1\t30\tC\tA,T\t' + '\t'.join(['0/2:20', '0/0:19', './.:30', *refs]),
            ]
            source._query = lambda args: ('\n'.join(names) + '\n' if args == ['query', '-l'] else
                'chr1\t1000\t3\n' if args == ['index', '-s'] else '\n'.join(lines))
            result = source.qualify(['chr1:10:C:T', 'chr1:20:C:T', 'chr1:30:C:A', 'chr1:30:C:T'], ['A_G38', 'LOW_E38', 'PARTIAL_E38'])
            rows = {row['variant_id']: row for row in result['variants']}
            self.assertEqual(rows['chr1:10:C:T']['sample_ids'], ['A_G38'])
            self.assertEqual(rows['chr1:10:C:T']['an'], 200, 'AF denominator includes DP20 reference calls outside selected carriers')
            self.assertEqual(rows['chr1:10:C:T']['af'], .005)
            self.assertEqual(rows['chr1:20:C:T']['af'], .01)
            self.assertEqual(rows['chr1:20:C:T']['sample_ids'], [], 'AF exactly .01 fails the strict threshold')
            self.assertEqual(rows['chr1:30:C:A']['sample_ids'], [])
            self.assertEqual(rows['chr1:30:C:T']['sample_ids'], ['A_G38'], 'Target ALT indices are preserved')
            with self.assertRaisesRegex(ValueError, 'missing'):
                source.qualify(['chr1:999:C:T'], ['A_E38'])

    def test_exact_allele_canonical_samples_phase_depth_and_no_inference(self):
        with tempfile.TemporaryDirectory() as directory:
            filename = Path(directory)/'source.vcf.gz'
            filename.write_bytes(b'fixture')
            provider = VcfCarrierGenotypes(filename)
            requested_names = []
            def query(args):
                if args == ['query','-l']:
                    return 'A_E38\nB_G38\nC_E38\nD_E38\nUNREQUESTED_E38\n'
                if args == ['index','-s']:
                    return 'chr13\t100000000\t1\n'
                requested_names.extend(Path(args[args.index('-S')+1]).read_text().splitlines())
                return ('chr13\t20189546\tAC\tA\tA_E38=0/1:30\tB_G38=1|1:40\tC_E38=0/1:12\tD_E38=0/0:50\n'
                        'chr13\t20189546\tA\tAC\tA_E38=1/1:40\n')
            provider._query = query
            result = provider.lookup('chr13:20189546:AC:A',['A_G38','B_E38','C_E38','D_E38','MISSING'])
            rows = {row['sample_id']:row for row in result['rows']}
            self.assertEqual(rows['A_G38']['gt'],'0/1')
            self.assertEqual(rows['B_E38']['gt'],'1|1')
            self.assertEqual(rows['C_E38']['status'],'low_or_missing_depth')
            self.assertEqual(rows['D_E38']['status'],'not_target_carrier')
            self.assertEqual(rows['MISSING']['status'],'not_in_vcf')
            self.assertNotIn('UNREQUESTED_E38',requested_names)
            self.assertEqual(result['source']['kind'],'original_vcf')
            self.assertEqual(len(result['rows']),5)

    def test_multiallelic_target_preserves_original_indices(self):
        with tempfile.TemporaryDirectory() as directory:
            filename = Path(directory)/'source.vcf.gz'
            filename.write_bytes(b'fixture')
            provider = VcfCarrierGenotypes(filename)
            provider._query = lambda args: ('A_E38\n' if args == ['query','-l'] else
                'chr1\t100\t1\n' if args == ['index','-s'] else 'chr1\t10\tC\tA,T\tA_E38=2/2:30\n')
            self.assertEqual(provider.lookup('chr1:10:C:T',['A_E38'])['rows'][0]['gt'],'2/2')
            self.assertEqual(provider.lookup('chr1:10:C:A',['A_E38'])['rows'][0]['status'],'not_target_carrier')


if __name__ == '__main__':
    unittest.main()
