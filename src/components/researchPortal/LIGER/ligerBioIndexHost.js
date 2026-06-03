/**
 * LIGER gene-program endpoints currently live on bioindex-dev only.
 * Pin this host so gene-page and LIGER UI keep using dev data even on
 * production portal builds (bioIndexUtils compile-time host may be prod).
 */
export const LIGER_BIOINDEX_HOST = "https://bioindex-dev.hugeamp.org";

export const LIGER_CELL_STATE_EXPRESSION_INDEX = "gene-program-expression-cell-state";
