<!--
heatmap configuration
        {
            "label": "", // label that goes above the heatmap
            "legend": "", // legend that goes above the heatmap.Also color scale legend will be added automatically
            "renderBy": {"main":"obs_cppa","sub":"p"}, //main => box color, sub => circle size
            "mainRenderRange":{"type":"scale","direction": "positive","low":0, "middle": 0,"high":0.30},
            // type: scale or steps, direction: positive or negative,
            "subRenderRange":{"type":"scale","direction": "negative","steps":[0,0.001,0.05],"low":0, "high":0.05},
            "rowField": "full_annotation",
            "rowLabel": "full_annotation",
            "columnField": "cluster_name",
            "columnLabel": "cluster_name",
            "hoverContent": [],
            "fontSize": 12
        },
-->
<template>
    <div class="heatmap-content">
        <div id="clicked_cell_value" class="clicked-cell-value hidden">
            <b-icon-x-circle-fill
                class="clicked-cell-value-close"
                @click="hidePanel"
            ></b-icon-x-circle-fill>
            <div id="clicked_cell_value_content"></div>
        </div>
        <div
            v-if="!!renderConfig.label"
            class="heatmap-label"
            v-html="renderConfig.label"
        ></div>
        <div
            v-if="!!renderConfig.legend"
            class="heatmap-legend"
            v-html="renderConfig.legend"
        ></div>
        <div
            v-if="!!renderConfig.legend"
            class="heatmap-scale-legend"
            id="heatmap_scale_legend"
        ></div>
        <div class="heatmap-wrapper" id="heatmapWrapper">
            <div
                class="heatmap-columns-wrapper"
                id="heatmapColumnsWrapper"
            ></div>

            <div class="heatmap-canvas-wrapper" id="heatmapCanvasWrapper">
                <canvas
                    v-if="!!renderConfig"
                    id="heatmap"
                    @click="checkPosition"
                    width=""
                    height=""
                >
                </canvas>
            </div>
            <div class="heatmap-rows-wrapper" id="heatmapRowsWrapper"></div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("heatmap", {
    props: ["heatmapData", "renderConfig"],
    data() {
        return {
            squareData: {},
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {
        this.renderHeatmap();
        this.renderScaleLegend();
    },
    beforeDestroy() {},
    computed: {
        renderData() {
            let massagedData = {};

            let rowList = this.heatmapData
                .map((v) => v[this.renderConfig.rowField])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank

            let columnList = this.heatmapData
                .map((v) => v[this.renderConfig.columnField])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank

            massagedData["rows"] = rowList.sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: "base" })
            );
            massagedData["columns"] = columnList.sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: "base" })
            );

            rowList.map((r) => {
                massagedData[r] = {};
                columnList.map((c) => {
                    massagedData[r][c] = {};
                });
            });

            this.heatmapData.map((d) => {
                //console.log("d", d);
                let row = this.renderConfig.rowField;
                let column = this.renderConfig.columnField;

                massagedData[d[row]][d[column]]["main"] =
                    d[this.renderConfig.renderBy.main];

                if (!!this.renderConfig.renderBy.sub) {
                    massagedData[d[row]][d[column]]["sub"] =
                        d[this.renderConfig.renderBy.sub];
                }
            });

            return massagedData;
        },
        canvasWidth() {
            return (
                this.renderConfig.fontSize *
                1.5 *
                this.renderData.columns.length
            );
        },
        canvasHeight() {
            return (
                this.renderConfig.fontSize * 1.5 * this.renderData.rows.length
            );
        },
    },
    watch: {
        renderData() {
            this.renderHeatmap();
        },
    },
    methods: {
        ...uiUtils,
        hidePanel() {
            uiUtils.hideElement("clicked-cell-value");
        },
        renderScaleLegend() {
            let scaleLegendWrapper = document.getElementById(
                "heatmap_scale_legend"
            );
            let scaleLegendContent =
                "<div class='scale-legend-main-field'><div class='field-label'>" +
                this.renderConfig.mainRenderRange.label +
                ":</div> ";

            if (
                this.renderConfig.mainRenderRange.low !=
                this.renderConfig.mainRenderRange.middle
            ) {
            }

            if (
                this.renderConfig.mainRenderRange.high !=
                this.renderConfig.mainRenderRange.middle
            ) {
                let colorStep =
                    (this.renderConfig.mainRenderRange.high -
                        this.renderConfig.mainRenderRange.middle) /
                    5;

                let scaleMiddle =
                    this.renderConfig.mainRenderRange.middle == 0
                        ? "0.00"
                        : Formatters.floatFormatter(
                              this.renderConfig.mainRenderRange.middle
                          );
                scaleLegendContent +=
                    "<div class='scale-legend-main-colors'><div class='scale-color' style='background-color: rgb(255,255,255)'>" +
                    scaleMiddle +
                    "</div>";
                for (let i = 1; i < 6; i++) {
                    let rAndG = 1 - i * 0.2;
                    rAndG *= 255;
                    rAndG = rAndG == 0 ? 0 : Formatters.intFormatter(rAndG);

                    console.log("rAndG", rAndG);
                    scaleLegendContent +=
                        "<div class='scale-color' style='background-color: rgb(255," +
                        rAndG +
                        "," +
                        rAndG +
                        ")'>" +
                        Formatters.floatFormatter(colorStep * i) +
                        "</div>";
                }
                scaleLegendContent += "</div></div>";
            }

            if (!!this.renderConfig.renderBy.sub) {
                scaleLegendContent +=
                    "<div class='scale-legend-sub-field'><div class='field-label'>" +
                    this.renderConfig.subRenderRange.label +
                    "</div>: </div>";
            }

            scaleLegendWrapper.innerHTML = scaleLegendContent;
        },
        checkPosition(event) {
            let aboveColumnPadding =
                document.getElementById("heatmapColumnsWrapper").offsetWidth +
                20;
            let wrapperRect = document
                .getElementById("heatmapWrapper")
                .getBoundingClientRect();
            let wrapperXPos = wrapperRect.left;
            let wrapperYPos = wrapperRect.top - aboveColumnPadding;

            let e = event;
            let rect = e.target.getBoundingClientRect();

            let xPos = Math.floor(e.clientX - rect.left);
            let yPos = Math.floor(e.clientY - rect.top);
            let x = Math.floor(
                (e.clientX - rect.left) / (this.renderConfig.fontSize * 1.5)
            );
            let y = Math.floor(
                (e.clientY - rect.top) / (this.renderConfig.fontSize * 1.5)
            );

            //console.log(this.squareData[y][x]);
            let clickedCellValue = "";
            clickedCellValue +=
                '<span class="field-on-clicked-cell">' +
                this.renderData.rows[y] +
                "</sub>";
            clickedCellValue +=
                '<span class="field-on-clicked-cell">' +
                this.renderData.columns[x] +
                "</sub>";
            clickedCellValue +=
                '<span class="content-on-clicked-cell"><b>' +
                this.squareData[y][x].main.field +
                ": </b>" +
                this.squareData[y][x].main.value +
                "</span>";
            if (!!this.squareData[y][x].sub) {
                clickedCellValue +=
                    '<span class="content-on-clicked-cell"><b>' +
                    this.squareData[y][x].sub.field +
                    ": </b>" +
                    this.squareData[y][x].sub.value +
                    "</span>";
            }

            let wrapper = document.getElementById("clicked_cell_value");
            let contentWrapper = document.getElementById(
                "clicked_cell_value_content"
            );
            let canvas = document.getElementById("heatmap");
            if (clickedCellValue != "") {
                contentWrapper.innerHTML = clickedCellValue;
                wrapper.classList.remove("hidden");
                wrapper.style.top = yPos + canvas.offsetTop + "px";
                wrapper.style.left = wrapperXPos - 15 + xPos + "px"; //minus 15 for the padding of the plot wrapper
            } else {
                wrapper.classList.add("hidden");
            }
        },
        renderHeatmap() {
            this.squareData = {};
            document.getElementById("heatmapColumnsWrapper").innerHTML = "";
            document.getElementById("heatmapRowsWrapper").innerHTML = "";

            let canvasWidth =
                this.renderConfig.fontSize *
                1.5 *
                this.renderData.columns.length;

            let canvasHeight =
                this.renderConfig.fontSize * 1.5 * this.renderData.rows.length;

            document.getElementById("heatmapColumnsWrapper").style.fontSize =
                this.renderConfig.fontSize + "px";
            document.getElementById("heatmapColumnsWrapper").style.marginLeft =
                this.renderConfig.fontSize *
                    1.5 *
                    this.renderData.columns.length +
                "px";
            document.getElementById("heatmapRowsWrapper").style.fontSize =
                this.renderConfig.fontSize + "px";
            this.renderData.columns.map((c) => {
                var div = document.createElement("div");
                var t = document.createTextNode(c);
                div.appendChild(t);
                div.setAttribute(
                    "style",
                    "height: " + this.renderConfig.fontSize * 1.5 + "px;"
                );
                document
                    .getElementById("heatmapColumnsWrapper")
                    .appendChild(div);
            });

            this.renderData.rows.map((r) => {
                var div = document.createElement("div");
                var t = document.createTextNode(r);
                div.appendChild(t);
                div.setAttribute(
                    "style",
                    "height: " + this.renderConfig.fontSize * 1.5 + "px;"
                );
                document.getElementById("heatmapRowsWrapper").appendChild(div);
            });

            let columnTopSpace =
                document.getElementById("heatmapColumnsWrapper").offsetHeight -
                document.getElementById("heatmapColumnsWrapper").offsetWidth -
                10;
            let aboveColumnPadding =
                document.getElementById("heatmapColumnsWrapper").offsetWidth +
                20;

            document.getElementById("heatmapColumnsWrapper").style.top =
                -columnTopSpace + "px";
            document.getElementById("heatmapWrapper").style.paddingTop =
                aboveColumnPadding + "px";

            let c = document.getElementById("heatmap");
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            let ctx = c.getContext("2d");

            let rIndex = 0;
            let rectSize = this.renderConfig.fontSize * 1.5;

            this.renderData.rows.map((r) => {
                this.squareData[rIndex] = {};
                let cIndex = 0;
                this.renderData.columns.map((c) => {
                    let mainValue = this.renderData[r][c].main;
                    let left = this.renderConfig.fontSize * 1.5 * cIndex;
                    let top = this.renderConfig.fontSize * 1.5 * rIndex;

                    this.squareData[rIndex][cIndex] = {};
                    this.squareData[rIndex][cIndex]["main"] = {
                        field: this.renderConfig.renderBy.main,
                        value: this.renderData[r][c].main,
                    };
                    if (!!this.renderConfig.renderBy.sub) {
                        this.squareData[rIndex][cIndex]["sub"] = {
                            field: this.renderConfig.renderBy.sub,
                            value: this.renderData[r][c].sub,
                        };
                    }
                    //mainValue *= -1;
                    let rColor, gColor, bColor;
                    let direction = this.renderConfig.mainRenderRange.direction;
                    let valHi = this.renderConfig.mainRenderRange.high;
                    let valMid = this.renderConfig.mainRenderRange.middle;
                    let valLo = this.renderConfig.mainRenderRange.low;

                    rColor =
                        mainValue >= valMid
                            ? 255
                            : 255 -
                              255 * ((valMid - mainValue) / valMid - valLo);
                    gColor =
                        mainValue >= this.renderConfig.mainRenderRange.middle
                            ? 255 -
                              255 * ((mainValue - valMid) / (valHi - valMid))
                            : 255 -
                              255 * ((valMid - mainValue) / valMid - valLo);
                    bColor =
                        mainValue < this.renderConfig.mainRenderRange.middle
                            ? 255
                            : 255 -
                              255 * ((mainValue - valMid) / (valHi - valMid));

                    rColor = rColor > 255 ? 255 : rColor < 0 ? 0 : rColor;
                    gColor = gColor > 255 ? 255 : gColor < 0 ? 0 : gColor;
                    bColor = bColor > 255 ? 255 : bColor < 0 ? 0 : bColor;

                    let colorString =
                        "rgba(" +
                        Math.floor(rColor) +
                        "," +
                        Math.floor(gColor) +
                        "," +
                        Math.floor(bColor) +
                        ",1)";

                    ctx.beginPath();
                    ctx.rect(left, top, rectSize, rectSize);
                    ctx.fillStyle = colorString;
                    ctx.fill();

                    if (!!this.renderConfig.renderBy.sub) {
                        let subValue = this.renderData[r][c].sub;
                        let steps = this.renderConfig.subRenderRange.steps;

                        let stepVal = 0;
                        let dotR;

                        let centerPos = (this.renderConfig.fontSize * 1.5) / 2;
                        if (this.renderConfig.subRenderRange.type == "steps") {
                            dotR =
                                (this.renderConfig.fontSize * 1.5 -
                                    (this.renderConfig.fontSize * 1.5) / 4) /
                                steps.length /
                                2;

                            for (let i = 0; i < steps.length; i++) {
                                stepVal +=
                                    steps[0] <= subValue &&
                                    subValue < steps[i + 1]
                                        ? 1
                                        : 0;
                            }
                        } else if (
                            this.renderConfig.subRenderRange.type == "scale"
                        ) {
                            dotR =
                                (this.renderConfig.fontSize * 1.5 -
                                    (this.renderConfig.fontSize * 1.5) / 4) /
                                2;

                            stepVal =
                                subValue >=
                                this.renderConfig.subRenderRange.high
                                    ? 1
                                    : subValue -
                                      this.renderConfig.subRenderRange.high /
                                          this.renderConfig.subRenderRange
                                              .high -
                                      this.renderConfig.subRenderRange.high;

                            if (stepVal < 0) stepVal = 0;

                            if (
                                this.renderConfig.subRenderRange.direction ==
                                "negative"
                            ) {
                                stepVal = 1 - stepVal;
                            }
                        }
                        ctx.fillStyle = "#00000075";
                        ctx.lineWidth = 0;
                        ctx.beginPath();
                        ctx.arc(
                            left + centerPos,
                            top + centerPos,
                            dotR * stepVal,
                            0,
                            2 * Math.PI
                        );
                        ctx.fill();
                    }

                    cIndex++;
                });
                rIndex++;
            });
        },
    },
});

