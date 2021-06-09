<template>
    <div class="mbm-plot-content">
        <div id="clicked_dot_value" class="clicked-dot-value hidden">
            <div id="clicked_dot_value_content"></div>
        </div>
        <div
            v-if="!!renderConfig.legend"
            class="mbm-plot-legend"
            v-html="renderConfig.legend"
        ></div>
        <canvas
            v-if="!!renderConfig"
            id="manhattanPlot"
            @mouseleave="hidePanel"
            @mousemove="checkPosition"
            @click="filterTable"
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
        uniqueChrs() {
            let chrs = Object.keys(this.chromosomeLength);
            let uniqueArr = [];

            chrs.map((c) => {
                if (this.renderData.sorted[c].length > 0) {
                    uniqueArr.push(c);
                }
            });

            uniqueArr.sort(function (a, b) {
                return a - b;
            });

            return uniqueArr;
        },
    },
    watch: {
        renderData() {
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,
        hidePanel() {
            //uiUtils.hideElement("clicked-dot-value");
        },
        onResize(e) {
            this.renderPlot();
        },
        filterTable() {
            let wrapper = document.getElementById("clicked_dot_value");

            if (wrapper.innerText != "") {
                let items = [];
                let genesLength = document.getElementsByClassName(
                    "gene-on-clicked-dot-mplot"
                );

                genesLength.forEach((gene) => items.push(gene.innerText));

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
        correctDecimal(decimalNum) {
            let dNum = decimalNum;

            for (let i = 0; i < 3; i++) {
                if (dNum.slice(-1) == 0) {
                    dNum = dNum.slice(0, -1);
                }
            }

            return dNum;
        },
        checkPosition(event) {
            let wrapper = document.getElementById("clicked_dot_value");
            let canvas = document.getElementById("manhattanPlot");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);
            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            let clickedDotValue = "";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
                            //console.log(this.dotPosData[x + h]);
                            let dotObject = this.dotPosData[x + h][y + v];
                            clickedDotValue +=
                                '<span class="gene-on-clicked-dot-mplot"><b>' +
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

            //let wrapper = document.getElementById("clicked_dot_value");
            let contentWrapper = document.getElementById(
                "clicked_dot_value_content"
            );

            if (clickedDotValue != "") {
                contentWrapper.innerHTML = clickedDotValue;

                document.getElementById("manhattanPlot").classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document
                    .getElementById("manhattanPlot")
                    .classList.remove("hover");
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

                let tickerNum =
                    (yMin + i * yStep) % 1 == 0
                        ? Formatters.floatFormatter(yMin + i * yStep)
                        : this.correctDecimal(
                              Formatters.floatFormatter(yMin + i * yStep)
                          );

                ctx.fillText(
                    tickerNum,
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

            this.uniqueChrs.map((chr) => {
                dnaLength += this.chromosomeLength[chr];
            });

            let chrByPixel = plotWidth / dnaLength;

            let xStart = this.leftMargin;
            ctx.textAlign = "center";
            ctx.rotate((Math.PI * 2) / 4);

            //for (const chr in this.chromosomeLength) {
            this.uniqueChrs.map((chr) => {
                let chrLength = this.chromosomeLength[chr] * chrByPixel;
                xStart += chrLength;
                let chrPos = xStart - chrLength / 2;

                ctx.fillText(
                    chr,
                    chrPos,
                    this.topMargin + plotHeight + yBump + 14
                );
            });

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
            let chrNum = this.uniqueChrs.length != 1 ? 1 : this.uniqueChrs[0];

            //for (const chr in this.chromosomeLength) {
            this.uniqueChrs.map((chr) => {
                if (this.uniqueChrs.length != 1) {
                    if (chr != 1) {
                        xStart += this.chromosomeLength[exChr];
                    }
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
            });
        },
    },
});

$(function () {});
</script>

<style>
#manhattanPlot.hover {
    cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

#clicked_dot_value {
    padding: 8px 20px 8px 10px !important;
}

.clicked-dot-value-close {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 14px;
    color: #69f;
}

.clicked-dot-value-close:hover {
    color: #36c;
}
</style>



