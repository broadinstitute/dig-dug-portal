<template>
    <div class="EGLT-table 52k">
        <b-container fluid>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item">{{capitalizedFormatter(show)}}</b-col>
                <b-col class="top-level-header-item">pValue</b-col>
                <b-col class="top-level-header-item">Beta</b-col>
                <b-col class="top-level-header-item">View</b-col>
            </b-row>
            <template v-for="(row, i) in json">
                <b-row class="data top-level-value" :key="row[show] + i">
                    <b-col class="top-level-value-item">{{row[show]}}</b-col>
                    <b-col class="top-level-value-item pValue">{{row.pValue}}</b-col>
                    <b-col class="top-level-value-item beta">
                        <span
                            :class="row.beta < 0 ? 'effect negative' : 'effect positive'"
                        >{{ row.beta < 0 ? "&#9660;" : "&#9650;"}}</span>
                        <span>{{row.beta}}</span>
                    </b-col>
                    <b-col class="top-level-value-item">
                        <b-button @click="showFeatures(i)" class="view-features-btn">Masks</b-button>
                        <b-button @click="showPlot(i)" class="view-visualizer-btn">Plot</b-button>
                    </b-col>
                </b-row>
                <div
                    :class="`feature-headers-${i}`"
                    class="feature-content-wrapper hidden"
                    :key="`features_${i}`"
                >
                    <template v-for="(key, j) in Object.keys(row)">
                        <template v-if="typeof row[key] === 'object'">
                            <b-row class="feature-header" v-if="j === 5" :key="`row_${i}_${j}`">
                                <b-col class="feature-header-item">Masks</b-col>
                                <b-col
                                    class="feature-header-item"
                                    :class="fh"
                                    v-for="fh in Object.keys(row[key])"
                                >{{fh}}</b-col>
                            </b-row>
                            <b-row
                                class="features"
                                :class="`features_${i}_${j}`"
                                :key="`features_${i}_${j}`"
                            >
                                <b-col class="feature-content-item key">{{key}}</b-col>
                                <b-col
                                    class="feature-content-item"
                                    :class="k"
                                    v-for="(item, k) in row[key]"
                                >
                                    <span
                                        v-if="k === 'beta'"
                                        :class="item < 0 ? 'effect negative' : 'effect positive'"
                                    >{{ item < 0 ? "&#9660;" : "&#9650;"}}</span>
                                    {{item}}
                                </b-col>
                            </b-row>
                        </template>
                    </template>
                </div>
                <!-- <b-row
                    class="features"
                    v-if="typeof "
                    :key="row[show] + i"
                >
                    <b-col v-for="col in row" :key="col + i">{{typeof col}} - {{col}}</b-col>
                </b-row>-->
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

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);

