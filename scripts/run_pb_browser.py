"""Install and run the local browser with its e3 tunnel in one terminal."""
import argparse
from http.client import HTTPConnection, HTTPException
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

from scripts.pb_local_server import terminate_group


ROOT = Path(__file__).resolve().parents[1]
API_PORTS = (8092, 8094, 8095, 8096)


def prepare(ssh_host):
    private = ROOT / '.pb-private-data'
    subprocess.run([sys.executable, 'scripts/setup_pb_runtime_data.py', '--ssh-host', ssh_host], check=True)
    venv = private / 'venv'
    python = venv / 'bin/python3'
    if not python.is_file():
        subprocess.run([sys.executable, '-m', 'venv', str(venv)], check=True)
    if subprocess.run([str(python), '-c', 'import numpy, scipy'], capture_output=True).returncode:
        subprocess.run([str(python), '-m', 'pip', 'install', '-r', 'scripts/requirements-pb-local.txt'], check=True)
    if not (ROOT / 'node_modules/.bin/vue-cli-service').is_file():
        subprocess.run(['npm', 'install'], check=True)

    values = subprocess.check_output(['bash', '-c', 'source "$1" && env -0', 'pb-browser', str(private / 'local.env')])
    env = dict(os.fsdecode(entry).split('=', 1) for entry in values.split(b'\0') if b'=' in entry)
    env.pop('PB_CONTEXT_DEMO_ROOT', None)
    env['PATH'] = str(venv / 'bin') + os.pathsep + env['PATH']
    return env


def api_ready(port):
    connection = HTTPConnection('127.0.0.1', port, timeout=1)
    try:
        connection.request('GET', '/health')
        return connection.getresponse().status == 200
    except (OSError, HTTPException):
        return False
    finally:
        connection.close()


def wait_for_analysis(tunnel, ready_file):
    deadline = None
    while True:
        state = ready_file.read_text().strip() if ready_file.is_file() else ''
        result = tunnel.poll()
        if result is not None and (result != 0 or state != 'reused'):
            raise RuntimeError('The e3 connection ended before the browser could start.')
        if state in {'opening', 'reused'}:
            if all(api_ready(port) for port in API_PORTS):
                return state
            if deadline is None:
                deadline = time.monotonic() + 45
            elif time.monotonic() >= deadline:
                raise RuntimeError('The e3 connection opened, but the analysis APIs did not respond.')
        time.sleep(0.5)


def serve(env):
    with tempfile.TemporaryDirectory(prefix='pb-browser-') as scratch:
        ready_file = Path(scratch) / 'tunnel'
        tunnel = subprocess.Popen(['bash', 'scripts/start_pb_context_demo.sh'],
                                  env={**env, 'PB_CONTEXT_READY_FILE': str(ready_file)}, start_new_session=True)
        try:
            state = wait_for_analysis(tunnel, ready_file)
            print('Open http://127.0.0.1:8098/pb_front2.html when the frontend is ready.', flush=True)
            frontend = subprocess.Popen(['bash', 'scripts/serve_pb_phenotype_local.sh'], env=env, start_new_session=True)
            try:
                while frontend.poll() is None:
                    if state == 'opening' and tunnel.poll() is not None:
                        raise RuntimeError('The e3 tunnel closed. Run npm run start:pb to reconnect.')
                    time.sleep(0.5)
                return frontend.returncode
            finally:
                if frontend.poll() is None:
                    frontend.terminate()
                    frontend.wait()
        finally:
            if tunnel.poll() is None:
                terminate_group(tunnel, grace=3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ssh-host', default=os.environ.get('PB_CONTEXT_SSH_HOST', 'e3'))
    args = parser.parse_args()
    os.chdir(ROOT)
    try:
        return serve(prepare(args.ssh_host))
    except KeyboardInterrupt:
        return 130
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'PB browser: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
