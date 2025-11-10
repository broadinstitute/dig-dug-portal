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
    data() {
        return {
            chart: null,
        };
    },
    computed: {
        height() {
            return `height: ${
                this.data.length ? this.data.length * 50 + 40 : 300
            }px`;
        },
    },
    watch: {
        data: {
            handler(newData) {
                console.log("Data changed, updating chart with:", newData);
                if (this.chart && newData && newData.length > 0) {
                    this.updateChart(newData);
                } else if (newData && newData.length > 0) {
                    // If chart doesn't exist but we have data, create it
                    this.$nextTick(() => {
                        this.createChart(
                            newData,
                            this.element,
                            this.dichotomous
                        );
                    });
                }
            },
            deep: true,
        },
        dichotomous(newValue) {
            console.log("Dichotomous changed:", newValue);
            // Recreate chart when dichotomous changes since it affects the entire chart structure
            this.$nextTick(() => {
                this.createChart(this.data, this.element, newValue);
            });
        },
    },
    mounted() {
        // Use nextTick to ensure DOM is ready
        this.$nextTick(() => {
            if (this.data && this.data.length > 0) {
                this.createChart(this.data, this.element, this.dichotomous);
            }
        });
    },
    beforeDestroy() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    },
    methods: {
        createChart(data, element, dichotomous) {
            // Check if element exists
            const chartElement = document.getElementById(element);
            if (!chartElement) {
                console.error("Chart element not found:", element);
                return;
            }

            // Dispose existing chart if it exists
            if (this.chart) {
                this.chart.dispose();
                this.chart = null;
            }

            // Validate data
            if (!data || data.length === 0) {
                console.warn("No data provided to create chart");
                return;
            }

            try {
                // Create chart instance
                this.chart = am4core.create(element, am4charts.XYChart);
                //let labelName = dichotomous ? "Odds Ratio" : "Beta";

                this.chart.data = data.map((item) => {
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

                //support logo
                this.chart.logo.disabled = true;

                // Create axes
                let yAxis = this.chart.yAxes.push(new am4charts.CategoryAxis());
                yAxis.dataFields.category = "category";
                yAxis.renderer.grid.template.location = 0;
                yAxis.renderer.inversed = true;

                let xAxis = this.chart.xAxes.push(new am4charts.ValueAxis());

                // Create series for lines
                let series = this.chart.series.push(
                    new am4charts.ColumnSeries()
                );
                series.dataFields.openValueX = "low";
                series.dataFields.valueX = "high";
                series.dataFields.categoryY = "category";
                series.columns.template.height = 1;
                series.columns.template.strokeWidth = 0;
                series.columns.template.fill = this.chart.colors.getIndex(0);

                // Create series for markers
                let series2 = this.chart.series.push(
                    new am4charts.LineSeries()
                );
                series2.dataFields.customValue = "bulletSize";
                series2.dataFields.valueX = "measure";
                series2.dataFields.categoryY = "category";
                series2.strokeWidth = 0;

                let marker = series2.bullets.push(new am4core.Rectangle());
                marker.width = 5;
                marker.height = 5;
                marker.strokeWidth = 0;
                marker.fill = this.chart.colors.getIndex(0);
                marker.stroke = this.chart.colors.getIndex(0);
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

                //Overwrites for 52k table
                yAxis.renderer.grid.template.disabled = true;
                xAxis.renderer.grid.template.disabled = true;

                // Add summary line
                let range = xAxis.axisRanges.create();
                range.value = dichotomous ? 1 : 0;
                range.grid.strokeWidth = 2;
                range.grid.strokeDasharray = "7,7";

                console.log("Chart created successfully");
            } catch (error) {
                console.error("Error creating chart:", error);
            }
        },
        updateChart(newData) {
            if (!this.chart || !newData || newData.length === 0) {
                console.warn("Cannot update chart - chart or data missing");
                return;
            }

            try {
                const processedData = newData.map((item) => {
                    if (item.stdErr == "Infinity") {
                        item.stdErr = 2 * Math.abs(item.beta);
                    }
                    return {
                        category: item.mask,
                        high: this.dichotomous
                            ? Math.exp(item.beta + item.stdErr * 1.96)
                            : item.beta + item.stdErr * 1.96,
                        low: this.dichotomous
                            ? Math.exp(item.beta - item.stdErr * 1.96)
                            : item.beta - item.stdErr * 1.96,
                        measure: this.dichotomous
                            ? Math.exp(item.beta)
                            : item.beta,
                        bulletSize: 5,
                    };
                });

                console.log(
                    "Updating chart with processed data:",
                    processedData
                );
                this.chart.data = processedData;
            } catch (error) {
                console.error("Error updating chart:", error);
            }
        },
    },
});
</script>

<style></style>
