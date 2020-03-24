export default {
    phenotypes: [
        {
            value: "calcium",
            name: "Calcium"
        },
        {
            value: "dbilirubin",
            name: "Dbilirubin"
        },
        {
            value: "dbp",
            name: "Diastolic blood pressure"
        },
        {
            value: "ebmd",
            name: "Estimated bone mineral density"
        },
        {
            value: "glucose",
            name: "Glucose"
        },
        {
            value: "height",
            name: "Height"
        },
        {
            value: "ldl",
            name: "LDL cholesterol"
        },
        {
            value: "lowtsh",
            name: "Lowtsh"
        },
        {
            value: "rbc",
            name: "RBC"
        },
        {
            value: "sbp",
            name: "Systolic blood pressure"
        },
        {
            value: "t2d",
            name: "Type 2 diabetes"
        },
        {
            value: "tg",
            name: "Triglycerides"
        }
    ],
    chromosomes: [
        { name: "1", value: "1" },
        { name: "2", value: "2" },
        { name: "3", value: "3" },
        { name: "4", value: "4" },
        { name: "5", value: "5" },
        { name: "6", value: "6" },
        { name: "7", value: "7" },
        { name: "8", value: "8" },
        { name: "9", value: "9" },
        { name: "10", value: "10" },
        { name: "11", value: "11" },
        { name: "12", value: "12" },
        { name: "13", value: "13" },
        { name: "14", value: "14" },
        { name: "15", value: "15" },
        { name: "16", value: "16" },
        { name: "17", value: "17" },
        { name: "18", value: "18" },
        { name: "19", value: "19" },
        { name: "20", value: "20" },
        { name: "21", value: "21" },
        { name: "22", value: "22" }
    ],
    dataColumns: [
        {
            name: "snp.name",
            value: "SNP identifier (usually the dbSNP rs identifier).",
            checked: true
        },
        {
            name: "snp.locus",
            value: "Locus from where the FINEMAP statistics where obtained",
            checked: true
        },
        {
            name: "snp.pos",
            value: "position of SNP on the chromosome",
            checked: true
        },
        { name: "maf", value: "SNP minor allele frequency", checked: true },
        {
            name: "beta",
            value: "SNP effect estimate from the GWAS",
            checked: true
        },
        {
            name: "se",
            value: "Standard error of the effect estimate from the GWAS",
            checked: true
        },
        {
            name: "z",
            value: "SNP Z-score (beta/se) from the GWAS",
            checked: true
        },
        {
            name: "prob",
            value: "FINEMAP posterior probability of the SNP being causal",
            checked: true
        },
        {
            name: "log10bf",
            value: "FINEMAP log 10 Bayes factor of the SNP being causal",
            checked: true
        },
        {
            name: "log10bf_group",
            value: "FINEMAP log 10 Bayes factor of the SNP group being causal",
            checked: true
        },
        {
            name: "snpeff.impact",
            value: "Impact of SNP as reported by SNPEff",
            checked: true
        },
        {
            name: "dsbsnp.func",
            value: "Functional consequence of the SNP as reported by dbSNP",
            checked: false
        },
        {
            name: "is.dbsnp.delit",
            value:
                "SWhether function of the SNP as reported by dbSNP is deliterious",
            checked: false
        },
        {
            name: "is.snpeff.delit",
            value: "Whether impact of SNP as reported by SNPEff is deliterious",
            checked: false
        },
        {
            name: "snp.in.trait.DHS",
            value:
                "The number of trait-matched openchromatin peaks that overlap the SNP",
            checked: false
        },
        {
            name: "nearest.trait.DHS.from.gene",
            value:
                "Is this trait-matched openchromatin SNP the nearest one to this gene?",
            checked: false
        },
        {
            name: "nearest.gene.from.trait.DHS",
            value:
                "Is this the nearest gene to the trait-matched openchromatin SNP?",
            checked: false
        },
        {
            name: "snp.in.DHS",
            value: "The number of openchromatin peaks that overlap the SNP",
            checked: false
        },
        {
            name: "nearest.DHS.from.gene",
            value: " Is this openchromatin SNP the nearest one to this gene?",
            checked: false
        },
        {
            name: "nearest.gene.from.DHS",
            value: " Is this the nearest gene to the openchromatin SNP?",
            checked: false
        },
        {
            name: "in.gtex",
            value: "Is SNP a GTEx eQTL for a trait-matched tissue or celltype",
            checked: false
        }
    ]
};
