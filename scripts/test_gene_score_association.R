#!/usr/bin/env Rscript
# Small deterministic checks of LM, Gaussian score algebra, and GRM IID order.
file_arg <- grep('^--file=',commandArgs(),value=TRUE)
script_dir <- dirname(normalizePath(sub('^--file=','',file_arg[1])))
source(file.path(script_dir,'gene_score_association.R'))
set.seed(14)
n <- 48L
age <- runif(n,18,80)
pc1 <- rnorm(n)
x <- c(rep(0,n-12L),runif(12L,0.1,1))
y <- 0.4*x + 0.02*age + 0.2*pc1 + rnorm(n,sd=0.5)
design <- cbind('(Intercept)'=1,age=age,PC1=pc1)
data <- data.frame(residual_phers=y)
null <- fit_null_model(data,design,c('age','PC1'),'lm')
rows <- which(x!=0)
result <- run_gene_score_test(null,rows,x[rows])
reference <- summary(stats::lm(y ~ x + age + pc1))$coefficients['x',]
stopifnot(result$status=='ok',
          isTRUE(all.equal(result$beta,unname(reference['Estimate']),tolerance=1e-9)),
          isTRUE(all.equal(result$standard_error,unname(reference['Std. Error']),tolerance=1e-9)),
          isTRUE(all.equal(result$p_value,unname(reference['Pr(>|t|)']),tolerance=1e-9)))
stopifnot(run_gene_score_test(null,integer(),numeric())$status=='no_positive_score')

# Null-GRM score beta and variance must match the full GLS projection algebra.
latent <- matrix(rnorm(n*3L),n,3L)
k <- tcrossprod(latent)/3 + diag(n)
vinv <- solve(diag(n)+0.2*k)
vix <- vinv%*%design
p <- vinv-vix%*%solve(crossprod(design,vix))%*%t(vix)
mixed <- list(model='lmm',P=p,py=as.vector(p%*%y),n=n)
got <- run_gene_score_test(mixed,rows,x[rows])
variance <- as.numeric(crossprod(x,p%*%x))
stopifnot(got$status=='ok',
          isTRUE(all.equal(got$beta,as.numeric(crossprod(x,p%*%y))/variance,tolerance=1e-9)),
          isTRUE(all.equal(got$standard_error,1/sqrt(variance),tolerance=1e-9)))
cat('GENE_SCORE_ASSOCIATION_R_TEST_PASS\n')
