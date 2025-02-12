<template>
    <div :id="'region_track_wrapper'+sectionId" class="region-track-wrapper">
        <div :id="'block_data_' + sectionId" class="block-data hidden">
            <div class="fixed-info-box-close" @click="infoBoxFrozen = false; hidePanel('block_data_' + sectionId)">
                <b-icon icon="x-circle-fill"></b-icon>
            </div>
            <div :id="'block_data_content_' + sectionId" class="block-data-content"></div>
        </div>
        <div class="col-md-11">
            <span v-for="cKey,index in colorGroups" :key="cKey" class="color-groups" @mouseover="renderPlot(cKey)" @mouseleave="renderPlot()">
                <span class="box" :style="'background-color:' + colors.bold[index % 16]"></span><span class="label" v-html="cKey"></span>
            </span>
        </div>
        
        <canvas v-if="!!plotConfig" :id="'track_' + sectionId" class="region-track"
            @mouseleave="hidePanel('block_data_' + sectionId);resetPosMarker()" @mousemove="checkPosition($event,'hover')" @click="checkPosition($event, 'click')" @resize="onResize"
            width="" height="">
        </canvas>

        <span :id="sectionId+'_xPosMarker'" class="x-pos-marker"></span>
        
        <div class="download-images-setting">
            <span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
            <ul class="options" >
                <li>
                    <a href="javascript:;"
                    @click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_regionTrack', 'svg')">Download SVG</a>
                </li>
                <li>
                    <a href="javascript:;"
                    @click="downloadImage('track_' + sectionId, sectionId + '_regionTrack', 'png')">Download PNG</a>
                </li>
            </ul>
        </div>
        <research-region-track-vector
        v-if="!!renderData"
            :renderData="renderData"
            :renderConfig="plotConfig"
            :colors="colors.bold"
            :margin="adjPlotMargin"
            :region="viewingRegion"
            :sectionId="sectionId"
            :utils="utils"
            :ref="sectionId + '_regionTrack'"
        >
        </research-region-track-vector>
    </div>
    
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import regionTrackVector from "@/components/researchPortal/vectorPlots/ResearchRegionTrackVector.vue";
import { indexOf } from "@amcharts/amcharts4/.internal/core/utils/Array";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-track", {
    props: [
        "sectionId",
        "plotConfig",
        "plotData",
        "dataComparisonConfig",
        "regionParam",
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
            starGroups: [],
        };
    },
    modules: {
    },
    components: {
        regionTrackVector
    },
    mounted: function () {
        this.renderPlot();
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        hoverPos() {
            return this.$root.hoverPos;
        },
        region() {

            let region = this.regionParam;

            if(!!this.plotConfig['expand region by']) {

                let regionArr = region.split(":");
                    let chr = regionArr[0];
                    let posRegion = regionArr[1].split("-");
                    let posStart = Number(posRegion[0]);
                    let posEnd = Number(posRegion[1]);

                    posStart -= this.plotConfig['expand region by']/2
                    posStart = (posStart <= 0)? 0:posStart;

                    posEnd += this.plotConfig['expand region by']/2
                    
                    region = chr +":"+posStart+"-"+posEnd;

            }

            return region;

        },
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

            let massagedData = {};
            let colorGroups =[];

            this.plotData.map(row=>{

                if(!massagedData[row[this.plotConfig["y axis field"]]]){
                    massagedData[row[this.plotConfig["y axis field"]]] = {};
                };

                if(!!this.plotConfig["color by"] && !colorGroups.includes(row[this.plotConfig["color by"]])) {
                    colorGroups.push(row[this.plotConfig["color by"]]);
                }

                if(!massagedData[row[this.plotConfig["y axis field"]]][row[this.plotConfig["render by"]]]) {
                    massagedData[row[this.plotConfig["y axis field"]]][row[this.plotConfig["render by"]]] = [];
                }
                massagedData[row[this.plotConfig["y axis field"]]][row[this.plotConfig["render by"]]].push(row);
            })


            this.colorGroups = colorGroups.sort();

            return massagedData;

        },
    },
    watch: {
        hoverPos(POS_ARR) {
            
            this.renderPlot(null,"enter");
        },
        viewingRegion(REGION){
            this.renderPlot();
        },
        plotData(DATA) {
            this.renderPlot();
        },
        starItems(STARS) {
            this.starGroups = [...new Set(STARS.map(s => s.section))].sort();
            this.renderPlot();
        }
    },
    methods: {
        downloadImage(ID, NAME, TYPE) {
            if (TYPE == 'svg') {
                this.$refs[this.sectionId + '_regionTrack'].renderPlot();
                this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_region_track_" + this.sectionId);
            } else if (TYPE == 'png') {
                this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
            }

        },
        renderPlot(cKey,action) {
            
            this.posData = {};

            let tracks = Object.keys(this.renderData).sort();
            let perTrack = this.plotConfig["track height"]*2;
            let canvasWidth = document.querySelector("#region_track_wrapper"+this.sectionId).clientWidth * 2;
            let canvasHeight = (perTrack * tracks.length)+ this.adjPlotMargin.top + this.adjPlotMargin.bottom;

            let c, ctx;

            c = document.getElementById(
                'track_' + this.sectionId
            );
            c.setAttribute("width", canvasWidth);
            c.setAttribute("height", canvasHeight);
            c.setAttribute(
                "style",
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
            

            // render marker band
            
            ctx.fillStyle = "#ff880025";

            ctx.fillRect(
                this.adjPlotMargin.left,
                plotHeight + this.adjPlotMargin.top + (this.adjPlotMargin.bump * 2)+12,
                plotWidth,
                12
            );
                
            //

            this.renderAxis(ctx,
                plotWidth,
                plotHeight,
                Number(region.end),
                Number(region.start),
                this.adjPlotMargin.top,
                this.adjPlotMargin);

            let canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            let getWidth = function (text, fontSize, fontFace) {
                context.font = fontSize + 'px ' + fontFace;
                return context.measureText(text).width;
            }

            tracks.map(track=>{
                let trackTop = this.adjPlotMargin.top + (perTrack * trackIndex);
                ctx.fillStyle = "#000000";
                ctx.textAlign = "start";
                ctx.textBaseline = "middle";
                ctx.font = "24px Arial";
                let labelLimit = Math.floor((this.adjPlotMargin.left - this.adjPlotMargin.bump) / 16)

                let trackLabel = "";
                let txtWidth = getWidth(track, 24, "Arial")

                if (txtWidth > (this.adjPlotMargin.left - this.adjPlotMargin.bump)) {
                    for (let i = 0; i < track.length; i++) {
                        if (getWidth(trackLabel + track[i], 24, "Arial") < (this.adjPlotMargin.left - (this.adjPlotMargin.bump * 6))) {
                            trackLabel = trackLabel + track[i];
                        }
                    }
                    trackLabel += "..."
                } else {
                    trackLabel = track;
                }

                //let trackLabel = (track.length > labelLimit)? track.slice(0, labelLimit)+'...': track;


                ctx.fillText(trackLabel, 2, trackTop + 12);

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

                regionKeys.map(blocks=>{

                    regionData[blocks].map((block,bIndex) =>{

                        let blockRegion = block[this.plotConfig["render by"]].split("-");

                        let blockStart = blockRegion[0];
                        let blockEnd = blockRegion[1];
                        let xPosStart, xPosEnd, xPosWidth;

                        if (blockStart <= region.end && blockEnd >= region.start) {
                            xPosStart =
                                (blockStart - region.start) * xPerPixel +
                                this.adjPlotMargin.left;

                            xPosStart =
                                xPosStart <= this.adjPlotMargin.left
                                    ? this.adjPlotMargin.left
                                    : xPosStart;
                            xPosEnd =
                                (blockEnd - region.start) * xPerPixel +
                                this.adjPlotMargin.left;

                            xPosEnd =
                                xPosEnd >
                                    this.adjPlotMargin.left + plotWidth
                                    ? this.adjPlotMargin.left + plotWidth
                                    : xPosEnd;
                            
                        } else if(blockStart <= region.start && blockEnd >= region.start) {

                            xPosStart = this.adjPlotMargin.left - this.adjPlotMargin.bump;

                            xPosEnd =
                                (blockEnd - region.start) * xPerPixel +
                                this.adjPlotMargin.left;

                            xPosEnd =
                                xPosEnd >
                                    this.adjPlotMargin.left + plotWidth
                                    ? this.adjPlotMargin.left + plotWidth
                                    : xPosEnd;

                        } else if(blockStart <= region.end && blockEnd >= region.end) {

                            xPosStart =
                                (blockStart - region.start) * xPerPixel +
                                this.adjPlotMargin.left;

                            xPosStart =
                                xPosStart <= this.adjPlotMargin.left
                                    ? this.adjPlotMargin.left
                                    : xPosStart;

                            xPosEnd = this.adjPlotMargin.left + plotWidth + this.adjPlotMargin.bump;

                        } else if(blockEnd <= region.start) {

                            xPosStart = this.adjPlotMargin.left - this.adjPlotMargin.bump - 15;

                            xPosEnd = this.adjPlotMargin.left - this.adjPlotMargin.bump - 5;

                        } else if(blockStart >= region.end) {

                            xPosStart = this.adjPlotMargin.left + plotWidth + this.adjPlotMargin.bump + 5;

                            xPosEnd = this.adjPlotMargin.left + plotWidth + this.adjPlotMargin.bump + 15;

                        }

                        xPosWidth = xPosEnd - xPosStart < 2? 2 : xPosEnd - xPosStart;

                        let colorIndex = !!this.plotConfig["color by"] ? (this.colorGroups.indexOf(block[this.plotConfig["color by"]]) % 16) : null;
                            let highlightKey = (!!cKey && block[this.plotConfig["color by"]] == cKey) ? true : null;

                            if (!!highlightKey) {
                                ctx.fillStyle = "#FF0000"
                                ctx.fillRect(
                                    xPosStart - 2,
                                    trackTop - 2,
                                    xPosWidth + 4,
                                    perTrack + 4
                                );
                            }

                            ctx.fillStyle = !!colorIndex || colorIndex === 0 ? this.colors.bold[colorIndex] : "#00000066";

                            ctx.fillRect(
                                xPosStart,
                                trackTop,
                                xPosWidth,
                                perTrack
                            );

                            if (!this.posData[Math.round(trackTop / 2)]) {
                                this.posData[Math.round(trackTop / 2)] = {'label':track,'regions':[]};
                            }

                            this.posData[Math.round(trackTop / 2)]['regions'].push({ start: Math.round(xPosStart / 2), end: Math.round((xPosStart + xPosWidth) / 2), data: block });
                    })
                    
                })
                trackIndex++;
            })

            let xStart = this.adjPlotMargin.left;
            if (!!this.starItems) {
                let yPos1 = this.adjPlotMargin.top - this.adjPlotMargin.bump;
                let yPos2 = this.adjPlotMargin.top + plotHeight + (this.adjPlotMargin.bump*3);

                this.starItems.map(star => {
                    let xPos = xStart + (star.columns[this.plotConfig["x axis field"]] - region.start) * xPerPixel;
                    let lineColor = this.colors.moderate[this.starGroups.indexOf(star.section) % 16];

                    this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 3, lineColor, [6, 2]); //"#FFAA0055"
                })

                let xPos = this.adjPlotMargin.bump
                this.starGroups.map((group, gIndex) => {
                    
                    let lineColor = this.colors.bold[gIndex]
                    let yPos = this.adjPlotMargin.top + plotHeight + this.adjPlotMargin.bottom - this.adjPlotMargin.bump;
                    this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos, xPos+50, yPos, 3, lineColor, [12, 4]);

                    xPos += 60;

                    ctx.font = "24px Arial";
                    ctx.fillStyle = lineColor;

                    ctx.fillText(
                            group,
                            xPos,
                            yPos
                        );

                    xPos += getWidth(group, 24, "Arial") + this.adjPlotMargin.bump;
                })
            }

            /// if there are markers
            if(this.hoverPos.length > 0) {

                
                this.hoverPos.map(h => {
                    let yPos1 = this.adjPlotMargin.top - this.adjPlotMargin.bump;
                    let yPos2 = this.adjPlotMargin.top + plotHeight + (this.adjPlotMargin.bump*3);

                    let xPos = xStart + (h - region.start) * xPerPixel;
                    this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 1, "#ff0000", [6, 2]);
                })
            }

            // if the region is expanded

            if(!!this.plotConfig['expand region by']) {

                let smallRegion = this.regionParam.split(":")[1].split("-");

                let yPos = this.adjPlotMargin.top + plotHeight + (this.adjPlotMargin.bump/2);
                let xPosStart = xStart + (smallRegion[0] - region.start) * xPerPixel;
                let xPosEnd = xStart + (smallRegion[1] - region.start) * xPerPixel;
                let xWidth = xPosEnd - xPosStart;

                ctx.fillStyle = "#FF0000";

                ctx.fillRect(
                    xPosStart,
                    yPos,
                    xWidth,
                    10
                );
    
            }
            ///
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
        resetPosMarker() {
				let xPosMarker = document.getElementById(this.sectionId + "_xPosMarker");
                xPosMarker.style.left = "0px";
                xPosMarker.style.top = "0px";
                xPosMarker.style.height = "1px";
		},

        checkPosition(e,action) {
            let rect = e.target.getBoundingClientRect();
                let X = Math.floor(e.clientX - rect.left);
                let Y = Math.floor(e.clientY - rect.top);

            let wrapperRect = document.getElementById("region_track_wrapper"+this.sectionId).getBoundingClientRect()

            this.getPosInfo(X,Y,action);

            if(action == "hover" && (X >= this.adjPlotMargin.left/2 && X <= (rect.width - this.adjPlotMargin.right/2)) && Y >= (rect.height - this.adjPlotMargin.bottom/2) ) {

                let xPosMarker = document.getElementById(this.sectionId + "_xPosMarker");
                xPosMarker.style.left = (X)+"px";
                xPosMarker.style.top = (wrapperRect.height - rect.height)+"px";
                xPosMarker.style.height = (rect.height - this.adjPlotMargin.bottom/2)+"px";

            } else {
				this.resetPosMarker();
			}

            if(action == "click" && (X >= this.adjPlotMargin.left/2 && X <= (rect.width - this.adjPlotMargin.right/2)) && Y >= (rect.height - this.adjPlotMargin.bottom/2) ) {

                const tempWidth = rect.width - (this.adjPlotMargin.left/2 + this.adjPlotMargin.right/2)
                const tempXPos = X-this.adjPlotMargin.left/2;
                let xPos = this.convertXPos(tempXPos, tempWidth);

                let itThere = false;
                let tempArr = [];

                if(this.hoverPos.length > 0) {
                    

                    this.hoverPos.map(h =>{

                    let xMargin = Math.floor((this.viewingRegion.end - this.viewingRegion.start)/tempWidth)*2;

                        if( h >= xPos - xMargin && h <= xPos + xMargin) {
                            itThere = true;
                        } else {
                            tempArr.push(h);
                        }
                    })

                    this.$root.hoverPos = tempArr;
                }
                
                if(!itThere) {
                    this.$root.hoverPos.push(Math.floor(xPos));
                }
                
            }
            
        },

        convertXPos(X,WIDTH) {

            let perPixel = ((this.viewingRegion.end - this.viewingRegion.start)/WIDTH);
            let xPos = (X * perPixel) + this.viewingRegion.start;

            return xPos;
        },

        getPosInfo(x,y,action) {

            if(this.infoBoxFrozen == false) {
                /*let rect = e.target.getBoundingClientRect();
                let x = Math.floor(e.clientX - rect.left);
                let y = Math.floor(e.clientY - rect.top);*/

                let wrapper = document.getElementById("block_data_" + this.sectionId);
                let contentWrapper = document.getElementById("block_data_content_" + this.sectionId);
                let canvas = document.getElementById("track_" + this.sectionId);

                if (action == "click") {
                    wrapper.setAttribute("style","");
                }
                
                let trackRows = Object.keys(this.posData);
                let blockData = [];
                let rowLabel = '';

                trackRows.map(row => {
                    let rowTop = Number(row);
                    let rowBottom = rowTop + Math.round(this.plotConfig["track height"]);

                    if (y >= rowTop && y <= rowBottom) {
                        rowLabel = this.posData[row].label;
                        this.posData[row]['regions'].map(block => {
                            if (x >= block.start && x <= block.end) {
                                blockData.push(block.data);
                            }
                        })
                    }
                })

                if (blockData.length > 0 || rowLabel != '') {
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
                                hoverContent += "<strong>" + h + "</strong>: <span>" + this.utils.Formatters.getHoverValue(b[h]) + "</span><br />";
                            })
                            hoverContent += "<br />";
                        } else if (action == "click") {
                            hoverContent += "<strong>" + b[this.plotConfig["render by"]] + "</strong><br />";
                            this.plotConfig["hover content"].map(h => {
                                hoverContent += "<strong>" + h + "</strong>: <span>" + this.utils.Formatters.getHoverValue(b[h]) + "</span><br />";
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

                    contentWrapper.innerHTML = (blockData.length > 0)? hoverContent : rowLabel;

                    if (action == "hover") {
                        wrapper.classList.remove("hidden");
                        wrapper.classList.add('hover');
                        wrapper.style.top = y + canvas.offsetTop + 25 + "px";
                        let xPosRatio = x / canvas.offsetWidth;
                        wrapper.style.left = x - (wrapper.offsetWidth * xPosRatio) + canvas.offsetLeft + "px";
                        document.getElementById("block_data_" + this.sectionId).classList.remove("fixed-info-box");
                    
                        document.getElementById("track_" + this.sectionId).classList.add("hover");
                    } else {
                        wrapper.classList.remove('hover');
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
    display: inline-block;
}

.color-groups span {
    display: inline-block;
}

.color-groups:hover {
    cursor: pointer;
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
    position:relative;
    padding: 0 !important;
}

.region-track {
    position: relative;
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

.block-data.hover .fixed-info-box-close {
    display: none;
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

.x-pos-marker {
    position:absolute;
    top:0;
    left:0;
    color: #ff0000;
    border-left:solid 1px #ff0000;
}

</style>