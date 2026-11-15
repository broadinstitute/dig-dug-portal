import gzip
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from scripts.build_pb_genotype_index import build_index
from scripts.sample_overlap_index import SampleOverlapIndex


class SampleOverlapTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        rows = []
        def add(gene, sample, variant, gt):
            rows.append({'gene_symbol':gene,'sample_id':sample,'variant_id':variant,'gt':gt})
        # Same exact variant annotated to two genes: count it once per sample.
        add('A','REF','chr1:1:A:T','0/1')
        add('A','CAND','chr1:1:A:T','1|1')
        add('A','REF','chr1:2:A:T','1/1')
        add('A','CAND','chr1:3:A:T',None)
        add('A','CAND','chr1:4:A:T','0/1')
        add('A','CAND','chr1:4:A:T','1/1')
        add('B','REF','chr1:1:A:T','0/1')
        add('B','CAND','chr1:1:A:T','1|1')
        add('C','OTHER','chr1:9:A:T','0/1')
        add('D','REF','chr1:10:A:T','0/1')
        source = self.root/'source.jsonl.gz'
        with gzip.open(source,'wt') as f:
            for row in rows: f.write(json.dumps(row)+'\n')
        self.sha = hashlib.sha256(source.read_bytes()).hexdigest()
        build_index(source,self.root/'index',expected_sha256=self.sha)
        self.index = SampleOverlapIndex(self.root/'index',expected_sha256=self.sha)

    def tearDown(self):
        self.temp.cleanup()

    def test_distinct_overlap_zero_missing_and_suffix(self):
        result = self.index.counts('REF_E38')
        self.assertEqual(result['reference_gene_count'],3)
        self.assertEqual(result['reference_variant_count'],3)
        self.assertEqual(result['by_sample']['CAND'],{'sharedGenes':2,'sharedVariants':1})
        self.assertEqual(result['by_sample']['OTHER'],{'sharedGenes':0,'sharedVariants':0})
        self.assertNotIn('MISSING',result['by_sample'])
        self.assertIsNone(self.index.counts('MISSING'))
        self.assertIs(result,self.index.counts('REF'))
        self.assertFalse(result['source']['genetic_similarity_score'])

    def test_paginated_gene_counts_and_separate_variant_lists(self):
        page = self.index.details('REF','CAND',page=2,page_size=1)
        self.assertEqual(page['total'],2)
        self.assertEqual(page['rows'][0]['gene'],'B')
        self.assertNotIn('referenceVariants',page['rows'][0])
        detail = self.index.details('REF','CAND',gene='A')['rows'][0]
        self.assertEqual([detail[k] for k in ['referenceVariantCount','candidateVariantCount','sharedVariantCount']],[2,3,1])
        calls = {row['id']:row for row in detail['candidateVariants']}
        self.assertEqual(calls['chr1:1:A:T']['gt'],'1|1')
        self.assertEqual(calls['chr1:3:A:T']['gtStatus'],'missing')
        self.assertEqual(calls['chr1:4:A:T']['gtStatus'],'conflict')
        self.assertIsNone(calls['chr1:4:A:T']['gt'])
        self.assertEqual(self.index.details('REF','OTHER')['rows'],[])
        self.assertEqual(self.index.details('REF','MISSING')['status'],'unavailable')
        with self.assertRaises(ValueError): self.index.details('REF','CAND',gene='D')

    def test_checksum_failure(self):
        self.index.filename.write_bytes(b'broken')
        with self.assertRaisesRegex(ValueError,'checksum'):
            SampleOverlapIndex(self.root/'index',expected_sha256=self.sha)


if __name__ == '__main__': unittest.main()
