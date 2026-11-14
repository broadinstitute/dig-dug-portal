"""Prepare the private GT cache using the caller's existing company SSH access.

Only the resolved index directory is printed to stdout, for the launchers.
No credentials or sample-level records are printed or stored in tracked files.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import tempfile

if __package__:
    from .build_pb_genotype_index import DATA_VERSION, SOURCE_SHA256, build_index
else:
    from build_pb_genotype_index import DATA_VERSION, SOURCE_SHA256, build_index

REPO = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = REPO / '.pb-private-data' / 'genotypes' / DATA_VERSION
REMOTE_SOURCE = ('/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ref/'
                 'dig-dug-portal/bioindex_handoff_20260907/sample_variant_gene.jsonl.gz')


def digest_file(filename):
    digest = hashlib.sha256()
    with Path(filename).open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def valid_index(directory):
    try:
        manifest = json.loads((directory / 'manifest.json').read_text())
        if not isinstance(manifest, dict):
            return False
        packed = manifest.get('packed_file', '')
        return (manifest.get('format') == 1
                and manifest.get('data_version') == DATA_VERSION
                and manifest.get('source_sha256') == SOURCE_SHA256
                and bool(re.fullmatch(r'genotypes-[a-f0-9]{64}\.bin', packed))
                and digest_file(directory / packed) == manifest.get('packed_sha256'))
    except (OSError, ValueError, TypeError):
        return False


def download_source(destination, host, remote):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.@:-]*', host):
        raise ValueError('PB_GT_SSH_HOST must be an SSH host or configured alias.')
    if not remote.startswith('/'):
        raise ValueError('PB_GT_REMOTE_SOURCE must be an absolute server path.')
    print(f'GT: downloading the approved processed release via SSH ({host}); first setup only.', file=sys.stderr)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, delete=False) as output:
            temporary = Path(output.name)
            try:
                result = subprocess.run([
                    'ssh', '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
                    '-o', 'StrictHostKeyChecking=yes', '-o', 'ServerAliveInterval=15',
                    '-o', 'ServerAliveCountMax=2', '-o', 'LogLevel=ERROR',
                    host, 'cat -- ' + shlex.quote(remote),
                ], stdout=output, stderr=subprocess.PIPE, timeout=180)
            except (OSError, subprocess.TimeoutExpired) as error:
                raise RuntimeError('Company SSH download unavailable; check VPN, SSH access and the configured host.') from error
        if result.returncode != 0:
            raise RuntimeError('Company SSH download failed; check VPN, SSH access, known_hosts and source-file permissions. No GT was installed.')
        if digest_file(temporary) != SOURCE_SHA256:
            raise ValueError('Downloaded GT source checksum mismatch. No GT was installed.')
        os.replace(temporary, destination)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def prepare(index, cache=DEFAULT_CACHE, host='e3', remote=REMOTE_SOURCE, download=True):
    index, cache = Path(index).expanduser().resolve(), Path(cache).expanduser().resolve()
    for directory in (index, cache):
        for public_root in (REPO / 'public', REPO / 'dist'):
            if directory == public_root or public_root in directory.parents:
                raise ValueError('Private GT files cannot be stored under public/ or dist/.')
    cache.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Serialize simultaneous launchers; a failed transfer cannot replace a valid cache.
    with (cache / '.setup.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if valid_index(index):
            print('GT: using the verified local index; no server connection needed.', file=sys.stderr)
            return index
        source = cache / 'sample_variant_gene.jsonl.gz'
        if not source.is_file() or digest_file(source) != SOURCE_SHA256:
            if not download:
                raise RuntimeError('No verified GT cache is available and PB_GT_AUTO_DOWNLOAD=0.')
            download_source(source, host, remote)
        print('GT: building the local index from the verified release; this may take a few minutes.', file=sys.stderr)
        result = build_index(source, index)
        if not valid_index(index):
            raise RuntimeError('GT index verification failed.')
        print(f"GT: ready ({result['genes']:,} genes, {result['rows']:,} calls).", file=sys.stderr)
        return index


def main():
    os.umask(0o077)
    try:
        index = prepare(
            os.environ.get('PB_GENOTYPE_INDEX') or DEFAULT_CACHE / 'index',
            host=os.environ.get('PB_GT_SSH_HOST', 'e3'),
            remote=os.environ.get('PB_GT_REMOTE_SOURCE', REMOTE_SOURCE),
            download=os.environ.get('PB_GT_AUTO_DOWNLOAD', '1') != '0',
        )
    except (OSError, ValueError, RuntimeError) as error:
        print(f'GT: {error}', file=sys.stderr)
        return 1
    print(index)
    return 0


if __name__ == '__main__':
    sys.exit(main())
