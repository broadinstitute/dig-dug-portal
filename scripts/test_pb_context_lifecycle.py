"""Exercise the batch lifecycle locally with harmless stand-ins for the APIs."""
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time
import unittest

from scripts.test_pb_context_connection import MOCK, ROOT


API = '''#!/usr/bin/env python3
import os,sys,time
from pathlib import Path
if '-c' in sys.argv: sys.exit(0)
port=sys.argv[sys.argv.index('--port')+1]
root=Path(os.environ['TEST_REMOTE_ROOT'])
(root/'pids'/port).write_text(str(os.getpid()))
if port==os.environ.get('TEST_API_EXIT_PORT'):
    time.sleep(0.3)
    sys.exit(17)
time.sleep(60)
'''


class BatchLifecycleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.root = base / 'deployments/test'
        for directory in ('runtime', 'source', 'inputs', 'scripts', 'pids', 'bin'):
            (self.root / directory).mkdir(parents=True)
        for relative in ('inputs.ready', 'scripts/pb_sample_gene_scores.py', 'scripts/pb_vcf_quality_api.py',
                         'source/2025_crdc_15764sample_hpo_parent_expanded_binary.tsv.gz',
                         'source/gene_scores.tsv', 'inputs/roster.tsv', 'inputs/covariates.tsv'):
            (self.root / relative).write_text('fixture')
        (self.root / 'runtime/submitted_job_id').write_text('123\n')
        self.bin = self.root / 'bin'
        for name, body in {
            'python-api': API, 'flock': MOCK,
            'Rscript': '#!/bin/bash\nexit 0\n',
            'curl': '#!/bin/bash\nexit 0\n',
            'sleep': '#!/bin/bash\n/bin/sleep 0.05\n',
        }.items():
            path = self.bin / name
            path.write_text(body)
            path.chmod(0o755)
        script = (ROOT / 'scripts/run_pb_context_demo.sbatch').read_text()
        script = script.replace(
            '/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/share/dig-dug-portal/pb_context_demo/',
            str(base / 'deployments') + '/')
        script = script.replace('source /programs/biogrids.shrc', ':')
        script = script.replace('/programs/x86_64-linux/python/3.12.2/mamba/bin/python3',
                                str(self.bin / 'python-api'))
        self.script = base / 'batch.sh'
        self.script.write_text(script)
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ['PATH'],
                        TEST_REMOTE_ROOT=str(self.root), TEST_LOG=str(base / 'calls.jsonl'),
                        SLURM_JOB_ID='123')

    def start(self, **settings):
        process = subprocess.Popen(['bash', str(self.script), str(self.root)],
                                   env={**self.env, **settings}, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, text=True)
        def finish():
            if process.poll() is None:
                process.terminate()
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
        self.addCleanup(finish)
        return process

    def wait_for_apis(self, process):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            if len(list((self.root / 'pids').iterdir())) == 4:
                return
            if process.poll() is not None:
                output, errors = process.communicate()
                self.fail(f'Batch exited before APIs started: {output}\n{errors}')
            time.sleep(0.02)
        self.fail('API fixtures did not start')

    def assert_apis_stopped(self):
        for path in (self.root / 'pids').iterdir():
            with self.assertRaises(ProcessLookupError, msg=f'API {path.name} still running'):
                os.kill(int(path.read_text()), 0)

    def assert_metadata_cleared(self):
        for name in ('job_id', 'submitted_job_id', 'node', 'bioindex_host', 'pid'):
            self.assertFalse((self.root / 'runtime' / name).exists(), name)
        self.assertTrue((self.root / 'inputs.ready').exists())

    def test_sigterm_stops_all_apis_and_removes_own_metadata(self):
        process = self.start()
        self.wait_for_apis(process)
        process.send_signal(signal.SIGTERM)
        output, errors = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 143, output + errors)
        self.assert_metadata_cleared()
        self.assertTrue((self.root / 'source/gene_scores.tsv').exists())
        self.assert_apis_stopped()

    def test_api_failure_stops_siblings_and_clears_metadata(self):
        process = self.start(TEST_API_EXIT_PORT='18096')
        output, errors = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 17, output + errors)
        self.assertIn('stopping job 123', errors)
        self.assert_metadata_cleared()
        self.assert_apis_stopped()

    def test_old_job_cleanup_preserves_new_job_metadata(self):
        process = self.start()
        self.wait_for_apis(process)
        for name, value in {'job_id': '456', 'submitted_job_id': '456',
                            'node': 'compute-new', 'pid': '999999'}.items():
            (self.root / 'runtime' / name).write_text(value)
        process.terminate()
        process.communicate(timeout=5)
        self.assertEqual((self.root / 'runtime/job_id').read_text(), '456')
        self.assertEqual((self.root / 'runtime/submitted_job_id').read_text(), '456')
        self.assertEqual((self.root / 'runtime/node').read_text(), 'compute-new')
        self.assertEqual((self.root / 'runtime/pid').read_text(), '999999')
        self.assert_apis_stopped()

    def test_preflight_failure_removes_submitted_id(self):
        (self.root / 'source/gene_scores.tsv').unlink()
        process = self.start()
        output, errors = process.communicate(timeout=5)
        self.assertEqual(process.returncode, 2, output + errors)
        self.assertIn('Missing input', errors)
        self.assert_metadata_cleared()


if __name__ == '__main__':
    unittest.main()
