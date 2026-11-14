#!/usr/bin/env bash
# Source from a local launcher after changing to the repository directory.
# An unavailable company connection must not prevent the rest of the portal starting.
pb_gt_python=${PB_GT_PYTHON:-python3}
if pb_gt_index=$("$pb_gt_python" scripts/setup_pb_genotypes.py); then
    export PB_GENOTYPE_INDEX="$pb_gt_index"
else
    unset PB_GENOTYPE_INDEX
    echo 'GT: continuing without genotypes. Connect to the company server and restart to retry.' >&2
fi
unset pb_gt_python pb_gt_index
