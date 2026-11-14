#!/usr/bin/env bash
# Run the local phenotype page with the existing CRDC scoring inputs.

script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?

data_root="${HOME}/Documents/BCH/99_2025_CRDC/results"
export PB_PHENOTYPE_HPO_MATRIX="${PB_PHENOTYPE_HPO_MATRIX:-$data_root/processed/hpo_parent_expansion_obo260216_metadata20260714_20260716/2025_crdc_16366sample_hpo_parent_expanded_binary.tsv.gz}"
export PB_PHENOTYPE_METADATA="${PB_PHENOTYPE_METADATA:-$data_root/CRDC20251009_updated_07142026_Aditi_confirmed_metadata_16366.tsv}"
export PB_PHENOTYPE_COHORT_MAPPING="${PB_PHENOTYPE_COHORT_MAPPING:-${HOME}/Documents/BCH/90_Ref/Cohort mapping (8).csv}"
export PB_GENE_HPO_FILE="${PB_GENE_HPO_FILE:-${HOME}/Downloads/browser_gene_hpo.jsonl.gz}"
export BIOINDEX_HOST_PRIVATE="${BIOINDEX_HOST_PRIVATE:-http://100.80.30.199:5000}"

for input_file in "$PB_PHENOTYPE_HPO_MATRIX" "$PB_PHENOTYPE_METADATA" "$PB_PHENOTYPE_COHORT_MAPPING" "$PB_GENE_HPO_FILE"; do
    if [[ ! -r "$input_file" ]]; then
        echo "PB Phenotype input is missing or unreadable: $input_file" >&2
        exit 2
    fi
done

exec node ./node_modules/.bin/vue-cli-service serve --port 8098 --host 127.0.0.1 "$@"
