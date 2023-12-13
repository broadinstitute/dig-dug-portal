<template>
    <div class="mbm-plot-content">
        <!--
 <div :id="'clicked_dot_value_' + sectionId" class="clicked-dot-value hidden">
            <div :id="'clicked_dot_value_content_' + sectionId" class="clicked-dot-value-content"></div>
        </div>
        <div :id="'dot_value_full_list_' + sectionId" class="dot-value-full-list hidden">
            <div class="clicked-dot-value-close" @click="hidePanel('dot_value_full_list_' + sectionId)">
                <b-icon icon="x-circle-fill"></b-icon>
            </div>
            <div :id="'dot_value_full_list_content_' + sectionId" class="dot-value-full-list-content"></div>
        </div>
        <div v-if="!!plotConfig.legend" class="mbm-plot-legend" v-html="plotConfig.legend"></div>
        <div v-for="item in plotsList" :key="item">
            <h4 v-if="item != 'default'">{{ item }}</h4>

            <canvas v-if="!!plotConfig" :id="'track_' + sectionId + item" class="manhattan-plot"
                @mouseleave="hidePanel" @mousemove="checkPosition($event, item)" @resize="onResize"
                @click="getFullList($event, item)" width="" height="">
            </canvas>
        </div>
        <div v-if="!!plotConfig.label" class="mbm-plot-label" v-html="plotConfig.label"></div>
        -->
        <div id="region_track_wrapper" class="col-md-9 region-track-wrapper">
            <template v-if="!!groupsList">
                <div v-for="group in groupsList" :key="group">
                    <h4>{{ group }}</h4>
                    <canvas v-if="!!plotConfig" :id="'track_' + sectionId + group" class="region-track"
                    width="" height="">
                    </canvas>
                </div>
            </template>
            <template v-else>
                <div>
                    <canvas v-if="!!plotConfig" :id="'track_' + sectionId" class="region-track"
                        width="" height="">
                    </canvas>
                </div>
            </template>
        </div>       
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
//import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
//import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-track", {
    props: [
        "sectionId",
        "plotConfig",
        "plotData",
        "dataComparisonConfig",
        "region",
        "regionZoom",
        "regionViewArea",
        "colors",
        "utils",
        "plotMargin",
        "starItems"
    ],
    data() {
        return {
            posData: {},
            groupsList: null,
        };
    },
    modules: {
    },
    components: {},
    mounted: function () {
        this.renderPlot();
       // window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
       // window.removeEventListener("resize", this.onResize);
    },
    computed: {
        renderData() {
            
            //console.log("this.plotData", this.plotData);

            let massagedData = {"keys":{},"data":{}};

            /// insert zoom filter here

            this.plotData.map(row=>{

                if(!massagedData.keys[row[this.plotConfig["y axis field"]]]){
                    massagedData.keys[row[this.plotConfig["y axis field"]]] = [];
                    massagedData.data[row[this.plotConfig["y axis field"]]] = {};
                };

                massagedData.keys[row[this.plotConfig["y axis field"]]].push(row[this.plotConfig["render by"]]);
                massagedData.data[row[this.plotConfig["y axis field"]]][row[this.plotConfig["render by"]]] = row;

            })

            return massagedData;

            /*let rawData = this.plotData;
            let compareGroups = [];
            let massagedData = {};
            let plotsList = [...this.plotsList];

            plotsList.map((c) => {
                let tempObj = { sorted: {}, unsorted: [] };
                massagedData[c] = tempObj;
            });

            for (const chr in this.chromosomeLength) {
                for (const [key, value] of Object.entries(massagedData)) {
                    value.sorted[chr] = [];
                }
            }

            if (this.dataComparisonConfig != null) {
                for (const [key, value] of Object.entries(rawData)) {
                    plotsList.map((c) => {
                        let region = value[this.plotConfig["x axis field"]];

                        if (
                            region != undefined &&
                            region != "" &&
                            region != null
                        ) {
                            let tempObj = {};
                            tempObj[this.plotConfig["render by"]] =
                                value[this.plotConfig["render by"]];

                            if (!!this.plotConfig["hover content"]) {
                                let hoverContent =
                                    this.plotConfig["hover content"];

                                hoverContent.map((h) => {
                                    let ifInCompare =
                                        this.dataComparisonConfig[
                                            "fields to compare"
                                        ].indexOf(h);
                                    tempObj[h] =
                                        ifInCompare < 0
                                            ? value[h]
                                            : value[h][c];
                                });
                            }

                            let locationArr =
                                value[this.plotConfig["x axis field"]].split(
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

                            tempObj[this.plotConfig["y axis field"]] =
                                value[this.plotConfig["y axis field"]][c];

                            massagedData[c].sorted[chr].push(tempObj);
                            massagedData[c].unsorted.push(tempObj);
                        }
                    });
                }
            } else {
                rawData.map((r) => {
                    let region = r[this.plotConfig["x axis field"]];

                    if (region != undefined && region != "" && region != null) {
                        let tempObj = {};
                        tempObj[this.plotConfig["render by"]] =
                            r[this.plotConfig["render by"]];

                        if (!!this.plotConfig["hover content"]) {
                            let hoverContent =
                                this.plotConfig["hover content"];

                            hoverContent.map((h) => {
                                tempObj[h] = r[h];
                            });
                        }

                        let locationArr =
                            r[this.plotConfig["x axis field"]].split(":");

                        let chr = locationArr[0].trim();

                        let regionArr = locationArr[1].split("-");

                        tempObj["locus"] =
                            regionArr.length > 1
                                ? (Number(regionArr[0].trim()) +
                                    Number(regionArr[1].trim())) /
                                2
                                : Number(regionArr[0].trim());

                        tempObj[this.plotConfig["y axis field"]] =
                            r[this.plotConfig["y axis field"]];

                        massagedData["default"].sorted[chr].push(tempObj);
                        massagedData["default"].unsorted.push(tempObj);
                    }
                });
            }

            return massagedData;*/
        },
        /*plotsList() {
            let rawData = this.plotData;
            let compareGroups = [];
            //console.log("this.dataComparisonConfig",this.dataComparisonConfig);

            if (!!rawData) {
                if (this.dataComparisonConfig != null) {
                    let compareKey =
                        this.dataComparisonConfig["fields to compare"][0];

                    for (const [key, value] of Object.entries(rawData)) {
                        Object.keys(value[compareKey]).map((k) => {
                            if (compareGroups.indexOf(k) < 0) {
                                compareGroups.push(k);
                            }
                        });
                    }
                } else {
                    compareGroups = ["default"];
                }
                return compareGroups;
            } else {
                return null;
            }
        },
        */
    },
    watch: {
        /*renderData(CONTENT) {
            //when data gets updated, hold it for little until vue.js renders <canvas> for the each datasets
            setTimeout(function () {
                window.dispatchEvent(new Event("resize"));
            }, 100);
        },*/
    },
    methods: {
        renderPlot() {
            console.log("this.renderData", this.renderData);
            console.log("this.plotConfig", this.plotConfig);

            let canvasWidth = document.querySelector("#region_track_wrapper").clientWidth;

            let trackNumber = Object.keys(this.renderData.keys).length;
            let canvasHeight = this.plotConfig["track height"] * trackNumber;

            //console.log(canvasRenderWidth, " : ", trackNumber," : ", canvasRenderHeight)

            let c, ctx;

            c = document.getElementById(
                'track_' + this.sectionId
            );
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            c.setAttribute(
                "style",
                "border: solid 1px #000"
            );
            
            ctx = c.getContext("2d");
        }
       /* hidePanel(element) {
            this.utils.uiUtils.hideElement(element);
        },
        onResize(e) {
            this.renderPlot(this.renderData);
        },
        getFullList(event, ID) {
            let wrapper = document.getElementById("dot_value_full_list_" + this.sectionId);
            wrapper.classList.remove("hidden");
            let e = event;
            let rect = e.target.getBoundingClientRect();
            let x = Math.floor(e.clientX - rect.left);
            let y = Math.floor(e.clientY - rect.top);

            let clickedDotValue = "";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[ID][x + h] != undefined) {
                        if (this.dotPosData[ID][x + h][y + v] != undefined) {
                            let dotObject = this.dotPosData[ID][x + h][y + v];
                            clickedDotValue +=
                                '<span class="gene-on-clicked-dot-mplot"><b>' +
                                dotObject[this.plotConfig["render by"]] +
                                "</b></span>";

                            if (!!this.plotConfig["hover content"]) {
                                let hoverContent =
                                    this.plotConfig["hover content"];

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
                "dot_value_full_list_content_" + this.sectionId
            );

            if (clickedDotValue != "") {
                contentWrapper.innerHTML = clickedDotValue;
                document
                    .getElementById("manhattanPlot_" + this.sectionId + ID)
                    .classList.add("hover");
                document
                    .getElementById("clicked_dot_value_" + this.sectionId)
                    .classList.add("hidden");
            } else {
                wrapper.classList.add("hidden");
                document
                    .getElementById("manhattanPlot_" + this.sectionId + ID)
                    .classList.remove("hover");
            }
        },
        checkPosition(event, ID) {

            let wrapper = document.getElementById("clicked_dot_value_" + this.sectionId);
            let canvas = document.getElementById("manhattanPlot_" + this.sectionId + ID);
            wrapper.classList.remove("hidden");
            let e = event;
            let rect = e.target.getBoundingClientRect();
            let x = Math.floor(e.clientX - rect.left);
            let y = Math.floor(e.clientY - rect.top);
            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            let clickedDotValue = "";

            let numOfValues = 0;

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[ID][x + h] != undefined) {
                        if (this.dotPosData[ID][x + h][y + v] != undefined) {
                            if (numOfValues < 6) {
                                let dotObject =
                                    this.dotPosData[ID][x + h][y + v];
                                clickedDotValue +=
                                    '<span class="gene-on-clicked-dot-mplot"><b>' +
                                    dotObject[this.plotConfig["render by"]] +
                                    "</b></span>";

                                if (!!this.plotConfig["hover content"]) {
                                    let hoverContent =
                                        this.plotConfig["hover content"];

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
                "clicked_dot_value_content_" + this.sectionId
            );

            if (clickedDotValue != "") {
                contentWrapper.innerHTML = clickedDotValue;

                document
                    .getElementById("manhattanPlot_" + this.sectionId + ID)
                    .classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document
                    .getElementById("manhattanPlot_" + this.sectionId + ID)
                    .classList.remove("hover");
            }
        },
        renderPlot(DATA) {

            this.dotPosData = {};

            let wrapper = document.getElementById("clicked_dot_value_" + this.sectionId);
            wrapper.classList.add("hidden");

            let canvasRenderWidth = !!this.plotConfig.width
                ? this.plotConfig.width * 2 +
                this.leftMargin +
                this.rightMargin
                : (window.innerWidth - 115) * 2;

            let canvasRenderHeight = !!this.plotConfig.height
                ? this.plotConfig.height * 2 +
                this.topMargin +
                this.bottomMargin
                : 800;

            let xBump = canvasRenderWidth * 0.02;
            let yBump = canvasRenderHeight * 0.02;
            let bump = 10;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);
            let plotHeight =
                canvasRenderHeight -
                (this.topMargin + yBump + this.bottomMargin);

            for (const [dKey, dValue] of Object.entries(DATA)) {
                let c = document.getElementById("manhattanPlot_" + this.sectionId + dKey);
                if (!!c) {
                    c.setAttribute("width", canvasRenderWidth);
                    c.setAttribute("height", canvasRenderHeight);
                    c.setAttribute(
                        "style",
                        "width:" +
                        canvasRenderWidth / 2 +
                        "px;height:" +
                        canvasRenderHeight / 2 +
                        "px;"
                    );
                    let ctx = c.getContext("2d");

                    ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#000000";
                    ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

                    // render y axis
                    ctx.moveTo(this.leftMargin - bump, this.topMargin);
                    ctx.lineTo(
                        this.leftMargin - bump,
                        plotHeight + this.topMargin + yBump + bump
                    );

                    //render x axis
                    ctx.moveTo(
                        this.leftMargin - bump,
                        plotHeight + this.topMargin + yBump + bump
                    );
                    ctx.lineTo(
                        plotWidth + this.leftMargin + bump,
                        plotHeight + this.topMargin + yBump + bump
                    );

                    // render y ticker

                    let yMin = null;
                    let yMax = null;

                    dValue.unsorted.map((d) => {
                        //yAxisData.push(d[this.plotConfig["y axis field"]]);

                        let yValue = d[this.plotConfig["y axis field"]];

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
                    });

                    let yStep = (yMax - yMin) / 4;

                    //let yAxisTicks = uiUtils.getAxisTicks(yMin, yMax);

                    let yTickDistance = plotHeight / 4;

                    for (let i = 0; i < 5; i++) {
                        let tickYPos = this.topMargin + i * yTickDistance;
                        let adjTickYPos = Math.floor(tickYPos);
                        ctx.moveTo(this.leftMargin - bump * 2, adjTickYPos);
                        ctx.lineTo(this.leftMargin - bump, adjTickYPos);
                        ctx.stroke();

                        ctx.font = "24px Arial";
                        ctx.textAlign = "right";
                        ctx.fillStyle = "#000000";

                        let yTickText = this.utils.Formatters.floatFormatter(
                            yMin + i * yStep
                        );

                        yTickText = yTickText == "-" ? 0 : yTickText;

                        ctx.fillText(
                            yTickText,
                            this.leftMargin - bump * 3,
                            this.topMargin + plotHeight + 10 - i * yTickDistance
                        );
                    }

                    ctx.stroke();

                    //Render y axis label
                    ctx.font = "28px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#000000";
                    ctx.rotate(-(Math.PI * 2) / 4);
                    ctx.fillText(
                        this.plotConfig["y axis label"],
                        -(this.topMargin + plotHeight / 2),
                        this.leftMargin - this.leftMargin / 2 - 28
                    );

                    let dnaLength = 0;

                    //get list of chrs with variants
                    let chrs = Object.keys(dValue.sorted).filter(
                        (key) => dValue.sorted[key].length > 0
                    );

                    // compare length of chromosomes in the data to the defalt

                    chrs.map((chr) => {
                        let chrLength = 0;
                        dValue.sorted[chr].map((v) => {
                            chrLength =
                                v.locus > chrLength ? v.locus : chrLength;
                        });

                        this.chromosomeLength[chr] =
                            chrLength > this.chromosomeLength[chr]
                                ? chrLength
                                : this.chromosomeLength[chr];
                    });

                    chrs.map((chr) => {
                        dnaLength += this.chromosomeLength[chr];
                    });

                    let chrByPixel = plotWidth / dnaLength;

                    let xStart = this.leftMargin;
                    ctx.textAlign = "center";
                    ctx.rotate((Math.PI * 2) / 4);

                    chrs.map((chr) => {
                        let chrLength = this.chromosomeLength[chr] * chrByPixel;
                        xStart += chrLength;
                        let chrPos = xStart - chrLength / 2;

                        ctx.fillText(
                            chr,
                            chrPos,
                            this.topMargin + plotHeight + yBump + 28 + bump
                        );
                    });

                    //Render x axis label

                    ctx.fillText(
                        this.plotConfig["x axis label"],
                        plotWidth / 2 + this.leftMargin,
                        this.topMargin + plotHeight + yBump + 88
                    );

                    //Render Dots

                    xStart = 0;
                    let exChr = "";
                    let chrNum = 1;

                    chrs.map((chr) => {
                        dValue.sorted[chr].map((g) => {
                            let xPos =
                                (xStart + g.locus) * chrByPixel +
                                this.leftMargin;

                            let yPosByPixel = plotHeight / (yMax - yMin);

                            let yPos =
                                this.topMargin +
                                plotHeight -
                                (g[this.plotConfig["y axis field"]] - yMin) *
                                yPosByPixel;

                            let dotColor =
                                this.chromosomeColors[
                                chrNum % this.chromosomeColors.length
                                ];

                            ctx.fillStyle = dotColor + "75";

                            ctx.lineWidth = 0;
                            ctx.beginPath();
                            ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
                            ctx.fill();

                            let xLoc = Math.round(
                                xPos.toString().split(".")[0] / 2
                            );
                            let yLoc = Math.round(
                                yPos.toString().split(".")[0] / 2
                            );

                            let hoverContent;

                            if (!!this.plotConfig["hover content"]) {
                                hoverContent =
                                    this.plotConfig["hover content"];
                            }

                            if (!this.dotPosData[dKey]) {
                                this.dotPosData[dKey] = {};
                            }

                            if (!this.dotPosData[dKey][xLoc]) {
                                this.dotPosData[dKey][xLoc] = {};
                            }
                            this.dotPosData[dKey][xLoc][yLoc] = {};
                            this.dotPosData[dKey][xLoc][yLoc][
                                this.plotConfig["render by"]
                            ] = g[this.plotConfig["render by"]];
                            if (!!this.plotConfig["hover content"]) {
                                hoverContent.map((h) => {
                                    this.dotPosData[dKey][xLoc][yLoc][h] = g[h];
                                });
                            }
                        });

                        xStart += this.chromosomeLength[chr];

                        chrNum++;
                    });
                }
            }
        },*/
    },
});

$(function () { });
</script>

<style>
.region-track.hover {
    cursor: pointer;
}

.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

.clicked-dot-value {
    position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 12px;
    max-width: 300px;
    border-radius: 5px;
    z-index: 10;
    width: auto;
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

.dot-value-full-list-content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 14px;
}
</style>