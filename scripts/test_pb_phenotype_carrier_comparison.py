"""Check profile carrier comparison counts, coverage and exact-test semantics."""
import json
from pathlib import Path
import tempfile
import unittest

import numpy as np
from scipy import sparse
from scripts.pb_phenotype_carrier_counts import compare


class ProfileComparisonTest(unittest.TestCase):
    def test_counts_missing_coverage_and_exact_p(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            metadata=dict(genes=['GJB2','CFTR'],hpo_columns=['HP:0000001','HP:0000002'],sample_ids=['A','B','C','D','E'],membership_sha256='fixture')
            (root/'metadata.json').write_text(json.dumps(metadata))
            sparse.save_npz(root/'membership.npz',sparse.csr_matrix(np.array([[1,1],[1,0],[0,1],[0,0],[0,0]],dtype=np.uint8)))
            sparse.save_npz(root/'hpo.npz',sparse.csc_matrix(np.array([[1,0],[1,1],[0,1],[0,0],[1,0]],dtype=np.uint8)))
            np.save(root/'coverage.npy',np.array([True,True,True,True,False]))
            body=dict(hpo_ids=['HP:0000001','HP:0000002'],minimum=1,sample_ids=['A','B','E'])
            result=compare(root,body)
            self.assertEqual(result['matchingSampleCount'],3)
            self.assertEqual(result['matchingCoveredCount'],2)
            self.assertEqual(result['otherSampleCount'],2)
            self.assertEqual(result['otherCoveredCount'],2)
            self.assertEqual(result['nCompared'],2)
            self.assertFalse(result['adjusted'])
            self.assertEqual([row['gene']for row in result['rows']],['GJB2'])
            row=result['rows'][0]
            self.assertEqual((row['matchingCarriers'],row['comparisonCarriers']),(2,0))
            self.assertIsNone(row['ratio'])
            self.assertEqual(row['queryCarrierCounts'],[2,1])
            self.assertAlmostEqual(row['pValue'],1/3)
            with self.assertRaises(ValueError):compare(root,{**body,'sample_ids':['D']})
            with self.assertRaises(ValueError):compare(root,{**body,'sample_ids':['OUTSIDE']})


if __name__=='__main__':unittest.main()
