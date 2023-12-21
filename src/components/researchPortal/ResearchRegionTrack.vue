<template>
    <div>
        <div id="region_track_wrapper" class="region-track-wrapper">
            <!--
<template v-if="!!groupsList">
                <template v-for="group in groupsList">
                    <h4>{{ group }}</h4>
                    <canvas v-if="!!plotConfig" :id="'track_' + sectionId + group" class="region-track"
                    width="" height="">
                    </canvas>
                </template>
            </template>

            <template v-else>
                <canvas v-if="!!plotConfig" :id="'track_' + sectionId" class="region-track"
                    width="" height="">
                </canvas>
            </template> 

            -->
            <div :id="'block_data_' + sectionId" class="block-data hidden">
                <div :id="'block_data_content_' + sectionId" class="block-data-content"></div>
            </div>
            <canvas v-if="!!plotConfig" :id="'track_' + sectionId" class="region-track"
                @mouseleave="hidePanel" @mousemove="checkPosition($event,'hover')" @resize="onResize"
                width="" height="">
            </canvas>
        </div>
        <!--
 
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
            colorGroups:[],
        };
    },
    modules: {
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
        adjPlotMargin() {

            let customPlotMargin = !!this.plotConfig["plot margin"] ? this.plotConfig["plot margin"] : null;

            let plotMargin = !!customPlotMargin ? {
                left: customPlotMargin.left,
                right: customPlotMargin.right,
                top: customPlotMargin.top,
                bottom: customPlotMargin.bottom,
                bump: !!customPlotMargin.bump ? customPlotMargin.bump : 10,
            } :
                {
                    left: this.plotMargin.leftMargin,
                    right: this.plotMargin.rightMargin,
                    top: this.plotMargin.topMargin,
                    bottom: this.plotMargin.bottomMargin,
                    bump: this.plotMargin.bump,
                };

            return plotMargin;
        },
        viewingRegion() {
            if (this.region == null) {
                return null;
            } else {
                let returnObj = {};

                returnObj["chr"] = parseInt(this.region.split(":")[0], 10);

                let regionArr = this.region.split(":")[1].split("-");
                let chr = this.region.split(":")[0];
                let start = parseInt(regionArr[0], 10);
                let end = parseInt(regionArr[1], 10);
                let distance = end - start;
                if (this.regionZoom > 0) {
                    let zoomNum = Math.round(
                        distance * (this.regionZoom / 200)
                    );
                    let viewPointShift = Math.round(
                        zoomNum * (this.regionViewArea / 100)
                    );
                    returnObj["chr"] = chr;
                    returnObj["start"] = start + zoomNum + viewPointShift;
                    returnObj["end"] = end - zoomNum + viewPointShift;
                } else if (this.regionZoom == 0) {
                    returnObj["chr"] = chr;
                    returnObj["start"] = start;
                    returnObj["end"] = end;
                }

                return returnObj;
            }
        },
        renderData() {
            
            //console.log("this.plotData", this.plotData);

            let massagedData = {};
            let colorGroups =[];

            this.plotData.map(row=>{

                if(!massagedData[row[this.plotConfig["y axis field"]]]){
                    massagedData[row[this.plotConfig["y axis field"]]] = {};
                };

                if(!!this.plotConfig["color by"] && !colorGroups.includes(row[this.plotConfig["color by"]])) {
                    colorGroups.push(row[this.plotConfig["color by"]]);
                }

                massagedData[row[this.plotConfig["y axis field"]]][row[this.plotConfig["render by"]]] = row;

            })


            this.colorGroups = colorGroups.sort();

            return massagedData;

        },
    },
    watch: {
        viewingRegion(REGION){
            this.renderPlot();
        },
        plotData(DATA) {
            this.renderPlot();
        },
        starItems(STARS) {
            this.renderPlot();
        }
    },
    methods: {
        renderPlot() {
            this.posData = {};

            let tracks = Object.keys(this.renderData).sort();
            let perTrack = this.plotConfig["track height"]*2;
            let canvasWidth = document.querySelector("#region_track_wrapper").clientWidth * 2;
            let canvasHeight = (perTrack * tracks.length)+ this.adjPlotMargin.top + this.adjPlotMargin.bottom;

            let c, ctx;

            c = document.getElementById(
                'track_' + this.sectionId
            );
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            c.setAttribute(
                "style",
                "background-color: #ffffff;"+
                "width: " +
						canvasWidth / 2 +
                "px;height:" +
                canvasHeight / 2 +
                "px;"
            );

            ctx = c.getContext("2d");
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            let trackIndex = 0;
            let plotHeight = perTrack * tracks.length;
            let plotWidth = canvasWidth - (this.adjPlotMargin.left + this.adjPlotMargin.right);
            let region = this.viewingRegion;
            let xPerPixel = plotWidth / (region.end - region.start);
            //let regionArr = this.region.split(":");
            //let region = regionArr[1].split("-");
            

            this.renderAxis(ctx,
                plotWidth,
                plotHeight,
                Number(region.end),
                Number(region.start),
                this.adjPlotMargin.top,
                this.adjPlotMargin);

            tracks.map(track=>{
                let trackTop = this.adjPlotMargin.top + (perTrack * trackIndex);
                ctx.fillStyle = "#000000";
                ctx.textAlign = "start";
                ctx.textBaseline = "middle";
                ctx.font = "24px Arial";
                ctx.fillText(track, 2, trackTop + 12);

                if (trackIndex % 2 == 0) {
                    ctx.fillStyle = "#00000010";
                    ctx.fillRect(
                        this.adjPlotMargin.left,
                        trackTop,
                        plotWidth,
                        perTrack
                    );
                }

                let regionData = this.renderData[track]
                let regionKeys = Object.keys(regionData)
                //let regionStart = region[0];
                //let regionEnd = region[1];
                

                regionKeys.map(block=>{
                    let blockRegion = regionData[block][this.plotConfig["render by"]].split("-");

                    let blockStart= blockRegion[0];
                    let blockEnd = blockRegion[1];

                    if (blockStart <= region.end && blockEnd >= region.start) {
                        let xPosStart =
                            (blockStart - region.start) * xPerPixel +
                        this.adjPlotMargin.left;

                        xPosStart =
                            xPosStart <= this.adjPlotMargin.left
                                ? this.adjPlotMargin.left
                                : xPosStart;
                        let xPosEnd =
                            (blockEnd - region.start) * xPerPixel +
                            this.adjPlotMargin.left;

                        xPosEnd =
                            xPosEnd >
                                this.adjPlotMargin.left + plotWidth
                                ? this.adjPlotMargin.left + plotWidth
                                : xPosEnd;

                        //let xPosWidth = xPosEnd - xPosStart;
                        let xPosWidth =
                            xPosEnd - xPosStart < 2
                                ? 2
                                : xPosEnd - xPosStart;

                        let colorIndex = !!this.plotConfig["color by"] ? this.colorGroups.indexOf(regionData[block][this.plotConfig["color by"]]):null;

                        ctx.fillStyle = !!colorIndex || colorIndex === 0 ? this.colors.bold[colorIndex]:"#00000066";

                        ctx.fillRect(
                            xPosStart,
                            trackTop,
                            xPosWidth,
                            perTrack
                        );
                    if(!this.posData[Math.round(trackTop/2)]) {
                       this.posData[Math.round(trackTop / 2)]= []; 
                    }

                    this.posData[Math.round(trackTop / 2)].push({start: Math.round(xPosStart/2),end: Math.round((xPosStart+xPosWidth) / 2),data: regionData[block] });
                    }
                })
                trackIndex++;
            })

            let xStart = this.adjPlotMargin.left;
            if (!!this.starItems) {
                let yPos1 = this.adjPlotMargin.top - this.adjPlotMargin.bump;
                let yPos2 = this.adjPlotMargin.top + plotHeight + (this.adjPlotMargin.bump*3);

                this.starItems.map(star => {
                    let xPos = xStart + (star.columns[this.plotConfig["x axis field"]] - region.start) * xPerPixel;

                    this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 3, "#FFAA0055", [6, 2]);
                })
            }
        },
        renderAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, plotMargin) {
            CTX.beginPath();
            CTX.lineWidth = 1;
            CTX.strokeStyle = "#000000";
            CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

            // render y axis
            CTX.moveTo(this.adjPlotMargin.left - this.adjPlotMargin.bump, yPos);
            CTX.lineTo(this.adjPlotMargin.left - this.adjPlotMargin.bump, yPos + HEIGHT + this.adjPlotMargin.bump);
            CTX.stroke();

            // render recombination Rate y axis
            let recomXpos = Math.round(
                this.adjPlotMargin.left + WIDTH + this.adjPlotMargin.bump
            );

            CTX.moveTo(recomXpos, yPos);
            CTX.lineTo(recomXpos, yPos + HEIGHT + this.adjPlotMargin.bump);
            CTX.stroke();

            //render x axis
            CTX.moveTo(this.adjPlotMargin.left - this.adjPlotMargin.bump, yPos + HEIGHT + this.adjPlotMargin.bump);
            CTX.lineTo(recomXpos, yPos + HEIGHT + this.adjPlotMargin.bump);
            CTX.stroke();

            // X ticks

            let xStep = Math.ceil((xMax - xMin) / 5);
            let xTickDistance = WIDTH / 5;

            for (let i = 0; i < 6; i++) {
                let tickXPos = this.adjPlotMargin.left + i * xTickDistance;
                let adjTickXPos = Math.floor(tickXPos);
                CTX.moveTo(adjTickXPos, yPos + HEIGHT + this.adjPlotMargin.bump);
                CTX.lineTo(adjTickXPos, yPos + HEIGHT + this.adjPlotMargin.bump * 2);
                CTX.stroke();

                CTX.textAlign = "center";
                //let positionLabel = i < 5 ? xMin + i * xStep : xMax;
                CTX.font = "24px Arial";
                CTX.fillStyle = "#000000";

                let xMaxMinGap = xMax - xMin;
                let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

                let positionLabel = this.utils.Formatters.decimalFormatter(
                    xMin + i * xStep,
                    xDecimal
                );

                positionLabel =
                    positionLabel >= 100000
                        ? Math.round(positionLabel * 0.001) + "k"
                        : positionLabel;

                CTX.fillText(
                    positionLabel,
                    adjTickXPos,
                    yPos + HEIGHT + 36 + this.adjPlotMargin.bump
                );
            }
        },
        checkPosition(e,action) {

            let rect = e.target.getBoundingClientRect();
            let x = Math.floor(e.clientX - rect.left);
            let y = Math.floor(e.clientY - rect.top);

            let wrapper = document.getElementById("block_data_" + this.sectionId);
            let contentWrapper = document.getElementById("block_data_content_" + this.sectionId);
            let canvas = document.getElementById("track_" + this.sectionId);
            wrapper.classList.remove("hidden");

            wrapper.style.top = y + canvas.offsetTop + 25 + "px";
            wrapper.style.left = x + canvas.offsetLeft + "px";

            let trackRows = Object.keys(this.posData);

            let blockData = [];

            trackRows.map(row =>{
                let rowTop = Number(row);
                let rowBottom = rowTop + Math.round(this.plotConfig["track height"]);

                if(y >= rowTop && y <= rowBottom) {
                    this.posData[row].map(block=>{
                        if(x >=block.start && x <= block.end) {
                            blockData.push(block.data);
                        }
                    })
                }
            })

            //console.log(blockData);
            if (blockData.length > 0) {
                let hoverContent = ""

                let blockIndex = 0;
                blockData.map(b =>{
                    if(action == "hover" && blockIndex < 5) {
                        hoverContent += "<strong>" + b[this.plotConfig["render by"]] + "</strong><br />";
                        this.plotConfig["hover content"].map(h => {
                            hoverContent += "<strong>" + h + "</strong>: <span>" + b[h] + "</span><br />";
                        })
                        hoverContent += "<br />";
                    } else if (action == "click"){
                        hoverContent += "<strong>" + b[this.plotConfig["render by"]] + "</strong><br />";
                        this.plotConfig["hover content"].map(h => {
                            hoverContent += "<strong>" + h + "</strong>: <span>" + b[h] + "</span><br />";
                        })
                        hoverContent += "<br />";
                    }

                    blockIndex++;
                })

                if (action == "hover" && blockData.length > 5) {
                   hoverContent +=
                    '<strong style="color: #36c;">Viewing 5 of ' +
                        blockData.length +
                        " items. Click to view full list.</strong>";
                }

                document.getElementById("track_" + this.sectionId).classList.add("hover");
                contentWrapper.innerHTML = hoverContent;
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("track_" + this.sectionId).classList.remove("hover");
            }

            /*
            let wrapper = document.getElementById("clicked_dot_value_" + this.sectionId);
            let canvas = document.getElementById("manhattanPlot_" + this.sectionId + ID);
            wrapper.classList.remove("hidden");
            let e = event;
            
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
            }*/
        },
        onResize(e) {
            this.renderPlot();
        },
        hidePanel(element) {
            this.utils.uiUtils.hideElement(element);
        },
       /* 
        
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
.region-track-wrapper {
    padding: 0 !important;
}
.region-track.hover {
    cursor: pointer;
}

.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

.block-data {
    position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 12px;
    max-width: 400px;
    border-radius: 5px;
    z-index: 10;
    width: auto;
    padding: 8px 20px 8px 10px !important;
}

.block-data-close {
    position: absolute;
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}

.block-data-close:hover {
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