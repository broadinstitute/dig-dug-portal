<template>
	<div class="mbm-plot-content row">
			<span v-if="!!this.selectedSplice">
				Splicing event data for {{ this.exonData[0].gene_name }}, {{ this.spliceData[0].tissue }}
			</span>
			<span v-else>
				Select a splice track to view from the table below.
			</span>
		<div class="col-md-12">
			<!-- place info modal here-->
			<div
				:id="'spliceTrackWrapper' + sectionId"
				class="genes-plot-wrapper"
			>
				<canvas :class="!exonData ? 'hidden' : ''"
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
			gene: null
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
		console.log("Making the research splice track");
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
			return {
				start: this.gene.start,
				end: this.gene.end
			};
		},
		viewingRegion() {
			return this.gene === null 
				? null 
				: {
					chr: this.gene.chromosome,
					start: this.gene.start,
					end: this.gene.end
				};
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
			this.gene = await(this.getGene(gene));
			this.spliceData = await(this.getSplices(ensembl, tissue));
			console.log(JSON.stringify(this.spliceData[0]));
			this.exonData = await(this.getExons(gene));
			this.calculatePlot();
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

			GENES.map(g => tracks[0].push(g));

			tracks = tracks.filter(t => t.length > 0);

			return tracks;
		},

		getWidth (ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderTrack(GENES) {
			console.log("Number of exons:", GENES.length);
			if (this.gene === null){
				return;
			}

			let canvasRenderWidth, canvasRenderHeight;

			if (!!document.getElementById("spliceTrackWrapper"+this.sectionId)) {

				
				let eachGeneTrackHeight = 45; // 10: gene track, 5: space between tracks

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


				let xMin = this.viewingRegion.start,
					xMax = this.viewingRegion.end;

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
					eachGeneTrackHeight * 10; // Arbitrarily making this 10 tracks deep

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
					genesArray.map((gene, geneSubIndex) => {

						let yPos = this.adjPlotMargin.top + (geneSubIndex % 10) * eachGeneTrackHeight;

						var left = "\u{2190}";
						var right = "\u{2192}";

						let geneName =
							gene.strand == "+"
								? gene.gene_name + " " + right
								: left + " " + gene.gene_name;

						let xonWidth =
									gene.xEndPos - gene.xStartPos <= 1
										? 1
										: gene.xEndPos - gene.xStartPos;
						
						ctx.fillRect(
									gene.xStartPos,
									yPos + 10,
									xonWidth,
									20
								);
					})
				});
				// Add splicing events
				for (let i = 0; i < this.spliceData.length; i++){
					let splice = this.spliceData[i];
					let spliceMidpoint = xStart + (splice.midpoint - xMin) * xPosByPixel;
					let spliceStart = xStart + (splice.splice_start - xMin) * xPosByPixel;
					let spliceEnd = xStart + (splice.splice_end - xMin) * xPosByPixel;
					let spliceWidth = spliceEnd - spliceStart;
					let yPos = this.adjPlotMargin.top;
					this.renderDot(ctx, spliceStart, yPos, "#00FF00");
					this.renderDot(ctx, spliceEnd, yPos, "#FF0000");
					ctx.fillStyle = "#efefef99";
					console.log(JSON.stringify(this.colors));
					ctx.fillRect(spliceStart,yPos,spliceWidth,20);
				}
			}			
			
		},
		renderDot(CTX, XPOS, YPOS, DOT_COLOR, WIDTH) {
			// Taken from ResearchRegionPlot
			CTX.fillStyle = DOT_COLOR;
			CTX.lineWidth = 0;
			CTX.beginPath();
			let width = !!WIDTH? WIDTH: 9;
			CTX.arc(XPOS, YPOS, width, 0, 2 * Math.PI);
			CTX.fill();
		},
		async getSplices(ensembl, tissue){
			let splices = await fetch(`${this.biHost}/splices?q=${ensembl},${tissue}`)
				.then(resp => resp.json());
			return this.getSpliceMidpoints(splices.data);
		},
		getSpliceMidpoints(splices){
			let output = structuredClone(splices);
			for (let i = 0; i < output.length; i++){
				output[i].midpoint = (output[i].splice_start + output[i].splice_end)/2;
			}
			return output;
		},
		async getExons(gene){
			let exons = await fetch(`${this.biHost}/exons?q=${gene}`)
				.then(resp => resp.json());
			return exons.data;
		},
		async getGene(geneName){
			let gene = await fetch(`${this.biHost}/gene?q=${geneName}`)
				.then(resp => resp.json());
			return gene.data[0];
		},
		calculatePlot(){
			let strand = this.exonData[0].strand;
			let start_splice_event = this.spliceStart(strand);
			let end_splice_event = this.spliceEnd(strand);
			let validExons = structuredClone(this.exonData);
			validExons = validExons.filter(e => 
				!!this.validExon(strand, e, start_splice_event, end_splice_event));
			console.log(validExons.length);
		},
		spliceStart(strand){
			let sortedStart = this.spliceData.toSorted((a,b) => a.splice_start - b.splice_start);
			return strand === "+"
				? sortedStart[0].splice_start
				: sortedStart[sortedStart.length - 1].splice_start;
		},
		spliceEnd(strand){
			let sortedEnd = this.spliceData.toSorted((a,b) => a.splice_end - b.splice_end);
			return strand === "+"
				? sortedEnd[sortedEnd.length - 1].splice_end
				: sortedEnd[0].splice_end;
		},
		validExon(strand, exon, start_splice_event, end_splice_event){
			if (strand === "-"){
				return exon.exon_start < (start_splice_event + 5000) &&
					exon.exon_end > (end_splice_event - 5000);
			}
			return exon.exon_start > (start_splice_event - 5000) &&
				exon.exon_end < (end_splice_event + 5000);
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
.hidden {
	display: none;
}
</style>



