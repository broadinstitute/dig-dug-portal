#!/usr/bin/env Rscript
# GRM Gaussian LMM runner: one REML null, then gene-wise score tests.
file_arg <- grep('^--file=',commandArgs(),value=TRUE)
script_dir <- dirname(normalizePath(sub('^--file=','',file_arg[1])))
source(file.path(script_dir,'gene_score_association.R'))
main('lmm')
