<template>
	<div :id="'region_region_wrapper' + sectionId" class="region-region-wrapper">
		<canvas v-if="!!renderConfig" :id="'region_region_' + sectionId" class="region-region-plot"
			width="" height="">
		</canvas>
	</div>
	
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("region-region-plot", {
	props: [
		"renderConfig",
		"plotMargin",
		"pkgData",
		"isSectionPage",
		"sectionId",
		"utils",
		"colors",
		"region"
	],
	data() {
		return {
			wideRegion: null,
			bigRegion: null,
			viewingRegion: null
		};
	},
	modules: {
	},
	components: {
	},
	mounted: function () {
		this.setViewingRegion();
		this.setWideRegion();
		this.renderPlot();
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		adjPlotMargin() {

			let customPlotMargin = !!this.renderConfig["plot margin"] ? this.renderConfig["plot margin"] : null;

			let plotMargin = !!customPlotMargin ? {
				left: 50,
				right: 50,
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
	},
	watch: {
		viewingRegion(REGION) {
			this.renderPlot();
		},
		wideRegion(REGION) {
			this.renderPlot();
			this.getGenesInRegion(REGION);
		},
		region(REGION) {
			console.log("called");
			this.setViewingRegion();
			this.setWideRegion();
			this.renderPlot();
		}
	},
	methods: {
		setWideRegion() {
			
			let regionArr = this.region.split(":");
			let range = this.renderConfig['region explorer']['expand region by'] / 2;

			this.wideRegion = {
				chr: regionArr[0],
				start: Number(regionArr[1].split("-")[0]) - range,
				end: Number(regionArr[1].split("-")[1]) + range
			}

			this.bigRegion = this.wideRegion.chr + ":" + this.wideRegion.start + "-" + this.wideRegion.end;
		},
		setViewingRegion() {
			let param = this.region//this.utils.keyParams[this.renderConfig["region"]];
			if (!!param) {
				let regionArr = param.split(":");

				let region = {
					chr: regionArr[0],
					start: regionArr[1].split("-")[0],
					end: regionArr[1].split("-")[1]
				}
				this.viewingRegion = region
			} else {
				this.viewingRegion = null;
			}
		},
		async getGenesInRegion(region) {

			let fetchUrl;
			let searchPoint = (!!!!this.plotConfig && !!this.plotConfig["genes track"])? this.plotConfig["genes track"]["search point"]: null;

			if (!!searchPoint) {
				fetchUrl = searchPoint + "/api/bio/query/genes?q=" + region;
			} else {
				fetchUrl = this.utils.uiUtils.biDomain() + "/api/bio/query/genes?q=" + this.bigRegion;
			}

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
						console.log("codingGenes", codingGenes);
						this.getGenesData(codingGenes);
					}
				}
			}
		},
		async getGenesData(GENES) {
			
			let fetchUrl;
			if (!!this.plotConfig && !!this.plotConfig["genome reference"] && this.plotConfig["genome reference"] == "GRCh38") {
				fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 1 and gene_name in " + GENES;
			} else if (!this.plotConfig || !this.plotConfig["genome reference"] ||
				(!!this.plotConfig["genome reference"] && 
				(this.plotConfig["genome reference"] == "GRCh37" || this.plotConfig["genome reference"] == "hg19"))) {
				fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 3 and gene_name in " + GENES;
			}

			let genesData = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

			if (genesData.error == null) {

				this.localGenesData = JSON.parse(genesData).data;

				this.localGeneTypes = [...new Set(this.localGenesData.filter(g => g.gene_type == "protein_coding"))]

				console.log("this.localGeneTypes", this.localGeneTypes);

				//this.renderTrack(this.localGenesData);
			}
		},
		renderPlot() {
			let canvasWidth = document.querySelector("#region_region_wrapper" + this.sectionId).clientWidth * 2;
			let canvasHeight = 20 + this.adjPlotMargin.top + this.adjPlotMargin.bottom;

			let c, ctx;

			c = document.getElementById(
				'region_region_' + this.sectionId
			);
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			c.setAttribute(
				"style",
				"background-color: #ffffff;" +
				"width: " +
				canvasWidth / 2 +
				"px;height:" +
				canvasHeight / 2 +
				"px;"
			);

			ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			let plotHeight = 50;
			let plotWidth = canvasWidth - (this.adjPlotMargin.left + this.adjPlotMargin.right);
			let wRegion = this.wideRegion;
			let vRegion = this.viewingRegion;
			let xPerPixel = plotWidth / (wRegion.end - wRegion.start);

			console.log(vRegion,wRegion);

			this.renderAxis(ctx,
				plotWidth,
				plotHeight,
				Number(wRegion.end),
				Number(wRegion.start),
				this.adjPlotMargin.top,
				this.adjPlotMargin);

			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			let getWidth = function (text, fontSize, fontFace) {
				context.font = fontSize + 'px ' + fontFace;
				return context.measureText(text).width;
			}

			let trackTop = this.adjPlotMargin.top;

			let xPosStart = ((vRegion.start - wRegion.start) * xPerPixel) + this.adjPlotMargin.left;

			let xPosEnd = ((vRegion.end - wRegion.start) * xPerPixel) + this.adjPlotMargin.left;

			let xPosWidth = xPosEnd - xPosStart

			

			ctx.fillStyle = "#FF0000"
			ctx.fillRect(
				xPosStart - 2,
				trackTop - 2,
				xPosWidth + 4,
				20
			);
			
/*
			tracks.map(track => {
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

				regionKeys.map(blocks => {

					regionData[blocks].map((block, bIndex) => {

						let blockRegion = block[this.plotConfig["render by"]].split("-");

						let blockStart = blockRegion[0];
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
								this.posData[Math.round(trackTop / 2)] = { 'label': track, 'regions': [] };
							}

							this.posData[Math.round(trackTop / 2)]['regions'].push({ start: Math.round(xPosStart / 2), end: Math.round((xPosStart + xPosWidth) / 2), data: block });
						}
					})

				})
				trackIndex++;
			})

			let xStart = this.adjPlotMargin.left;
			if (!!this.starItems) {
				let yPos1 = this.adjPlotMargin.top - this.adjPlotMargin.bump;
				let yPos2 = this.adjPlotMargin.top + plotHeight + (this.adjPlotMargin.bump * 3);

				this.starItems.map(star => {
					let xPos = xStart + (star.columns[this.plotConfig["x axis field"]] - region.start) * xPerPixel;
					let lineColor = this.colors.moderate[this.starGroups.indexOf(star.section) % 16];

					this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos1, xPos, yPos2, 3, lineColor, [6, 2]); //"#FFAA0055"
				})

				let xPos = this.adjPlotMargin.bump
				this.starGroups.map((group, gIndex) => {

					let lineColor = this.colors.bold[gIndex]
					let yPos = this.adjPlotMargin.top + plotHeight + this.adjPlotMargin.bottom - this.adjPlotMargin.bump;
					this.utils.plotUtils.renderDashedLine(ctx, xPos, yPos, xPos + 50, yPos, 3, lineColor, [12, 4]);

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
			}*/
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

		onResize(e) {
			this.setViewingRegion();
			this.setWideRegion();
			this.renderPlot();
		},
	},
});

$(function () { });
</script>

<style scoped>
.region-region-wrapper {
	padding: 0 !important;
}
.region-region-plot {
	
}
</style>



