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
        { name: "snp.name", value: "snp.name", checked: true },
        { name: "snp.locus", value: "snp.locus", checked: true },
        { name: "snp.pos", value: "snp.pos", checked: true },
        { name: "maf", value: "maf", checked: true },
        { name: "beta", value: "beta", checked: true },
        { name: "se", value: "se", checked: true },
        { name: "z", value: "z", checked: true },
        { name: "prob", value: "prob", checked: true },
        { name: "log10bf", value: "log10bf", checked: true },
        { name: "log10bf_group", value: "log10bf_group", checked: true },
        { name: "snpeff.impact", value: "snpeff.impact", checked: true },
        { name: "dsbsnp.func", value: "dsbsnp.func", checked: false },
        { name: "is.dbsnp.delit", value: "is.dbsnp.delit", checked: false },
        { name: "is.snpeff.delit", value: "is.snpeff.delit", checked: false },
        { name: "snp.in.trait.DHS", value: "snp.in.trait.DHS", checked: false },
        {
            name: "nearest.trait.DHS.from.gene",
            value: "nearest.trait.DHS.from.gene",
            checked: false
        },
        {
            name: "nearest.gene.from.trait.DHS",
            value: "nearest.gene.from.trait.DHS",
            checked: false
        },
        { name: "snp.in.DHS", value: "snp.in.DHS", checked: false },
        {
            name: "nearest.DHS.from.gene",
            value: " nearest.DHS.from.gene",
            checked: false
        },
        {
            name: "nearest.gene.from.DHS",
            value: " nearest.gene.from.DHS",
            checked: false
        },
        { name: "in.gtex", value: "in.gtex", checked: false }
    ]
};
