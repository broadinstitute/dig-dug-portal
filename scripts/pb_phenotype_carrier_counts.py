"""Descriptive GRS>0 counts from existing memberships and the expanded HPO matrix.

This is a sparse intersection/count, not an association model calculation.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy import sparse


def build(response, hpo_path, destination):
    from scripts.pb_gene_context_validation import load_hpo_matrix
    response, hpo_path, destination = Path(response), Path(hpo_path), Path(destination)
    data = json.loads(response.read_text())
    if data.get('definition') != 'existing gene_score > 0' or data.get('score_type') != 'sum':
        raise ValueError('Expected existing Sum GRS positive memberships.')
    hpo = load_hpo_matrix(hpo_path, [])
    samples = list(map(str, hpo['sample_ids']))
    positions = {sid: i for i, sid in enumerate(samples)}
    available = set(data['available_sample_ids'])
    unavailable = set(data['unavailable_sample_ids'])
    if available & unavailable or available | unavailable != set(samples):
        raise ValueError('GRS membership coverage does not match the HPO cohort.')
    indptr, indices = [0], []
    for sid in samples:
        row = data['sample_gene_indices'].get(sid, [])
        if sid in available and sid not in data['sample_gene_indices']:
            raise ValueError('An available sample has no memberships.')
        if len(set(row)) != len(row) or any(i < 0 or i >= len(data['genes']) for i in row):
            raise ValueError('Invalid positive membership indices.')
        indices.extend(row)
        indptr.append(len(indices))
    membership = sparse.csr_matrix((np.ones(len(indices), dtype=np.uint8), np.asarray(indices, dtype=np.int32), np.asarray(indptr, dtype=np.int32)), shape=(len(samples), len(data['genes'])))
    destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    sparse.save_npz(destination/'membership.npz', membership)
    sparse.save_npz(destination/'hpo.npz', hpo['matrix'].tocsc())
    np.save(destination/'coverage.npy', np.asarray([sid in available for sid in samples], dtype=bool))
    metadata = dict(genes=data['genes'], hpo_columns=hpo['hpo_columns'], cohort_samples=len(samples), covered_samples=len(available), analysis_roster_samples=data['analysis_sample_count'], definition=data['definition'], score_type='sum', sample_ids=samples, membership_sha256=hashlib.sha256(response.read_bytes()).hexdigest(), hpo_sha256=hashlib.sha256(hpo_path.read_bytes()).hexdigest())
    (destination/'metadata.json').write_text(json.dumps(metadata))
    for file in destination.iterdir():
        file.chmod(0o600)
    return {key:value for key,value in metadata.items() if key not in {'genes','hpo_columns'}}


def counts(destination, hpo, genes):
    destination = Path(destination)
    metadata = json.loads((destination/'metadata.json').read_text())
    column = metadata['hpo_columns'].index(hpo) if hpo in metadata['hpo_columns'] else None
    if column is None:
        return None
    membership = sparse.load_npz(destination/'membership.npz')
    observations = sparse.load_npz(destination/'hpo.npz')
    coverage = np.load(destination/'coverage.npy', allow_pickle=False)
    match = observations[:,column].toarray().ravel().astype(bool)
    all_counts = np.asarray(membership.sum(axis=0)).ravel()
    match_counts = np.asarray(membership[match].sum(axis=0)).ravel()
    at = {gene:i for i,gene in enumerate(metadata['genes'])}
    return dict(cohortSampleCount=metadata['cohort_samples'], coveredSampleCount=metadata['covered_samples'], matchingSampleCount=int(match.sum()), matchingCoveredCount=int(coverage[match].sum()), definition='Sum GRS > 0', source='existing approved gene-score memberships; parent-expanded CRDC HPO matrix', genes={gene:dict(all=int(all_counts[at[gene]]), withPhenotype=int(match_counts[at[gene]])) for gene in genes if gene in at})


def compare(destination, payload):
    from functools import lru_cache
    import re
    from scipy.stats import fisher_exact
    destination = Path(destination)
    metadata = json.loads((destination/'metadata.json').read_text())
    ids = payload.get('hpo_ids')
    selected_ids = payload.get('sample_ids')
    minimum = payload.get('minimum')
    if not isinstance(ids, list) or not 2 <= len(ids) <= 20 or len(set(ids)) != len(ids) or any(term not in metadata['hpo_columns'] for term in ids):
        raise ValueError('Choose 2 to 20 valid HPO terms.')
    if not isinstance(minimum, int) or isinstance(minimum, bool) or not 1 <= minimum <= len(ids):
        raise ValueError('Invalid minimum match count.')
    if not isinstance(selected_ids, list) or len(selected_ids) > 20000 or len(set(selected_ids)) != len(selected_ids) or any(not isinstance(value, str) for value in selected_ids):
        raise ValueError('Invalid selected sample set.')
    samples = metadata['sample_ids']
    selected = set(selected_ids)
    if not selected.issubset(set(samples)):
        raise ValueError('Sample set is outside the HPO cohort.')
    membership = sparse.load_npz(destination/'membership.npz')
    observations = sparse.load_npz(destination/'hpo.npz')
    coverage = np.load(destination/'coverage.npy', allow_pickle=False)
    query = observations[:,[metadata['hpo_columns'].index(term) for term in ids]].toarray().astype(bool)
    match = np.asarray([sid in selected for sid in samples], dtype=bool)
    if np.any(match & (query.sum(axis=1) < minimum)):
        raise ValueError('Selected samples do not satisfy this profile.')
    eligible_match = match & coverage
    eligible_other = ~match & coverage
    n_match, n_other = int(eligible_match.sum()), int(eligible_other.sum())
    positive_match = np.asarray(membership[eligible_match].sum(axis=0)).ravel()
    positive_other = np.asarray(membership[eligible_other].sum(axis=0)).ravel()
    query_counts = [np.asarray(membership[eligible_match & query[:,i]].sum(axis=0)).ravel() for i in range(len(ids))]
    approved = set(json.loads((Path(__file__).resolve().parents[1]/'src/views/PbPhenotype/profileGeneCatalog.generated.json').read_text())['genes'])
    @lru_cache(maxsize=None)
    def pvalue(a,b):
        return float(fisher_exact([[a,n_match-a],[b,n_other-b]], alternative='two-sided').pvalue)
    rows=[]
    compared=0
    for index,gene in enumerate(metadata['genes']):
        if gene not in approved:
            continue
        compared += 1
        a,b=int(positive_match[index]),int(positive_other[index])
        if not n_match or not n_other or not a or a / n_match <= b / n_other:
            continue
        rows.append(dict(gene=gene, matchingCarriers=a, comparisonCarriers=b,
            ratio=(a/n_match)/(b/n_other) if b else None, pValue=pvalue(a,b),
            queryCarrierCounts=[int(values[index]) for values in query_counts]))
    rows.sort(key=lambda row:(row['pValue'],-row['matchingCarriers'],row['gene']))
    return dict(hpoIds=ids, minimum=minimum, matchingSampleCount=int(match.sum()), otherSampleCount=int((~match).sum()),
        matchingCoveredCount=n_match, otherCoveredCount=n_other, cohortSampleCount=len(samples),
        coveredSampleCount=int(coverage.sum()), nCompared=compared, rows=rows,
        definition='Sum GRS > 0', pMethod='two-sided Fisher exact test; unadjusted',
        adjusted=False, membershipSha256=metadata['membership_sha256'])


if __name__ == '__main__':
    import sys
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--response')
    parser.add_argument('--hpo-matrix')
    parser.add_argument('--destination',required=True)
    parser.add_argument('--compare', action='store_true')
    args=parser.parse_args()
    if args.compare:
        result=compare(args.destination,json.load(sys.stdin))
    elif args.response and args.hpo_matrix:
        result=build(args.response,args.hpo_matrix,args.destination)
    else:
        parser.error('--response and --hpo-matrix are required for snapshot creation')
    print(json.dumps(result,allow_nan=False))
