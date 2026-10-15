// Verbatim validation copy and figure metadata from the reviewed dashboard.
export const BirdValidationData = {
    falcon:{
      name:'FALCON',
      figures:[
        {
          src:'/images/birdimages/falcon_validation_simulations.png',
          alt:'FALCON simulation validation NDCG across GWAS sample sizes',
          heading:'Validation 1: FALCON outperforms MAGMA (simulated data)',
          description:'Using simulated data, both the full FALCON model and the truncated FALCON model without V2G and functional annotations recovered true disease-relevant genes to a greater extent than did MAGMA. NDCG: Normalized Discounted Cumulative Gain.'
        },
        {
          src:'/images/birdimages/falcon_validation_real_data.png',
          alt:'FALCON real-data validation across four ground-truth sets',
          heading:'Validation 2: FALCON outperforms MAGMA (real data)',
          description:'Using real data (3529 genes and 45 phenotypes), FALCON consistently outperformed both baseline methods: MAGMA and nearest genes across four metrics and across all four classes of genes. Classes of genes: drug associations (with successful drug targets), functional experimental (confirmed through experimental interventions), functional observational (from multi-omic data), expert curated (hand-selected by domain experts). Metrics of performance: AUROC (class separability), AUPRC (false positive identification), NDCG (ranking quality), and the Gini coefficient (concentration of true positives at the top).'
        }
      ]
    },
    pigean:{
      name:'PIGEAN',
      figures:[
        {
          src:'/images/birdimages/pigean_validation_loco_no_title.png',
          alt:'Indirect support predicts direct signal on held-out chromosomes',
          heading:'Validation 1: Indirect support predicts direct support',
          description:'Indirect support learned from all but one chromosome significantly predicted direct support on the associated held-out chromosome across 12 phenotypes (β ranged from 0.134 to 0.331; P < 0.001 for all phenotypes). The fitted relationships consistently fell below the y = x calibration line, consistent with the expected conservative bias that indirect support captures disease relevance not just association. This follows the hypothesis that indirect support extends beyond direct genetic implication, as not every indirectly supported gene is expected to have corresponding direct genetic support.'
        },
        {
          src:'/images/birdimages/pigean_validation_temporal_no_title.png',
          alt:'Indirect support predicts future GWAS significance',
          heading:'Validation 2: Indirect support from past GWAS predicts future GWAS signals',
          description:'We regressed gene-level MAGMA Z-scores from post-2018 GWAS on the gene-level MAGMA Z-scores from pre-2018 GWAS for 67 phenotypes, restricting to genes meeting increasing thresholds of indirect support. The improvement in model fit increased significantly with higher indirect support thresholds (β = 0.058, P = 8.65e-09), demonstrating that indirect support is predictive of future GWAS discoveries and is not recapitulating latent genetic information embedded in curated libraries.'
        }
      ]
    },
    eaggl:{
      name:'EAGGL',
      figures:[
        {
          src:'/images/birdimages/eaggl_validation_gene_recovery.png',
          alt:'Disease-mechanism gene recovery validation plot',
          heading:'Validation 1: Genetic factors capture known genes better than their null counterparts',
          description:'We assessed the genetic factors inferred by EAGGL against the known genes for each matched disease curated by DisMech. Of the 40 matched diseases, their factors typically identified the known genes in their top ranked genes, and significantly more so than their counterparts with randomly shuffled genes.'
        },
        {
          src:'/images/birdimages/eaggl_validation_similarity.png',
          alt:'Disease-blocked similarity distribution validation plot',
          heading:'Validation 2: Genetic factors assimilate pathophysiological aspects more than they do signs and symptoms',
          description:'Overall, each pathophysiological characteristic and each associated phenotype was more similar to at least one factor of the same disease than a random factor from another disease. However, between the two properties, the factors resembled pathophysiology (proxies for mechanisms) more than they did associated phenotypes (most were disease symptoms; Wilcoxon P = 1.4e-8).'
        }
      ]
    }
  };
