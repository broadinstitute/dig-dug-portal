"""Own a local PB dev-server process group and clean up its APIs on shutdown.

POSIX (macOS/Linux). Stop/status only discover known PB commands whose working
directory is this checkout; unrelated Node/Python processes are not targets.
"""
import argparse
import fcntl
import os
from pathlib import Path
import re
import shlex
import signal
import socket
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
GRACE_SECONDS = 3.0


def is_server_command(command):
    try:
        args = shlex.split(command)
    except ValueError:
        return False
    if not args:
        return False
    executable = Path(args[0]).name.lower()
    if executable in {'node', 'nodejs'}:
        return any(Path(arg).name == 'vue-cli-service' and args[index + 1] == 'serve'
                   for index, arg in enumerate(args[:-1]))
    if not re.fullmatch(r'python(?:\d+(?:\.\d+)*)?', executable):
        return False
    return any((arg == '-m' and args[index + 1] in
                {'scripts.pb_phenotype_profile_api', 'scripts.pb_gene_context_api_server'})
               or (Path(arg).name == 'pb_local_server.py' and args[index + 1] == 'run')
               for index, arg in enumerate(args[:-1]))


def process_cwd(pid):
    proc = Path('/proc') / str(pid) / 'cwd'
    try:
        if proc.exists():
            return proc.resolve()
        result = subprocess.run(['lsof', '-a', '-p', str(pid), '-d', 'cwd', '-Fn'],
                                capture_output=True, text=True)
        return next((Path(line[1:]).resolve() for line in result.stdout.splitlines()
                     if line.startswith('n/')), None)
    except (OSError, StopIteration):
        return None


def find_servers(root=ROOT):
    result = subprocess.run(['ps', '-axo', 'pid=,command='], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError('Cannot inspect local processes: ' + result.stderr.strip())
    found = {}
    for line in result.stdout.splitlines():
        parts = line.strip().split(None, 1)
        if len(parts) != 2 or not parts[0].isdigit():
            continue
        pid, command = int(parts[0]), parts[1]
        if pid != os.getpid() and is_server_command(command) and process_cwd(pid) == root.resolve():
            found[pid] = command
    return found


def stop_servers(root=ROOT, grace=GRACE_SECONDS):
    targets = find_servers(root)
    if not targets:
        print('PB: no local frontend/API processes remain in this checkout.')
        return 0
    print('PB: stopping local frontend/API PIDs: ' + ', '.join(map(str, targets)), flush=True)
    # Recheck ownership immediately before signalling; never use broad pkill.
    def signal_remaining(sig):
        current = find_servers(root)
        for pid, command in targets.items():
            if current.get(pid) == command:
                try:
                    os.kill(pid, sig)
                except ProcessLookupError:
                    pass
    signal_remaining(signal.SIGTERM)
    deadline = time.monotonic() + grace + 1
    while time.monotonic() < deadline:
        if not (set(targets) & set(find_servers(root))):
            break
        time.sleep(.15)
    signal_remaining(signal.SIGKILL)
    remaining = find_servers(root)
    if remaining:
        print('PB: processes still present; run npm run status:pb to inspect.', file=sys.stderr)
        return 1
    print('PB: local frontend/API servers stopped. External SSH tunnels/remote jobs are independent.')
    return 0


def requested_port(command):
    port = 8080
    for index, arg in enumerate(command):
        if arg == '--port' and index + 1 < len(command):
            port = int(command[index + 1])
        elif arg.startswith('--port='):
            port = int(arg.split('=', 1)[1])
    if not 1 <= port <= 65535:
        raise ValueError('The frontend port must be between 1 and 65535.')
    return port


def check_ports(command):
    port = requested_port(command)
    ports = {port}
    if all(os.environ.get(key) for key in ['PB_PHENOTYPE_HPO_MATRIX', 'PB_PHENOTYPE_METADATA', 'PB_PHENOTYPE_COHORT_MAPPING']):
        ports.add(int(os.environ.get('PB_PHENOTYPE_PROFILE_PORT', '8093')))
    if os.environ.get('PB_GENE_CONTEXT_DATA_ROOT') and not os.environ.get('PHENOTYPE_ANALYZER_HOST_PRIVATE'):
        ports.add(8092)
    for candidate in sorted(ports):
        with socket.socket() as probe:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                probe.bind(('127.0.0.1', candidate))
            except OSError as error:
                raise RuntimeError(f'Port {candidate} is occupied. Run npm run status:pb; '
                                   'use npm run stop:pb to clear this checkout\'s old servers. '
                                   'An unrelated service must be handled separately.') from error
    return port


def terminate_group(child, grace):
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        child.wait()
        return
    deadline = time.monotonic() + grace
    while time.monotonic() < deadline:
        child.poll()
        try:
            os.killpg(child.pid, 0)
        except ProcessLookupError:
            break
        time.sleep(.05)
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    child.wait()


def run_server(command, root=ROOT, grace=GRACE_SECONDS, preflight=True):
    directory = root / '.pb-private-data/runtime'
    directory.mkdir(parents=True, exist_ok=True)
    with (directory / 'local-server.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('A PB server launcher is already running for this checkout. '
                               'Use npm run stop:pb before restarting.')
        env = os.environ.copy()
        if preflight:
            env['PB_LOCAL_SERVER_PORT'] = str(check_ports(command))
        requested_stop = []
        def on_signal(signum, _frame):
            requested_stop.append(signum)
        old_handlers = {sig: signal.signal(sig, on_signal) for sig in
                        (signal.SIGINT, signal.SIGTERM, signal.SIGHUP)}
        child = None
        try:
            # A separate group makes terminal Ctrl+C reach the owner first. The
            # owner then terminates Vue + APIs + their descendants as one unit.
            child = subprocess.Popen(command, cwd=root, env=env, start_new_session=True)
            while child.poll() is None and not requested_stop:
                time.sleep(.1)
            result = child.poll()
            if requested_stop:
                print('\nPB: stopping frontend and its local APIs…', flush=True)
            return 128 + requested_stop[0] if requested_stop else (result if result is not None else 1)
        finally:
            if child is not None:
                terminate_group(child, grace)
            for sig, handler in old_handlers.items():
                signal.signal(sig, handler)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['run', 'stop', 'status'])
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    try:
        if args.action == 'run':
            command = args.command[1:] if args.command[:1] == ['--'] else args.command
            if not command:
                parser.error('run requires a command after --')
            return run_server(command)
        if args.action == 'stop':
            return stop_servers()
        servers = find_servers()
        for pid, command in servers.items():
            if 'vue-cli-service' in command:
                label = 'Vue frontend'
            elif 'pb_phenotype_profile_api' in command:
                label = 'Sample/Profile API'
            elif 'pb_gene_context_api_server' in command:
                label = 'Context API'
            else:
                label = 'PB launcher'
            match = re.search(r'--port(?:=|\s+)(\d+)', command)
            port = f' · port {match.group(1)}' if match else ''
            print(f'PID {pid} · {label}{port}')
        if not servers:
            print('PB: no local frontend/API processes remain in this checkout.')
        print('External SSH tunnels/remote compute jobs are managed separately.')
        return 0
    except (OSError, RuntimeError, ValueError) as error:
        print('PB: ' + str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
