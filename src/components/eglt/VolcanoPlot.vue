<template>
    <div class="volcano-plot-content">
        <div id="clicked_dot_value" class="hidden"></div>

        <div
            v-if="!!renderConfig.legend"
            class="volcano-plot-legend"
            v-html="renderConfig.legend"
        ></div>
        <canvas
            v-if="!!renderConfig"
            id="volcanoPlot"
            class=""
            @mouseleave="hidePanel"
            @mousemove="checkPosition"
            @click="filterTable"
            :width="renderConfig.width + 120"
            :height="renderConfig.height + 120"
        >
        </canvas>
        <!--<div id="clicked_dot_indicator" class=""></div>-->
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
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("volcano-plot", {
    props: ["plotData", "renderConfig", "geneOfInterest"],
    data() {
        return {};
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {
        this.renderPlot();
    },
    computed: {
        renderingGene() {
            return this.geneOfInterest;
        },
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
        volcanoDotPos() {
            let xAxisData = [];
            let yAxisData = [];
            let canvasWidth = this.renderConfig.width;
            let canvasHeight = this.renderConfig.height;
            let leftMargin = 74.5; // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            let topMargin = 44.5; // -0.5 to draw crisp line

            let xBump = this.renderConfig.width * 0.02;
            let yBump = this.renderConfig.height * 0.02;
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
            let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
            let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;
            let dotPos = {};

            this.renderData.map((d) => {
                //Actual rendering position
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

                dotPos[
                    Formatters.intFormatter(xPos) +
                        "_" +
                        Formatters.intFormatter(yPos)
                ] = d[this.renderConfig.renderBy];

                if (!!dotPos[Formatters.intFormatter(xPos)]) {
                    dotPos[Formatters.intFormatter(xPos)][
                        Formatters.intFormatter(yPos)
                    ] = d[this.renderConfig.renderBy];
                } else {
                    dotPos[Formatters.intFormatter(xPos)] = {};
                    dotPos[Formatters.intFormatter(xPos)][
                        Formatters.intFormatter(yPos)
                    ] = d[this.renderConfig.renderBy];
                }
            });

            //console.log("dotPos", dotPos);

            return dotPos;
        },
    },
    watch: {
        renderData() {
            this.clearPlot();
            this.renderPlot();
        },
        renderingGene() {
            this.clearPlot();
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,
        hidePanel() {
            uiUtils.hideElement("clicked_dot_value");
            //this.renderPlot();
        },
        filterTable() {
            let wrapper = document.getElementById("clicked_dot_value");

            if (wrapper.innerText != "") {
                let items = wrapper.innerText.split("\n");
                document.getElementById(
                    "filter_" + this.renderConfig.renderBy.replace(/ /g, "")
                ).value = items.join(", ");
                this.$parent.filterData(
                    "",
                    this.renderConfig.renderBy,
                    "search"
                );
            }
        },
        checkPosition(event) {
            let wrapper = document.getElementById("clicked_dot_value");
            wrapper.classList.remove("hidden");

            let e = event;
            var rect = document
                .getElementById("volcanoPlot")
                .getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);

            let canvas = document.getElementById("volcanoPlot");

            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            let clickedDotValue = "";
            let redDotsArr = [];

            for (let h = -3; h <= 3; h++) {
                for (let v = -3; v <= 3; v++) {
                    if (this.volcanoDotPos[x + h] != undefined) {
                        if (this.volcanoDotPos[x + h][y + v] != undefined) {
                            //console.log(this.volcanoDotPos[x + h][y + v]);
                            let tempObj = {};
                            tempObj["x"] = x + h;
                            tempObj["y"] = y + v;

                            redDotsArr.push(tempObj);

                            clickedDotValue +=
                                '<span class="gene-on-clicked-dot-volcano">' +
                                this.volcanoDotPos[x + h][y + v] +
                                "</span>";
                        }
                    }
                }
            }

            if (clickedDotValue != "") {
                wrapper.innerHTML = clickedDotValue;
                document.getElementById("volcanoPlot").classList.add("hover");
                //this.renderPlot(redDotsArr);
            } else {
                wrapper.innerHTML = clickedDotValue;
                wrapper.classList.add("hidden");
                document
                    .getElementById("volcanoPlot")
                    .classList.remove("hover");
            }
        },
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
        renderPlot(REDDOTS) {
            let xAxisData = [];
            let yAxisData = [];

            let canvasWidth = this.renderConfig.width;
            let canvasHeight = this.renderConfig.height;
            let leftMargin = 74.5; // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            let topMargin = 44.5; // -0.5 to draw crisp line

            let xBump = this.renderConfig.width * 0.02;
            let yBump = this.renderConfig.height * 0.02;

            var c = document.getElementById("volcanoPlot");
            var ctx = c.getContext("2d");
            ctx.clearRect(
                0,
                0,
                this.renderConfig.width + 120,
                this.renderConfig.height + 120
            );

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

                if (xAxisTicks.lo + i * xAxisTicks.step == 0) {
                    ctx.fillText(
                        0,
                        leftMargin + i * xTickDistance + xBump,
                        topMargin + canvasHeight + 17 + yBump
                    );
                } else {
                    ctx.fillText(
                        Formatters.floatFormatter(
                            xAxisTicks.lo + i * xAxisTicks.step
                        ),
                        leftMargin + i * xTickDistance + xBump,
                        topMargin + canvasHeight + 17 + yBump
                    );
                }
            }
            //Render x axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.fillText(
                this.renderConfig.xAxisLabel,
                leftMargin + canvasWidth / 2,
                topMargin + canvasHeight + 45 + yBump
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

                if (yAxisTicks.lo + yAxisTicks.step * i == 0) {
                    ctx.fillText(
                        0,
                        leftMargin - 7,
                        topMargin + (5 - i) * yTickDistance + 3
                    );
                } else {
                    ctx.fillText(
                        Formatters.floatFormatter(
                            yAxisTicks.lo + yAxisTicks.step * i
                        ),
                        leftMargin - 7,
                        topMargin + (5 - i) * yTickDistance + 3
                    );
                }
            }

            //Render y axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.rotate(-(Math.PI * 2) / 4);
            ctx.fillText(
                this.renderConfig.yAxisLabel,
                -(topMargin + canvasHeight / 2),
                leftMargin - 55
            );

            //render dots

            ctx.rotate((Math.PI * 2) / 4);
            let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
            let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;

            let xCondition = this.renderConfig.xCondition;

            this.renderData.map((d) => {
                //rendering position
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
                    let xCondiCombi = this.renderConfig.xCondition.combination;
                    let xFieldVal = d[this.renderConfig.xAxisField];

                    if (
                        xCondiCombi == "gt" &&
                        xFieldVal > this.renderConfig.xCondition.gt
                    ) {
                        fillScore++;
                    }
                    if (
                        xCondiCombi == "lt" &&
                        xFieldVal < this.renderConfig.xCondition.lt
                    ) {
                        fillScore++;
                    }
                    if (
                        xCondiCombi == "and" &&
                        xFieldVal > this.renderConfig.xCondition.gt &&
                        xFieldVal < this.renderConfig.xCondition.lt
                    ) {
                        fillScore++;
                    }
                    if (
                        (xCondiCombi == "or" &&
                            xFieldVal > this.renderConfig.xCondition.gt) ||
                        xFieldVal < this.renderConfig.xCondition.lt
                    ) {
                        fillScore++;
                    }
                }

                if (!!this.renderConfig.yCondition) {
                    let yCondiCombi = this.renderConfig.yCondition.combination;
                    let yFieldVal = d[this.renderConfig.yAxisField];

                    if (
                        yCondiCombi == "gt" &&
                        yFieldVal > this.renderConfig.yCondition.gt
                    ) {
                        fillScore++;
                    }
                    if (
                        yCondiCombi == "lt" &&
                        yFieldVal < this.renderConfig.yCondition.lt
                    ) {
                        fillScore++;
                    }
                    if (
                        yCondiCombi == "and" &&
                        yFieldVal > this.renderConfig.yCondition.gt &&
                        yFieldVal < this.renderConfig.yCondition.lt
                    ) {
                        fillScore++;
                    }
                    if (
                        (yCondiCombi == "or" &&
                            yFieldVal > this.renderConfig.yCondition.gt) ||
                        yFieldVal < this.renderConfig.yCondition.lt
                    ) {
                        fillScore++;
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

                ctx.lineWidth = 0;
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

            // reder hovering dots in red
            //console.log(!!this.volcanoDotPos);

            if (REDDOTS != undefined) {
                REDDOTS.map((dot) => {
                    let redXPos = dot.x;
                    let redYPos = dot.y;
                    ctx.fillStyle = "#ff0000";
                    ctx.lineWidth = 0;
                    ctx.beginPath();
                    ctx.arc(redXPos, redYPos, 4, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }

            //if selectedGene is not undefined
            if (this.geneOfInterest != undefined) {
                let targetGene = this.$parent.convert2RenderBy(
                    this.geneOfInterest
                );

                this.renderData.map((d) => {
                    if (
                        d[this.renderConfig.renderBy].toLowerCase() ==
                        targetGene.toLowerCase()
                    ) {
                        let xPos =
                            leftMargin +
                            xBump +
                            canvasWidth *
                                ((d[this.renderConfig.xAxisField] -
                                    xAxisTicks.lo) /
                                    (xPosMax - xAxisTicks.lo));
                        let yPos =
                            topMargin +
                            canvasHeight -
                            canvasHeight *
                                ((d[this.renderConfig.yAxisField] -
                                    yAxisTicks.lo) /
                                    (yPosMax - yAxisTicks.lo));

                        ctx.fillStyle = "#ff0000";
                        ctx.lineWidth = 0;

                        ctx.beginPath();
                        ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
                        ctx.fill();

                        ctx.font = "12px Arial";
                        ctx.textAlign = "center";
                        ctx.fillStyle = "#FF0000";
                        ctx.fillText(
                            d[this.renderConfig.renderBy],
                            xPos,
                            yPos - 6
                        );
                    }
                });
            }

            //render dashed line
            if (!!this.renderConfig.xCondition) {
                let xCondiCombi = this.renderConfig.xCondition.combination;

                let xGTPos = null,
                    xLTPos = null;

                if (
                    xCondiCombi == "gt" ||
                    xCondiCombi == "or" ||
                    xCondiCombi == "and"
                ) {
                    xGTPos =
                        leftMargin +
                        xBump +
                        canvasWidth *
                            ((this.renderConfig.xCondition.gt - xAxisTicks.lo) /
                                (xPosMax - xAxisTicks.lo));
                }

                if (
                    xCondiCombi == "lt" ||
                    xCondiCombi == "or" ||
                    xCondiCombi == "and"
                ) {
                    xLTPos =
                        leftMargin +
                        xBump +
                        canvasWidth *
                            ((this.renderConfig.xCondition.lt - xAxisTicks.lo) /
                                (xPosMax - xAxisTicks.lo));
                }

                if (xGTPos != null) {
                    this.renderDash(
                        xGTPos,
                        xGTPos,
                        topMargin,
                        canvasHeight + topMargin + yBump,
                        "#999999",
                        1,
                        [5, 5]
                    );
                }

                if (xLTPos != null) {
                    this.renderDash(
                        xLTPos,
                        xLTPos,
                        topMargin,
                        canvasHeight + topMargin + yBump,
                        "#999999",
                        1,
                        [5, 5]
                    );
                }
            }

            if (!!this.renderConfig.yCondition) {
                let yCondiCombi = this.renderConfig.yCondition.combination;

                let yGTPos = null,
                    yLTPos = null;

                if (
                    yCondiCombi == "gt" ||
                    yCondiCombi == "or" ||
                    yCondiCombi == "and"
                ) {
                    yGTPos =
                        topMargin +
                        canvasHeight -
                        canvasHeight *
                            ((this.renderConfig.yCondition.gt - yAxisTicks.lo) /
                                (yPosMax - yAxisTicks.lo));
                }

                if (
                    yCondiCombi == "lt" ||
                    yCondiCombi == "or" ||
                    yCondiCombi == "and"
                ) {
                    yLTPos =
                        topMargin +
                        canvasHeight -
                        canvasHeight *
                            ((this.renderConfig.yCondition.lt - yAxisTicks.lo) /
                                (yPosMax - yAxisTicks.lo));
                }

                if (yGTPos != null) {
                    this.renderDash(
                        leftMargin,
                        leftMargin + canvasWidth + xBump,
                        yGTPos,
                        yGTPos,
                        "#999999",
                        1,
                        [5, 5]
                    );
                }

                if (yLTPos != null) {
                    this.renderDash(
                        leftMargin,
                        leftMargin + canvasWidth + xBump,
                        yLTPos,
                        yLTPos,
                        "#999999",
                        1,
                        [5, 5]
                    );
                }
            }
        },
        renderDash(X1, X2, Y1, Y2, COLOR, WIDTH, DASH) {
            var d = document.getElementById("volcanoPlot");
            var dtx = d.getContext("2d");
            dtx.strokeStyle = COLOR;
            dtx.lineWidth = WIDTH;
            dtx.setLineDash(DASH);
            dtx.moveTo(X1, Y1);
            dtx.lineTo(X2, Y2);
            dtx.stroke();
        },
    },
});

$(function () {});
</script>
<style>
#volcanoPlot.hover {
    cursor: pointer;
}

.gene-on-clicked-dot-volcano {
    display: block;
    float: left;
    padding: 0 5px;
}
</style>



