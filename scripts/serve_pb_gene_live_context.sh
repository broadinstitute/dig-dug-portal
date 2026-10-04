#!/usr/bin/env bash
# Prepare private cohort inputs and serve both Gene pages with the Context API.

usage() {
  cat <<'USAGE'
Usage: bash scripts/serve_pb_gene_live_context.sh \
  --hpo-matrix HPO.tsv.gz --metadata METADATA.tsv --roster ROSTER.tsv \
  --pca PCA.tsv --bioindex-host http://HOST:5000 --output-dir NEW_PRIVATE_DIRECTORY \
  [--gene-scores GENE_SCORES.tsv]

The output directory holds private sample-level cohort inputs. Never serve it
as static content or include it in the engineer delivery archive.
USAGE
}

hpo_matrix= metadata= roster= pca= bioindex_host= output_dir= gene_scores=
while (($#)); do
  case "$1" in
    --hpo-matrix) hpo_matrix=${2:?}; shift 2 ;;
    --metadata) metadata=${2:?}; shift 2 ;;
    --roster) roster=${2:?}; shift 2 ;;
    --pca) pca=${2:?}; shift 2 ;;
    --bioindex-host) bioindex_host=${2:?}; shift 2 ;;
    --output-dir) output_dir=${2:?}; shift 2 ;;
    --gene-scores) gene_scores=${2:?}; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
for item in "$hpo_matrix" "$metadata" "$roster" "$pca"; do
  [[ -f "$item" ]] || { echo "Missing input file: $item" >&2; exit 2; }
done
[[ -n "$bioindex_host" && -n "$output_dir" ]] || { usage >&2; exit 2; }
if [[ -n "$gene_scores" && ! -f "$gene_scores" ]]; then
  echo "Missing gene score file: $gene_scores" >&2
  exit 2
fi

script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?
python_bin=${PB_GENE_CONTEXT_PYTHON:-python3}
"$python_bin" scripts/prepare_pb_gene_context_inputs.py \
  --hpo-matrix "$hpo_matrix" --metadata "$metadata" --roster "$roster" \
  --pca "$pca" --output-dir "$output_dir" || exit $?

export PB_GENE_CONTEXT_DATA_ROOT="$output_dir"
export BIOINDEX_HOST_PRIVATE="$bioindex_host"
export NODE_OPTIONS="${NODE_OPTIONS:---openssl-legacy-provider}"
if [[ -n "$gene_scores" ]]; then
  export PB_GENE_CONTEXT_GENE_SCORES="$gene_scores"
fi
exec npm run serve:pb-gene
