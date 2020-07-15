<template>
    <div class="feature-scores-wrapper">
        <b-icon-x-circle-fill
            v-on:click="hideElement('feature-scores-wrapper')"
            class="feature-plot-close"
        ></b-icon-x-circle-fill>
        <h4 class="gene-name">Gene name:</h4>
        <div class="feature-scores"></div>
    </div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-graph-richards", {
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
        tableGeneData() {
            if (!!this.graphData) {
                let features = {};

                this.graphData.data.forEach(element => {
                    features[element.gene] = element.features[this.featureObj];
                });

                return features;
            }
        },
        tableGraphData() {
            if (!!this.graphData) {
                let features = {};
                let DATA = this.graphData.data;

                Object.keys(DATA[0].features.predictor).map(function(KEY) {
                    features[KEY] = [];
                });

                DATA.map(function(VALUE) {
                    let eachData = VALUE.features.predictor;
                    $.each(eachData, function(KEY, FEATURE_VALUE) {
                        let FV = FEATURE_VALUE;
                        features[KEY].push(FV);
                    });
                });

                let frequencyData = {};

                var groupCount = 1;

                $.each(features, function(KEY, FEATURE) {
                    frequencyData[KEY] = [];

                    for (let i = 0; i < 15; i++) {
                        frequencyData[KEY][i] = {};
                    }

                    features[KEY].sort(function(a, b) {
                        return a - b;
                    });

                    //console.log(featuresData[KEY]);

                    let segment =
                        (features[KEY][features[KEY].length - 1] -
                            features[KEY][0]) /
                        15;

                    frequencyData[KEY][0]["feature_name"] = KEY;
                    frequencyData[KEY][0]["segment"] = segment;
                    frequencyData[KEY][0]["group"] = groupCount;
                    frequencyData[KEY][0]["min"] = features[KEY][0];
                    frequencyData[KEY][0]["max"] =
                        features[KEY][features[KEY].length - 1];

                    for (let i = 0; i < 15; i++) {
                        let numInSeg = 0;
                        let beginNum = features[KEY][0] + segment * i;
                        let endNum = features[KEY][0] + segment * (i + 1);

                        FEATURE.map(function(FEATURE_VAL) {
                            numInSeg +=
                                FEATURE_VAL >= beginNum && FEATURE_VAL < endNum
                                    ? 1
                                    : 0;
                        });

                        frequencyData[KEY][i]["count_by"] =
                            (beginNum + endNum) / 2;
                        frequencyData[KEY][i]["frequency"] = numInSeg;
                    }

                    frequencyData[KEY][0]["count_by"] = features[KEY][0];

                    groupCount++;
                });

                return frequencyData;
            }
        }
    },
    watch: {
        tableGraphData(DATA) {
            this.renderCharts(DATA);
        }
    },
    methods: {
        ...uiUtils,
        hideElement(ELEMENT) {
            uiUtils.hideElement(ELEMENT);
        },
        renderCharts(DATA) {
            $.each(DATA, function(KEY, FEATURE) {
                let NAME = DATA[0].group;
                let featureName =
                    kpn.effectorGenes.eiHeaders[DATA[0].feature_name].header;
                let divClass =
                    kpn.effectorGenes.eiHeaders[DATA[0].feature_name].class;
                let geneName = GENENAME;

                $(".feature-scores").append(
                    '<div class="chart top-20-chart-' +
                        NAME +
                        " " +
                        divClass +
                        '" style="width: 200px;"><h5>' +
                        featureName +
                        "</h5></div>"
                );
            });
        }
    }
});
</script>

