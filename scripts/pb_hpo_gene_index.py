"""Index the existing P<0.05 gene-HPO release by HPO; never fit models or adjust p/q."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import time


def build(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    stat = source.stat()
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_name(destination.name + '.partial')
    if partial.exists():
        raise ValueError('An unfinished index already exists: ' + str(partial))
    db = sqlite3.connect(partial)
    try:
        db.execute('PRAGMA journal_mode=OFF')
        db.execute('PRAGMA synchronous=OFF')
        db.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT)')
        db.execute('CREATE TABLE models (id INTEGER PRIMARY KEY, formula TEXT UNIQUE)')
        db.execute('CREATE TABLE associations (hpo TEXT, gene TEXT, beta REAL, se REAL, n INTEGER, cases INTEGER, controls INTEGER, low REAL, high REAL, odds REAL, p REAL, q_hpo REAL, q_gene REAL, npositive INTEGER, positive INTEGER, model INTEGER)')
        models, pending, total, genes = {}, [], 0, 0
        with gzip.open(source, 'rt') as handle:
            for line in handle:
                record = json.loads(line)
                if record.get('selection_rule') != 'p_value_lt_0.05':
                    raise ValueError('Use the complete November P<0.05 release, not the older top-15 projection.')
                genes += 1
                for row in record['associations']:
                    if row.get('fit_status') != 'PASS' or not 0 <= row['p_value'] < .05:
                        raise ValueError('Unexpected delivery selection.')
                    formula = row.get('model_formula') or ''
                    if formula not in models:
                        models[formula] = len(models) + 1
                        db.execute('INSERT INTO models VALUES (?,?)', (models[formula], formula))
                    pending.append((row['hpo_id'], record['gene'], row.get('beta_gene_score_sum_approx'), row.get('se_gene_score_sum_approx'), row.get('n_samples'), row.get('n_cases'), row.get('n_controls'), row.get('ci_lower_approx'), row.get('ci_upper_approx'), row.get('odds_ratio_approx'), row['p_value'], row.get('q_by_hpo'), row.get('q_by_gene'), row.get('n_positive_samples'), int(row.get('positive_direction') is True), models[formula]))
                if len(pending) >= 10000:
                    db.executemany('INSERT INTO associations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', pending)
                    total += len(pending)
                    pending.clear()
            if pending:
                db.executemany('INSERT INTO associations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', pending)
                total += len(pending)
        db.execute('CREATE INDEX by_hpo ON associations(hpo,p,gene)')
        digest = hashlib.sha256()
        with source.open('rb') as handle:
            for block in iter(lambda: handle.read(8 * 1024 * 1024), b''):
                digest.update(block)
        metadata = dict(source=str(source), source_size=stat.st_size, source_mtime_ns=stat.st_mtime_ns, source_sha256=digest.hexdigest(), release_id='gene_hpo_release_20261112', selection='PASS p_value < 0.05; both effect directions; no top-N limit', genes=genes, associations=total, schema_version=1)
        db.executemany('INSERT INTO metadata VALUES (?,?)', [(key, json.dumps(value)) for key, value in metadata.items()])
        db.commit()
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Index integrity check failed.')
        db.close()
        os.chmod(partial, 0o600)
        os.replace(partial, destination)
        return metadata
    except Exception:
        db.close()
        raise


def query(database, hpo):
    db = sqlite3.connect(Path(database).resolve().as_uri() + '?mode=ro', uri=True)
    try:
        metadata = {key: json.loads(value) for key, value in db.execute('SELECT key,value FROM metadata')}
        rows = db.execute('SELECT a.*, m.formula FROM associations a LEFT JOIN models m ON a.model=m.id WHERE hpo=? ORDER BY p,gene', (hpo,))
        associations = []
        for row in rows:
            associations.append(dict(hpo_id=row[0], gene=row[1], beta_gene_score_sum_approx=row[2], se_gene_score_sum_approx=row[3], n_samples=row[4], n_cases=row[5], n_controls=row[6], ci_lower_approx=row[7], ci_upper_approx=row[8], odds_ratio_approx=row[9], p_value=row[10], q_by_hpo=row[11], q_by_gene=row[12], n_positive_samples=row[13], positive_direction=bool(row[14]), model_formula=row[16], q_significant_by_hpo=row[11] is not None and row[11] < .05, fit_status='PASS'))
        carrier_counts = None
        try:
            from scripts.pb_burden_memberships import memberships
            carrier_counts = memberships(hpo, associations)
        except (OSError, ValueError, KeyError):
            carrier_counts = None
        return dict(metadata=metadata, associations=associations, carrierCounts=carrier_counts)
    finally:
        db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source')
    parser.add_argument('--database', required=True)
    parser.add_argument('--hpo')
    args = parser.parse_args()
    if args.hpo:
        result = query(args.database, args.hpo)
    elif args.source:
        started = time.monotonic()
        result = build(args.source, args.database)
        result['seconds'] = time.monotonic() - started
    else:
        parser.error('--source or --hpo is required')
    print(json.dumps(result, allow_nan=False))
