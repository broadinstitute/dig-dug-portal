<template>
    <div>
        <div id="region_track_wrapper" class="region-track-wrapper">
            
            <div :id="'block_data_' + sectionId" class="block-data hidden">
                <div class="fixed-info-box-close" @click="infoBoxFrozen = false; hidePanel('block_data_' + sectionId)">
                    <b-icon icon="x-circle-fill"></b-icon>
                </div>
                <div :id="'block_data_content_' + sectionId" class="block-data-content"></div>
            </div>
            <div>
                <span v-for="color,index in colorGroups" :key="color" class="color-groups">
                    <span class="box" :style="'background-color:' + colors.bold[index]"></span><span class="label" v-html="color"></span>
                </span>
            </div>
            <canvas v-if="!!plotConfig" :id="'track_' + sectionId" class="region-track"
                @mouseleave="hidePanel('block_data_' + sectionId)" @mousemove="checkPosition($event,'hover')" @click="checkPosition($event, 'click')" @resize="onResize"
                width="" height="">
            </canvas>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";

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
            infoBoxFrozen: false,
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

            if(this.infoBoxFrozen == false) {
                let rect = e.target.getBoundingClientRect();
                let x = Math.floor(e.clientX - rect.left);
                let y = Math.floor(e.clientY - rect.top);

                let wrapper = document.getElementById("block_data_" + this.sectionId);
                let contentWrapper = document.getElementById("block_data_content_" + this.sectionId);
                let canvas = document.getElementById("track_" + this.sectionId);

                if (action == "click") {
                    wrapper.setAttribute("style","");
                }
                
                let trackRows = Object.keys(this.posData);

                let blockData = [];

                trackRows.map(row => {
                    let rowTop = Number(row);
                    let rowBottom = rowTop + Math.round(this.plotConfig["track height"]);

                    if (y >= rowTop && y <= rowBottom) {
                        this.posData[row].map(block => {
                            if (x >= block.start && x <= block.end) {
                                blockData.push(block.data);
                            }
                        })
                    }
                })

                //console.log(blockData);
                if (blockData.length > 0) {
                    if (action == "click") {
                        this.infoBoxFrozen = true;
                        document.getElementById("block_data_" + this.sectionId).classList.add("fixed-info-box");
                    }

                    let hoverContent = ""

                    let blockIndex = 0;
                    blockData.map(b => {
                        if (action == "hover" && blockIndex < 5) {
                            hoverContent += "<strong>" + b[this.plotConfig["render by"]] + "</strong><br />";
                            this.plotConfig["hover content"].map(h => {
                                hoverContent += "<strong>" + h + "</strong>: <span>" + b[h] + "</span><br />";
                            })
                            hoverContent += "<br />";
                        } else if (action == "click") {
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

                    contentWrapper.innerHTML = hoverContent;

                    if (action == "hover") {
                        wrapper.classList.remove("hidden");
                        wrapper.style.top = y + canvas.offsetTop + 25 + "px";
                        let xPosRatio = x / canvas.offsetWidth;
                        wrapper.style.left = x - (wrapper.offsetWidth * xPosRatio) + canvas.offsetLeft + "px";
                        document.getElementById("block_data_" + this.sectionId).classList.remove("fixed-info-box");
                    }

                    if(action="hover") {
                        document.getElementById("track_" + this.sectionId).classList.add("hover");
                    }
                    
                } else {
                    if (action = "hover" && this.infoBoxFrozen == false) {
                        wrapper.classList.add("hidden");
                        document.getElementById("track_" + this.sectionId).classList.remove("hover");
                    }
                }
            }
        },
        onResize(e) {
            this.renderPlot();
        },
        hidePanel(element) {
            if(this.infoBoxFrozen == false) {
                this.utils.uiUtils.hideElement(element);
            }
        },
       
    },
});

$(function () { });
</script>

<style>
.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}

.fixed-info-box-close:hover {
	color: #36c;
}


.fixed-info-box-content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px !important;
}
.color-groups {
    font-size: 13px;
}

.color-groups .box {
    width: 12px;
    height: 12px;
    margin-right: 3px;
    margin-left: 7px;
    display: inline-block;
    vertical-align: middle;
}

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

.block-data.fixed-info-box {
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

.block-data.fixed-info-box .block-data-content {
    height: 280px;
    overflow: auto;
    width: 389px;
}

</style>