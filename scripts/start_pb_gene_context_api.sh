#!/usr/bin/env bash
# Start the aggregate Context API used by pb_gene.html and public_gene.html.
# Pass the input flags accepted by scripts.pb_gene_context_api_server.

if [[ -f /programs/biogrids.shrc ]]; then
  source /programs/biogrids.shrc || exit $?
  export PYTHON_X=3.12.2 R_X=4.4.2 PYTHONNOUSERSITE=1
  unset PYTHONPATH
fi

script_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd) || exit $?
cd "$script_root" || exit $?

python_bin=${PB_GENE_CONTEXT_PYTHON:-python3}
if [[ -x /programs/x86_64-linux/python/3.12.2/mamba/bin/python3 && -z "${PB_GENE_CONTEXT_PYTHON:-}" ]]; then
  python_bin=/programs/x86_64-linux/python/3.12.2/mamba/bin/python3
fi

exec "$python_bin" -m scripts.pb_gene_context_api_server "$@"
