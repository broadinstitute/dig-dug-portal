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
					@mousemove="checkPosition"
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
			biHost: "https://vision.hugeampkpnbi.org/api/bio/query",
			spliceData: null,
			exonData: null,
			gene: null,
			spliceVisualMap: [],
			exonVisualMap: [],
			hoverTent: -1,
			hoverExon: -1,
			colors: {
				green: "#00FF00",
				gray: "#DDDDDD99",
				charcoal: "#333333",
				purple: "#AA4499"
			}
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
				top: customPlotMargin.top * 2,
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
			this.exonData = await(this.getExons(gene));
			this.calculatePlot();
			this.renderTrack(this.exonData);
		},
		hoverTent(newTent, oldTent){
			if (newTent === -1 || newTent === oldTent){
				return;
			}
			this.renderTrack(this.exonData);
		},
		hoverExon(newExon, oldExon){
			if (newExon === -1 || newExon === oldExon){
				return;
			}
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


		getWidth (ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderTrack(GENES) {
			// TODO consult MultiRegionPlot component for how to get the coordinates track in there.
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
				let xposbypixel = plotWidth / (xMax - xMin);

				let genesSorted = this.utils.sortUtils.sortArrOfObjects(GENES, 'start', 'number', 'asc')
									.filter(g => g.exon_start <= xMax && g.exon_end >= xMin);
				let genesTiled = this.tileExons(genesSorted);

				canvasRenderHeight =
					this.adjPlotMargin.top +
					eachGeneTrackHeight * genesTiled.length;

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

				let exonVisualMap = [];
				
				let geneCounter = 0;
				genesTiled.map((tiledRow, rowIndex) => {
					tiledRow.map(gene => {
						let xStartPos = xStart + (gene.exon_start - xMin) * xposbypixel;
						let xEndPos = xStart + (gene.exon_end - xMin) * xposbypixel;

						let yPos = this.adjPlotMargin.top + (rowIndex * eachGeneTrackHeight);

						let xonWidth = xEndPos - xStartPos <= 1
										? 1
										: xEndPos - xStartPos;

						let highlight = this.highlightExon(gene);
						let hover = geneCounter === this.hoverExon;
						ctx.fillStyle = highlight ? this.colors.green
							: hover ? this.colors.purple
							: this.colors.charcoal;

						ctx.fillRect(xStartPos, yPos + 10, xonWidth, 20);
						exonVisualMap.push({
							exonStart: xStartPos,
							exonEnd: xStartPos + xonWidth,
							exonTop: yPos + 10,
							exonBottom: yPos + 30,

							// Raw region data; this mapping pulls double duty
							exon_start: gene.exon_start,
							exon_end: gene.exon_end
						});
						geneCounter++;
					})
				});
				
				
				this.exonVisualMap = exonVisualMap;

				// Add splicing events
				let spliceVisualMap = [];
				for (let i = 0; i < this.spliceData.length; i++){
					let splice = this.spliceData[i];
					let spliceMidpoint = xStart + (splice.midpoint - xMin) * xposbypixel;
					let spliceStart = xStart + (splice.splice_start - xMin) * xposbypixel;
					let spliceEnd = xStart + (splice.splice_end - xMin) * xposbypixel;
					spliceVisualMap.push({
						spliceStart: spliceStart,
						spliceEnd: spliceEnd
					});
					let yPos = this.adjPlotMargin.top / 2;
					let highlight = i === this.hoverTent;
					let hover = this.highlightTent(splice);
					ctx.fillStyle = highlight ? this.colors.green
						: hover ? this.colors.purple
						: this.colors.gray;
					// Draw the tents as triangles of height 20
					ctx.beginPath();
					ctx.moveTo(spliceStart, yPos + 20);
					ctx.lineTo(spliceEnd, yPos + 20);
					ctx.lineTo(spliceMidpoint, yPos);
					ctx.fill();
				}
				this.spliceVisualMap = spliceVisualMap;
			}			
			
		},
		tileExons(exonsInput){
			let allRows = [];
			let exons = structuredClone(exonsInput);

			// Initiate first row with first exon
			allRows.push([exons.shift()]);
			
			while (exons.length > 0){
				// Initiate row with the first unshelved exon
				let row = allRows[allRows.length - 1];
				let lastExon = row[row.length - 1];
				let next = this.findNextTileIndex(lastExon, exons);
				if (next === null){
					allRows.push([exons.shift()]);
					continue;
				} else {
					let nextExon = exons[next];
					row.push(nextExon);
					exons = exons.slice(0,next).concat(exons.slice(next + 1));
				}
			}
			return allRows;
		},
		findNextTileIndex(last, unshelvedExons){
			for (let i = 0; i < unshelvedExons.length; i++){
				let u = unshelvedExons[i];
				if (u.exon_start > last.exon_end){
					return i;
				}
			}
			return null;
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
		},
		highlightExon(exon){
			if (this.hoverTent === -1){
				return false;
			}
			let tent = this.spliceData[this.hoverTent];
			if (tent === undefined){
				return false;
			}
			return this.overlap(tent.splice_start, tent.splice_end, exon.exon_start, exon.exon_end);
		},
		highlightTent(tent){
			if (this.hoverExon === -1){
				return false;
			}
			let exon = this.exonVisualMap[this.hoverExon];
			if (exon === undefined){
				return false;
			}
			return this.overlap(tent.splice_start, tent.splice_end, exon.exon_start, exon.exon_end);
		},
		overlap(start1, end1, start2, end2){
			return !(start2 > end1 || start1 > end2);
		},
		checkPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			// Need scale factor of 2 as rendered
			let xPos = Math.floor(e.clientX - rect.left) * 2;
			let yPos = Math.floor(e.clientY - rect.top)  * 2;
			if (yPos < this.adjPlotMargin.top){
				let tent = this.getTent(xPos);
				this.hoverTent = tent;
				if (tent != -1){
					this.hoverExon = -1;
				}
			} else {
				let exon = this.getExon(xPos, yPos);
				this.hoverExon = exon;
				if (exon != -1){
					this.hoverTent = -1;
				}
			}
		},
		getTent(xPos){
			for (let i = 0; i < this.spliceVisualMap.length; i++){
				let t = this.spliceVisualMap[i];
				if (xPos >= t.spliceStart && xPos <= t.spliceEnd){
					return i;
				}
			}
			return -1;
		},
		getExon(xPos, yPos){
			for (let i = 0; i < this.exonVisualMap.length; i++){
				let e = this.exonVisualMap[i];
				let xMatch = xPos >= e.exonStart && xPos <= e.exonEnd;
				let yMatch = yPos >= e.exonTop && yPos <= e.exonBottom;
				if (xMatch && yMatch){
					return i;
				}
			}
			return -1;
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



