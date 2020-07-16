<template>
    <div class="feature-scores-wrapper">
        <b-icon-x-circle-fill
            v-on:click="hideElement('feature-scores-wrapper')"
            class="feature-plot-close"
        ></b-icon-x-circle-fill>
        <h4 class="gene-name">Gene name: {{this.selectedGeneName}}</h4>
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
    props: ["graphData", "selectedGeneName"],
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
                    checked: "checked",
                    decimal: 3
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
                let massagedData = { GENES: {} };
                let features = {};
                let DATA = this.graphData.data;

                DATA.forEach(element => {
                    massagedData.GENES[element.gene] =
                        element.features.predictor;
                });

                Object.keys(DATA[0].features.predictor).map(function(KEY) {
                    if (KEY.indexOf("fn.") >= 0) {
                        features[KEY] = [];
                    }
                });

                DATA.map(function(VALUE) {
                    let eachData = VALUE.features.predictor;
                    $.each(eachData, function(KEY, FEATURE_VALUE) {
                        if (KEY.indexOf("fn.") >= 0) {
                            let FV = FEATURE_VALUE;
                            features[KEY].push(FV);
                        }
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

                massagedData["DATA"] = frequencyData;

                return massagedData;
            }
        }
    },
    watch: {
        tableGraphData(DATA) {
            this.renderCharts(DATA);
        },
        "this.selectedGeneName"() {
            console.log("foo");
        }
    },
    methods: {
        ...uiUtils,
        hideElement(ELEMENT) {
            uiUtils.hideElement(ELEMENT);
        },
        renderCharts(DATA) {
            let featureHeaders = this.featureHeaders;
            let GENE = this.selectedGeneName;

            $.each(DATA.DATA, function(KEY, FEATURE) {
                let NAME = FEATURE[0].group;
                let featureName =
                    featureHeaders[FEATURE[0].feature_name].header;
                let divClass = featureHeaders[FEATURE[0].feature_name].class;
                let geneName = "GENENAME";

                $(".feature-scores").append(
                    '<div class="chart top-20-chart-' +
                        NAME +
                        " " +
                        divClass +
                        '" style="width: 200px;"><h5>' +
                        featureName +
                        "</h5></div>"
                );

                //rendering chart begins
                var chartWrapper = ".top-20-chart-" + NAME;

                var margin = { top: 25, right: 10, bottom: 20, left: 29 },
                    width =
                        $(chartWrapper).width() - margin.left - margin.right, // Use the window's width
                    height = 150 - margin.top - margin.bottom; // Use the window's height

                var n = FEATURE.length;
                var maxNumberArray = [];
                $.each(FEATURE, function(index, value) {
                    maxNumberArray.push(value.frequency);
                });

                var maxNumber = Math.ceil(Math.max.apply(Math, maxNumberArray));

                var xScale = d3
                    .scaleLinear()
                    .domain([FEATURE[0].min, FEATURE[0].max]) // input
                    .range([0, width]); // output

                var yScale = d3
                    .scaleLinear()
                    .domain([0, maxNumber]) // input
                    .range([height, 0]); // output

                var line = d3
                    .line()
                    .x(function(d) {
                        return xScale(d.count_by);
                    }) // set the x values for the line generator
                    .y(function(d) {
                        return yScale(d.frequency);
                    }) // set the y values for the line generator
                    .curve(d3.curveMonotoneX); // apply smoothing to the line

                let dataset = FEATURE;

                let svg = d3
                    .select(chartWrapper)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr(
                        "transform",
                        "translate(" + margin.left + "," + margin.top + ")"
                    );

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale).ticks(3));

                svg.append("g")
                    .attr("class", "y axis")
                    .call(d3.axisLeft(yScale).ticks(3))
                    .selectAll("text")
                    .style("text-anchor", "end");

                svg.append("path")
                    .datum(dataset)
                    .attr("class", "chart-line")
                    .attr("d", line);

                /* selected gene info */
                let SCORE = DATA.GENES[GENE][FEATURE[0].feature_name];
                let DECIMAL = featureHeaders[FEATURE[0].feature_name].decimal;
                let SHORTSCORE =
                    DECIMAL == null ? SCORE : SCORE.toFixed(DECIMAL);
                let MINV =
                    DECIMAL == null
                        ? FEATURE[0].min
                        : FEATURE[0].min.toFixed(DECIMAL);

                let MAXV =
                    DECIMAL == null
                        ? FEATURE[0].max
                        : FEATURE[0].max.toFixed(DECIMAL);

                let scoreLabel = "Value: " + SHORTSCORE + "<br />";
                scoreLabel += "Range: " + MINV + " - " + MAXV;

                let pointData = [SCORE];

                svg.selectAll(".dot")
                    .data(pointData)
                    .enter()
                    .append("line")
                    .attr("class", "data-line")
                    .attr("x1", function(d) {
                        return xScale(d) + 1;
                    })
                    .attr("y1", 0)
                    .attr("x2", function(d) {
                        return xScale(d) + 1;
                    })
                    .attr("y2", height);

                svg.selectAll(".dot")
                    .data(pointData)
                    .enter()
                    .append("text")
                    .attr("x", function(d) {
                        if (width - xScale(d) > 30) {
                            return xScale(d) + 5;
                        } else {
                            return xScale(d) - 5;
                        }
                    })
                    .attr("y", 10)
                    .attr("style", "fill: #F00; font-size: 12px;")
                    .attr("class", function(d) {
                        if (width - xScale(d) > 30) {
                            return "start-anchor";
                        } else {
                            return "end-anchor";
                        }
                    })
                    .text(GENE);

                $(chartWrapper).append(
                    "<div style='font-size:13px; width: 100%; text-align:center;'>" +
                        scoreLabel +
                        "</div>"
                );

                // rendering chart end
            });
        }
    }
});
</script>

