<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 genes-plot-wrapper">
			<div
				id="genesTrackWrapper"
				:class="plotType == 'region plot' ? 'col-md-9' : 'col-md-12'"
			>
				<canvas
					id="genesTrack"
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
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-genes-track", {
	props: [
		"region",
		"genesData",
		"plotConfig",
		"plotType",
		"plotMargin",
		"regionZoom",
		"regionViewArea",
	],
	data() {
		return {
			plotRendered: 0,
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
				//if (n.length > 0) {
				this.renderTrack(this.genesData);
				//}
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		...uiUtils,
		onResize(e) {
			this.renderTrack(this.genesData);
		},
		renderTrack(GENES) {
			//console.log("GENES", GENES);

			if (!!document.getElementById("genesTrackWrapper")) {
				let genesArray = GENES;
				let canvasRenderWidth, canvasRenderHeight;
				let eachGeneTrackHeight = 60; //15: gene name, 10: gene track, 5: space between tracks

				canvasRenderWidth = !!this.plotConfig.width
					? this.plotConfig.width * 2 +
					  this.plotMargin.leftMargin +
					  this.plotMargin.rightMargin
					: document.getElementById("genesTrackWrapper").clientWidth *
							2 -
					  60; // -30 for padding

				canvasRenderHeight =
					this.plotMargin.topMargin +
					eachGeneTrackHeight * genesArray.length; // no this.plotMargin.bottomMargin is needed here since there is no plot label needed

				let bump = this.plotMargin.bump;

				let plotWidth =
					this.plotType == "region plot"
						? canvasRenderWidth - this.plotMargin.leftMargin * 2
						: canvasRenderWidth -
						  (this.plotMargin.leftMargin +
								this.plotMargin.rightMargin);

				let plotHeight = eachGeneTrackHeight * genesArray.length;

				let c = document.getElementById("genesTrack");
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

				let xMin = Number(this.viewingRegion.start),
					xMax = Number(this.viewingRegion.end);

				let xStart = this.plotMargin.leftMargin;
				let yStart = this.plotMargin.topMargin;
				let xPosByPixel = plotWidth / (xMax - xMin);

				ctx.font = "italic bold 24px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000000";

				console.log(genesArray);

				genesArray.map((gene, geneIndex) => {
					if (gene.start <= xMax && gene.end >= xMin) {
						let xStartPos =
							gene.start > xMin
								? xStart + (gene.start - xMin) * xPosByPixel
								: xStart;
						let xEndPos =
							gene.end < xMax
								? xStart + (gene.end - xMin) * xPosByPixel
								: xStart + (xMax - xMin) * xPosByPixel;

						let yPos =
							this.plotMargin.topMargin +
							geneIndex * eachGeneTrackHeight;

						//yPos += yPos % 1 == 0 ? 0.5 : 0;

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
			}
		},
	},
});

$(function () {});
</script>

<style>
.genes-plot-wrapper {
	padding: 0 !important;
}
</style>