$(function () {});
</script>

<style>
.heatmap-content {
    text-align: center;
}

.heatmap-wrapper {
    text-align: left;
    display: inline-block;
    position: relative;
    white-space: nowrap;
    background-color: #fff;
}

#heatmapColumnsWrapper {
    transform-origin: left bottom;
    transform: rotate(-90deg);
    position: absolute;
    left: 0;
}
#heatmapColumnsWrapper div {
    transform-origin: left center;
    transform: rotate(45deg);
    white-space: nowrap;
}
#heatmapRowsWrapper {
    padding-left: 10px;
    display: inline-block;
    vertical-align: top;
    white-space: nowrap;
}
#heatmapCanvasWrapper {
    display: inline-block;
    vertical-align: top;
}

#heatmapCanvasWrapper canvas {
    border: solid 1px #aaa;
}

#clicked_cell_value {
    text-align: left;
    padding: 8px 20px 8px 10px !important;
}
.field-on-clicked-cell,
.content-on-clicked-cell {
    display: block !important;
}

.clicked-cell-value-close {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 12px;
    color: #69f;
}

.clicked-cell-value-close:hover {
    color: #36c;
}

.heatmap-label {
    font-size: 16px;
    font-weight: bold;
    text-align: left;
}

.heatmap-legend {
    font-size: 14px;
    text-align: left;
}

.heatmap-scale-legend {
    font-size: 14px;
    text-align: left;
}

.heatmap-scale-legend div {
    display: inline-block;
}
.heatmap-scale-legend div.scale-color {
    padding: 0 3px;
    font-size: 12px;
    border-left: solid 1px #fff;
}

.scale-legend-main-field .field-label,
.scale-legend-sub-field .field-label {
    font-weight: bold;
}

.scale-legend-main-colors {
    margin-right: 10px;
}
</style>



