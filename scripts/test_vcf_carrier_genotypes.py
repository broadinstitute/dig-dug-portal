from pathlib import Path
import tempfile
import unittest
from scripts.vcf_carrier_genotypes import VcfCarrierGenotypes


class VcfCarrierGenotypesTest(unittest.TestCase):
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
