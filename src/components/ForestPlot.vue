<template>
    <div :id="element" class="plots" :style="height"></div>
</template>

<script>
import Vue from "vue";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
am4core.useTheme(am4themes_animated);
am4core.options.autoDispose = true;

let chart = null;
export default Vue.component("ForestPlot", {
    props: {
        data: {
            type: Array,
            required: true,
        },
        element: {
            type: String,
            required: false,
            default: "forest-plot",
        },
        dichotomous: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    computed: {
        height() {
            return `height: ${
                this.data.length ? this.data.length * 50 + 40 : 300
            }px`;
        },
    },
    mounted() {
        this.createChart(this.data, this.element, this.dichotomous);
    },
    methods: {
        createChart(data, element, dichotomous) {
            chart = am4core.create(element, am4charts.XYChart);
            let labelName = dichotomous ? "Odds Ratio" : "Beta";

            chart.data = data.map((item) => {
                if (item.stdErr == "Infinity") {
                    item.stdErr = 2 * Math.abs(item.beta);
                }
                return {
                    category: item.mask,
                    high: dichotomous
                        ? Math.exp(item.beta + item.stdErr * 1.96)
                        : item.beta + item.stdErr * 1.96,
                    low: dichotomous
                        ? Math.exp(item.beta - item.stdErr * 1.96)
                        : item.beta - item.stdErr * 1.96,
                    measure: dichotomous ? Math.exp(item.beta) : item.beta,
                    bulletSize: 5,
                };
            });

            chart.logo.disabled = true;

            let yAxis = chart.yAxes.push(new am4charts.CategoryAxis());
            yAxis.dataFields.category = "category";
            yAxis.renderer.grid.template.location = 0;
            yAxis.renderer.inversed = true;


            let xAxis = chart.xAxes.push(new am4charts.ValueAxis());

            let series = chart.series.push(new am4charts.ColumnSeries());
            series.dataFields.openValueX = "low";
            series.dataFields.valueX = "high";
            series.dataFields.categoryY = "category";
            series.columns.template.height = 1;
            series.columns.template.strokeWidth = 0;
            series.columns.template.fill = chart.colors.getIndex(0);

            let series2 = chart.series.push(new am4charts.LineSeries());
            series2.dataFields.customValue = "bulletSize";
            series2.dataFields.valueX = "measure";
            series2.dataFields.categoryY = "category";
            series2.strokeWidth = 0;

            let marker = series2.bullets.push(new am4core.Rectangle());
            marker.width = 5;
            marker.height = 5;
            marker.strokeWidth = 0;
            marker.fill = chart.colors.getIndex(0);
            marker.stroke = chart.colors.getIndex(0);
            marker.propertyFields.rotation = "rotation";
            marker.propertyFields.fill = "fill";
            marker.nonScalingStroke = true;
            marker.verticalCenter = "middle";
            marker.horizontalCenter = "middle";

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

            yAxis.renderer.grid.template.disabled = true;
            xAxis.renderer.grid.template.disabled = true;

            let range = xAxis.axisRanges.create();
            range.value = dichotomous ? 1 : 0;
            range.grid.strokeWidth = 2;
            range.grid.strokeDasharray = "7,7";
        },
        updateChart(newData) {
            chart.data = newData;
        },
    },
});
</script>

<style></style>
