suppressPackageStartupMessages(library(Matrix))
args <- commandArgs(trailingOnly=TRUE)
if (length(args) != 2L) stop('Usage: Rscript export_pb_burden_memberships.R prepared_inputs output.jsonl.gz')
root <- args[[1L]]
scores <- readRDS(file.path(root,'gene_score_sum.sparse.rds'))
covariates <- readRDS(file.path(root,'model_covariates.rds'))
stopifnot(inherits(scores,'dgCMatrix'), nrow(scores)==nrow(covariates),
          identical(rownames(scores),as.character(covariates$IID)),
          !anyDuplicated(covariates$IID), !anyDuplicated(colnames(scores)),
          all(is.finite(scores@x)), all(scores@x>=0))
output <- gzfile(args[[2L]],'wt')
writeLines(jsonlite::toJSON(list(type='metadata',analysisN=nrow(scores),geneCount=ncol(scores),indexDefinition='zero-based original analysis roster row'),auto_unbox=TRUE),output)
for (j in seq_len(ncol(scores))) {
 start <- scores@p[[j]]+1L
 end <- scores@p[[j+1L]]
 at <- if(start<=end)seq.int(start,end) else integer()
 positive <- scores@i[at[scores@x[at]>0]]
 writeLines(jsonlite::toJSON(list(type='gene',gene=colnames(scores)[[j]],sampleIndices=unname(positive)),auto_unbox=TRUE,force=TRUE),output)
}
close(output)
cat(nrow(scores),'analysis samples;',ncol(scores),'genes exported\n')
