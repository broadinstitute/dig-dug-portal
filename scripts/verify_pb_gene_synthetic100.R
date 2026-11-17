#!/usr/bin/env Rscript
argv <- commandArgs(trailingOnly=TRUE)
if (length(argv)<2L || length(argv)>3L ||
    (length(argv)==3L && argv[3]!='lm-only'))
  stop('Usage: verify_pb_gene_synthetic100.R ROOT GRM_PREFIX [lm-only]')
root <- argv[1]
grm_prefix <- argv[2]
lm_only <- length(argv)==3L
file_arg <- grep('^--file=',commandArgs(),value=TRUE)
script_dir <- dirname(normalizePath(sub('^--file=','',file_arg[1])))
source(file.path(script_dir,'gene_score_association.R'))

scores <- data.table::fread(file.path(root,'input/gene_scores.tsv'))
if (nrow(scores)!=300L || anyDuplicated(scores,by=c('sample_id','gene_symbol')))
  stop('Synthetic gene-score input is not 100 samples x 3 genes')

check <- function(model,score_type,affected_only) {
  args <- c('--phenotype',file.path(root,'input/residual_phers.tsv'),
            '--covariates',file.path(root,'input/covariates.tsv'),
            '--affected-only',affected_only)
  analysis <- load_inputs(args,model)
  d <- analysis$data
  expected_n <- if(affected_only=='yes') 60L else 100L
  if (nrow(d)!=expected_n) stop('Wrong selected N')
  output <- file.path(root,'results',sprintf('gene_%s_%s_%s.tsv',model,score_type,
                                               if(affected_only=='yes') 'affected' else 'all'))
  got <- data.table::fread(output)
  expected_genes <- if(score_type=='max') 'ATL1' else c('ATL1','ADCY10','SLC34A1')
  if (nrow(got)!=length(expected_genes) || !setequal(got$gene_symbol,expected_genes) ||
      any(got$status!='ok') || any(got$n_samples!=expected_n))
    stop('Runner output gene/status/N mismatch: ',output)
  if (model=='lmm') {
    k <- read_grm(grm_prefix,d$vcf_sample_id)
    diag(k) <- diag(k)+1e-4*mean(diag(k))
    fit <- GMMAT::glmmkin(fixed=stats::reformulate(analysis$fixed,response='residual_phers'),
                          data=d,kins=k,id='vcf_sample_id',family=stats::gaussian(),
                          method='REML',method.optim='Brent',maxiter=1000L,tol=1e-4)
    if (!isTRUE(fit$converged) || is.null(fit$P) ||
        !identical(as.character(fit$id_include),as.character(d$vcf_sample_id)))
      stop('Independent GMMAT null fit failed')
    py <- as.vector(fit$P%*%d$residual_phers)
  }
  for (gene in got$gene_symbol) {
    tab <- scores[gene_symbol==gene]
    x <- as.numeric(tab[[paste0('gene_score_',score_type)]][match(d$sample_id,tab$sample_id)])
    if (anyNA(x)) stop('Synthetic gene score not complete')
    if (model=='lm') {
      fixed <- analysis$fixed
      reference_data <- as.data.frame(d[,..fixed])
      reference_data$x <- x
      reference_data$residual_phers <- d$residual_phers
      reference <- stats::lm(stats::reformulate(c('x',fixed),response='residual_phers'),
                             data=reference_data)
      coefficient <- summary(reference)$coefficients['x',]
      expected <- unname(coefficient[c('Estimate','Std. Error','Pr(>|t|)')])
    } else {
      u <- sum(x*py)
      v <- as.numeric(crossprod(x,fit$P%*%x))
      expected <- c(u/v,1/sqrt(v),stats::pchisq(u*u/v,df=1,lower.tail=FALSE))
    }
    row <- got[gene_symbol==gene]
    actual <- c(row$beta,row$standard_error,row$p_value)
    if (!isTRUE(all.equal(actual,expected,tolerance=1e-7)))
      stop('Effect/SE/p mismatch: ',model,' ',score_type,' ',gene,
           ' actual=',paste(actual,collapse=','),' expected=',paste(expected,collapse=','))
  }
  cat(sprintf('GENE_%s_100_PASS score=%s affected=%s N=%d genes=%d\n',
              toupper(model),score_type,affected_only,expected_n,nrow(got)))
}

check('lm','max','no')
check('lm','sum','yes')
if (!lm_only) {
  check('lmm','max','no')
  check('lmm','sum','yes')
}