export default Vue.component("fiftytwok-table", {
    props: ["show"],
    data() {
        return {
            json: [
                {
                    dataset: "52k",
                    phenotype: "BMI",
                    gene: "RNF14",
                    pValue: 0.795,
                    beta: -0.0328,
                    masks: [
                        {
                            mask: "LofTee",
                            n: 17260,
                            pValue: 0.24698,
                            combinedAF: 0.00034762,
                            passingVariants: 5,
                            singleVariants: 4,
                            stdErr: 0.067554,
                            beta: -0.078211,
                        },
                        {
                            mask: "5/5",
                            n: 32927,
                            pValue: 0.8093899999999999,
                            combinedAF: 0.0010022,
                            passingVariants: 22,
                            singleVariants: 15,
                            stdErr: 0.031608,
                            beta: 0.0076242,
                        },
                        {
                            mask: "16/16",
                            n: 17260,
                            pValue: 0.24698,
                            combinedAF: 0.00034762,
                            passingVariants: 5,
                            singleVariants: 4,
                            stdErr: 0.067554,
                            beta: -0.078211,
                        },
                        {
                            mask: "5/5 + LofTee LC",
                            n: 32927,
                            pValue: 0.8093899999999999,
                            combinedAF: 0.0010022,
                            passingVariants: 22,
                            singleVariants: 15,
                            stdErr: 0.031608,
                            beta: 0.0076242,
                        },
                        {
                            mask: "5/5 + 0/5 1%",
                            n: 41112,
                            pValue: 0.95237,
                            combinedAF: 0.0082701,
                            passingVariants: 89,
                            singleVariants: 47,
                            stdErr: 0.023386,
                            beta: -0.0013968,
                        },
                        {
                            mask: "5/5 + 1/5 1%",
                            n: 41112,
                            pValue: 0.9984,
                            combinedAF: 0.006932300000000001,
                            passingVariants: 84,
                            singleVariants: 45,
                            stdErr: 0.010551000000000001,
                            beta: 2.122e-5,
                        },
                        {
                            mask: "11/11",
                            n: 28161,
                            pValue: 0.38822,
                            combinedAF: 0.00074571,
                            passingVariants: 13,
                            singleVariants: 8,
                            stdErr: 0.037993,
                            beta: -0.032783,
                        },
                    ],
                },
                {
                    dataset: "52k",
                    phenotype: "Phenotype*",
                    gene: "Gene*",
                    pValue: 0.795,
                    beta: -0.0328,
                    masks: [
                        {
                            mask: "LofTee",
                            n: 17260,
                            pValue: 0.24698,
                            combinedAF: 0.00034762,
                            passingVariants: 5,
                            singleVariants: 4,
                            stdErr: 0.067554,
                            beta: -0.078211,
                        },
                        {
                            mask: "5/5",
                            n: 32927,
                            pValue: 0.8093899999999999,
                            combinedAF: 0.0010022,
                            passingVariants: 22,
                            singleVariants: 15,
                            stdErr: 0.031608,
                            beta: 0.0076242,
                        },
                        {
                            mask: "16/16",
                            n: 17260,
                            pValue: 0.24698,
                            combinedAF: 0.00034762,
                            passingVariants: 5,
                            singleVariants: 4,
                            stdErr: 0.067554,
                            beta: -0.078211,
                        },
                        {
                            mask: "5/5 + LofTee LC",
                            n: 32927,
                            pValue: 0.8093899999999999,
                            combinedAF: 0.0010022,
                            passingVariants: 22,
                            singleVariants: 15,
                            stdErr: 0.031608,
                            beta: 0.0076242,
                        },
                        {
                            mask: "5/5 + 0/5 1%",
                            n: 41112,
                            pValue: 0.95237,
                            combinedAF: 0.0082701,
                            passingVariants: 89,
                            singleVariants: 47,
                            stdErr: 0.023386,
                            beta: -0.0013968,
                        },
                        {
                            mask: "5/5 + 1/5 1%",
                            n: 41112,
                            pValue: 0.9984,
                            combinedAF: 0.006932300000000001,
                            passingVariants: 84,
                            singleVariants: 45,
                            stdErr: 0.010551000000000001,
                            beta: 2.122e-5,
                        },
                        {
                            mask: "11/11",
                            n: 28161,
                            pValue: 0.38822,
                            combinedAF: 0.00074571,
                            passingVariants: 13,
                            singleVariants: 8,
                            stdErr: 0.037993,
                            beta: -0.032783,
                        },
                    ],
                },
            ],
        };
    },
    mounted() {},
    methods: {
        capitalizedFormatter: Formatters.capitalizedFormatter,
        showFeatures(index) {
            console.log("index: ", index);
            uiUtils.showHideElement("feature-headers-" + index);
        },
        showPlot(index) {
            console.log("plot index: ", index);
            let isEmpty =
                document.getElementById("plot_" + index).innerHTML === "";
            if (isEmpty) this.createChart(index);

            uiUtils.showHideElement("feature-plot-" + index);
        },
        createChart(index, data) {
            // Create chart instance
            let chart = am4core.create("plot_" + index, am4charts.XYChart);

            // Add data
            chart.data = [
                {
                    category: "LofTee",
                    measure: 1.3,
                    bulletSize: 25,
                    high: 3.4,
                    low: 1.0,
                },
                {
                    category: "5/5",
                    measure: 2.1,
                    bulletSize: 15,
                    high: 2.6,
                    low: 0.5,
                },
                {
                    category: "16/16",
                    measure: 1.8,
                    bulletSize: 10,
                    high: 3.2,
                    low: 0.9,
                },
                {
                    category: "5/5 + LofTee LC",
                    measure: 2.3,
                    bulletSize: 30,
                    high: 2.7,
                    low: 1.9,
                },
                {
                    category: "5/5 + 0/5 1%",
                    measure: 2.1,
                    bulletSize: 35,
                    high: 2.5,
                    low: 1.8,
                },
                {
                    category: "5/5 + 1/5 1%",
                    measure: 2.3,
                    bulletSize: 20,
                    high: 2.7,
                    low: 1.9,
                },
                {
                    category: "11/11",
                    measure: 1.1,
                    bulletSize: 25,
                    high: 2.5,
                    low: 0.8,
                },
                {
                    category: "Summary measure",
                    measure: 2.2,
                    bulletSize: 55,
                    high: 2.4,
                    low: 1.9,
                    rotation: 45,
                    fill: am4core.color("#fff"),
                    label: "{valueX}",
                },
            ];

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
            marker.tooltipText = "[bold]{valueX}[/] ({low}-{high})";

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
            range.value = 2.2;
            range.grid.strokeWidth = 2;
            range.grid.strokeDasharray = "3,3";
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
