<template>
    <div class="heatmap-content">
        <div id="clicked_cell_value" class="hidden"></div>
        <div
            v-if="!!renderConfig.legend"
            class="heatmap-legend"
            v-html="renderConfig.legend"
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
                    @resize="onResize"
                    width=""
                    height=""
                >
                </canvas>
            </div>
            <div class="heatmap-rows-wrapper" id="heatmapRowsWrapper"></div>
        </div>
        <div
            v-if="!!renderConfig.label"
            class="heatmap-label"
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

export default Vue.component("heatmap", {
    props: ["heatmapData", "renderConfig"],
    data() {
        return {
            posColorScale: {
                r: { max: 255, min: 255 },
                g: { max: 0, min: 255 },
                b: { max: 0, min: 255 },
            },
            negColorScale: {
                r: { max: 0, min: 255 },
                g: { max: 0, min: 255 },
                b: { max: 255, min: 255 },
            },
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {
        this.renderHeatmap();
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
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

            massagedData["rows"] = rowList.sort();
            massagedData["columns"] = columnList.sort();

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
                massagedData[d[row]][d[column]]["sub"] =
                    d[this.renderConfig.renderBy.sub];
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
            console.log(this.renderData);
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

        onResize(e) {
            //this.renderHeatmap();
        },
        checkPosition(event) {},
        renderHeatmap() {
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
                document
                    .getElementById("heatmapColumnsWrapper")
                    .appendChild(div);
            });

            this.renderData.rows.map((r) => {
                var div = document.createElement("div");
                var t = document.createTextNode(r);
                div.appendChild(t);
                document.getElementById("heatmapRowsWrapper").appendChild(div);
            });

            let columnTopSpace =
                document.getElementById("heatmapColumnsWrapper").offsetWidth +
                20;

            document.getElementById("heatmapColumnsWrapper").style.top =
                -columnTopSpace + "px";
            document.getElementById("heatmapWrapper").style.paddingTop =
                columnTopSpace + "px";

            let c = document.getElementById("heatmap");
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            let ctx = c.getContext("2d");

            let rIndex = 0;
            let rectSize = this.renderConfig.fontSize * 1.5;

            this.renderData.rows.map((r) => {
                let cIndex = 0;
                this.renderData.columns.map((c) => {
                    let renderValue = this.renderData[r][c].main;
                    let left = this.renderConfig.fontSize * 1.5 * cIndex;
                    let top = this.renderConfig.fontSize * 1.5 * rIndex;

                    let rColor =
                        renderValue >= 0
                            ? 255
                            : 255 -
                              255 *
                                  (renderValue /
                                      this.renderConfig.renderByRange.mainLo);
                    let gColor =
                        255 -
                        255 *
                            (renderValue /
                                this.renderConfig.renderByRange.mainHi);
                    let bColor =
                        renderValue < 0
                            ? 255
                            : 255 -
                              255 *
                                  (renderValue /
                                      this.renderConfig.renderByRange.mainHi);

                    if (rColor > 255) rColor = 255;
                    if (gColor > 255) gColor = 255;
                    if (bColor > 255) bColor = 255;

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
}
#heatmapRowsWrapper {
    padding-left: 10px;
    display: inline-block;
    vertical-align: top;
}
#heatmapCanvasWrapper {
    display: inline-block;
    vertical-align: top;
}

#heatmapCanvasWrapper canvas {
    border: solid 1px #aaa;
}
</style>



