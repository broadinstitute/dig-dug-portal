<template>
    <div class="feature-scores-wrapper">{{tableGraphData}}</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-graphs", {
    props: ["graphData", "graphType"],
    data() {
        return {
            featureHeaders: {
                "fn.locus.no.genes": {
                    header: "Genes",
                    name: "# genes at locus",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.snpeff.rank": {
                    header: "avg. SNPEff",
                    name: "Mean SNPEff rank",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.locus.no.SNPs": {
                    header: "SNPs",
                    name: "# SNVs at locus",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.sum.nearest.gene.from.DHS": {
                    header: "DHS SNPs",
                    name: "# SNVs in DHS",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.min.snp.tss.dist": {
                    header: "SNP dist.",
                    name: "Minimum SNV-gene distance (&#x394g)",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.max.locus.z": {
                    header: "Locus z-score",
                    name: "Best GWAS z-score at locus",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.sum.overlap.bf": {
                    header: "log10(BF)",
                    name: "Sum of log10(BF) for genic SNVs",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.max.length": {
                    header: "GeneLen",
                    name: "Gene length",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.mean.dist.prob": {
                    header: "PostPr/dist",
                    name: "Mean (SNV probability / &#x394g)",
                    class: "",
                    checked: "checked"
                },
                "fn.max.overlap.1m.snpeff.one": {
                    header: "Gene SNPEff",
                    name: "Genic SNV with SNPEff Impact",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.max.beta.overlap": {
                    header: "Gene z-score",
                    name: "Best GWAS effect for genic SNV",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.max.maf": {
                    header: "MAF",
                    name: "Highest effect allele frequency",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.mean.dist.prob.square": {
                    header: "PostPr/dist^2",
                    name: "Mean (SNV probability / &#x394g²)",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.sum.snp.in.DHS.count.beta": {
                    header: "Beta in DHS",
                    name: "&#x2211; (GWAS beta for SNV in DHS)",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.max.1m.snpeff.impact.none": {
                    header: "Any SNPEff",
                    name: "Any SNV with SNPEff Impact",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.sum.nearest.nearest.DHS.from.gene.snp.in.DHS": {
                    header: "SNV in DHS",
                    name: "Count of nearest SNV in DHS",
                    class: "",
                    checked: "checked",
                    decimal: null
                },
                "fn.max.z": {
                    header: "Gene z-score",
                    name: "Max GWAS z-score",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.mean.locus.prob": {
                    header: "avg. PostPr",
                    name: "Mean SNV probability",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.mean.beta.overlap": {
                    header: "Beta in Gene",
                    name: "Mean GWAS beta for genic SNVs",
                    class: "",
                    checked: "checked",
                    decimal: 3
                },
                "fn.nearest.trait.DHS.from.gene.dist.inv": {
                    header: "dhsSNP/dist",
                    name: "Nearest SNP in DHS / &#x394g",
                    class: "",
                    checked: "checked",
                    decimal: 3
                }
            }
        };
    },
    mounted: function() {},
    computed: {
        tableGraphData() {
            if (!!this.graphData) {
                let features = {};

                this.graphData.data.forEach(element => {
                    features[element.gene] = element.features;
                });

                return features;
            }
        }
    }
});
</script>

