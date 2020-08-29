<template>
    <div class="EGLT-table 52k">
        <!-- <forest-plot :data="test" :dichotomous="true"></forest-plot> -->
        <b-container fluid>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item">{{capitalizedFormatter(show)}}</b-col>
                <b-col class="top-level-header-item">pValue</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">Odds Ratio</b-col>
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(row, i) in associations.data">
                <b-row class="data top-level-value" :key="row[show] + i">
                    <b-col class="top-level-value-item">
                        <a
                            :href="`/phenotype.html?phenotype=${row.phenotype}`"
                        >{{phenotypeMap[row.phenotype].description}}</a>
                    </b-col>
                    <b-col class="top-level-value-item pValue">{{pValueFormatter(row.pValue)}}</b-col>
                    <b-col class="top-level-value-item beta">
                        <template v-if="!phenotypeMap[row.phenotype].dichotomous">
                            <span
                                :class="row.beta < 0 ? 'effect negative' : 'effect positive'"
                            >{{ row.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                            <span>{{effectFormatter(row.beta)}}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item beta">
                        <template v-if="!!phenotypeMap[row.phenotype].dichotomous">
                            <span
                                :class="row.beta < 0 ? 'effect negative' : 'effect positive'"
                            >{{ row.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                            <span>{{effectFormatter(Math.exp(row.beta))}}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item">
                        <b-button @click="showFeatures(i)" class="view-features-btn">Masks</b-button>
                        <b-button @click="showPlot(i, row.masks)" class="view-visualizer-btn">Plot</b-button>
                    </b-col>
                </b-row>
                <div
                    :class="`feature-headers-${i}`"
                    class="feature-content-wrapper hidden"
                    :key="`features_${i}`"
                >
                    <b-row class="feature-header">
                        <b-col
                            class="feature-header-item"
                            v-for="col in colNames"
                            :key="col"
                        >{{col}}</b-col>
                        <b-col
                            class="feature-header-item"
                            v-if="!phenotypeMap[row.phenotype].dichotomous"
                        >Beta</b-col>
                        <b-col
                            class="feature-header-item"
                            v-if="!!phenotypeMap[row.phenotype].dichotomous"
                        >Odds Ratio</b-col>
                    </b-row>
                    <template v-for="(mask, j) in row.masks">
                        <b-row
                            class="features"
                            :class="`features_${i}_${j}`"
                            :key="`features_${i}_${j}`"
                        >
                            <b-col class="feature-content-item">{{mask.mask}}</b-col>
                            <b-col class="feature-content-item">{{pValueFormatter(mask.pValue)}}</b-col>
                            <b-col
                                class="feature-content-item"
                            >{{Number.parseFloat(mask.combinedAF).toFixed(7)}}</b-col>
                            <b-col class="feature-content-item">{{mask.passingVariants}}</b-col>
                            <b-col class="feature-content-item">{{mask.singleVariants}}</b-col>
                            <b-col
                                class="feature-content-item"
                            >{{Number.parseFloat(mask.stdErr).toFixed(5)}}</b-col>
                            <b-col class="feature-content-item">{{intFormatter(mask.n)}}</b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!phenotypeMap[row.phenotype].dichotomous"
                            >
                                <span
                                    :class="mask.beta < 0 ? 'effect negative' : 'effect positive'"
                                >{{ mask.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                                {{effectFormatter(mask.beta)}}
                            </b-col>
                            <b-col
                                class="feature-content-item"
                                v-if="!!phenotypeMap[row.phenotype].dichotomous"
                            >
                                <span
                                    :class="Math.exp(mask.beta) < 0 ? 'effect negative' : 'effect positive'"
                                >{{ Math.exp(mask.beta) < 0 ? "&#9660;" : "&#9650;"}}</span>
                                {{effectFormatter(Math.exp(mask.beta))}}
                            </b-col>
                        </b-row>
                    </template>
                </div>
                <div
                    class="feature-plot-wrapper hidden"
                    :class="`feature-plot-${i}`"
                    :key="`plot_${i}`"
                >
                    <h4>Forest Plot</h4>
                    <div :id="`plot_${i}`" class="plots"></div>
                </div>
            </template>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import ForestPlot from "@/components/ForestPlot";

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export default Vue.component("gene-associations-table", {
    props: ["show"],
    component: ForestPlot,
    data() {
        return {
            colNames: [
                "Mask",
                "P-Value",
                "Combined AF",
                "Passing Variants",
                "Single Variants",
                "Standard Error",
                "Sample Size",
            ],
        };
    },
    mounted() {},
    computed: {
        associations() {
            return this.$store.state.associations;
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
    },
    methods: {
        capitalizedFormatter: Formatters.capitalizedFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        showFeatures(index) {
            console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
        },
        showPlot(index, data, dichotomous = false) {
            console.log("plot index: ", index);
            console.log("data:", data);
            let isEmpty =
                document.getElementById("plot_" + index).innerHTML === "";
            if (isEmpty) this.createChart(index, data, dichotomous);

            uiUtils.showHideElement("feature-plot-" + index);
        },
        createChart(index, data, dichotomous) {
            // Create chart instance
            let chart = am4core.create("plot_" + index, am4charts.XYChart);

            // Add data
            // chart.data = [
            //     {
            //         category: "LofTee",
            //         measure: 1.3,
            //         bulletSize: 25,
            //         high: 3.4,
            //         low: 1.0,
            //     },
            //     {
            //         category: "5/5",
            //         measure: 2.1,
            //         bulletSize: 15,
            //         high: 2.6,
            //         low: 0.5,
            //     },
            //     {
            //         category: "16/16",
            //         measure: 1.8,
            //         bulletSize: 10,
            //         high: 3.2,
            //         low: 0.9,
            //     },
            //     {
            //         category: "5/5 + LofTee LC",
            //         measure: 2.3,
            //         bulletSize: 30,
            //         high: 2.7,
            //         low: 1.9,
            //     },
            //     {
            //         category: "5/5 + 0/5 1%",
            //         measure: 2.1,
            //         bulletSize: 35,
            //         high: 2.5,
            //         low: 1.8,
            //     },
            //     {
            //         category: "5/5 + 1/5 1%",
            //         measure: 2.3,
            //         bulletSize: 20,
            //         high: 2.7,
            //         low: 1.9,
            //     },
            //     {
            //         category: "11/11",
            //         measure: 1.1,
            //         bulletSize: 25,
            //         high: 2.5,
            //         low: 0.8,
            //     },
            //     {
            //         category: "Summary measure",
            //         measure: 2.2,
            //         bulletSize: 55,
            //         high: 2.4,
            //         low: 1.9,
            //         rotation: 45,
            //         fill: am4core.color("#fff"),
            //         label: "{valueX}",
            //     },
            // ];
            let labelName = dichotomous ? "Odds Ratio" : "Beta";

            let mapped = data.map((item) => {
                let value = dichotomous ? Math.exp(item.beta) : item.beta;
                return {
                    category: item.mask,
                    high: value + item.stdErr * 1.96,
                    low: value - item.stdErr * 1.96,
                    measure: item.beta,
                    bulletSize: 20,
                };
            });

            console.log("chart data", mapped);

            chart.data = mapped;

            // Create axes
            let yAxis = chart.yAxes.push(new am4charts.CategoryAxis());
            yAxis.dataFields.category = "category";
            yAxis.renderer.grid.template.location = 0;
            //yAxis.renderer.minGridDistance = 30;
            yAxis.renderer.inversed = true;

            let yAxis2 = chart.yAxes.push(new am4charts.CategoryAxis());
            yAxis2.dataFields.category = "category";
            yAxis2.renderer.grid.template.location = 0;
            //yAxis.renderer.minGridDistance = 30;
            yAxis2.renderer.inversed = true;
            yAxis2.renderer.labels.template.adapter.add("text", function (
                text,
                target
            ) {
                return "[bold]{measure}[/] ({low}-{high})";
            });
            yAxis2.renderer.opposite = true;

            let xAxis = chart.xAxes.push(new am4charts.ValueAxis());

            // Create series for lines
            let series = chart.series.push(new am4charts.ColumnSeries());
            series.dataFields.openValueX = "low";
            series.dataFields.valueX = "high";
            series.dataFields.categoryY = "category";
            series.columns.template.height = 2;
            series.columns.template.strokeWidth = 0;
            series.columns.template.fill = chart.colors.getIndex(0);

            // Create series for markers
            let series2 = chart.series.push(new am4charts.LineSeries());
            series2.dataFields.customValue = "bulletSize";
            series2.dataFields.valueX = "measure";
            series2.dataFields.categoryY = "category";
            series2.strokeWidth = 0;

            let marker = series2.bullets.push(new am4core.Rectangle());
            marker.width = 10;
            marker.height = 10;
            marker.strokeWidth = 2;
            marker.fill = chart.colors.getIndex(0);
            marker.stroke = chart.colors.getIndex(0);
            marker.propertyFields.rotation = "rotation";
            marker.propertyFields.fill = "fill";
            marker.nonScalingStroke = true;
            marker.verticalCenter = "middle";
            marker.horizontalCenter = "middle";
            marker.tooltipText =
                "[bold]" + labelName + " {valueX}[/] ({low}-{high})";

            let label = series2.bullets.push(new am4core.Label());
            label.propertyFields.text = "label";
            label.strokeWidth = 0;
            label.verticalCenter = "middle";
            label.horizontalCenter = "middle";
            label.interactionsEnabled = false;

            series2.heatRules.push({
                target: marker,
                property: "scale",
                min: 1,
                max: 4,
                dataField: "customValue",
            });

            // Add summary line
            let range = xAxis.axisRanges.create();
            range.value = 0;
            range.grid.strokeWidth = 5;
            range.grid.strokeDasharray = "7,7";
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
.feature-header-item {
    background-color: #75def850;
}
.feature-content-wrapper {
    border-left: solid 4px #75def8 !important;
}
.col.beta {
    display: inline-block;
    text-align: left;
}
.plots {
    min-height: 560px;
}
</style>
