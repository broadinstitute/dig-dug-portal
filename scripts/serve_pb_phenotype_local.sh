#!/usr/bin/env bash
# Run the local phenotype page with the existing CRDC scoring inputs.

script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?

data_root="${HOME}/Documents/BCH/99_2025_CRDC/results"
export PB_PHENOTYPE_HPO_MATRIX="${PB_PHENOTYPE_HPO_MATRIX:-$data_root/processed/hpo_parent_expansion_obo260216_metadata20260714_20260716/2025_crdc_16366sample_hpo_parent_expanded_binary.tsv.gz}"
export PB_PHENOTYPE_METADATA="${PB_PHENOTYPE_METADATA:-$data_root/CRDC20251009_updated_07142026_Aditi_confirmed_metadata_16366.tsv}"
project_metadata="$script_root/.pb-private-data/samples-info-projects.jsonl"
if [[ ! -r "$project_metadata" ]]; then
    project_metadata="${HOME}/Documents/BCH/90_Ref/Cohort mapping (8).csv"
fi
export PB_PHENOTYPE_COHORT_MAPPING="${PB_PHENOTYPE_COHORT_MAPPING:-$project_metadata}"
release_root="$script_root/.pb-private-data/precomputed/gene_hpo_release_20261112"
export PB_GENE_HPO_FILE="${PB_GENE_HPO_FILE:-$release_root/browser_gene_hpo.jsonl.gz}"
export PB_HPO_GENE_INDEX="${PB_HPO_GENE_INDEX:-$release_root/hpo-gene.sqlite}"
export PB_GENE_HPO_RELEASE_ID="${PB_GENE_HPO_RELEASE_ID:-gene_hpo_release_20261112}"
export BIOINDEX_HOST_PRIVATE="${BIOINDEX_HOST_PRIVATE:-http://100.80.30.199:5000}"

for input_file in "$PB_PHENOTYPE_HPO_MATRIX" "$PB_PHENOTYPE_METADATA" "$PB_PHENOTYPE_COHORT_MAPPING" "$PB_GENE_HPO_FILE" "$PB_HPO_GENE_INDEX"; do
    if [[ ! -r "$input_file" ]]; then
        echo "PB Phenotype input is missing or unreadable: $input_file" >&2
        exit 2
    fi
done

source scripts/prepare_pb_genotypes.sh
exec node ./node_modules/.bin/vue-cli-service serve --port 8098 --host 127.0.0.1 "$@"
