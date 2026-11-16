import json
import os
from pathlib import Path
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

from scripts import pb_local_server as lifecycle


class LocalServerTests(unittest.TestCase):
    def test_only_actual_server_commands_match(self):
        for command in ['node ./node_modules/.bin/vue-cli-service serve --port 8098',
                        '/usr/local/bin/Python -m scripts.pb_phenotype_profile_api --port 8093',
                        'python3 scripts/pb_local_server.py run -- node cli serve',
                        'python3 -m scripts.pb_gene_context_api_server']:
            self.assertTrue(lifecycle.is_server_command(command), command)
        for command in ['node other-app.js', 'python3 scripts/pb_local_server.py stop',
                        'node ./node_modules/.bin/vue-cli-service build',
                        'zsh -c "node vue-cli-service serve"',
                        'python3 -c "print(\'vue-cli-service serve\')"',
                        'ssh -N -L 8092:localhost:18092 e3']:
            self.assertFalse(lifecycle.is_server_command(command), command)

    def test_discovery_excludes_other_checkouts(self):
        root = Path('/tmp/this-checkout').resolve()
        listing = subprocess.CompletedProcess([], 0, '123 node cli/vue-cli-service serve\n124 node cli/vue-cli-service serve\n125 python3 other.py\n', '')
        with patch.object(lifecycle.subprocess, 'run', return_value=listing), patch.object(lifecycle, 'process_cwd', side_effect=[root, Path('/tmp/other-checkout')]):
            self.assertEqual(list(lifecycle.find_servers(root)), [123])

    def test_stop_rechecks_pid_ownership(self):
        old = {123: 'node cli/vue-cli-service serve'}
        with patch.object(lifecycle, 'find_servers', side_effect=[old, {}, {}, {}, {}]), patch.object(lifecycle.os, 'kill') as kill:
            self.assertEqual(lifecycle.stop_servers(grace=0), 0)
            kill.assert_not_called()

    def test_fixed_port_conflict_and_argument_override(self):
        with socket.socket() as occupied, patch.dict(os.environ, {}, clear=True):
            occupied.bind(('127.0.0.1', 0)); occupied.listen()
            port = occupied.getsockname()[1]
            with self.assertRaisesRegex(RuntimeError, 'occupied'):
                lifecycle.check_ports(['node', 'cli', '--port', str(port)])
        self.assertEqual(lifecycle.requested_port(['node', '--port', '8098', '--port=8123']), 8123)

    def run_group_case(self, mode, sig):
        with tempfile.TemporaryDirectory(prefix='pb-lifecycle-test-') as directory:
            root = Path(directory)
            ready = root / 'ready.json'
            # A deliberately stuck API descendant owns a listening socket. In
            # "exit" mode its parent exits normally first (orphan cleanup).
            api = ("import socket,time,signal,json,os;"
                   "signal.signal(signal.SIGTERM,signal.SIG_IGN);"
                   "s=socket.socket();s.bind(('127.0.0.1',0));s.listen();"
                   f"open({str(ready)!r},'w').write(json.dumps({{'pid':os.getpid(),'port':s.getsockname()[1]}}));"
                   "time.sleep(60)")
            driver = root / 'fake_server.py'
            driver.write_text('import subprocess,sys,time,signal\n'
                              'signal.signal(signal.SIGTERM,signal.SIG_IGN)\n'
                              f'subprocess.Popen([sys.executable,"-c",{api!r}])\n'
                              + ('time.sleep(1)\n' if mode == 'exit' else 'time.sleep(60)\n'))
            code = (f'import sys;sys.path.insert(0,{str(lifecycle.ROOT)!r});'
                    'from pathlib import Path;from scripts.pb_local_server import run_server;'
                    f'sys.exit(run_server([sys.executable,{str(driver)!r}],root=Path({str(root)!r}),grace=.3,preflight=False))')
            owner = subprocess.Popen([sys.executable, '-c', code], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                deadline = time.monotonic() + 5
                while not ready.exists() and time.monotonic() < deadline:
                    if owner.poll() is not None:
                        self.fail(owner.communicate())
                    time.sleep(.03)
                self.assertTrue(ready.exists())
                info = json.loads(ready.read_text())
                if sig is not None:
                    owner.send_signal(sig)
                stdout, stderr = owner.communicate(timeout=5)
                self.assertEqual(owner.returncode, 128 + sig if sig else 0, (stdout, stderr))
                with socket.socket() as probe:
                    # Listening socket must be released even when the API
                    # ignores TERM or the leader exited before cleanup.
                    probe.bind(('127.0.0.1', info['port']))
            finally:
                if owner.poll() is None:
                    owner.send_signal(signal.SIGTERM)
                    owner.communicate(timeout=5)

    def test_ctrl_c_cleans_stuck_api_group(self):
        self.run_group_case('wait', signal.SIGINT)

    def test_term_cleans_stuck_api_group(self):
        self.run_group_case('wait', signal.SIGTERM)

    def test_normal_exit_cleans_orphan_api(self):
        self.run_group_case('exit', None)

    def test_stop_cleans_legacy_server_but_leaves_other_checkout(self):
        with tempfile.TemporaryDirectory(prefix='pb-stop-test-') as directory:
            root = Path(directory).resolve()
            processes = []
            try:
                for name in ['target', 'other']:
                    checkout = root / name
                    (checkout / 'scripts').mkdir(parents=True)
                    (checkout / 'scripts/__init__.py').write_text('')
                    (checkout / 'scripts/pb_phenotype_profile_api.py').write_text(
                        "from pathlib import Path;import time;Path('ready').touch();time.sleep(60)")
                    processes.append(subprocess.Popen([sys.executable, '-m', 'scripts.pb_phenotype_profile_api'], cwd=checkout))
                deadline = time.monotonic() + 5
                while not all((root / name / 'ready').exists() for name in ['target', 'other']) and time.monotonic() < deadline:
                    time.sleep(.03)
                self.assertTrue(all((root / name / 'ready').exists() for name in ['target', 'other']))
                self.assertEqual(lifecycle.stop_servers(root / 'target', grace=.2), 0)
                processes[0].wait(timeout=3)
                self.assertIsNone(processes[1].poll())
            finally:
                for process in processes:
                    if process.poll() is None:
                        process.terminate()
                    process.wait(timeout=3)


if __name__ == '__main__':
    unittest.main()
