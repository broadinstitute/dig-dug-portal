<template>
    <div class="mbm-plot-content">
        <div id="clicked_dot_value" class="clicked-dot-value hidden">
            <div id="clicked_dot_value_content"></div>
        </div>
        <div id="dot_value_full_list" class="dot-value-full-list hidden">
            <div
                class="clicked-dot-value-close"
                @click="hidePanel('dot_value_full_list')"
            >
                <b-icon icon="x-circle-fill"></b-icon>
            </div>
            <div id="dot_value_full_list_content"></div>
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
            @resize="onResize"
            @click="getFullList"
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

export default Vue.component("research-region-plot", {
    props: ["genesInRegion", "plotData", "renderConfig", "filtersIndex"],
    data() {
        return {
            plotRendered: 0,
            leftMargin: 74.5, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            rightMargin: 0.5,
            topMargin: 10.5, // -0.5 to draw crisp line
            bottomMargin: 50.5,
            dotPosData: {},
            chr: null,
            start: null,
            end: null,
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    components: {},
    mounted: function () {
        //this.renderPlot();
        if (this.plotData != null) {
            let xMin = null,
                xMax = null;

            this.chr = this.plotData[0][this.renderConfig.geneTrack.chr];

            this.plotData.map((d) => {
                let xValue = Number(d[this.renderConfig.xAxisField]);

                if (xMin == null) {
                    xMin = xValue;
                }
                if (xMax == null) {
                    xMax = xValue;
                }

                if (xValue < xMin) {
                    xMin = xValue;
                }
                if (xValue > xMax) {
                    xMax = xValue;
                }
            });

            this.start = xMin;
            this.end = xMax;

            this.getGenesInRegion();
        }

        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        renderData() {
            return this.plotData;
        },
        genesInRegionData() {
            let contents = this.$store.state.hugeampkpncms.genesInRegion;

            if (contents == "") {
                return null;
            } else {
                return contents;
            }
        },
    },
    watch: {
        renderData(data) {
            //this.renderPlot();
            let xMin = null,
                xMax = null;

            this.chr = this.plotData[0][this.renderConfig.geneTrack.chr];

            this.plotData.map((d) => {
                let xValue = Number(d[this.renderConfig.xAxisField]);

                if (xMin == null) {
                    xMin = xValue;
                }
                if (xMax == null) {
                    xMax = xValue;
                }

                if (xValue < xMin) {
                    xMin = xValue;
                }
                if (xValue > xMax) {
                    xMax = xValue;
                }
            });

            this.start = xMin;
            this.end = xMax;

            this.getGenesInRegion();
        },

        genesInRegionData(data) {
            if (!!data && data != null) {
                //console.log("step 1", JSON.parse(data));
                this.renderPlot();
            }
        },
    },
    methods: {
        ...uiUtils,

        hidePanel(element) {
            uiUtils.hideElement(element);
        },
        onResize(e) {
            this.renderPlot();
        },
        getGenesInRegion() {
            //console.log("called");
            let dataPoint =
                "https://bioindex.hugeamp.org/api/bio/query/genes?q=" +
                this.chr +
                ":" +
                this.start +
                "-" +
                this.end;

            let fetchParam = { dataPoint: dataPoint, domain: "external" };

            this.$store.dispatch("hugeampkpncms/getGenesInRegion", fetchParam);
        },
        getFullList(event) {
            let wrapper = document.getElementById("dot_value_full_list");
            let canvas = document.getElementById("manhattanPlot");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);

            let clickedDotValue = "";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
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
            let contentWrapper = document.getElementById(
                "dot_value_full_list_content"
            );

            if (clickedDotValue != "") {
                contentWrapper.innerHTML = clickedDotValue;
                document.getElementById("manhattanPlot").classList.add("hover");
                document
                    .getElementById("clicked_dot_value")
                    .classList.add("hidden");
            } else {
                wrapper.classList.add("hidden");
                document
                    .getElementById("manhattanPlot")
                    .classList.remove("hover");
            }
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

            let numOfValues = 0;

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
                            if (numOfValues < 6) {
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

                            numOfValues += 1;
                        }
                    }
                }
            }

            if (numOfValues > 5) {
                clickedDotValue +=
                    '<span class="gene-on-clicked-dot-mplot" style="color: #36c;"><b>Viewing 5 of ' +
                    numOfValues +
                    " items. Click to view full list.<b><span>";
            }

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

            //console.log("genes", this.genesInRegionData);
            let genesInRegion = JSON.parse(this.genesInRegionData)[
                "data"
            ].filter((g) => g.source == "symbol");

            let canvasRenderWidth = !!this.renderConfig.width
                ? this.renderConfig.width + this.leftMargin + this.rightMargin
                : window.innerWidth - 115;

            let canvasRenderHeight = !!this.renderConfig.height
                ? this.renderConfig.height + this.topMargin + this.bottomMargin
                : 400;

            //console.log("no geneTrack", canvasRenderHeight);
            canvasRenderHeight += !!this.renderConfig.geneTrack
                ? 35 * genesInRegion.length
                : 0;

            //console.log("with geneTrack", canvasRenderHeight);

            let xBump = canvasRenderWidth * 0.03;
            let yBump = canvasRenderHeight * 0.02;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);
            let plotHeight =
                canvasRenderHeight -
                (this.topMargin + yBump + this.bottomMargin);

            plotHeight -= !!this.renderConfig.geneTrack ? 50 : 0;

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
            ctx.stroke();

            //render x axis
            ctx.moveTo(this.leftMargin, plotHeight + this.topMargin + yBump);
            ctx.lineTo(
                plotWidth + this.leftMargin,
                plotHeight + this.topMargin + yBump
            );
            ctx.stroke();

            // render x & y ticker values

            let yMin = null,
                yMax = null,
                xMin = null,
                xMax = null;

            let chr = this.plotData[0][this.renderConfig.geneTrack.chr];

            this.plotData.map((d) => {
                let yValue = d[this.renderConfig.yAxisField];
                let xValue = Number(d[this.renderConfig.xAxisField]);

                if (yMin == null) {
                    yMin = yValue;
                }
                if (yMax == null) {
                    yMax = yValue;
                }

                if (yValue < yMin) {
                    yMin = yValue;
                }
                if (yValue > yMax) {
                    yMax = yValue;
                }

                if (xMin == null) {
                    xMin = xValue;
                }
                if (xMax == null) {
                    xMax = xValue;
                }

                if (xValue < xMin) {
                    xMin = xValue;
                }
                if (xValue > xMax) {
                    xMax = xValue;
                }
            });

            let yStep = (yMax - yMin) / 4;
            let xStep = Math.ceil((xMax - xMin) / 4);

            // Y ticks
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

            // X ticks
            let xTickDistance = (plotWidth - 5) / 4;

            for (let i = 0; i < 5; i++) {
                let tickXPos = this.leftMargin + i * xTickDistance + 5;
                let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(adjTickXPos, this.topMargin + plotHeight + yBump);
                ctx.lineTo(
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 5
                );
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#000000";

                ctx.fillText(
                    xMin + i * xStep,
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 15
                );
            }

            let xStart = this.leftMargin + 5;
            let yStart = this.topMargin;
            let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

            let yPosByPixel = plotHeight / (yMax - yMin);

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

            //Render x axis label
            ctx.rotate((-(Math.PI * 2) / 4) * 3);
            /*ctx.fillText(
                this.renderConfig.xAxisLabel,
                plotWidth / 2 + this.leftMargin,
                canvasRenderHeight - 5
            );
            */

            this.plotData.map((g) => {
                let xPos =
                    xStart +
                    xPosByPixel * (g[this.renderConfig.xAxisField] - xMin);

                let yPos =
                    yStart +
                    plotHeight -
                    yPosByPixel * (g[this.renderConfig.yAxisField] - yMin);

                let dotColor = "#00000020";

                ctx.fillStyle = dotColor;

                ctx.lineWidth = 0;
                ctx.beginPath();
                ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
                ctx.fill();

                let xLoc = xPos.toString().split(".")[0];
                let yLoc = yPos.toString().split(".")[0];

                //console.log(g[this.renderConfig.renderBy]);

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

            let geneCtx = c.getContext("2d");
            geneCtx.beginPath();

            let gIndex = 0,
                aboveGenesTrack =
                    this.topMargin + plotHeight + yBump + 15 + 5 + 12;

            genesInRegion.map((gene) => {
                let gStart = gene.start <= xMin ? xMin : gene.start;
                let gEnd = gene.end >= xMax ? xMax : gene.end;

                let txtXPos =
                    xStart +
                    xPosByPixel *
                        (gStart + Math.ceil((gEnd - gStart) / 2) - xMin);

                let txtYPos = aboveGenesTrack + 15 * gIndex;

                let startPos = xStart + xPosByPixel * (gStart - xMin);
                let endPos = xStart + xPosByPixel * (gEnd - xMin);

                geneCtx.font = "italic 11px Arial";
                geneCtx.textAlign = "center";
                geneCtx.fillStyle = "#0000FF";
                geneCtx.fillText(gene.name, txtXPos, txtYPos);

                //ctx.beginPath();
                geneCtx.lineWidth = 1;
                geneCtx.strokeStyle = "#0000FF";
                geneCtx.moveTo(startPos, txtYPos + 5);
                geneCtx.lineTo(endPos, txtYPos + 5);
                geneCtx.stroke();

                gIndex++;
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
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}

.clicked-dot-value-close:hover {
    color: #36c;
}

.dot-value-full-list {
    position: fixed;
    width: 400px;
    height: 300px;
    left: calc(50% - 200px);
    top: calc(50% - 150px);
    padding: 20px 0px 3px 15px;
    border-radius: 5px;
    border: solid 1px #ddd;
    background-color: #fff;
    z-index: 100;
}

#dot_value_full_list_content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 14px;
}
</style>



