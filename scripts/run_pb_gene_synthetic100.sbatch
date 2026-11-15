#!/bin/bash
#SBATCH --job-name=pb_gene_synth100
#SBATCH --partition=bch-compute
#SBATCH --cpus-per-task=2
#SBATCH --mem=16G
#SBATCH --time=01:00:00

source /programs/biogrids.shrc || exit $?
export PYTHON_X=3.12.2
export R_X=4.4.2
unset PYTHONPATH  # login shell prepends Python 3.6 packages, incompatible with 3.12
export PYTHONNOUSERSITE=1
export OMP_NUM_THREADS=2
export OPENBLAS_NUM_THREADS=2
export MKL_NUM_THREADS=2
PYTHON=/programs/x86_64-linux/python/3.12.2/mamba/bin/python3

ROOT=$1
ADCY10_ROOT=/lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/ADCY10/analysis_2025/three_cohort_grm_idf15764_20260924
COHORT_COV=$ADCY10_ROOT/cohort_all/data/covariates_pc20.tsv
GRM_PREFIX=$ADCY10_ROOT/cohort_all/data/grm_subset

if [[ -z "$ROOT" || "$ROOT" != /lab-share/RC-Data-Science-e2/Groups/gnomad/kyuryung/sandbox/* ]]; then
    echo 'Pass an output directory inside the approved kyuryung/sandbox' >&2
    exit 2
fi
cd "$ROOT" || exit $?
"$PYTHON" -c 'import numpy, scipy' || exit $?
Rscript -e 'stopifnot(requireNamespace("GMMAT",quietly=TRUE),requireNamespace("data.table",quietly=TRUE))' || exit $?

"$PYTHON" -m scripts.test_pb_gene_synthetic100_server prepare --root "$ROOT" --cohort-cov "$COHORT_COV" || exit $?
"$ROOT/scripts/run_pb_gene_context.sh" \
    --hpo-matrix "$ROOT/input/hpo.tsv" --roster "$ROOT/input/roster.tsv" \
    --variant-evidence "$ROOT/input/variant_evidence.tsv" --covariates "$ROOT/input/covariates.tsv" \
    --gene-scores "$ROOT/input/gene_scores.tsv" --gene ATL1 \
    --terms HP:0011734,HP:0006827 --variant-model ols --gene-model lm \
    --score-type max --affected-only no --output-dir "$ROOT/results/ols_lm" || exit $?
cp "$ROOT/results/ols_lm/residual_phers.tsv" "$ROOT/input/residual_phers.tsv"
cp "$ROOT/results/ols_lm/variant_ols.json" "$ROOT/results/variant_ols.json"
cp "$ROOT/results/ols_lm/gene_lm.tsv" "$ROOT/results/gene_lm_max_all.tsv"

"$ROOT/scripts/run_pb_gene_context.sh" \
    --hpo-matrix "$ROOT/input/hpo.tsv" --roster "$ROOT/input/roster.tsv" \
    --variant-evidence "$ROOT/input/variant_evidence.tsv" --covariates "$ROOT/input/covariates.tsv" \
    --gene-scores "$ROOT/input/gene_scores.tsv" --gene ATL1 \
    --terms HP:0011734,HP:0006827 --variant-model lmm --gene-model lmm \
    --score-type max --affected-only no --grm-prefix "$GRM_PREFIX" \
    --output-dir "$ROOT/results/lmm_lmm" || exit $?
cp "$ROOT/results/lmm_lmm/variant_lmm.json" "$ROOT/results/variant_lmm.json"
cp "$ROOT/results/lmm_lmm/gene_lmm.tsv" "$ROOT/results/gene_lmm_max_all.tsv"

"$PYTHON" -m scripts.test_pb_gene_synthetic100_server check-variant \
    --root "$ROOT" --grm-prefix "$GRM_PREFIX" || exit $?
Rscript scripts/run_gene_score_lm.R \
    --phenotype "$ROOT/input/residual_phers.tsv" --covariates "$ROOT/input/covariates.tsv" \
    --gene-scores "$ROOT/input/gene_scores.tsv" --score-type sum --affected-only yes \
    --output "$ROOT/results/gene_lm_sum_affected.tsv" || exit $?
Rscript scripts/run_gene_score_lmm.R \
    --phenotype "$ROOT/input/residual_phers.tsv" --covariates "$ROOT/input/covariates.tsv" \
    --gene-scores "$ROOT/input/gene_scores.tsv" --score-type sum --affected-only yes \
    --grm-prefix "$GRM_PREFIX" --output "$ROOT/results/gene_lmm_sum_affected.tsv" || exit $?
Rscript scripts/verify_pb_gene_synthetic100.R "$ROOT" "$GRM_PREFIX" || exit $?
echo 'PB_GENE_SYNTHETIC100_ALL_PASS'
