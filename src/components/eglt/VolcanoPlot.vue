<template>
    <div class="volcano-plot-content">
        <canvas
            v-if="!!renderConfig"
            id="volcanoPlot"
            :width="renderConfig.width"
            :height="renderConfig.height"
            style="border: solid 1px #ddd"
        >
        </canvas>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("volcano-plot", {
    props: ["plotData", "renderConfig"],
    data() {
        return {};
    },
    modules: {
        uiUtils,
    },
    mounted: function () {
        this.renderPlot();
    },
    computed: {
        renderData() {
            let rawData = this.plotData;
            let massagedData = [];

            rawData.map((r) => {
                let tempObj = {};
                tempObj[this.renderConfig.renderBy] =
                    r[this.renderConfig.renderBy];
                tempObj[this.renderConfig.xAxisField] =
                    r[this.renderConfig.xAxisField];
                tempObj[this.renderConfig.yAxisField] =
                    r[this.renderConfig.yAxisField];

                massagedData.push(tempObj);
            });

            return massagedData;
        },
    },
    watch: {
        renderData() {
            this.clearPlot();
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,
        clearPlot() {
            var c = document.getElementById("volcanoPlot");
            var ctx = c.getContext("2d");
            ctx.clearRect(
                0,
                0,
                this.renderConfig.width,
                this.renderConfig.height
            );
        },
        renderPlot() {
            let xAxisData = [];
            let yAxisData = [];

            var c = document.getElementById("volcanoPlot");
            var ctx = c.getContext("2d");

            this.renderData.map((d) => {
                xAxisData.push(d[this.renderConfig.xAxisField]);
                yAxisData.push(d[this.renderConfig.yAxisField]);

                ctx.fillStyle = "#00000050"; //gray
                ctx.beginPath();
                ctx.arc(
                    d[this.renderConfig.xAxisField] * 10,
                    d[this.renderConfig.yAxisField] * 10,
                    3,
                    0,
                    2 * Math.PI
                );
                ctx.fill();
            });
            xAxisData.sort();
            yAxisData.sort();
            console.log(
                uiUtils.getAxisTicks(
                    xAxisData[0],
                    xAxisData[xAxisData.length - 1]
                )
            );
            console.log(
                uiUtils.getAxisTicks(
                    yAxisData[0],
                    yAxisData[yAxisData.length - 1]
                )
            );
            console.log(uiUtils.getAxisTicks(0, 100));
        },
    },
});

$(function () {});
</script>

