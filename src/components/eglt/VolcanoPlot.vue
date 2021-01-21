<template>
    <div class="volcano-plot-content">
        <div
            v-if="!!renderConfig.legend"
            class="volcano-plot-legend"
            v-html="renderConfig.legend"
        ></div>
        <canvas
            v-if="!!renderConfig"
            id="volcanoPlot"
            :width="renderConfig.width + 120"
            :height="renderConfig.height + 120"
        >
        </canvas>
        <div
            v-if="!!renderConfig.label"
            class="volcano-plot-label"
            v-html="renderConfig.label"
        ></div>
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
                this.renderConfig.width + 120,
                this.renderConfig.height + 120
            );
        },
        renderPlot() {
            let xAxisData = [];
            let yAxisData = [];

            let canvasWidth = this.renderConfig.width;
            let canvasHeight = this.renderConfig.height;
            let leftMargin = 74.5; // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            let topMargin = 44.5; // -0.5 to draw crisp line

            let xBump = this.renderConfig.width * 0.02;
            let yBump = this.renderConfig.height * 0.02;

            console.log("xBump", xBump, "yBump", yBump);

            var c = document.getElementById("volcanoPlot");
            var ctx = c.getContext("2d");

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000000";
            ctx.setLineDash([]);

            this.renderData.map((d) => {
                xAxisData.push(d[this.renderConfig.xAxisField]);
                yAxisData.push(d[this.renderConfig.yAxisField]);
            });

            let xMin = Math.min.apply(Math, xAxisData);
            let xMax = Math.max.apply(Math, xAxisData);

            let yMin = Math.min.apply(Math, yAxisData);
            let yMax = Math.max.apply(Math, yAxisData);

            let xAxisTicks = uiUtils.getAxisTicks(xMin, xMax);
            let yAxisTicks = uiUtils.getAxisTicks(yMin, yMax);

            //console.log("x", xAxisTicks);
            //console.log("y", yAxisTicks);

            // render x axis

            ctx.moveTo(leftMargin, canvasHeight + topMargin + yBump);
            ctx.lineTo(
                canvasWidth + leftMargin + xBump,
                canvasHeight + topMargin + yBump
            );
            ctx.stroke();

            let xTickDistance = canvasWidth / 5;
            for (let i = 0; i < 6; i++) {
                ctx.moveTo(
                    leftMargin + i * xTickDistance + xBump,
                    topMargin + canvasHeight + yBump
                );
                ctx.lineTo(
                    leftMargin + i * xTickDistance + xBump,
                    canvasHeight + topMargin + 5 + yBump
                );
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#000000";
                ctx.fillText(
                    xAxisTicks.lo + i * xAxisTicks.step,
                    leftMargin + i * xTickDistance + xBump,
                    topMargin + canvasHeight + 17 + yBump
                );
            }
            //Render x axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.fillText(
                this.renderConfig.xAxisLabel,
                leftMargin + canvasWidth / 2,
                topMargin + canvasHeight + 35 + yBump
            );

            // render y axis
            ctx.moveTo(leftMargin, topMargin);
            ctx.lineTo(leftMargin, canvasHeight + topMargin + yBump);
            ctx.stroke();
            let yTickDistance = canvasHeight / 5;
            for (let i = 0; i < 6; i++) {
                ctx.moveTo(leftMargin - 5, topMargin + i * yTickDistance);
                ctx.lineTo(leftMargin, topMargin + i * yTickDistance);
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillStyle = "#000000";
                ctx.fillText(
                    yAxisTicks.lo + yAxisTicks.step * i,
                    leftMargin - 7,
                    topMargin + (5 - i) * yTickDistance + 3
                );
            }

            //Render y axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.rotate(-(Math.PI * 2) / 4);
            ctx.fillText(
                this.renderConfig.yAxisLabel,
                -(topMargin + canvasHeight / 2),
                leftMargin - 35
            );

            //render dots
            ctx.rotate((Math.PI * 2) / 4);
            let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
            let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;

            let xCondition = this.renderConfig.xCondition;
            console.log(xCondition);
            console.log(this.renderConfig.yCondition);

            this.renderData.map((d) => {
                let xPos =
                    leftMargin +
                    xBump +
                    canvasWidth *
                        ((d[this.renderConfig.xAxisField] - xAxisTicks.lo) /
                            (xPosMax - xAxisTicks.lo));
                let yPos =
                    topMargin +
                    canvasHeight -
                    canvasHeight *
                        ((d[this.renderConfig.yAxisField] - yAxisTicks.lo) /
                            (yPosMax - yAxisTicks.lo));

                let fillScore = 0;

                if (!!this.renderConfig.xCondition) {
                    switch (this.renderConfig.xCondition.combination) {
                        case "gt":
                            if (
                                d[this.renderConfig.xAxisField] >
                                this.renderConfig.xCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "lt":
                            if (
                                d[this.renderConfig.xAxisField] <
                                this.renderConfig.xCondition.lt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "and":
                            if (
                                d[this.renderConfig.xAxisField] <
                                    this.renderConfig.xCondition.lt &&
                                d[this.renderConfig.xAxisField] >
                                    this.renderConfig.xCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "or":
                            if (
                                d[this.renderConfig.xAxisField] <
                                    this.renderConfig.xCondition.lt ||
                                d[this.renderConfig.xAxisField] >
                                    this.renderConfig.xCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                    }
                }

                if (!!this.renderConfig.yCondition) {
                    switch (this.renderConfig.yCondition.combination) {
                        case "gt":
                            if (
                                d[this.renderConfig.yAxisField] >
                                this.renderConfig.yCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "lt":
                            if (
                                d[this.renderConfig.yAxisField] <
                                this.renderConfig.yCondition.lt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "and":
                            if (
                                d[this.renderConfig.yAxisField] <
                                    this.renderConfig.yCondition.lt &&
                                d[this.renderConfig.yAxisField] >
                                    this.renderConfig.yCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                        case "or":
                            if (
                                d[this.renderConfig.yAxisField] <
                                    this.renderConfig.yCondition.lt ||
                                d[this.renderConfig.yAxisField] >
                                    this.renderConfig.yCondition.gt
                            ) {
                                fillScore++;
                            }
                            break;
                    }
                }

                switch (fillScore) {
                    case 0:
                        ctx.fillStyle = "#00000050";
                        break;
                    case 1:
                        ctx.fillStyle = "#09910980";
                        break;
                    case 2:
                        ctx.fillStyle = "#ff003780";
                        break;
                }

                ctx.beginPath();
                ctx.arc(xPos, yPos, 3, 0, 2 * Math.PI);
                ctx.fill();

                if (
                    !!this.renderConfig.dotLabelScore &&
                    fillScore >= this.renderConfig.dotLabelScore
                ) {
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#000000";
                    ctx.fillText(d[this.renderConfig.renderBy], xPos, yPos - 4);
                }
            });

            if (!!this.renderConfig.xCondition) {
                switch (this.renderConfig.xCondition.combination) {
                    case "gt":
                        let xGTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.gt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));

                        this.renderDash(
                            xGTPos,
                            xGTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;

                    case "lt":
                        let xLTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.lt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));

                        this.renderDash(
                            xLTPos,
                            xLTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );

                        break;
                    case "and":
                        xLTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.lt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));
                        xGTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.gt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));

                        this.renderDash(
                            xLTPos,
                            xLTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        this.renderDash(
                            xGTPos,
                            xGTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;
                    case "or":
                        xLTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.lt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));
                        xGTPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((this.renderConfig.xCondition.gt -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));

                        this.renderDash(
                            xLTPos,
                            xLTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        this.renderDash(
                            xGTPos,
                            xGTPos,
                            topMargin,
                            canvasHeight + topMargin + yBump,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;
                }
            }

            if (!!this.renderConfig.yCondition) {
                switch (this.renderConfig.yCondition.combination) {
                    case "gt":
                        let yGTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.gt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yGTPos,
                            yGTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;
                    case "lt":
                        let yLTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.lt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yLTPos,
                            yLTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );

                        break;
                    case "and":
                        yLTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.lt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yLTPos,
                            yLTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        yGTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.gt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yGTPos,
                            yGTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;
                    case "or":
                        yLTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.lt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yLTPos,
                            yLTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        yGTPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((this.renderConfig.yCondition.gt -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        this.renderDash(
                            leftMargin,
                            leftMargin + canvasWidth + xBump,
                            yGTPos,
                            yGTPos,
                            "#999999",
                            1,
                            [5, 5]
                        );
                        break;
                }
            }
        },
        renderDash(X1, X2, Y1, Y2, COLOR, WIDTH, DASH) {
            var c = document.getElementById("volcanoPlot");
            var ctx = c.getContext("2d");
            ctx.strokeStyle = COLOR;
            ctx.lineWidth = WIDTH;
            ctx.setLineDash(DASH);
            ctx.moveTo(X1, Y1);
            ctx.lineTo(X2, Y2);
            ctx.stroke();
        },
    },
});

$(function () {});
</script>

