<template>
    <div class="mbm-plot-content row">
        <div
            id="genesTrackWrapper"
            :class="plotType == 'score_plot' ? 'col-md-12' : 'col-md-9'"
        >
            <canvas
                id="genesTrack"
                @resize="onResize"
                width=""
                height=""
                style="border: solid 1px #aaa"
            ></canvas>
        </div>
        {{ plotType }}<br />
        {{ region }}<br />
        {{ genesData }}
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-genes-track", {
    props: ["region", "genesData", "plotConfig", "plotType"],
    data() {
        return {
            plotRendered: 0,
            leftMargin: 74.5, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            rightMargin: 0.5,
            topMargin: 10.5, // -0.5 to draw crisp line
            bottomMargin: 10.5,
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    components: {},
    mounted: function () {
        window.addEventListener("resize", this.onResize);
        this.renderTrack(this.genesData);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        searchingRegion() {
            let returnObj = {};
            let regionArr = this.region.split(":")[1].split("-");
            returnObj["start"] = regionArr[0];
            returnObj["end"] = regionArr[1];

            return returnObj;
        },
        codingGenes() {
            let codingGenesData = this.genesData;
            return codingGenesData;
        },
    },
    watch: {
        codingGenes(DATA) {
            this.renderTrack(this.genesData);
        },
    },
    methods: {
        ...uiUtils,
        onResize(e) {
            this.renderTrack(this.genesData);
        },
        renderTrack(GENES) {
            let genesArray = GENES;
            let canvasRenderWidth, canvasRenderHeight;
            let eachGeneTrackHeight = 30; //15: gene name, 10: gene track, 5: space between tracks

            canvasRenderWidth = !!this.plotConfig.width
                ? this.plotConfig.width + this.leftMargin + this.rightMargin
                : document.getElementById("genesTrackWrapper").clientWidth - 30; // -30 for - padding

            canvasRenderHeight =
                this.topMargin +
                this.bottomMargin +
                eachGeneTrackHeight * genesArray.length;

            let xBump = canvasRenderWidth * 0.03;
            let yBump = canvasRenderHeight * 0.02;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);

            let plotHeight = eachGeneTrackHeight * genesArray.length;

            let c = document.getElementById("genesTrack");
            c.setAttribute("width", canvasRenderWidth);
            c.setAttribute("height", canvasRenderHeight);
            let ctx = c.getContext("2d");

            ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

            let xMin = Number(this.searchingRegion.start),
                xMax = Number(this.searchingRegion.end);

            let xStart = this.leftMargin + 5;
            let yStart = this.topMargin;
            let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

            ctx.font = "italic bold 12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            genesArray.map((gene, geneIndex) => {
                let xStartPos =
                    gene.start > xMin
                        ? xStart + (gene.start - xMin) * xPosByPixel
                        : xStart;
                let xEndPos =
                    gene.end < xMax
                        ? xStart + (gene.end - xMin) * xPosByPixel
                        : xStart + (xMax - xMin) * xPosByPixel;

                let yPos = this.topMargin + yBump + geneIndex * 30;

                yPos += yPos % 1 == 0 ? 0.5 : 0;

                let geneName =
                    gene.strand == "+"
                        ? gene.gene_name + " >>"
                        : "<< " + gene.gene_name;

                ctx.fillText(
                    geneName,
                    xStartPos + (xEndPos - xStartPos) / 2,
                    yPos
                );

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#000000";
                ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

                ctx.moveTo(xStartPos, yPos + 10);
                ctx.lineTo(xEndPos, yPos + 10);
                ctx.stroke();

                gene.exons.map((exon) => {
                    let xonStartPos =
                        exon.start > xMin
                            ? xStart + (exon.start - xMin) * xPosByPixel
                            : xStart;
                    let xonEndPos =
                        exon.end < xMax
                            ? xStart + (exon.end - xMin) * xPosByPixel
                            : xStart + (xMax - xMin) * xPosByPixel;

                    let xonWidth = xonEndPos - xonStartPos;

                    ctx.fillRect(xonStartPos, yPos + 5, xonWidth, 10);
                });

                console.log(gene.start);
                console.log(gene.end);
                console.log(gene.strand);
                console.log(xMin, ":", xMax);
            });
        },
    },
});

$(function () {});
</script>

<style>
.region-plot-default-legend span {
    font-size: 12px;
    display: inline-block;
    margin-right: 5px;
}
.plot-legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 12px;
}
#manhattanPlot.hover,
#ldPlot.hover {
    cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

#clicked_dot_value,
#ld_clicked_dot_value {
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

.dot-value-full-list,
.ld-dot-value-full-list {
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

#dot_value_full_list_content,
#ld_dot_value_full_list_content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 14px;
}
</style>



