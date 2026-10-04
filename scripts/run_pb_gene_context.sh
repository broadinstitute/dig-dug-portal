#!/usr/bin/env bash
# Run one HPO context against one gene. Output directory must be new.

usage() {
  cat <<'USAGE'
Usage: scripts/run_pb_gene_context.sh \
  --hpo-matrix HPO.tsv --roster ROSTER.tsv --variant-evidence VARIANTS.tsv \
  --covariates COVARIATES.tsv --gene-scores GENE_SCORES.tsv \
  --gene ATL1 --terms HP:0011734,HP:0006827 --output-dir NEW_DIRECTORY \
  [--variant-model ols|lmm] [--gene-model lm|lmm] \
  [--score-type max|sum] [--affected-only yes|no] \
  [--grm-prefix PREFIX] [--platform-file PLATFORM.tsv] [--score-id-map MAP.tsv]

For variant LMM, the current dense reference supports at most 1500 samples.
The gene LMM uses GMMAT and the selected GRM.
USAGE
}

hpo_matrix= roster= variant_evidence= covariates= gene_scores= gene= terms= output_dir=
variant_model=ols gene_model=lm score_type=max affected_only=no grm_prefix= platform_file= score_id_map=
while (($#)); do
  case "$1" in
    --hpo-matrix) hpo_matrix=${2:?}; shift 2 ;;
    --roster) roster=${2:?}; shift 2 ;;
    --variant-evidence) variant_evidence=${2:?}; shift 2 ;;
    --covariates) covariates=${2:?}; shift 2 ;;
    --gene-scores) gene_scores=${2:?}; shift 2 ;;
    --gene) gene=${2:?}; shift 2 ;;
    --terms) terms=${2:?}; shift 2 ;;
    --output-dir) output_dir=${2:?}; shift 2 ;;
    --variant-model) variant_model=${2:?}; shift 2 ;;
    --gene-model) gene_model=${2:?}; shift 2 ;;
    --score-type) score_type=${2:?}; shift 2 ;;
    --affected-only) affected_only=${2:?}; shift 2 ;;
    --grm-prefix) grm_prefix=${2:?}; shift 2 ;;
    --platform-file) platform_file=${2:?}; shift 2 ;;
    --score-id-map) score_id_map=${2:?}; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for item in "$hpo_matrix" "$roster" "$variant_evidence" "$covariates" "$gene_scores"; do
  [[ -f "$item" ]] || { echo "Missing input file: $item" >&2; exit 2; }
done
[[ -n "$gene" && -n "$terms" && -n "$output_dir" ]] || { usage >&2; exit 2; }
[[ "$variant_model" == ols || "$variant_model" == lmm ]] || { echo 'variant-model must be ols or lmm' >&2; exit 2; }
[[ "$gene_model" == lm || "$gene_model" == lmm ]] || { echo 'gene-model must be lm or lmm' >&2; exit 2; }
[[ "$score_type" == max || "$score_type" == sum ]] || { echo 'score-type must be max or sum' >&2; exit 2; }
[[ "$affected_only" == yes || "$affected_only" == no ]] || { echo 'affected-only must be yes or no' >&2; exit 2; }
if [[ "$variant_model" == lmm || "$gene_model" == lmm ]]; then
  [[ -f "${grm_prefix}.grm.id" && -f "${grm_prefix}.grm.bin" ]] || { echo 'LMM requires --grm-prefix with .grm.id and .grm.bin' >&2; exit 2; }
fi
[[ ! -e "$output_dir" ]] || { echo "Output directory already exists: $output_dir" >&2; exit 2; }
hpo_matrix=$(readlink -f "$hpo_matrix") || exit $?
roster=$(readlink -f "$roster") || exit $?
variant_evidence=$(readlink -f "$variant_evidence") || exit $?
covariates=$(readlink -f "$covariates") || exit $?
gene_scores=$(readlink -f "$gene_scores") || exit $?
output_dir=$(realpath -m "$output_dir") || exit $?
if [[ -n "$grm_prefix" ]]; then grm_prefix=$(readlink -f "${grm_prefix}.grm.id") || exit $?; grm_prefix=${grm_prefix%.grm.id}; fi
if [[ -n "$platform_file" ]]; then platform_file=$(readlink -f "$platform_file") || exit $?; fi
if [[ -n "$score_id_map" ]]; then score_id_map=$(readlink -f "$score_id_map") || exit $?; fi
IFS=',' read -r -a hpo_terms <<< "$terms"
hpo_args=()
for term in "${hpo_terms[@]}"; do
  term=${term//[[:space:]]/}
  [[ "$term" =~ ^HP:[0-9]{7}$ ]] || { echo "Invalid HPO term: $term" >&2; exit 2; }
  hpo_args+=(--hpo "$term")
done
[[ ${#hpo_args[@]} -gt 0 ]] || { echo 'At least one HPO term is required' >&2; exit 2; }

source /programs/biogrids.shrc || exit $?
export PYTHON_X=3.12.2 R_X=4.4.2 PYTHONNOUSERSITE=1
unset PYTHONPATH
python_bin=/programs/x86_64-linux/python/3.12.2/mamba/bin/python3
script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?
mkdir -p "$output_dir" || exit $?
output_dir=$(cd "$output_dir" && pwd) || exit $?

"$python_bin" -m scripts.prepare_gene_association_phers \
  --hpo-matrix "$hpo_matrix" --overlap-roster "$roster" \
  "${hpo_args[@]}" --output "$output_dir/residual_phers.tsv" || exit $?

variant_module=scripts.variant_association
if [[ "$variant_model" == lmm ]]; then variant_module=scripts.variant_association_lmm_reference; fi
variant_args=(--hpo-matrix "$hpo_matrix" --roster "$roster" --gene-evidence "$variant_evidence"
  --covariates "$covariates" --gene "$gene" --terms "$terms")
if [[ "$variant_model" == lmm ]]; then variant_args+=(--grm-prefix "$grm_prefix"); fi
"$python_bin" -m "$variant_module" "${variant_args[@]}" > "$output_dir/variant_${variant_model}.json" || exit $?

gene_args=(--phenotype "$output_dir/residual_phers.tsv" --covariates "$covariates"
  --gene-scores "$gene_scores" --genes "$gene" --score-type "$score_type"
  --affected-only "$affected_only" --output "$output_dir/gene_${gene_model}.tsv")
if [[ -n "$platform_file" ]]; then gene_args+=(--platform-file "$platform_file"); fi
if [[ -n "$score_id_map" ]]; then gene_args+=(--score-id-map "$score_id_map"); fi
if [[ "$gene_model" == lmm ]]; then gene_args+=(--grm-prefix "$grm_prefix"); fi
Rscript "scripts/run_gene_score_${gene_model}.R" "${gene_args[@]}" || exit $?

printf 'PB_GENE_CONTEXT_COMPLETE gene=%s terms=%s variant=%s gene_model=%s output=%s\n' \
  "$gene" "$terms" "$variant_model" "$gene_model" "$output_dir"
