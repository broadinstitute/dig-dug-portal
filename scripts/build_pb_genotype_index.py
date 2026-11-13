"""Build a private gene-keyed GT lookup from the processed JSONL handoff.

Each gene is a separate gzip member in one packed file. Requests read only that
member, rather than scanning the original 11M rows. No calls are inferred.
"""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

DATA_VERSION = '2025_crdc_16366_dp20_af001_20260907'
SOURCE_SHA256 = 'e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7'


def build_index(source, destination, expected_sha256=SOURCE_SHA256):
    source, destination = Path(source), Path(destination)
    digest = hashlib.sha256()
    with source.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(block)
    if digest.hexdigest() != expected_sha256:
        raise ValueError('Processed genotype source checksum mismatch.')
    destination.mkdir(parents=True, exist_ok=True)
    genes, count, current, calls = {}, 0, None, []
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination, delete=False) as packed:
            temporary = Path(packed.name)

            def flush():
                if current is None:
                    return
                if current in genes:
                    raise ValueError('Input must be grouped by gene.')
                blob = gzip.compress(json.dumps(calls, separators=(',', ':')).encode(), mtime=0)
                genes[current] = [packed.tell(), len(blob), len(calls)]
                packed.write(blob)

            with gzip.open(source, 'rt') as handle:
                for line in handle:
                    row = json.loads(line)
                    gene, sample, variant = row['gene_symbol'], row['sample_id'], row['variant_id']
                    if not all(isinstance(value, str) and value for value in (gene, sample, variant)):
                        raise ValueError('Missing gene, sample or exact variant ID.')
                    if gene != current:
                        flush()
                        current, calls = gene, []
                    gt = row.get('gt')
                    if gt is not None and not re.fullmatch(r'(?:\d+|\.)(?:[/|](?:\d+|\.))*', gt):
                        raise ValueError('Invalid source GT.')
                    calls.append([sample, variant, gt])
                    count += 1
            flush()
        pack_sha = hashlib.sha256(temporary.read_bytes()).hexdigest()
        # Content-addressed name keeps readers of an older manifest consistent.
        pack_name = f'genotypes-{pack_sha}.bin'
        os.replace(temporary, destination / pack_name)
        manifest = {'format': 1, 'data_version': DATA_VERSION,
                    'source_sha256': digest.hexdigest(), 'source_file': source.name,
                    'scope': 'GRCh38; nonsynonymous; DP>=20; cohort AF<0.01',
                    'packed_file': pack_name, 'packed_sha256': pack_sha,
                    'rows': count, 'genes': genes}
        with tempfile.NamedTemporaryFile(mode='w', dir=destination, delete=False) as output:
            json.dump(manifest, output, separators=(',', ':'))
            manifest_tmp = Path(output.name)
        os.replace(manifest_tmp, destination / 'manifest.json')
        return {'rows': count, 'genes': len(genes), 'packed_bytes': (destination / pack_name).stat().st_size,
                'source_sha256': digest.hexdigest()}
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    print(json.dumps(build_index(args.source, args.out)))
