<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12">
			<!-- place info modal here-->
			<div
				:id="'genesTrackWrapper' + sectionId"
				class="genes-plot-wrapper"
			>
				<canvas
					:id="'genesTrack'+sectionId"
					@resize="onResize"
					width=""
					height=""
				></canvas>
			</div>
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

export default Vue.component("multi-genes-track", {
	props: [
		"region",
		"genesData",
		"plotConfig",
		"plotType",
		"plotMargin",
		"regionZoom",
		"regionViewArea",
		"utils",
		"sectionId",
		"starItems"
	],
	data() {
		return {
			plotRendered: 0,
			localGenesData: null,
		};
	},
	modules: {
		//uiUtils,
		//Formatters,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		if(!!this.genesData) {
			this.renderTrack(this.genesData);
		} else {
			this.getGenesInRegion(this.region)
		}
	},
	created() {
		//this.$root.$refs.genesTrack = this;
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

				//console.log("multi genes track", plotMargin);

			return plotMargin;
		},
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":")[1].split("-");
			returnObj["start"] = regionArr[0];
			returnObj["end"] = regionArr[1];

			return returnObj;
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
		codingGenes() {
			let codingGenesData = this.genesData;
			return codingGenesData;
		},
	},
	watch: {
		codingGenes(DATA) {
			this.renderTrack(this.genesData);
		},
		viewingRegion: {
			handler: function (n, o) {
				//consolee.log("n",n);
				if(!!this.genesData){
					this.renderTrack(this.genesData);
				} else {
					this.getGenesInRegion(n.chr+":"+n.start+"-"+n.end);
				}
			},
			deep: true,
			immediate: true,
		},
		starItems(STARS){
			if (!this.genesData) {
				this.renderTrack(this.localGenesData);
			} else {
				this.renderTrack(this.genesData);
			}
		}
	},
	methods: {
		//...uiUtils,
		onResize(e) {
			if(!this.genesData){
				this.renderTrack(this.localGenesData);
			} else {
				this.renderTrack(this.genesData);
			}
			
		},
		renderTrack(GENES) {

			if (!!document.getElementById("genesTrackWrapper"+this.sectionId)) {
				let genesArray = GENES;
				let canvasRenderWidth, canvasRenderHeight;
				let eachGeneTrackHeight = 60; //15: gene name, 10: gene track, 5: space between tracks

				canvasRenderWidth = !!this.plotConfig.width
					? this.plotConfig.width * 2 +
					  this.adjPlotMargin.left +
					  this.adjPlotMargin.right
					: document.getElementById("genesTrackWrapper" + this.sectionId).clientWidth *2;

				let plotWidth =
					this.plotType == "region plot"
						? canvasRenderWidth - this.adjPlotMargin.left * 2
						: canvasRenderWidth -
						(this.adjPlotMargin.left +
							this.adjPlotMargin.right);

				//let plotHeight = eachGeneTrackHeight * genesArray.length;

				let xMin = Number(this.viewingRegion.start),
					xMax = Number(this.viewingRegion.end);

				let xStart = this.adjPlotMargin.left;
				let yStart = this.adjPlotMargin.top;
				let xPosByPixel = plotWidth / (xMax - xMin);

				let takenGeneRegions = [];
				let geneIndex = 0;

				genesArray.map((gene) => {
					if (gene.start <= xMax && gene.end >= xMin) {
						let xStartPos =
							gene.start > xMin
								? xStart + (gene.start - xMin) * xPosByPixel
								: xStart;
						let xEndPos =
							gene.end < xMax
								? xStart + (gene.end - xMin) * xPosByPixel
								: xStart + (xMax - xMin) * xPosByPixel;



						let renderRegionTaken = false;

						takenGeneRegions.map(r => {
							if ((xStartPos >= r.start && xStartPos <= r.end)
								|| (xEndPos >= r.start && xEndPos <= r.end)) {
								renderRegionTaken = true;
							}
						})

						if (takenGeneRegions.length != 0 && renderRegionTaken == true) {
							takenGeneRegions = [];
							geneIndex++;
						}

						takenGeneRegions.push({ start: xStartPos - 100, end: xEndPos + 100 });
					}
				})


				canvasRenderHeight =
					this.adjPlotMargin.top +
					eachGeneTrackHeight * (geneIndex+1)//genesArray.length; // no this.adjPlotMargin.bottom is needed here since there is no plot label needed

				let bump = this.adjPlotMargin.bump;

				

				let c = document.getElementById("genesTrack" + this.sectionId);
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

				ctx.font = "italic bold 24px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000000";

				takenGeneRegions = [];
				geneIndex = 0;
				genesArray.map((gene) => {
					if (gene.start <= xMax && gene.end >= xMin) {
						let xStartPos =
							gene.start > xMin
								? xStart + (gene.start - xMin) * xPosByPixel
								: xStart;
						let xEndPos =
							gene.end < xMax
								? xStart + (gene.end - xMin) * xPosByPixel
								: xStart + (xMax - xMin) * xPosByPixel;

						

						let renderRegionTaken = false;

						takenGeneRegions.map(r=>{
							if((xStartPos >= r.start && xStartPos <= r.end)
								|| (xEndPos >= r.start && xEndPos <= r.end)) {
							renderRegionTaken = true;
							}
						})

						if (takenGeneRegions.length != 0 && renderRegionTaken == true) {
							takenGeneRegions = [];
							geneIndex ++;
						}

						takenGeneRegions.push({ start: xStartPos - 100, end: xEndPos + 100 });

						let yPos = this.adjPlotMargin.top + geneIndex * eachGeneTrackHeight;

						var left = "\u{2190}";
						var right = "\u{2192}";

						let geneName =
							gene.strand == "+"
								? gene.gene_name + " " + right
								: left + " " + gene.gene_name;

						ctx.fillText(
							geneName,
							xStartPos + (xEndPos - xStartPos) / 2,
							yPos
						);

						ctx.beginPath();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "#000000";
						ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

						ctx.moveTo(xStartPos, yPos + 20);
						ctx.lineTo(xEndPos, yPos + 20);
						ctx.stroke();

						gene.exons.map((exon) => {
							//console.log(gene.gene_name, ": ", exon.start, exon.end);

							if (exon.start < xMax && exon.end > xMin) {
								let xonStartPos =
									exon.start > xMin
										? xStart +
										  (exon.start - xMin) * xPosByPixel
										: xStart;
								let xonEndPos =
									exon.end < xMax
										? xStart +
										  (exon.end - xMin) * xPosByPixel
										: xStart + (xMax - xMin) * xPosByPixel;

								let xonWidth =
									xonEndPos - xonStartPos <= 1
										? 1
										: xonEndPos - xonStartPos;

								ctx.fillRect(
									xonStartPos,
									yPos + 10,
									xonWidth,
									20
								);
							}
						});
					}
				});

				if(!!this.starItems) {
					let yPos1 = this.adjPlotMargin.top - (this.adjPlotMargin.bump * 3);
					let yPos2 = this.adjPlotMargin.top + (GENES.length * eachGeneTrackHeight);

					this.starItems.map(star => {
						let xPos = xStart + (star.columns[this.plotConfig["x axis field"]] - xMin) * xPosByPixel;

						this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 3, "#FFAA0055", [6, 2]);
					})
				}
			}
		},
		async getGenesInRegion(region) {

			let fetchUrl = "https://bioindex.hugeamp.org/api/bio/query/genes?q=" + region;
			let genes = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

			if (genes.error == null) {
				let genesInRegion = JSON.parse(genes);
				let codingGenes = "";

				if (!!genesInRegion["data"] && genesInRegion["data"].length > 1) {
					genesInRegion["data"].map((gene) => {
						if ((gene.type = "protein_coding")) {
							codingGenes += "'" + gene.name + "',";
						}
					});

					codingGenes = codingGenes.slice(0, -1);

					if (codingGenes.length > 1) {
						this.getGenesData(codingGenes);
					}
				}
			}
		},
		async getGenesData(GENES) {

			let fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 3 and gene_name in " + GENES;
			let genesData = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

			if (genesData.error == null) {
				this.localGenesData = JSON.parse(genesData).data;
				this.renderTrack(this.localGenesData);
			}
		},
	},
});

$(function () {});
</script>

<style>
.genes-plot-wrapper {
	padding: 0 !important;
	width: 100% !important;
}
</style>



