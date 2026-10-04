#!/usr/bin/env Rscript
# OLS runner: residual PheRS ~ GRS + age + sex + WES/WGS + PC1..10.
file_arg <- grep('^--file=',commandArgs(),value=TRUE)
script_dir <- dirname(normalizePath(sub('^--file=','',file_arg[1])))
source(file.path(script_dir,'gene_score_association.R'))
main('lm')
