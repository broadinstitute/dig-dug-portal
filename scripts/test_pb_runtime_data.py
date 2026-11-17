"""Exercise installation failures and retries without transferring private data."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from scripts.setup_pb_runtime_data import prepare


class RuntimeSetupTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.repo = Path(self.temporary.name).resolve() / "user's checkout"
        self.repo.mkdir()
        self.root = self.repo / '.pb-private-data'
        self.payload = b'fixture runtime data\n'
        self.relative = 'inputs/fixture.tsv'
        self.manifest = Path(self.temporary.name) / 'manifest.json'
        self.write_manifest()
        self.calls = []

    def write_manifest(self, relative=None):
        self.manifest.write_text(json.dumps({
            'schema': 'pb-prototype-runtime-data-v1',
            'files': [{'path': relative or self.relative, 'size_bytes': len(self.payload),
                       'sha256': hashlib.sha256(self.payload).hexdigest()}],
        }))

    def transfer(self, host, relative, destination):
        self.calls.append((host, relative))
        destination.write_bytes(self.payload)

    def install(self, **kwargs):
        return prepare(self.repo, self.manifest, transfer=self.transfer, **kwargs)

    def test_install_reuse_verify_and_shell_settings(self):
        self.install(host='own-e3')
        self.install(host='own-e3')
        self.install(verify_only=True)
        self.assertEqual(self.calls, [('own-e3', self.relative)])
        config = self.root / 'local.env'
        self.assertEqual(config.stat().st_mode & 0o777, 0o600)
        self.assertEqual((self.root / self.relative).stat().st_mode & 0o777, 0o600)
        result = subprocess.run(['bash', '-c', 'source "$1"; printf "%s\\n" "$PB_PHENOTYPE_METADATA" "$PB_CONTEXT_SSH_HOST" "$PB_CONTEXT_ALLOW_SUBMIT"', 'test', str(config)], capture_output=True, text=True, check=True)
        self.assertEqual(result.stdout.splitlines(), [str(self.root / 'inputs/metadata.xlsx'), 'own-e3', '0'])

    def test_failed_transfer_retains_partial_and_retries(self):
        def fail(host, relative, destination):
            destination.write_bytes(b'partial')
            raise RuntimeError('connection interrupted')
        with self.assertRaises(RuntimeError):
            prepare(self.repo, self.manifest, transfer=fail)
        self.assertFalse((self.root / self.relative).exists())
        self.assertFalse((self.root / 'local.env').exists())
        self.assertTrue((self.root / '.runtime-downloads' / self.relative).exists())
        self.install()
        self.assertEqual((self.root / self.relative).read_bytes(), self.payload)

    def test_bad_checksum_preserves_existing_file_and_configuration(self):
        self.install()
        target = self.root / self.relative
        target.write_bytes(b'old data')
        original_config = (self.root / 'local.env').read_text()
        def corrupt(host, relative, destination):
            destination.write_bytes(b'incorrect data')
        with self.assertRaisesRegex(RuntimeError, 'Checksum mismatch'):
            prepare(self.repo, self.manifest, transfer=corrupt)
        self.assertEqual(target.read_bytes(), b'old data')
        self.assertEqual((self.root / 'local.env').read_text(), original_config)

    def test_rejects_traversal_before_transfer(self):
        for relative in ('../outside', '/absolute', 'inputs/../../outside', 'inputs/$(command)', 'inputs/./file'):
            self.write_manifest(relative)
            with self.assertRaises(ValueError):
                self.install()
        self.assertFalse(self.calls)

    def test_rejects_private_root_symlink(self):
        outside = Path(self.temporary.name) / 'outside'
        outside.mkdir()
        self.root.symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlinks'):
            self.install()
        self.assertFalse(list(outside.iterdir()))

    def test_rejects_nested_symlink(self):
        self.root.mkdir()
        (self.root / 'inputs').symlink_to(Path(self.temporary.name), target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlinks'):
            self.install()
        self.assertFalse(self.calls)

    def test_preserves_unmanaged_local_config(self):
        self.root.mkdir()
        config = self.root / 'local.env'
        config.write_text('export EXISTING_SETTING=keep\n')
        with self.assertRaisesRegex(ValueError, 'not installer-managed'):
            self.install()
        self.assertEqual(config.read_text(), 'export EXISTING_SETTING=keep\n')
        self.assertFalse(self.calls)

    def test_verify_only_does_not_create_files(self):
        with self.assertRaisesRegex(RuntimeError, 'Missing or mismatched'):
            self.install(verify_only=True)
        self.assertFalse(self.root.exists())

    def test_rejects_option_injection_in_host(self):
        for host in ('-oProxyCommand=bad', 'host; command', 'host with spaces'):
            with self.assertRaises(ValueError):
                self.install(host=host)
        self.assertFalse(self.calls)


if __name__ == '__main__':
    unittest.main()
