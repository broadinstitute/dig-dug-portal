"""Read original binary-HPO burden input memberships for frontend intersections.

Only opaque, zero-based analysis-row IDs are returned, never patient identifiers.
Stored statistical results and rPheRS are not modified or recalculated.
"""
import argparse
import csv
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
import struct
import zlib

SCHEMA = 'original-burden-memberships-v1'
DEFAULT_ROOT = Path(__file__).resolve().parents[1] / '.pb-private-data/precomputed/burden-original-memberships'


def digest(path):
    value=hashlib.sha256()
    with Path(path).open('rb') as handle:
        for block in iter(lambda:handle.read(8*1024*1024),b''): value.update(block)
    return value.hexdigest()


def pack(indices):
    return zlib.compress(struct.pack('<'+'H'*len(indices), *indices))


def unpack(value):
    raw=zlib.decompress(value)
    return list(struct.unpack('<'+'H'*(len(raw)//2),raw))


def build(root):
    root=Path(root)
    destination=root/'membership.sqlite'
    partial=root/'membership.sqlite.partial'
    if partial.exists(): raise ValueError('An unfinished membership build already exists.')
    con=sqlite3.connect(partial)
    try:
        con.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY,value TEXT)')
        con.execute('CREATE TABLE genes (gene TEXT PRIMARY KEY,n INTEGER,indices BLOB)')
        con.execute('CREATE TABLE hpos (hpo TEXT PRIMARY KEY,n INTEGER,indices BLOB)')
        with (root/'gene_manifest.tsv').open() as handle:
            expected={row['gene']:int(row['n_positive_samples']) for row in csv.DictReader(handle,delimiter='\t')}
        with gzip.open(root/'positive-gene-indices.jsonl.gz','rt') as handle:
            meta=json.loads(next(handle));n=int(meta['analysisN'])
            for line in handle:
                row=json.loads(line)
                indices=row['sampleIndices']
                if isinstance(indices,int): indices=[indices]
                if len(indices)!=expected[row['gene']] or len(set(indices))!=len(indices) or any(i<0 or i>=n for i in indices):
                    raise ValueError('Original gene membership does not match its manifest: '+row['gene'])
                con.execute('INSERT INTO genes VALUES (?,?,?)',(row['gene'],len(indices),pack(indices)))
        if con.execute('SELECT COUNT(*) FROM genes').fetchone()[0]!=len(expected): raise ValueError('Incomplete gene export.')
        with (root/'hpo_binary.bin').open('rb') as binary,(root/'hpo_manifest.tsv').open() as handle:
            for row in csv.DictReader(handle,delimiter='\t'):
                binary.seek(int(row['byte_offset']));values=binary.read(n)
                if len(values)!=n or any(v not in (0,1) for v in values): raise ValueError('Invalid original HPO binary vector.')
                indices=[i for i,value in enumerate(values) if value]
                if len(indices)!=int(row['cases']) or n-len(indices)!=int(row['controls']): raise ValueError('HPO manifest mismatch: '+row['hpo_id'])
                con.execute('INSERT INTO hpos VALUES (?,?,?)',(row['hpo_id'],len(indices),pack(indices)))
        hashes={name:digest(root/name) for name in ['model_covariates.rds','gene_score_sum.sparse.rds','gene_manifest.tsv','hpo_manifest.tsv','hpo_binary.bin','prepare_qc.tsv']}
        metadata=dict(schema=SCHEMA,analysisN=n,cohortId='sha256:'+hashes['model_covariates.rds'],indexDefinition=meta['indexDefinition'],sourceHashes=hashes)
        con.executemany('INSERT INTO metadata VALUES (?,?)',[(key,json.dumps(value))for key,value in metadata.items()]);con.commit()
        if con.execute('PRAGMA integrity_check').fetchone()[0]!='ok': raise ValueError('Membership index failed integrity check.')
        con.close();partial.chmod(0o600);partial.replace(destination)
        (root/'provenance.json').write_text(json.dumps(metadata,indent=2));(root/'provenance.json').chmod(0o600)
        return metadata
    except Exception:
        con.close();raise


def memberships(hpo, associations, root=DEFAULT_ROOT):
    database=Path(root)/'membership.sqlite'
    if not database.is_file() or not associations: return None
    con=sqlite3.connect(database.resolve().as_uri()+'?mode=ro',uri=True)
    try:
        meta={key:json.loads(value)for key,value in con.execute('SELECT key,value FROM metadata')}
        if meta.get('schema')!=SCHEMA: return None
        observation=con.execute('SELECT n,indices FROM hpos WHERE hpo=?',(hpo,)).fetchone()
        if observation is None: return None
        genes={}
        for row in associations:
            if row.get('n_samples')!=meta['analysisN'] or row.get('n_cases')!=observation[0]: return None
            found=con.execute('SELECT n,indices FROM genes WHERE gene=?',(row['gene'],)).fetchone()
            if found is None or found[0]!=row.get('n_positive_samples'): return None
            genes[row['gene']]=unpack(found[1])
        bundle=dict(schema=SCHEMA,hpoId=hpo,cohortId=meta['cohortId'],analysisN=meta['analysisN'],nCases=observation[0],hpoSampleIds=unpack(observation[1]),geneCarrierSampleIds=genes)
        # No HPO×gene intersection is computed here; the UI intersects these sets.
        return dict(cohortSampleCount=meta['analysisN'],coveredSampleCount=meta['analysisN'],matchingSampleCount=observation[0],matchingCoveredCount=observation[0],definition='gene_score_sum > 0',source='original single-HPO burden-analysis prepared inputs',sampleMembership=bundle,genes={row['gene']:dict(all=row['n_positive_samples'],withPhenotype=None)for row in associations})
    finally:
        con.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--build',required=True)
    print(json.dumps(build(parser.parse_args().build)))
