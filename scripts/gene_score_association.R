#!/usr/bin/env Rscript
# Shared calculation for run_gene_score_lm.R and run_gene_score_lmm.R.
# Input phenotype is the browser's residual PheRS for one HPO query.
# Gene scores are sparse; an absent sample/gene row means score zero only when
# upstream genotype callability has established that convention.

option <- function(args, name, default=NULL) {
  key <- paste0('--',name)
  at <- match(key,args)
  if (is.na(at)) return(default)
  if (at==length(args)) stop('Missing value for ',key)
  args[at+1L]
}

load_inputs <- function(args, model) {
  if (!requireNamespace('data.table',quietly=TRUE)) stop('data.table is required')
  y <- data.table::fread(option(args,'phenotype'))
  d <- data.table::fread(option(args,'covariates'))
  if (!all(c('sample_id','residual_phers') %in% names(y))) stop('Phenotype needs sample_id and residual_phers')
  needed <- c('sample_id','age','sex','affected',paste0('PC',1:10))
  if (!all(needed %in% names(d))) stop('Covariates missing required columns')
  if (anyDuplicated(y$sample_id) || anyDuplicated(d$sample_id)) stop('Duplicate sample IDs')
  if (!'WES_WGS' %in% names(d)) {
    platform_path <- option(args,'platform-file')
    if (is.null(platform_path)) stop('Provide WES_WGS in covariates or --platform-file')
    platform <- data.table::fread(platform_path)
    if (!all(c('sample_id','WES_WGS') %in% names(platform)) || anyDuplicated(platform$sample_id))
      stop('Platform file needs unique sample_id and WES_WGS')
    d$WES_WGS <- platform$WES_WGS[match(d$sample_id,platform$sample_id)]
  }
  map_path <- option(args,'score-id-map')
  if (!is.null(map_path)) {
    id_map <- data.table::fread(map_path)
    if (!all(c('sample_id','score_sample_id') %in% names(id_map)) ||
        anyDuplicated(id_map$sample_id) || anyDuplicated(id_map$score_sample_id))
      stop('Score ID map needs unique sample_id and score_sample_id')
    d$score_sample_id <- id_map$score_sample_id[match(d$sample_id,id_map$sample_id)]
  } else if (!'score_sample_id' %in% names(d)) d$score_sample_id <- d$sample_id
  order <- match(y$sample_id,d$sample_id)
  if (anyNA(order)) stop('Phenotype sample missing from covariates')
  d <- d[order]
  d$residual_phers <- as.numeric(y$residual_phers)
  if (identical(option(args,'affected-only','no'),'yes')) d <- d[toupper(trimws(affected))=='Y']
  if (nrow(d)<20L || anyNA(d$score_sample_id) || anyDuplicated(d$score_sample_id) ||
      any(!is.finite(d$residual_phers))) stop('Invalid selected phenotype/score roster')
  age <- suppressWarnings(as.numeric(d$age))
  age_missing <- !is.finite(age) | age<0 | age>99
  if (all(age_missing)) stop('No observed ages')
  age[age_missing] <- stats::median(age[!age_missing])
  d$age <- age
  if ('age_unknown' %in% names(d)) {
    d$age_unknown <- as.numeric(d$age_unknown)
    if (any(!is.finite(d$age_unknown))) stop('Invalid age_unknown')
  } else d$age_unknown <- as.numeric(age_missing)
  sex <- tolower(trimws(as.character(d$sex)))
  d$sex_male <- as.numeric(sex %in% c('male','m'))
  d$sex_unknown <- as.numeric(!sex %in% c('male','m','female','f'))
  platform <- toupper(trimws(as.character(d$WES_WGS)))
  if (anyNA(platform) || any(!platform %in% c('WES','WGS'))) stop('WES_WGS must be WES or WGS')
  d$platform_wgs <- as.numeric(platform=='WGS')
  fixed <- c('age','age_unknown','sex_male','sex_unknown','platform_wgs',paste0('PC',1:10))
  for (name in fixed) {
    d[[name]] <- as.numeric(d[[name]])
    if (any(!is.finite(d[[name]]))) stop('Invalid covariate: ',name)
  }
  design <- cbind('(Intercept)'=1,as.matrix(d[,..fixed]))
  decomposition <- qr(design,tol=1e-10)
  keep <- sort(decomposition$pivot[seq_len(decomposition$rank)])
  if (!1L %in% keep) stop('Invalid intercept')
  if (model=='lmm' && (!'vcf_sample_id' %in% names(d) || anyNA(d$vcf_sample_id) ||
                       anyDuplicated(d$vcf_sample_id))) stop('LMM needs unique vcf_sample_id')
  list(data=d,design=design[,keep,drop=FALSE],fixed=setdiff(colnames(design)[keep],'(Intercept)'))
}

# GCTA lower-triangle reader adapted from the existing ADCY10 three-cohort code.
read_grm <- function(prefix, wanted) {
  ids <- utils::read.table(paste0(prefix,'.grm.id'),stringsAsFactors=FALSE)
  ix <- match(wanted,ids[[2]])
  if (anyNA(ix)) stop('Model IID absent from GRM')
  k <- matrix(0,length(ix),length(ix),dimnames=list(wanted,wanted))
  con <- file(paste0(prefix,'.grm.bin'),'rb')
  on.exit(close(con))
  for (j in order(ix)) {
    i <- ix[j]
    seek(con,as.double(i)*(i-1)/2*4,origin='start')
    row <- readBin(con,'numeric',n=i,size=4,endian='little')
    if (length(row)!=i) stop('Truncated GRM')
    take <- which(ix<=i)
    k[j,take] <- row[ix[take]]
    k[take,j] <- row[ix[take]]
  }
  if (any(!is.finite(k)) || any(diag(k)<=0)) stop('Invalid GRM')
  k
}

