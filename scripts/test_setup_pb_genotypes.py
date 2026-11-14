import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from scripts import setup_pb_genotypes as setup
from scripts.build_pb_genotype_index import build_index


class SetupGenotypesTest(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        self.cache, self.index = self.root / 'cache', self.root / 'cache/index'
        self.payload = gzip.compress((json.dumps({
            'gene_symbol': 'TEST', 'sample_id': 'S1',
            'variant_id': 'chr1:1:A:G', 'gt': '1|1',
        }) + '\n').encode(), mtime=0)
        self.digest = hashlib.sha256(self.payload).hexdigest()
        for mocker in (
            patch.object(setup, 'SOURCE_SHA256', self.digest),
            patch.object(setup, 'build_index', side_effect=lambda source, index: build_index(source, index, self.digest)),
        ):
            mocker.start()
            self.addCleanup(mocker.stop)

    def ssh_success(self, command, **kwargs):
        self.assertIn('BatchMode=yes', command)
        self.assertIn('StrictHostKeyChecking=yes', command)
        self.assertEqual(command[-2], 'company-alias')
        kwargs['stdout'].write(self.payload)
        return SimpleNamespace(returncode=0)

    def test_download_build_and_reuse_without_ssh(self):
        with patch.object(setup.subprocess, 'run', side_effect=self.ssh_success) as remote:
            self.assertEqual(setup.prepare(self.index, self.cache, host='company-alias'), self.index.resolve())
            self.assertTrue(setup.valid_index(self.index))
            setup.prepare(self.index, self.cache, host='not-accessible', download=False)
            self.assertEqual(remote.call_count, 1, 'A verified cache must work offline')
        manifest = json.loads((self.index / 'manifest.json').read_text())
        self.assertEqual(manifest['rows'], 1)
        self.assertEqual((self.cache / 'sample_variant_gene.jsonl.gz').read_bytes(), self.payload)
        self.assertEqual((self.cache / 'sample_variant_gene.jsonl.gz').stat().st_mode & 0o777, 0o600)

    def test_unauthorized_download_installs_nothing_and_can_retry(self):
        with patch.object(setup.subprocess, 'run', return_value=SimpleNamespace(returncode=255)):
            with self.assertRaisesRegex(RuntimeError, 'SSH download failed'):
                setup.prepare(self.index, self.cache)
        self.assertEqual([p.name for p in self.cache.iterdir()], ['.setup.lock'])
        self.assertFalse(self.index.exists())
        with patch.object(setup.subprocess, 'run', side_effect=self.ssh_success):
            setup.prepare(self.index, self.cache, host='company-alias')
        self.assertTrue(setup.valid_index(self.index))

    def test_wrong_release_rejected_before_indexing(self):
        def wrong_release(command, **kwargs):
            kwargs['stdout'].write(b'wrong release')
            return SimpleNamespace(returncode=0)
        with patch.object(setup.subprocess, 'run', side_effect=wrong_release):
            with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                setup.prepare(self.index, self.cache)
        self.assertFalse(self.index.exists())
        self.assertFalse((self.cache / 'sample_variant_gene.jsonl.gz').exists())

    def test_corrupt_index_rebuilt_from_verified_source_offline(self):
        with patch.object(setup.subprocess, 'run', side_effect=self.ssh_success):
            setup.prepare(self.index, self.cache, host='company-alias')
        manifest = json.loads((self.index / 'manifest.json').read_text())
        (self.index / manifest['packed_file']).write_bytes(b'corrupt')
        self.assertFalse(setup.valid_index(self.index))
        with patch.object(setup.subprocess, 'run') as remote:
            setup.prepare(self.index, self.cache, download=False)
            remote.assert_not_called()
        self.assertTrue(setup.valid_index(self.index))

    def test_offline_without_cache_and_public_paths_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'AUTO_DOWNLOAD=0'):
            setup.prepare(self.index, self.cache, download=False)
        with self.assertRaisesRegex(ValueError, 'public/'):
            setup.prepare(setup.REPO / 'public/private-gt', self.cache)

    def test_launcher_exports_index_and_continues_when_unavailable(self):
        fake = self.root / 'fake python'
        fake.write_text('#!/bin/sh\nprintf "%s\\n" "/private/local/index"\n')
        fake.chmod(0o700)
        env = dict(os.environ, PB_GT_PYTHON=str(fake), PB_GENOTYPE_INDEX='old-index')
        command = ['bash', '-c', 'source scripts/prepare_pb_genotypes.sh; printf "GT_RESULT=%s" "${PB_GENOTYPE_INDEX:-missing}"']
        result = subprocess.run(command, cwd=setup.REPO, env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, 'GT_RESULT=/private/local/index')
        fake.write_text('#!/bin/sh\nexit 1\n')
        result = subprocess.run(command, cwd=setup.REPO, env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, 'GT_RESULT=missing')
        self.assertIn('continuing without genotypes', result.stderr)


if __name__ == '__main__':
    unittest.main()
