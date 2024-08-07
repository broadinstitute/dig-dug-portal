<template>
    <div class="heatmap-wrapper">
        <div id="clicked_cell_value" class="clicked-cell-value hidden">
            <div id="clicked_cell_value_content"></div>
        </div>
        <div class="heatmap-content" id="heatmapContent"
            :hidden="this.hideHeatmap">
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
            <div class="heatmap-canvas-wrapper" id="heatmapPlotWrapper">
                <div
                    class="heatmap-columns-wrapper"
                    id="heatmapColumnsWrapper"
                ></div>
                <div class="heatmap-rows-wrapper" id="heatmapRowsWrapper"></div>
                <div class="heatmap-canvas-wrapper" id="heatmapCanvasWrapper">
                    <canvas
                        v-if="!!renderConfig"
                        id="heatmap"
                        @mouseleave="hidePanel"
                        @mousemove="checkPosition"
                        width=""
                        height=""
                    >
                    </canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("heatmap", {
    props: ["heatmapData", "renderConfig"],
    data() {
        return {
            squareData: {},
            canvasHover: false,
            hideHeatmap: false,
            phenotypeMap: this.$store.state.bioPortal.phenotypeMap,
            colors: {},
            separator: "___",
            lo: null,
            mid: null,
            hi: null
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    mounted: function () {
        this.colors = this.groupColors();
        this.renderHeatmap();
        this.renderScaleLegend();
    },
    beforeDestroy() {},
    computed: {
        renderData() {
            if (this.heatmapData.length === 0){
                return {
                    columns: [],
                    rows: [],
                    empty: true
                }
            }
            this.hideHeatmap = false;
            if (!!this.renderConfig.colorByPhenotype){
                // Automatically rather than manually get the extremes.
                this.getExtremes();
            }
            let massagedData = {};

            let startingData = this.heatmapData;

            let rowList = startingData
                .map((v) => v[this.renderConfig.rowField])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank

            let columnList = startingData
                .map((v) => v[this.renderConfig.columnField])
                .filter((v, i, arr) => arr.indexOf(v) == i) //unique
                .filter((v, i, arr) => v != ""); //remove blank

            massagedData["rows"] = rowList.sort((a, b) =>
                !this.renderConfig.sortRowsDescending ? 1 : -1 *
                a.localeCompare(b, undefined, { sensitivity: "base" })
            );
            let processedColumns = columnList.sort((a, b) => {
                let prefixA = this.applyPrefix(a);
                let prefixB = this.applyPrefix(b)
                return prefixA.localeCompare(prefixB, undefined, { sensitivity: "base" });
            });
            massagedData["columns"] = processedColumns;

            rowList.map((r) => {
                massagedData[r] = {};
                columnList.map((c) => {
                    massagedData[r][c] = {};
                });
            });

            startingData.map((d) => {
                let row = this.renderConfig.rowField;
                let column = this.renderConfig.columnField;

                massagedData[d[row]][d[column]]["main"] =
                    d[this.renderConfig.main.field];

                if (!!this.renderConfig.sub) {
                    massagedData[d[row]][d[column]]["sub"] =
                        d[this.renderConfig.sub.field];
                }
                
            });
            return massagedData;
        },
        boxSize() {
            return this.renderConfig.fontSize * 1.5;
        },
    },
    watch: {
        renderData(newData) {
            if (!newData.empty){
                this.hideHeatmap = false;
                this.renderHeatmap();
            } else {
                this.hideHeatmap = true;
            }
        },
    },
    methods: {
        ...uiUtils,
        hidePanel() {
            uiUtils.hideElement("clicked_cell_value");
            this.renderHeatmap();
        },
        renderScaleLegend() {
            let scaleLegendWrapper = document.getElementById(
                "heatmap_scale_legend"
            );
            let scaleLegendContent =
                "<div class='scale-legend-main-field'><div class='field-label'>" +
                this.renderConfig.main.label +
                ":</div> ";

            let lowValue = this.renderConfig.main.low;
            let middleValue = this.renderConfig.main.middle;
            let highValue = this.renderConfig.main.high;

            if (lowValue != middleValue) {
            }

            if (highValue != middleValue) {
                let colorStep = (highValue - middleValue) / 5;

                let scaleMiddle =
                    middleValue == 0
                        ? "0.00"
                        : Formatters.floatFormatter(middleValue);
                scaleLegendContent +=
                    "<div class='scale-legend-main-colors'><div class='scale-color' style='background-color: rgb(255,255,255)'>" +
                    scaleMiddle +
                    "</div>";
                for (let i = 1; i < 6; i++) {
                    let rAndG = 1 - i * 0.2;
                    rAndG *= 255;
                    rAndG = rAndG == 0 ? 0 : Formatters.intFormatter(rAndG);

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

            if (!!this.renderConfig.sub) {
                scaleLegendContent +=
                    "<div class='scale-legend-sub-field'><div class='field-label'>" +
                    this.renderConfig.sub.label +
                    "</div>:";
                let steps = this.renderConfig.sub.valueRange;
                let stepDirection = this.renderConfig.sub.direction;
                let dotMaxR = this.boxSize * 0.75;
                let spanScale;

                steps.map((s, sindex) => {
                    if (stepDirection == "positive") {
                        spanScale = dotMaxR * ((sindex + 1) / steps.length);
                        scaleLegendContent +=
                            "<div class='sub-legend-steps'> >= ";
                    } else {
                        spanScale =
                            dotMaxR * ((steps.length - sindex) / steps.length);
                        scaleLegendContent +=
                            "<div class='sub-legend-steps'> <= ";
                    }

                    scaleLegendContent +=
                        s +
                        ": <span style = 'display: inline-block; background-color: #00000075; width:" +
                        spanScale +
                        "px; height:" +
                        spanScale +
                        "px; border-radius:" +
                        spanScale / 2 +
                        "px;'></span></div>";
                });

                scaleLegendContent += "</div>";
            }

            scaleLegendWrapper.innerHTML = scaleLegendContent;
        },
        checkPosition(event) {
            let e = event;
            let rect = e.target.getBoundingClientRect();

            let xPos = Math.floor(e.clientX - rect.left);
            let yPos = Math.floor(e.clientY - rect.top);
            let x = Math.floor((e.clientX - rect.left) / this.boxSize);
            let y = Math.floor((e.clientY - rect.top) / this.boxSize);

            let clickedCellValue = "";
            if (
                x >= 0 &&
                y >= 0 &&
                !!this.squareData[y] &&
                !!this.squareData[y][x]
            ) {
                clickedCellValue +=
                    '<span class="field-on-clicked-cell">' +
                    this.removeRowPrefix(this.renderData.rows[y]) +
                    "</sub>";
                clickedCellValue +=
                    '<span class="field-on-clicked-cell">';
                let columnLabel = !this.renderConfig.sortPhenotypeColumns
                    ? this.renderData.columns[x]
                    : this.getPhenotypeDescription(this.renderData.columns[x]);
                clickedCellValue += columnLabel + "</sub>";
                clickedCellValue +=
                    '<span class="content-on-clicked-cell"><b>' +
                    this.renderConfig.main.label +
                    ": </b>" +
                    this.squareData[y][x].main.value +
                    "</span>";
                if (!!this.squareData[y][x].sub) {
                    clickedCellValue +=
                        '<span class="content-on-clicked-cell"><b>' +
                        this.renderConfig.sub.label +
                        ": </b>" +
                        this.squareData[y][x].sub.value +
                        "</span>";
                }
                if (!!this.squareData[y][x].group) {
                    clickedCellValue +=
                        '<span class="content-on-clicked-cell"><b>' +
                        this.squareData[y][x].group.field +
                        ": </b>" +
                        this.squareData[y][x].group.value +
                        "</span>";
                }
            }

            let wrapper = document.getElementById("clicked_cell_value");
            let contentWrapper = document.getElementById(
                "clicked_cell_value_content"
            );

            let wrapperRect = document
                .getElementById("heatmapCanvasWrapper")
                .getBoundingClientRect();
            let wrapperXPos = wrapperRect.left;
            let wrapperYPos =
                document.getElementById("heatmapContent").offsetHeight -
                document.getElementById("heatmapPlotWrapper").offsetHeight +
                document.getElementById("heatmapColumnsWrapper").offsetWidth;

            if (clickedCellValue != "") {
                contentWrapper.innerHTML = clickedCellValue;
                wrapper.classList.remove("hidden");
                wrapper.style.top = wrapperYPos + yPos + "px";
                wrapper.style.left = wrapperXPos - 30 + xPos + "px"; //minus 15 for the padding of the plot wrapper
            } else {
                wrapper.classList.add("hidden");
            }
            this.renderHeatmap(x, y);
        },
        renderHeatmap(X, Y) {
            this.squareData = {};
            document.getElementById("heatmapColumnsWrapper").innerHTML = "";
            document.getElementById("heatmapRowsWrapper").innerHTML = "";

            let canvasWidth =
                this.renderConfig.fontSize *
                1.5 *
                this.renderData.columns.length;

            let canvasHeight = this.boxSize * this.renderData.rows.length;

            document.getElementById("heatmapColumnsWrapper").style.fontSize =
                this.renderConfig.fontSize + "px";
            document.getElementById("heatmapRowsWrapper").style.fontSize =
                this.renderConfig.fontSize + "px";

            this.renderData.columns.map((c) => {
                var div = document.createElement("div");
                var t = document.createTextNode(this.getPhenotypeDescription(c));
                div.appendChild(t);
                div.setAttribute("style", "height: " + this.boxSize + "px;");
                document
                    .getElementById("heatmapColumnsWrapper")
                    .appendChild(div);
            });

            this.renderData.rows.map((r) => {
                var div = document.createElement("div");
                var t = document.createTextNode(this.removeRowPrefix(r));
                div.appendChild(t);
                div.setAttribute("style", "height: " + this.boxSize + "px;");
                document.getElementById("heatmapRowsWrapper").appendChild(div);
            });

            let columnTopSpace =
                document.getElementById("heatmapColumnsWrapper").offsetHeight -
                document.getElementById("heatmapColumnsWrapper").offsetWidth -
                10;
            let aboveColumnPadding =
                document.getElementById("heatmapColumnsWrapper").offsetWidth +
                20;

            let rIndex = 0;

            /*document.getElementById("heatmapColumnsWrapper").style.top =
                -columnTopSpace + "px";*/
            document.getElementById("heatmapColumnsWrapper").style.left =
                document.getElementById("heatmapRowsWrapper").offsetWidth +
                (this.boxSize - this.renderConfig.fontSize) / 2 +
                "px";
            document.getElementById("heatmapPlotWrapper").style.paddingTop =
                aboveColumnPadding + "px";

            let c = document.getElementById("heatmap");
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            let ctx = c.getContext("2d");

            this.renderData.rows.map((r) => {
                this.squareData[rIndex] = {};
                let cIndex = 0;
                this.renderData.columns.map((c) => {
                    let mainValue = this.renderData[r][c].main;
                    let left = this.boxSize * cIndex;
                    let top = this.boxSize * rIndex;

                    this.squareData[rIndex][cIndex] = {};
                    this.squareData[rIndex][cIndex]["main"] = {
                        field: this.renderConfig.main.field,
                        value: this.renderData[r][c].main,
                    };
                    if (!!this.renderConfig.sub) {
                        this.squareData[rIndex][cIndex]["sub"] = {
                            field: this.renderConfig.sub.field,
                            value: this.renderData[r][c].sub,
                        };
                    }
                    if (!!this.renderConfig.sortPhenotypeColumns){
                        let group = this.getGroup(c);
                        this.squareData[rIndex][cIndex]["group"] = {
                            field: "Group",
                            value: group === "ZZZ_UNGROUPED" 
                                ? "UNGROUPED"
                                : group,
                        };
                    }

                    let colorString = !this.renderConfig.colorByPhenotype 
                        ? this.colorString(mainValue) 
                        : this.groupColorString(c, mainValue);

                    if (X == cIndex && Y == rIndex) {
                        ctx.beginPath();
                        ctx.rect(left, top, this.boxSize, this.boxSize);
                        ctx.fillStyle = "black";
                        ctx.fill();

                        ctx.beginPath();
                        ctx.rect(
                            left + 2,
                            top + 2,
                            this.boxSize - 4,
                            this.boxSize - 4
                        );
                        ctx.fillStyle = colorString;
                        ctx.fill();
                    } else {
                        ctx.beginPath();
                        ctx.rect(left, top, this.boxSize, this.boxSize);
                        ctx.fillStyle = colorString;
                        ctx.fill();
                    }

                    if (!!this.renderConfig.sub) {
                        let steps = this.renderConfig.sub.valueRange;
                        let subDirection = this.renderConfig.sub.direction;
                        let dotMaxR = (this.boxSize * 0.75) / 2;
                        let centerPos = this.boxSize / 2;

                        let stepVal = 0;
                        let subValue = this.renderData[r][c].sub;
                        let dotR;

                        if (this.renderConfig.sub.type == "steps") {
                            let dotRUnit = dotMaxR / steps.length;
                            if (subDirection == "positive") {
                                for (let i = 0; i <= steps.length - 1; i++) {
                                    stepVal += subValue >= steps[i] ? 1 : 0;
                                }
                            } else {
                                for (let i = steps.length - 1; i >= 0; i--) {
                                    stepVal += subValue <= steps[i] ? 1 : 0;
                                }
                            }
                            dotR = dotRUnit * stepVal;
                        } else if (this.renderConfig.sub.type == "scale") {
                            let scaleRange = steps[1] - steps[0];
                            if (subDirection == "positive") {
                                subValue -= steps[0];
                                stepVal =
                                    subValue <= steps[0]
                                        ? 0
                                        : subValue >= steps[1]
                                        ? 1
                                        : subValue / scaleRange;
                            } else {
                                subValue -= steps[0];
                                stepVal =
                                    subValue >= steps[1]
                                        ? 0
                                        : subValue <= steps[0]
                                        ? 1
                                        : (steps[1] - subValue) / scaleRange;
                            }

                            dotR = dotMaxR * stepVal;
                        }
                        ctx.fillStyle = "#00000075";
                        ctx.lineWidth = 0;
                        ctx.beginPath();
                        ctx.arc(
                            left + centerPos,
                            top + centerPos,
                            dotR,
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
        getGroup(phenotype){
            return !!this.phenotypeMap[phenotype]
                    ? this.phenotypeMap[phenotype].group
                    : "ZZZ_UNGROUPED";
        },
        applyPrefix(columnName){
            return !this.renderConfig.sortPhenotypeColumns 
                ? columnName
                : `${this.getGroup(columnName)}${this.separator}${columnName}`;
        },
        groupColors(){
            let groups = Object.values(this.phenotypeMap).map(d => d.group);
            let uniqueGroups = [];
            groups.forEach(g => {
                if (!uniqueGroups.includes(g)){
                uniqueGroups.push(g);
                }});
            uniqueGroups.push("ZZZ_UNGROUPED");
            uniqueGroups.sort();
            let colorMap = {};
            let colors = plotUtils.plotColors();
            for (let i = 0; i < uniqueGroups.length; i++){
                colorMap[uniqueGroups[i]] = colors[i % colors.length];
            }
            return colorMap;
        },
        colorString(mainValue){
            let rColor, gColor, bColor;
            let direction = this.renderConfig.main.direction;
            let valHi = this.renderConfig.main.high;
            let valMid = this.renderConfig.main.middle;
            let valLo = this.renderConfig.main.low;

            rColor =
                mainValue >= valMid
                    ? 255
                    : 255 -
                        255 * ((valMid - mainValue) / valMid - valLo);
            gColor =
                mainValue >= this.renderConfig.main.middle
                    ? 255 -
                        255 * ((mainValue - valMid) / (valHi - valMid))
                    : 255 -
                        255 * ((valMid - mainValue) / valMid - valLo);
            bColor =
                mainValue < this.renderConfig.main.middle
                    ? 255
                    : 255 -
                        255 * ((mainValue - valMid) / (valHi - valMid));

            rColor = rColor > 255 ? 255 : rColor < 0 ? 0 : rColor;
            gColor = gColor > 255 ? 255 : gColor < 0 ? 0 : gColor;
            bColor = bColor > 255 ? 255 : bColor < 0 ? 0 : bColor;

            let outputString =
                "rgba(" +
                Math.floor(rColor) +
                "," +
                Math.floor(gColor) +
                "," +
                Math.floor(bColor) +
                ",1)";
            return outputString;
        },
        groupColorString(phenotype, mainValue){
            if(phenotype === undefined){
                return undefined;
            }
            let alpha = 255 * (mainValue - this.lo) / (this.hi - this.lo);
            let group = this.getGroup(phenotype);
            let outputString = `${this.colors[group]}${this.alphaToHex(alpha)}`;
            return outputString;
        },
        alphaToHex(decimal){
            let alphaInt = Math.round(decimal);
            let hexDigits = '0123456789ABCDEF';
            let lastPlace = alphaInt % 16;
            let lastDigit = hexDigits[lastPlace];
            let firstPlace = (alphaInt - lastPlace) / 16;
            let firstDigit = hexDigits[firstPlace];
            return `${firstDigit}${lastDigit}`;
        },
        getExtremes(){
            let mainField = this.renderConfig.main.field;
            let max = this.heatmapData[0][mainField];
            let min = this.heatmapData[0][mainField];
            this.heatmapData.forEach(d => {
                if (d[mainField] > max){
                    max = d[mainField];
                }
                if (d[mainField] < min){
                    min = d[mainField];
                }
            });
            // Always start at 0 or not?
            this.lo = 0;
            this.hi = max;
            this.mid = (this.lo + this.hi) / 2;
        },
        truncateColumn(longString){
            if (!this.renderConfig.truncateColumns){
                return longString;
            }
            return longString.length <= 25 ? longString : `${longString.slice(0,25)}...`;
        },
        getPhenotypeDescription(phenotypeName){
            if (!!this.phenotypeMap[phenotypeName]){
                return this.phenotypeMap[phenotypeName].description;
            }
            return phenotypeName;
        },
        removeRowPrefix(rowName){
            if (!this.renderConfig.rowScorePrefixes){
                return rowName;
            }
            let index = rowName.indexOf(this.separator);
            if (index === -1){
                return rowName;
            }
            return rowName.slice(index + this.separator.length);
        }
    },
});

$(function () {});
</script>

<style>
.heatmap-content {
    text-align: center;
    overflow-x: auto;
}

.heatmap-wrapper {
    position: relative;
}

.heatmap-canvas-wrapper {
    text-align: left;
    display: inline-block;
    position: relative;
    white-space: nowrap;
    background-color: #fff;
}

#heatmapColumnsWrapper {
    transform-origin: left top;
    transform: rotate(-90deg);
    position: absolute;
    /*left: 0;*/
}
#heatmapColumnsWrapper div {
    /*transform-origin: left center;
    transform: rotate(45deg);*/
    white-space: nowrap;
    padding-left: 10px;
}
#heatmapRowsWrapper {
    padding-right: 10px;
    display: inline-block;
    vertical-align: top;
    white-space: nowrap;
    text-align: right;
}
#heatmapCanvasWrapper {
    display: inline-block;
    vertical-align: top;
}

#heatmapCanvasWrapper canvas {
    border: solid 1px #aaa;
}

#heatmap:hover {
    cursor: pointer;
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

.sub-legend-steps {
    padding-left: 5px;
}
</style>



