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
        <div class="plot-score-options-ui">
            <div
                v-for="(option, opIndex) in renderConfig.scoreBy"
                :key="opIndex"
                class="plot-score-option"
            >
                <input
                    type="checkbox"
                    :id="'score_chkbox_' + opIndex"
                    :name="'score_chkbox_' + opIndex"
                    checked
                    @click="calculateScore"
                />
                <label
                    :for="'score_chkbox_' + opIndex"
                    v-html="option.field"
                ></label>
            </div>
        </div>
        <canvas
            v-if="!!renderConfig"
            id="scorePlot"
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
        {{ searchParameters }}
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-score-plot", {
    props: [
        "plotData",
        "renderConfig",
        "filtersIndex",
        "dataComparisonConfig",
        "searchParameters",
    ],
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
                23: 156040895,
                24: 57227415,
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
            compareGroupColors: [
                "#007bff30",
                "#04884530",
                "#8490C830",
                "#BF61A530",
                "#EE312430",
                "#FCD70030",
                "#5555FF30",
                "#7aaa1c30",
                "#9F78AC30",
                "#F8808430",
                "#F5A4C730",
                "#CEE6C130",
                "#cccc0030",
                "#6FC7B630",
                "#D5A76830",
                "#D4D4D430",
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
    components: {},
    mounted: function () {
        this.renderPlot();
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        renderData() {
            let rawData = this.plotData; //!!this.dataComparisonConfig ? this.obj2Array(this.plotData): this.plotData;
            let massagedData = { sorted: {}, unsorted: [] };

            for (const chr in this.chromosomeLength) {
                massagedData.sorted[chr] = [];
            }

            let renderConfig = this.renderConfig;

            let feedMassagedData = function (r) {
                let region = r[renderConfig.xAxisField];
                //console.log(region);
                if (region != undefined && region != "" && region != null) {
                    let tempObj = {};
                    tempObj[renderConfig.renderBy] = r[renderConfig.renderBy];

                    if (!!renderConfig.hoverContent) {
                        let hoverContent = renderConfig.hoverContent;

                        hoverContent.map((h) => {
                            tempObj[h] = r[h];
                        });
                    }

                    let locationArr = r[renderConfig.xAxisField].split(":");

                    let chr = locationArr[0].trim();

                    let regionArr = locationArr[1].split("-");

                    tempObj["locus"] =
                        regionArr.length > 1
                            ? (Number(regionArr[0].trim()) +
                                  Number(regionArr[1].trim())) /
                              2
                            : Number(regionArr[0].trim());

                    tempObj[renderConfig.yAxisField] =
                        r[renderConfig.yAxisField];

                    massagedData.sorted[chr].push(tempObj);
                    massagedData.unsorted.push(tempObj);
                }
            };

            if (!!this.dataComparisonConfig) {
                for (const [rKey, r] of Object.entries(rawData)) {
                    feedMassagedData(r);
                }
            } else {
                rawData.map((r) => {
                    feedMassagedData(r);
                });
            }

            //console.log(massagedData);
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

        calculateScore() {
            let scoreColumns = function (row, scoreBy) {
                let fieldValue = 0;
                let fieldsLength = scoreBy.length;

                scoreBy.map((f) => {
                    let scoreType = f.type;
                    let fName = f.field;
                    switch (scoreType) {
                        case "boolean":
                            let value2Score =
                                f.valueToScore[row[fName]] * f.weight;
                            fieldValue += value2Score;
                            break;
                    }
                });

                return fieldValue / fieldsLength;
            };

            let countingFields = [];

            this.renderConfig.scoreBy.map((f, fIndex) => {
                if (document.getElementById("score_chkbox_" + fIndex).checked) {
                    countingFields.push(f);
                }
            });

            let dataWithNewScore = this.plotData;
            this.plotData.map((d, dIndex) => {
                let score = scoreColumns(d, countingFields);
                dataWithNewScore[dIndex][
                    this.renderConfig.scoreColumnTableHeader
                ] = score;
            });

            this.$store.dispatch("filteredData", dataWithNewScore);
        },
        hidePanel(element) {
            uiUtils.hideElement(element);
        },
        onResize(e) {
            this.renderPlot();
        },
        getFullList(event) {
            let wrapper = document.getElementById("dot_value_full_list");
            let canvas = document.getElementById("scorePlot");
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
                document.getElementById("scorePlot").classList.add("hover");
                document
                    .getElementById("clicked_dot_value")
                    .classList.add("hidden");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("scorePlot").classList.remove("hover");
            }
        },
        checkPosition(event) {
            let wrapper = document.getElementById("clicked_dot_value");
            let canvas = document.getElementById("scorePlot");
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

                document.getElementById("scorePlot").classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("scorePlot").classList.remove("hover");
            }
        },
        getColorIndex(SKEY) {
            let keyField = this.dataComparisonConfig.fieldsGroupDataKey;
            let keyParameterSeach = this.searchParameters[keyField].search;
            let colorIndex = "";
            //if (keyParameterSeach.length > 1) {
            keyParameterSeach.map((sValue, sIndex) => {
                if (SKEY == sValue) {
                    colorIndex = sIndex;
                }
            });
            //}

            return colorIndex;
        },
        renderPlot() {
            //console.log(this.searchParameters);
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

            let c = document.getElementById("scorePlot");
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

            let yMin = null;
            let yMax = null;

            this.renderData.unsorted.map((d) => {
                if (
                    !!this.dataComparisonConfig &&
                    this.dataComparisonConfig.fieldsToCompare.includes(
                        this.renderConfig.yAxisField
                    ) == true
                ) {
                    for (const [key, value] of Object.entries(
                        d[this.renderConfig.yAxisField]
                    )) {
                        let yValue = value;

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
                    }
                } else {
                    let yValue = d[this.renderConfig.yAxisField];

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
                }
            });

            let yStep = (yMax - yMin) / 4;

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

                let yTickText = Formatters.floatFormatter(yMin + i * yStep);

                yTickText = yTickText == "-" ? 0 : yTickText;

                ctx.fillText(
                    yTickText,
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

            //get list of chrs with variants
            let chrs = Object.keys(this.renderData.sorted).filter(
                (key) => this.renderData.sorted[key].length > 0
            );

            //console.log("chrs length", chrs.length);

            // compare length of chromosomes in the data to the defalt
            let chrLengthMax = 0;
            let chrLengthMin = 0;

            if (chrs.length == 1) {
                let chr = chrs[0];

                this.renderData.sorted[chr].map((v) => {
                    if (chrLengthMin == 0) {
                        chrLengthMin = v.locus;
                    }
                    if (chrLengthMax == 0) {
                        chrLengthMax = v.locus;
                    }
                    if (v.locus < chrLengthMin) {
                        chrLengthMin = v.locus;
                    }
                    if (v.locus > chrLengthMax) {
                        chrLengthMax = v.locus;
                    }
                });

                this.chromosomeLength[chr] = chrLengthMax;

                dnaLength = chrLengthMax - chrLengthMin;
            } else {
                chrs.map((chr) => {
                    let chrLength = 0;
                    this.renderData.sorted[chr].map((v) => {
                        chrLength = v.locus > chrLength ? v.locus : chrLength;
                    });

                    this.chromosomeLength[chr] =
                        chrLength > this.chromosomeLength[chr]
                            ? chrLength
                            : this.chromosomeLength[chr];
                });

                chrs.map((chr) => {
                    dnaLength += this.chromosomeLength[chr];
                });
            }

            let chrByPixel = plotWidth / dnaLength;

            let xStart = this.leftMargin;
            ctx.textAlign = "center";
            ctx.rotate((Math.PI * 2) / 4);

            if (chrs.length == 1) {
                ctx.fillText(
                    chrLengthMin,
                    this.leftMargin,
                    this.topMargin + plotHeight + yBump + 20
                );

                ctx.fillText(
                    chrLengthMax,
                    plotWidth + this.leftMargin,
                    this.topMargin + plotHeight + yBump + 20
                );
            } else {
                chrs.map((chr) => {
                    let chrLength = this.chromosomeLength[chr] * chrByPixel;
                    xStart += chrLength;
                    let chrPos = xStart - chrLength / 2;

                    ctx.fillText(
                        chr,
                        chrPos,
                        this.topMargin + plotHeight + yBump + 14
                    );
                });
            }

            //Render x axis label

            ctx.fillText(
                this.renderConfig.xAxisLabel,
                plotWidth / 2 + this.leftMargin,
                this.topMargin + plotHeight + yBump + 44
            );

            //Render Dots
            if (chrs.length == 1) {
                xStart = chrLengthMin;
                let chr = chrs[0];
                this.renderData.sorted[chr].map((g) => {
                    let xPos =
                        (g.locus - xStart) * chrByPixel + this.leftMargin;

                    let yPosByPixel = plotHeight / (yMax - yMin);

                    if (
                        !!this.dataComparisonConfig &&
                        this.dataComparisonConfig.fieldsToCompare.includes(
                            this.renderConfig.yAxisField
                        ) == true
                    ) {
                        let yField = g[this.renderConfig.yAxisField];

                        for (const [yKey, yValue] of Object.entries(yField)) {
                            let yPos =
                                this.topMargin +
                                plotHeight -
                                (yValue - yMin) * yPosByPixel;

                            let colorKey = this.getColorIndex(yKey);

                            let dotColor = this.compareGroupColors[colorKey];

                            ctx.fillStyle = dotColor;

                            ctx.lineWidth = 0;
                            ctx.beginPath();
                            ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
                            ctx.fill();

                            let xLoc = xPos.toString().split(".")[0];
                            let yLoc = yPos.toString().split(".")[0];

                            this.add2HoverContent(xLoc, yLoc, g);
                        }
                    } else {
                        let yPos =
                            this.topMargin +
                            plotHeight -
                            (g[this.renderConfig.yAxisField] - yMin) *
                                yPosByPixel;

                        let dotColor = this.chromosomeColors[
                            chr % this.chromosomeColors.length
                        ];

                        ctx.fillStyle = dotColor + "75";

                        ctx.lineWidth = 0;
                        ctx.beginPath();
                        ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
                        ctx.fill();

                        let xLoc = xPos.toString().split(".")[0];
                        let yLoc = yPos.toString().split(".")[0];

                        this.add2HoverContent(xLoc, yLoc, g);
                    }
                });
            } else {
                xStart = 0;
                let exChr = "";
                let chrNum = 1;

                chrs.map((chr) => {
                    this.renderData.sorted[chr].map((g) => {
                        let xPos =
                            (xStart + g.locus) * chrByPixel + this.leftMargin;

                        let yPosByPixel = plotHeight / (yMax - yMin);

                        let yPos =
                            this.topMargin +
                            plotHeight -
                            (g[this.renderConfig.yAxisField] - yMin) *
                                yPosByPixel;

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
                        this.add2HoverContent(xLoc, yLoc, g);
                    });

                    xStart += this.chromosomeLength[chr];
                    chrNum++;
                });
            }
        },
        add2HoverContent(xLoc, yLoc, g) {
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
        },
    },
});

$(function () {});
</script>

<style>
.plot-score-options-ui {
    font-size: 12px;
    text-align: right;
    padding-right: 20px;
}

.plot-score-option {
    display: inline-block;
    margin-right: 10px;
}

.plot-score-option input[type="checkbox"] {
    margin-right: 5px;
}

.plot-score-option label {
    vertical-align: middle;
}

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



