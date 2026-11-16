#!/usr/bin/env bash
# Source after changing to the checkout directory. Keep Gene n_terms on its
# approved scoring release, independently of the phenotype availability matrix.
pb_scoring_root="$PWD/.pb-private-data/rphers/gene-scoring-20261007-5a9ab06cc"
export PB_GENE_SCORING_HPO_MATRIX="${PB_GENE_SCORING_HPO_MATRIX:-$pb_scoring_root/hpo.tsv.gz}"
export PB_GENE_SCORING_SAMPLE_MAP="${PB_GENE_SCORING_SAMPLE_MAP:-$pb_scoring_root/covariates.tsv}"
export PB_GENE_SCORING_HPO_SHA256="${PB_GENE_SCORING_HPO_SHA256:-eaa0ea2e218d300d4b9546ec238128e146237cee92a43350bc2846d5bd834ba6}"

if ! python3 - <<'PY'
import hashlib
import os
from pathlib import Path
import sys

try:
    matrix = Path(os.environ['PB_GENE_SCORING_HPO_MATRIX'])
    mapping = Path(os.environ['PB_GENE_SCORING_SAMPLE_MAP'])
    digest = hashlib.sha256()
    with matrix.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    if digest.hexdigest() != os.environ['PB_GENE_SCORING_HPO_SHA256']:
        raise ValueError('Gene scoring matrix checksum mismatch: ' + str(matrix))
    with mapping.open() as handle:
        columns = handle.readline().rstrip('\r\n').split('\t')
    if not {'sample_id', 'vcf_sample_id'}.issubset(columns):
        raise ValueError('Gene scoring sample map requires sample_id and vcf_sample_id: ' + str(mapping))
except (OSError, ValueError) as error:
    print('Gene HPO totals: ' + str(error), file=sys.stderr)
    print('Install the approved Gene scoring matrix and sample map, or set PB_GENE_SCORING_HPO_MATRIX, PB_GENE_SCORING_SAMPLE_MAP and PB_GENE_SCORING_HPO_SHA256. See docs/pb_gene2_engineering_handoff_20261112.md, section 6.', file=sys.stderr)
    sys.exit(1)
PY
then
    unset pb_scoring_root
    return 1
fi
echo 'Gene HPO totals: using the verified local scoring matrix and sample map.' >&2
unset pb_scoring_root
