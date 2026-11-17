#!/usr/bin/env bash

if [[ -z "${PB_GENE_CONTEXT_DATA_ROOT:-}" && -z "${PHENOTYPE_ANALYZER_HOST_PRIVATE:-}" ]]; then
  echo 'PB Gene Context API is not configured.' >&2
  echo 'Set PB_GENE_CONTEXT_DATA_ROOT to the approved input directory, or set PHENOTYPE_ANALYZER_HOST_PRIVATE to a compatible Context API base URL.' >&2
  exit 2
fi

script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?
source scripts/prepare_pb_gene_scoring.sh || exit $?
source scripts/prepare_pb_genotypes.sh
exec python3 scripts/pb_local_server.py run -- node ./node_modules/.bin/vue-cli-service serve --port 8095 "$@"
