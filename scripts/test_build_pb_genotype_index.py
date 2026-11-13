import gzip
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from scripts.build_pb_genotype_index import build_index


class GenotypeIndexTest(unittest.TestCase):
    def test_gene_members_preserve_exact_source_and_reject_wrong_release(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'calls.jsonl.gz'
            rows = [{'gene_symbol': 'A', 'sample_id': 'S1', 'variant_id': 'chr1:1:A:G', 'gt': '0/2'},
                    {'gene_symbol': 'B', 'sample_id': 'S1', 'variant_id': 'chr1:2:C:T', 'gt': '1|1'}]
            with gzip.open(source, 'wt') as handle:
                handle.writelines(json.dumps(row) + '\n' for row in rows)
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            with self.assertRaisesRegex(ValueError, 'checksum'):
                build_index(source, root / 'wrong')
            result = build_index(source, root / 'index', digest)
            self.assertEqual(result['rows'], 2)
            self.assertEqual(result['genes'], 2)
            manifest = json.loads((root / 'index/manifest.json').read_text())
            packed = (root / 'index' / manifest['packed_file']).read_bytes()
            for row in rows:
                offset, length, count = manifest['genes'][row['gene_symbol']]
                self.assertEqual(count, 1)
                self.assertEqual(json.loads(gzip.decompress(packed[offset:offset + length])),
                                 [[row['sample_id'], row['variant_id'], row['gt']]])


if __name__ == '__main__':
    unittest.main()
