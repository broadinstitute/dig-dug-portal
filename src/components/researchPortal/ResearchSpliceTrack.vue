<template>
	<div class="mbm-plot-content row">
		<div v-if="!!this.selectedSplice">
			<h4>Splicing event data for {{ this.exonData[0].gene_name }}, {{ this.spliceData[0].tissue }}</h4>
			<ul id="explanation">
				<li>Rectangles represent exons. Hover to highlight splicing events overlapping the exon.</li>
				<li>Dot-and-line symbols represent splicing events. Hover over the dot to highlight exons overlapping the splicing event.</li>
				<li>The splicing event indicated by an arrow corresponds to the selected row from the table.</li>
			</ul>
		</div>
		<div v-else>
			Select a splice track to view from the table below.
		</div>
		<div class="col-md-10">
			<!-- place info modal here-->
			<div v-if="!!this.selectedSplice">
				<strong>{{ this.exonData[0].gene_name }} {{ this.exonData[0].strand }}</strong>
			</div>
			<div
				:id="'spliceTrackWrapper' + sectionId"
				class="genes-plot-wrapper"
			>

				<canvas :id="`xaxis_${sectionId}`"></canvas>
				<canvas :class="!exonData ? 'hidden' : ''"
					:id="'spliceTrack'+sectionId"
					@resize="onResize"
					@mousemove="checkPosition"
					width=""
					height=""
				></canvas>
			</div>
		</div>
		<div class="col-md-2">
			<div class="highlighted-data" v-if="!!this.selectedSplice">
				<strong>Highlighted splicing event:</strong>
				<div id="spliceData">
					<div v-if="this.hoverTent !== -1">
						<div>Chromosome: {{ this.hoverTentData.chr }}</div>
						<div>Start position: {{ this.hoverTentData.splice_start }}</div>
						<div>End position: {{ this.hoverTentData.splice_end }}</div>
						<div>Gene ID: {{this.hoverTentData.gene_id}}</div>
						<div>Gene symbol: {{ this.exonData[0].gene_name }}</div>
						<div>Tissue: {{ this.hoverTentData.tissue }}</div>
						<div>Cluster ID: {{ getClusterID(hoverTentData.full_id) }}</div>
					</div>
					<div v-else>Hover over the diagram to highlight a splicing event.</div>	
				</div>
				<strong>Highlighted exon:</strong>
				<div v-if="this.hoverExon !== -1">
					<div>Chromosome: {{ this.hoverExonData.chr }}</div>
					<div>Start position: {{ this.hoverExonData.exon_start }}</div>
					<div>End position: {{ this.hoverExonData.exon_end }}</div>
					<div>Gene ID: {{this.hoverExonData.gene_id}}</div>
					<div>Gene symbol: {{ this.hoverExonData.gene_name }}</div>
				</div>
				<div v-else>Hover over the diagram to highlight an exon.</div>
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
				purple: "#AA4499",
				blue: "#2F67B1", // colorblind safe blue from UCSB
				red: "#BF2C23", // colorblind safe red from UCSB,
				magenta: "#9F4A96", // Paul Tol's Muted colorblind safe palette
				teal: "#5DA899", // Paul Tol's Muted colorblind safe palette
				gold: "#DCCD7D" // Paul Tol's Muted colorblind safe palette
			},
			dotRadius: 6,
			selectedSpliceStart: null,
			selectedSpliceEnd: null
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
				top: customPlotMargin.top * 4,
				bottom: customPlotMargin.bottom,
				bump: !!customPlotMargin.bump ? customPlotMargin.bump : 10,
				tentHeightFactor: 0.4
			} :
				{
					left: this.plotMargin.leftMargin,
					right: this.plotMargin.rightMargin,
					top: this.plotMargin.topMargin,
					bottom: this.plotMargin.bottomMargin,
					bump: this.plotMargin.bump,
					tentHeightFactor: 0.33
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
		hoverExonData(){
			if (this.hoverExon === -1){
				return null;
			}
			return this.exonVisualMap[this.hoverExon];
		},
		hoverTentData(){
			if (this.hoverTent === -1){
				return null;
			}
			return this.spliceVisualMap[this.hoverTent];
		}
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
			console.log(newData);
			let spliceParams = newData.split("___");
			let gene = spliceParams[0];
			let ensembl = spliceParams[1];
			let tissue = spliceParams[2];
			let start = spliceParams[3];
			let end = spliceParams[4];
			this.selectedSpliceStart = parseInt(start);
			this.selectedSpliceEnd = parseInt(end);
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

		getClusterID(full_id){
			let elements = full_id.split(":");
			for (let i = 0; i < elements.length; i++){
				let element = elements[i];
				if (element.slice(0,4) === "clu_"){
					return element;
				}
			}
			return "";
		},
		getWidth (ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderTrack(GENES) {
			console.log("Exon data format", JSON.stringify(GENES[0]));
			if (this.gene === null){
				return;
			}
			let c = document.getElementById("spliceTrack" + this.sectionId);
			let ctx = c.getContext("2d");
			let xMin = this.viewingRegion.start,
					xMax = this.viewingRegion.end;

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


				

				let xStart = this.adjPlotMargin.left;
				let xposbypixel = plotWidth / (xMax - xMin);

				let genesSorted = this.utils.sortUtils.sortArrOfObjects(GENES, 'start', 'number', 'asc')
									.filter(g => g.exon_start <= xMax && g.exon_end >= xMin);
				let genesTiled = this.tileExons(genesSorted);

				canvasRenderHeight =
					this.adjPlotMargin.top +
					eachGeneTrackHeight * genesTiled.length;

				
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
						ctx.fillStyle = highlight ? this.colors.teal
							: hover ? this.colors.magenta
							: this.colors.charcoal;

						ctx.fillRect(xStartPos, yPos + 10, xonWidth, 20);
						let mappedExon = structuredClone(gene);
						mappedExon.exonStart = xStartPos;
						mappedExon.exonEnd = xStartPos + xonWidth;
						mappedExon.exonTop = yPos + 10;
						mappedExon.exonBottom = yPos + 30;
						exonVisualMap.push(mappedExon);
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
					let mappedSplice = structuredClone(splice);
					mappedSplice.spliceStart = spliceStart;
					mappedSplice.spliceEnd = spliceEnd;
					mappedSplice.spliceMidpoint = spliceMidpoint;
					spliceVisualMap.push(mappedSplice);
					let highlight = i === this.hoverTent;
					let isSelected = splice.splice_start === this.selectedSpliceStart
						&& splice.splice_end === this.selectedSpliceEnd;
					if (isSelected){
						console.log("Found it");
					}
					let hover = this.highlightTent(splice);
					ctx.fillStyle = highlight ? this.colors.teal
						: hover ? this.colors.magenta
						: isSelected ? this.colors.gold
						: "black";
					ctx.strokeStyle = ctx.fillStyle;
					ctx.lineWidth = 2;
					// Draw the tents as triangles
					let space = 2;
					let tentBottom = this.adjPlotMargin.top - space;
					let tentTop = tentBottom * this.adjPlotMargin.tentHeightFactor;
					ctx.beginPath();
					ctx.moveTo(spliceStart, tentBottom);
					ctx.lineTo(spliceMidpoint, tentTop);
					ctx.stroke();
					ctx.lineTo(spliceEnd, tentBottom);
					ctx.stroke();
					ctx.moveTo(spliceMidpoint, tentTop);
					ctx.beginPath();
					ctx.arc(spliceMidpoint, tentTop, this.dotRadius, 0, Math.PI * 2, true);
					ctx.fill();
					if(isSelected){
						// Draw an arrow
						ctx.strokeStyle = "red";
						ctx.fillStyle = "red";
						ctx.lineWidth = 3;
						let arrowPoint = tentTop - (this.dotRadius * 2);
						ctx.moveTo(spliceMidpoint, arrowPoint);
						ctx.lineTo(spliceMidpoint, 0);
						ctx.moveTo(spliceMidpoint, arrowPoint);
						ctx.lineTo(spliceMidpoint - 6, arrowPoint - 9);
						ctx.moveTo(spliceMidpoint, arrowPoint);
						ctx.lineTo(spliceMidpoint + 6, arrowPoint - 9);
						ctx.stroke();
					}
				}
				this.spliceVisualMap = spliceVisualMap;
			}
			this.renderAxis(canvasRenderWidth, xMax, xMin);
			console.log("X max:", xMax, "X min:", xMin);
			
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
				let tent = this.getTent(xPos, yPos);
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
		getTent(xPos, yPos){
			for (let i = 0; i < this.spliceVisualMap.length; i++){
				let t = this.spliceVisualMap[i];
				let dotHeight = (this.adjPlotMargin.top - 2) * this.adjPlotMargin.tentHeightFactor;
				let xDist = t.spliceMidpoint - xPos;
				let yDist = dotHeight - yPos;
				if (Math.abs(xDist) <= this.dotRadius && Math.abs(yDist) <= this.dotRadius){
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
		},
		renderAxis(
			WIDTH,
			xMax,
			xMin,
		) {
			// Adapted from MultiRegionPlot
			let c = document.getElementById("xaxis_" + this.sectionId);
			let CTX = c.getContext("2d");
			let HEIGHT = 50;
			c.setAttribute("width", WIDTH);
			c.setAttribute("height", HEIGHT);
			c.setAttribute(
					"style",
					"width:" +
						WIDTH / 2 +
						"px;height:" +
						HEIGHT / 2 +
						"px;"
				);
			CTX.clearRect(0, 0, WIDTH, HEIGHT);

			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.font = "24px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			let axisTop = 10;
			//render x axis
			CTX.moveTo(
				this.adjPlotMargin.left, axisTop
			);
			CTX.lineTo(
				WIDTH + this.adjPlotMargin.left,
				axisTop
			);
			CTX.stroke();

			// X ticks
			let xStep = Math.ceil((xMax - xMin) / 5);
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.adjPlotMargin.left + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos); // .5 is needed to render crisp line
				CTX.moveTo(
					adjTickXPos,
					axisTop
				);
				CTX.lineTo(
					adjTickXPos,
					axisTop
				);
				CTX.stroke();
				CTX.lineTo(
					adjTickXPos,
					axisTop + 10
				);
				CTX.stroke();

				CTX.textAlign = "center";

				
				let positionLabel = xMin + i * xStep;

				CTX.fillText(
					positionLabel,
					adjTickXPos,
					HEIGHT - 5
				);
			}

			//Render x axis label
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.fillText(
				"Position",
				WIDTH / 2 + this.adjPlotMargin.left,
				this.adjPlotMargin.top +
				this.adjPlotMargin.bottom +
				HEIGHT -
				24
			);
		},
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
.highlighted-data {
	background-color: #efefef;
	border-radius: 5px;
	padding: 10px;
	min-height: 350px;
}
#spliceData {
	min-height: 175px;
}
</style>



