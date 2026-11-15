#!/usr/bin/env bash
# Source from a local launcher after changing to the repository directory.
# An unavailable company connection must not prevent the rest of the portal starting.
pb_gt_python=${PB_GT_PYTHON:-python3}
if pb_gt_index=$("$pb_gt_python" scripts/setup_pb_genotypes.py); then
    export PB_GENOTYPE_INDEX="$pb_gt_index"
    # Sample All variants needs the original processed rows, not the gene GT pack.
    pb_gt_source="$(dirname -- "$pb_gt_index")/sample_variant_gene.jsonl.gz"
    if [[ -z "${PB_SAMPLE_VARIANT_SOURCE:-}" && -r "$pb_gt_source" ]]; then
        export PB_SAMPLE_VARIANT_SOURCE="$pb_gt_source"
    fi
else
    unset PB_GENOTYPE_INDEX
    echo 'GT: continuing without genotypes. Connect to the company server and restart to retry.' >&2
fi
unset pb_gt_python pb_gt_index pb_gt_source
