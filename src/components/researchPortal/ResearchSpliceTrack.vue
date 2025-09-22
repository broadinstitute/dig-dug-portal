<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12">
			<!-- place info modal here-->
			SPLICE TRACK CANVAS
			<div
				:id="'spliceTrackWrapper' + sectionId"
				class="genes-plot-wrapper"
			>
				<canvas
					:id="'spliceTrack'+sectionId"
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
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-splice-track", {
	props: [
		"plotConfig",
		"plotType",
		"plotMargin",
		"regionZoom",
		"utils",
		"sectionId",
		"hoverPos"
	],
	data() {
		return {
			plotRendered: 0,
			localGenesData: null,
			renderingGenes: [],
			biHost: "https://vision.hugeampkpnbi.org/api/bio/query",
			spliceData: null,
			exonData: null,
			region: null,
		};
	},
	modules: {
		//uiUtils,
		//Formatters,
	},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		if(!!this.exonData) {
			this.renderTrack(this.exonData);
		}
	},
	created() {
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
				if (this.regionZoom == 0) {
					returnObj["chr"] = chr;
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
		selectedSplice(){
			return this.$store.state.selectedSplice;
		},
	},
	watch: {
		viewingRegion: {
			handler: function (n, o) {
				if(!!this.exonData){
					this.renderTrack(this.exonData);
				}
			},
			deep: true,
			immediate: true,
		},
		async selectedSplice(newData){
			let spliceParams = newData.split("___");
			let gene = spliceParams[0];
			let ensembl = spliceParams[1];
			let tissue = spliceParams[2];
			this.region = await(this.getSingleGeneRegion(gene));
			this.spliceData = await(this.getSplices(ensembl, tissue));
			this.exonData = await(this.getExons(gene));
			this.renderTrack(this.exonData);
		}
	},
	methods: {
		//...uiUtils,
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.sectionId + '_spliceTrack'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "spliceTrack"+this.sectionId);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
		},
		onResize(e) {
			if(!this.exonData){
				this.renderTrack(this.exonData);
			}
			
		},

		sortGenesByRegion(GENES) {
			let tracks = [];
			let gIndex = 0;

			// canvas is required to use getWidth function
			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			GENES.map(g => {
				tracks[gIndex] = [];
				gIndex ++;
			})

			GENES.map(g => {
				if( true) {
					if (tracks[0].length == 0 || true) { // let's just sort them all in one bucket for now
						tracks[0].push(g);
					} else {
						let gTaken = false;
						tracks.map(t => {
							if (t.length > 0 && gTaken == false) {

								let lastGene = t[t.length - 1];

								//measuring if the regioon of the last gene is bigger than the gene label
								//console.log("t", t);
								let lastGeneWidth = lastGene.xEndPos - lastGene.xStartPos;
								let newGeneWidth = g.xEndPos - g.xStartPos;
								

								let geneLabelWidth = this.getWidth(context, g.gene_name + " " +"\u{2190}", 24, "Arial");

								let endPos = (lastGeneWidth <= geneLabelWidth) ? ((geneLabelWidth - lastGeneWidth)/2)+lastGene.xEndPos: lastGene.xEndPos;
								let startPos = (newGeneWidth <= geneLabelWidth) ? g.xStartPos - ((geneLabelWidth - newGeneWidth) / 2) : g.xStartPos;

								/*
								let endPos = (lastGeneWidth <= 100) ? ((100- lastGeneWidth)/2)+lastGene.xEndPos: lastGene.xEndPos;
								let startPos = (newGeneWidth <= 100) ? g.xStartPos - ((100 - newGeneWidth) / 2) : g.xStartPos;
								*/

								if (endPos <= startPos) {
									t.push(g)
									gTaken = true;
								}
							} else if (t.length == 0 && gTaken == false) {
								t.push(g)
								gTaken = true;
							}
						})
					}
				}
			})

			tracks = tracks.filter(t => t.length > 0);

			return tracks;
		},

		getWidth (ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderTrack(GENES) {

			let canvasRenderWidth, canvasRenderHeight;

			if (!!document.getElementById("spliceTrackWrapper"+this.sectionId)) {

				
				let eachGeneTrackHeight = 60; //15: gene name, 10: gene track, 5: space between tracks

				canvasRenderWidth = !!this.plotConfig.width
					? this.plotConfig.width * 2 +
					  this.adjPlotMargin.left +
					  this.adjPlotMargin.right
					: document.getElementById("spliceTrackWrapper" + this.sectionId).clientWidth *2;

				let plotWidth =
					this.plotType == "region plot"
						? canvasRenderWidth - this.adjPlotMargin.left * 2
						: canvasRenderWidth -
						(this.adjPlotMargin.left +
							this.adjPlotMargin.right);

				//let plotHeight = eachGeneTrackHeight * geneTracksArray.length;

				let xMin = Number(this.viewingRegion.start),
					xMax = Number(this.viewingRegion.end);
				console.log(xMin, xMax);

				let xStart = this.adjPlotMargin.left;
				let yStart = this.adjPlotMargin.top;
				let xPosByPixel = plotWidth / (xMax - xMin);

				let genesSorted = this.utils.sortUtils.sortArrOfObjects(GENES, 'start', 'number', 'asc')
									.filter(g => g.exon_start <= xMax && g.exon_end >= xMin);

				genesSorted.map(gene =>{

					let xStartPos =
						gene.exon_start > xMin
							? xStart + (gene.exon_start - xMin) * xPosByPixel
							: xStart;
					let xEndPos =
						gene.exon_end < xMax
							? xStart + (gene.exon_end - xMin) * xPosByPixel
							: xStart + (xMax - xMin) * xPosByPixel;

					gene["xStartPos"] = xStartPos;
					gene["xEndPos"] = xEndPos;
				})

				let geneTracksArray = this.sortGenesByRegion(genesSorted);

				this.renderingGenes = geneTracksArray;

				canvasRenderHeight =
					this.adjPlotMargin.top +
					eachGeneTrackHeight * geneTracksArray.length;

				let bump = this.adjPlotMargin.bump;

				let c = document.getElementById("spliceTrack" + this.sectionId);
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

				geneTracksArray.map((genesArray, geneIndex) => {
					genesArray.map(gene => {

						let yPos = this.adjPlotMargin.top + geneIndex * eachGeneTrackHeight;

						var left = "\u{2190}";
						var right = "\u{2192}";

						let geneName =
							gene.strand == "+"
								? gene.gene_name + " " + right
								: left + " " + gene.gene_name;

						ctx.fillText(
							geneName,
							gene.xStartPos + (gene.xEndPos - gene.xStartPos) / 2,
							yPos
						);

						ctx.beginPath();
						ctx.lineWidth = 1;
						ctx.strokeStyle = "#000000";
						ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

						ctx.moveTo(gene.xStartPos, yPos + 20);
						ctx.lineTo(gene.xEndPos, yPos + 20);
						ctx.stroke();
						let xonWidth =
									gene.xEndPos - gene.xStartPos <= 1
										? 1
										: gene.xEndPos - gene.xStartPos;
						console.log(geneName, gene.xStartPos, xonWidth);
						ctx.fillRect(
									gene.xStartPos,
									yPos + 10,
									xonWidth,
									20
								);

						/* gene.exons.map((exon) => {

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
						}); */
					})
				})
			}			
			
		},
		async getSplices(ensembl, tissue){
			let splices = await fetch(`${this.biHost}/splices?q=${ensembl},${tissue}`)
				.then(resp => resp.json());
			return splices.data;
		},
		async getExons(gene){
			let exons = await fetch(`${this.biHost}/exons?q=${gene}`)
				.then(resp => resp.json());
			return exons.data;
		},
		async getSingleGeneRegion(geneName){
			let gene = await fetch(`${this.biHost}/gene?q=${geneName}`)
				.then(resp => resp.json());
			return `${gene.chromosome}:${gene.start}-${gene.end}`;
		}
	},
});

$(function () {});
</script>

<style>
.genes-track-setting {
	position: absolute;
	top: -10px;
	right: 5px;
}

.genes-track-setting .options-gear {
	color: #333333;
	padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    margin-right: 10px;
    border: solid 1px #dddddd;
}

.genes-track-setting .options-gear > svg {
	font-size: 12px !important;
}

.genes-track-setting:hover .options-gear {
	color: #000000;
}

.genes-track-setting ul.options {
	display: none;
	position: absolute;
    background-color: #ffffff;
    padding: 15px;
    border: solid 1px #dddddd;
    border-radius: 5px;
    z-index: 10;
    list-style: none;
	right: 0;
	box-shadow: 0px 5px 5px 5px rgb(0 0 0 / 20%)
}

.genes-track-setting ul.options li {
	white-space: nowrap;
}

.genes-track-setting ul.options li label {
	padding-left: 5px;
}

.genes-track-setting:hover ul.options {
	display: block;
}

.genes-plot-wrapper {
	padding: 0 !important;
	width: 100% !important;
}
</style>



