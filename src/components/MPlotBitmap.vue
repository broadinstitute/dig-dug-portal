<template>
    <div class="mbm-plot-content">
        <div id="clicked_dot_value" class="hidden"></div>
        <div
            v-if="!!renderConfig.legend"
            class="mbm-plot-legend"
            v-html="renderConfig.legend"
        ></div>
        <canvas
            v-if="!!renderConfig"
            id="manhattanPlot"
            @click="checkPosition"
            @resize="onResize"
            width=""
            height=""
        >
        </canvas>
        <div
            v-if="!!renderConfig.label"
            class="mbm-plot-label"
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

export default Vue.component("m-bitmap-plot", {
    props: ["plotData", "renderConfig"],
    data() {
        return {
            plotRendered: 0,
            chromosomeLength: {
                1: 248956422,
                2: 242193529,
                3: 198295559,
                4: 190214555,
                5: 181538259,
                6: 170805979,
                7: 159345973,
                8: 145138636,
                9: 138394717,
                10: 133797422,
                11: 135086622,
                12: 133275309,
                13: 114364328,
                14: 107043718,
                15: 101991189,
                16: 90338345,
                17: 83257441,
                18: 80373285,
                19: 58617616,
                20: 64444167,
                21: 46709983,
                22: 50818468,
                X: 156040895,
                Y: 57227415,
            },
            chromosomeColors: [
                "#08306b",
                "#41ab5d",
                "#000000",
                "#f16913",
                "#3f007d",
                "#cb181d",
            ],
            leftMargin: 74.5, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            rightMargin: 0.5,
            topMargin: 10.5, // -0.5 to draw crisp line
            bottomMargin: 50.5,
            dotPosData: {},
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {
        this.renderPlot();
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        renderData() {
            let rawData = this.plotData;
            let massagedData = { sorted: {}, unsorted: [] };

            for (const chr in this.chromosomeLength) {
                massagedData.sorted[chr] = [];
            }

            rawData.map((r) => {
                let region = r[this.renderConfig.xAxisField];
                if (region != undefined && region != "" && region != null) {
                    let tempObj = {};
                    tempObj[this.renderConfig.renderBy] =
                        r[this.renderConfig.renderBy];

                    if (!!this.renderConfig.hoverContent) {
                        let hoverContent = this.renderConfig.hoverContent;

                        hoverContent.map((h) => {
                            tempObj[h] = r[h];
                        });
                    }

                    let locationArr = r[this.renderConfig.xAxisField].split(
                        ":"
                    );

                    let chr = locationArr[0].trim();

                    let regionArr = locationArr[1].split("-");

                    tempObj["locus"] =
                        regionArr.length > 1
                            ? (Number(regionArr[0].trim()) +
                                  Number(regionArr[1].trim())) /
                              2
                            : Number(regionArr[0].trim());

                    tempObj[this.renderConfig.yAxisField] =
                        r[this.renderConfig.yAxisField];

                    massagedData.sorted[chr].push(tempObj);
                    massagedData.unsorted.push(tempObj);
                }
            });

            return massagedData;
        },
    },
    watch: {
        renderData() {
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,

        onResize(e) {
            this.renderPlot();
        },
        checkPosition(event) {
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);
            let clickedDotValue = "";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
                            //console.log(this.dotPosData[x + h]);
                            let dotObject = this.dotPosData[x + h][y + v];
                            clickedDotValue +=
                                '<span class="gene-on-clicked-dot"><b>' +
                                dotObject[this.renderConfig.renderBy] +
                                "</b></span>";

                            if (!!this.renderConfig.hoverContent) {
                                let hoverContent = this.renderConfig
                                    .hoverContent;

                                hoverContent.map((h) => {
                                    clickedDotValue +=
                                        '<span class="content-on-clicked-dot">' +
                                        h +
                                        ": " +
                                        dotObject[h] +
                                        "</span>";
                                });
                            }
                        }
                    }
                }
            }

            let wrapper = document.getElementById("clicked_dot_value");
            let canvas = document.getElementById("manhattanPlot");
            if (clickedDotValue != "") {
                wrapper.innerHTML = clickedDotValue;
                wrapper.classList.remove("hidden");
                wrapper.style.top = y + canvas.offsetTop + "px";
                wrapper.style.left = x + canvas.offsetLeft + "px";
            } else {
                wrapper.classList.add("hidden");
            }
        },
        renderPlot() {
            this.dotPosData = {};

            let wrapper = document.getElementById("clicked_dot_value");
            wrapper.classList.add("hidden");

            let canvasRenderWidth = !!this.renderConfig.width
                ? this.renderConfig.width + this.leftMargin + this.rightMargin
                : window.innerWidth - 115;

            let canvasRenderHeight = !!this.renderConfig.height
                ? this.renderConfig.height + this.topMargin + this.bottomMargin
                : 400;

            let xBump = canvasRenderWidth * 0.02;
            let yBump = canvasRenderHeight * 0.02;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);
            let plotHeight =
                canvasRenderHeight -
                (this.topMargin + yBump + this.bottomMargin);

            let c = document.getElementById("manhattanPlot");
            c.setAttribute("width", canvasRenderWidth);
            c.setAttribute("height", canvasRenderHeight);
            let ctx = c.getContext("2d");

            ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000000";
            ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

            // render y axis
            ctx.moveTo(this.leftMargin, this.topMargin);
            ctx.lineTo(this.leftMargin, plotHeight + this.topMargin + yBump);

            //render x axis
            ctx.moveTo(this.leftMargin, plotHeight + this.topMargin + yBump);
            ctx.lineTo(
                plotWidth + this.leftMargin,
                plotHeight + this.topMargin + yBump
            );

            // render y ticker

            let yAxisData = [];
            this.renderData.unsorted.map((d) => {
                yAxisData.push(d[this.renderConfig.yAxisField]);
            });

            let yMin = Math.min.apply(Math, yAxisData);
            let yMax = Math.max.apply(Math, yAxisData);
            let yStep = (yMax - yMin) / 4;

            let yAxisTicks = uiUtils.getAxisTicks(yMin, yMax);

            let yTickDistance = plotHeight / 4;
            for (let i = 0; i < 5; i++) {
                let tickYPos = this.topMargin + i * yTickDistance;
                let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(this.leftMargin - 5, adjTickYPos);
                ctx.lineTo(this.leftMargin, adjTickYPos);
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillStyle = "#000000";

                ctx.fillText(
                    Formatters.floatFormatter(yMin + i * yStep),
                    this.leftMargin - 10,
                    this.topMargin + plotHeight + 5 - i * yTickDistance
                );
            }

            ctx.stroke();

            //Render y axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.rotate(-(Math.PI * 2) / 4);
            ctx.fillText(
                this.renderConfig.yAxisLabel,
                -(this.topMargin + plotHeight / 2),
                this.leftMargin - this.leftMargin / 2 - 14
            );

            let dnaLength = 0;

            for (const chr in this.chromosomeLength) {
                dnaLength += this.chromosomeLength[chr];
            }

            let chrByPixel = plotWidth / dnaLength;

            let xStart = this.leftMargin;
            ctx.textAlign = "center";
            ctx.rotate((Math.PI * 2) / 4);

            for (const chr in this.chromosomeLength) {
                let chrLength = this.chromosomeLength[chr] * chrByPixel;
                xStart += chrLength;
                let chrPos = xStart - chrLength / 2;

                ctx.fillText(
                    chr,
                    chrPos,
                    this.topMargin + plotHeight + yBump + 14
                );
            }

            //Render x axis label
            ctx.fillText(
                this.renderConfig.xAxisLabel,
                this.canvasRenderWidth / 2 + this.leftMargin,
                this.topMargin + plotHeight + yBump + 44
            );

            ctx.fillText(
                this.renderConfig.xAxisLabel,
                canvasRenderWidth / 2 + this.leftMargin,
                this.topMargin + plotHeight + yBump + 44
            );

            //Render Dots
            xStart = 0;
            let exChr = "";
            let chrNum = 1;

            for (const chr in this.chromosomeLength) {
                if (chr != 1) {
                    xStart += this.chromosomeLength[exChr];
                }

                this.renderData.sorted[chr].map((g) => {
                    let xPos =
                        (xStart + g.locus) * chrByPixel + this.leftMargin;

                    let yPosByPixel = plotHeight / (yMax - yMin);

                    let yPos =
                        this.topMargin +
                        plotHeight -
                        (g[this.renderConfig.yAxisField] - yMin) * yPosByPixel;

                    let dotColor = this.chromosomeColors[
                        chrNum % this.chromosomeColors.length
                    ];

                    ctx.fillStyle = dotColor + "75";

                    ctx.lineWidth = 0;
                    ctx.beginPath();
                    ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
                    ctx.fill();

                    let xLoc = xPos.toString().split(".")[0];
                    let yLoc = yPos.toString().split(".")[0];

                    let hoverContent;

                    if (!!this.renderConfig.hoverContent) {
                        hoverContent = this.renderConfig.hoverContent;
                    }

                    if (!this.dotPosData[xLoc]) {
                        this.dotPosData[xLoc] = {};
                    }
                    this.dotPosData[xLoc][yLoc] = {};
                    this.dotPosData[xLoc][yLoc][this.renderConfig.renderBy] =
                        g[this.renderConfig.renderBy];
                    if (!!this.renderConfig.hoverContent) {
                        hoverContent.map((h) => {
                            this.dotPosData[xLoc][yLoc][h] = g[h];
                        });
                    }
                });
                exChr = chr;
                chrNum++;
            }
        },
    },
});

$(function () {});
</script>

<style>
#manhattanPlot:hover {
    background-color: #eee;
}
.gene-on-clicked-dot,
.content-on-clicked-dot {
    display: block !important;
}
</style>