fit_null_model <- function(d, design, fixed, model, grm_prefix=NULL) {
  y <- as.numeric(d$residual_phers)
  n <- length(y)
  if (model=='lm') {
    q <- qr.Q(qr(design))
    ry <- y-as.vector(q%*%crossprod(q,y))
    return(list(model='lm',q=q,ry=ry,yy=sum(ry*ry),df=n-ncol(design)-1L,n=n))
  }
  if (is.null(grm_prefix) || !requireNamespace('GMMAT',quietly=TRUE))
    stop('LMM requires --grm-prefix and GMMAT')
  k <- read_grm(grm_prefix,d$vcf_sample_id)
  diag(k) <- diag(k)+1e-4*mean(diag(k))  # same ridge as ADCY10 run
  fit <- GMMAT::glmmkin(fixed=stats::reformulate(fixed,response='residual_phers'),
                        data=d,kins=k,id='vcf_sample_id',family=stats::gaussian(),
                        method='REML',method.optim='Brent',maxiter=1000L,tol=1e-4)
  if (!isTRUE(fit$converged) || !identical(as.character(fit$id_include),as.character(d$vcf_sample_id)) ||
      is.null(fit$P) || !identical(dim(fit$P),c(n,n)))
    stop('GRM null fit failed or changed sample order; no LM fallback')
  list(model='lmm',P=fit$P,py=as.vector(fit$P%*%y),n=n)
}

run_gene_score_test <- function(null, indices, scores) {
  positive <- sum(scores>0)
  result <- list(beta=NA_real_,standard_error=NA_real_,p_value=NA_real_,
                 n_positive=positive,status='no_positive_score')
  if (!positive) return(result)
  if (null$model=='lm') {
    qx <- colSums(null$q[indices,,drop=FALSE]*scores)
    variance <- sum(scores*scores)-sum(qx*qx)
    numerator <- sum(scores*null$ry[indices])
    if (!is.finite(variance) || variance<=1e-10) {
      result$status <- 'constant_or_collinear_score'; return(result)
    }
    beta <- numerator/variance
    rss <- max(0,null$yy-numerator*numerator/variance)
    if (rss<=1e-12) {result$status <- 'zero_residual_variance'; return(result)}
    se <- sqrt(rss/null$df/variance)
    p <- 2*stats::pt(-abs(beta/se),df=null$df)
  } else {
    variance <- as.numeric(crossprod(scores,null$P[indices,indices,drop=FALSE]%*%scores))
    if (!is.finite(variance) || variance<=1e-10) {
      result$status <- 'invalid_score_variance'; return(result)
    }
    numerator <- sum(scores*null$py[indices])
    beta <- numerator/variance             # null-score approximation
    se <- 1/sqrt(variance)
    p <- stats::pchisq(numerator*numerator/variance,df=1,lower.tail=FALSE)
  }
  result$beta <- beta; result$standard_error <- se; result$p_value <- p; result$status <- 'ok'
  result
}

main <- function(model,args=commandArgs(trailingOnly=TRUE)) {
  phenotype <- option(args,'phenotype')
  covariates <- option(args,'covariates')
  score_file <- option(args,'gene-scores')
  output <- option(args,'output')
  if (any(vapply(list(phenotype,covariates,score_file,output),is.null,logical(1))))
    stop('Required: --phenotype --covariates --gene-scores --output')
  score_type <- option(args,'score-type','max')
  if (!score_type %in% c('max','sum')) stop('--score-type must be max or sum')
  if (!option(args,'affected-only','no') %in% c('yes','no')) stop('--affected-only must be yes or no')
  if (file.exists(output)) stop('Refusing to overwrite output')
  analysis <- load_inputs(args,model)
  d <- analysis$data
  null <- fit_null_model(d,analysis$design,analysis$fixed,model,option(args,'grm-prefix'))
  column <- paste0('gene_score_',score_type)
  scores <- data.table::fread(score_file,select=c('sample_id','gene_symbol',column),showProgress=FALSE)
  data.table::setnames(scores,c('sample_id',column),c('score_sample_id','score'))
  scores$score <- as.numeric(scores$score)
  if (any(!is.finite(scores$score)) || any(scores$score<0)) stop('Invalid gene scores')
  data.table::setkey(scores,gene_symbol,score_sample_id)
  if (anyDuplicated(scores,by=c('gene_symbol','score_sample_id'))) stop('Duplicate sample/gene score')
  available_genes <- unique(scores$gene_symbol)
  scores$index <- match(scores$score_sample_id,d$score_sample_id)
  scores <- scores[!is.na(index)]
  if (!nrow(scores)) stop('No gene score sample IDs match phenotype IDs')
  scores <- scores[score>0]  # zero rows do not contribute to U or V
  data.table::setkey(scores,gene_symbol)
  genes_arg <- option(args,'genes')
  genes <- if (is.null(genes_arg)) available_genes else trimws(strsplit(genes_arg,',',fixed=TRUE)[[1]])
  results <- lapply(genes,function(gene) {
    rows <- scores[list(gene),nomatch=0L]
    tested <- run_gene_score_test(null,rows$index,rows$score)
    data.table::data.table(gene_symbol=gene,score_type=score_type,model=model,
      affected_only=option(args,'affected-only','no'),n_samples=nrow(d),
      beta=tested$beta,standard_error=tested$standard_error,p_value=tested$p_value,
      n_positive=tested$n_positive,status=tested$status)
  })
  dir.create(dirname(output),recursive=TRUE,showWarnings=FALSE)
  data.table::fwrite(data.table::rbindlist(results),output,sep='\t')
}
