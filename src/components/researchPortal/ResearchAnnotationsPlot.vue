<template>
	<div class="mbm-plot-content row">
		<div
			id="annotationsPlotWrapper"
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-9 anno-plot-wrapper">
				<div id="tissueInfoBox" class="hidden"></div>
				<canvas
					id="annotationsPlot"
					@resize="onResize"
					@mousemove="checkPosition($event, 'annotation')"
					width=""
					height=""
				></canvas>
			</div>
			<div class="col-md-3 anno-plot-ui-wrapper">
				<h6>Add Tissue Track</h6>
				<div id="annotationsUIWrapper">
					<div class="filtering-ui-wrapper">
						<div class="filtering-ui-content">
							<div class="col">
								<select
									class="custom-select"
									@change="updateTissuesList($event)"
								>
									<option>{{ "Select annotation" }}</option>
									<option
										:value="'all'"
										v-html="'All annotations'"
									></option>
									<option
										v-for="(annoValue, annoKey) in annoData"
										:key="annoKey"
										:value="annoKey"
										v-html="annoKey"
									></option>
								</select>
								<select class="custom-select">
									<option>{{ "Select tissue" }}</option>
									<option
										v-for="(
											tissueValue, tissueKey
										) in selectedAnno"
										:key="tissueKey"
										:value="tissueKey"
										v-html="tissueKey"
									></option>
								</select>
							</div>
						</div>
					</div>
				</div>
				<h6>Global Enrichment</h6>
				<div id="GEPlotWrapper">
					<!--<span
						v-for="(annoValue, annoKey, annoIndex) in annoData"
						class="anno-bubble"
						v-html="annoKey"
						:style="
							'background-color:' +
							compareGroupColors[annoIndex] +
							';'
						"
						:key="annoKey"
					></span>-->
					<div
						v-if="searchingPhenotype != null"
						id="GEInfoBox"
						class="hidden"
					></div>
					<canvas
						v-if="searchingPhenotype != null"
						id="GEPlot"
						width=""
						height=""
						style="border: solid 1px #000"
					></canvas>
				</div>
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

export default Vue.component("research-annotations-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"plotMargin",
		"compareGroupColors",
		"dataComparison",
	],
	data() {
		return {
			annoData: {},
			GEData: {},
			tissuesData: {},
			selectedAnno: {},
			annoPosData: {},
			spaceBy: 7,
		};
	},
	modules: {
		uiUtils,
		Formatters,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingRegion() {
			//console.log("search Called from region");
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			this.getAnnotations(returnObj);

			return returnObj;
		},
		searchingPhenotype() {
			//console.log("search Called from phenotype");
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			this.getAnnotations(returnObj);

			return this.phenotype;
		},
		testReferencing() {
			if (this.searchingRegion != null) {
				//console.log("it works");
			}
		},
	},
	watch: {},
	methods: {
		...uiUtils,
		onResize(e) {
			this.renderByAnnotations();
		},
		updateTissuesList(event) {
			this.selectedAnno = this.annoData[event.target.value];
		},
		checkPosition(event, TYPE) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var rawX = e.clientX - rect.left;

			const infoBox = document.querySelector("#tissueInfoBox");

			if (
				x >= this.plotMargin.leftMargin &&
				x <= rect.width - this.plotMargin.leftMargin
			) {
				var y =
					Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy) -
					1;

				let rawY = e.clientY - rect.top;

				//console.log("y", y, "raw y", Math.floor(e.clientY - rect.top));
				if (!!this.annoPosData[y]) {
					let infoContent = this.annoPosData[y].tissue;
					for (const [region, regionValue] of Object.entries(
						this.annoPosData[y].regions
					)) {
						let hPosition = region.split("_");
						let start = hPosition[0];
						let end = hPosition[1];
						if (x >= start && x <= end) {
							infoContent +=
								"<br />" +
								regionValue.start +
								"-" +
								regionValue.end;
						}
					}
					infoBox.innerHTML = infoContent;
					infoBox.setAttribute("class", "");
					infoBox.style.left = rawX + 15 + "px";
					infoBox.style.top = rawY + this.spaceBy + "px";
				} else {
					infoBox.innerHTML = "";
					infoBox.setAttribute("class", "hidden");
				}
			} else {
				infoBox.innerHTML = "";
				infoBox.setAttribute("class", "hidden");
			}
		},
		getColorIndex(anno) {
			let annoArry = Object.keys(this.annoData);
			let i = annoArry.indexOf(anno);
			return this.compareGroupColors[i];
		},
		async getGlobalEnrichment() {
			let annoServer =
				this.renderConfig.annotationsServer == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig.annotationsServer;

			let phenotype = this.searchingPhenotype;

			var GEURL = annoServer + "/query/global-enrichment?q=" + phenotype;

			var GEJson = await fetch(GEURL).then((resp) => resp.json());

			if (GEJson.error == null) {
				if (this.dataComparison == "newSearch") {
					this.GEData = {};
				}

				this.GEData[this.searchingPhenotype] = GEJson.data;

				for (const [phenotype, phenotypeValue] of Object.entries(
					this.GEData
				)) {
					phenotypeValue.map((p) => {
						let ancestry = p.ancestry;
						let annotation = p.annotation;
						let pValue = p.pValue;
						let phenotype = p.phenotype;
						let tissue = p.tissue;

						if (
							!!this.annoData[annotation] &&
							!!this.annoData[annotation][tissue]
						) {
							if (
								!this.annoData[annotation][tissue].ancestries[
									ancestry
								]
							) {
								this.annoData[annotation][tissue].ancestries[
									ancestry
								] = {};
							}
							this.annoData[annotation][tissue].ancestries[
								ancestry
							][phenotype] = pValue;
						}

						if (
							!!this.tissuesData[tissue] &&
							!!this.tissuesData[tissue][annotation]
						) {
							if (
								!this.tissuesData[tissue][annotation]
									.ancestries[ancestry]
							) {
								this.tissuesData[tissue][annotation].ancestries[
									ancestry
								] = {};
							}
							this.tissuesData[tissue][annotation].ancestries[
								ancestry
							][phenotype] = pValue;
						}
					});
				}

				//this.renderByTissues();
				this.renderByAnnotations();
				this.renderGE();
			}
		},

		async getAnnotations(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				let annoServer =
					this.renderConfig.annotationsServer == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig.annotationsServer;

				var annotationsURL =
					annoServer +
					"/query/regions?q=" +
					REGION_OBJ.chr +
					":" +
					REGION_OBJ.start +
					"-" +
					REGION_OBJ.end;

				var annotationsJson = await fetch(annotationsURL).then((resp) =>
					resp.json()
				);

				if (annotationsJson.error == null) {
					this.annoData = {};
					this.tissuesData = {};

					annotationsJson.data.map((a) => {
						// annoData
						if (!this.annoData[a.annotation]) {
							this.annoData[a.annotation] = {};
						}
						if (!this.annoData[a.annotation][a.tissue]) {
							this.annoData[a.annotation][a.tissue] = {
								region: [],
								ancestries: {},
							};
						}

						this.annoData[a.annotation][a.tissue].region.push(a);

						//tissuesData
						if (!this.tissuesData[a.tissue]) {
							this.tissuesData[a.tissue] = {};
						}

						if (!this.tissuesData[a.tissue][a.annotation]) {
							this.tissuesData[a.tissue][a.annotation] = {
								region: [],
								ancestries: {},
							};
						}
						this.tissuesData[a.tissue][a.annotation].region.push(a);
					});
					this.getGlobalEnrichment();
				}
			}
		},
		renderGE() {
			let sortedGEData = {};
			for (const [phenotype, GE] of Object.entries(this.GEData)) {
				sortedGEData[phenotype] = { max: null, min: null };
				GE.map((g) => {
					if (!sortedGEData[phenotype][g.annotation]) {
						sortedGEData[phenotype][g.annotation] = {};
					}
					let pValue = -Math.log10(g.pValue);

					sortedGEData[phenotype].max =
						sortedGEData[phenotype].max == null
							? pValue
							: pValue > sortedGEData[phenotype].max
							? pValue
							: sortedGEData[phenotype].max;

					sortedGEData[phenotype].min =
						sortedGEData[phenotype].min == null
							? pValue
							: pValue < sortedGEData[phenotype].min
							? pValue
							: sortedGEData[phenotype].min;

					if (!sortedGEData[phenotype][g.annotation][g.tissue]) {
						sortedGEData[phenotype][g.annotation][g.tissue] =
							pValue;
					}
				});
			}
			console.log("sortedGEData", sortedGEData);

			let titleSize = this.spaceBy * 2;
			let plotHeight = 150;
			let bump = 5.5;

			let canvasWidth =
				document.querySelector("#GEPlotWrapper").clientWidth; //30 <- left & right padding of wrapper

			let numOfPhenotypes = Object.keys(sortedGEData).length;
			let canvasHeight =
				(this.plotMargin.topMargin +
					this.plotMargin.bottomMargin +
					plotHeight +
					titleSize) *
				numOfPhenotypes;

			let c, ctx;
			c = document.querySelector("#GEPlot");
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			ctx = c.getContext("2d");

			let pIndex = 0;
			for (const [phenotype, GE] of Object.entries(sortedGEData)) {
				let titleYPos =
					titleSize +
					(this.plotMargin.topMargin +
						this.plotMargin.bottomMargin +
						plotHeight +
						titleSize) *
						pIndex;

				ctx.font = "14px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(phenotype, bump, titleYPos);

				pIndex++;
			}
		},
		renderByAnnotations() {
			var tempHeight = 0;
			let annotationTitleH = this.spaceBy * 2;
			let btnAnnotations = this.spaceBy * 7;
			let perTissue = this.spaceBy;
			let topMargin = this.spaceBy * 2;
			let bottomMargin = this.spaceBy * 2;

			for (const [annotation, tissues] of Object.entries(this.annoData)) {
				tempHeight += annotationTitleH;
				tempHeight += Object.keys(tissues).length * perTissue;
				tempHeight += btnAnnotations;
			}

			let canvasWidth =
				document.querySelector("#annotationsPlotWrapper").clientWidth *
					0.75 -
				30; //30 <- left & right padding of wrapper

			let canvasHeight = tempHeight + topMargin + bottomMargin;

			let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
			let plotHeight = tempHeight;
			let bump = 5.5;

			let xPerPixel =
				plotWidth /
				(this.searchingRegion.end - this.searchingRegion.start);

			let c, ctx;
			c = document.querySelector("#annotationsPlot");
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			ctx = c.getContext("2d");

			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			let renderHeight = annotationTitleH;

			for (const [annotation, tissues] of Object.entries(this.annoData)) {
				ctx.font = "14px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(annotation, bump, renderHeight);

				let blockHeight = Object.keys(tissues).length * perTissue;
				renderHeight += annotationTitleH;

				this.renderAxis(
					ctx,
					plotWidth,
					blockHeight,
					Number(this.searchingRegion.end),
					Number(this.searchingRegion.start),
					renderHeight,
					bump
				);
				let tissueIndex = 0;
				for (const [tissue, regions] of Object.entries(tissues)) {
					let yPosBtn = Math.ceil(renderHeight / this.spaceBy);

					this.annoPosData[yPosBtn] = { tissue: tissue, regions: {} };

					if (tissueIndex % 2 == 0) {
						ctx.fillStyle = "#eeeeee";
						ctx.fillRect(
							this.plotMargin.leftMargin,
							renderHeight,
							plotWidth,
							perTissue
						);
					}

					tissueIndex++;

					regions.region.map((p) => {
						let xPosStart =
							(p.start - this.searchingRegion.start) * xPerPixel +
							this.plotMargin.leftMargin;

						xPosStart =
							xPosStart <= this.plotMargin.leftMargin
								? this.plotMargin.leftMargin
								: xPosStart;
						let xPosEnd =
							(p.end - this.searchingRegion.start) * xPerPixel +
							this.plotMargin.leftMargin;

						xPosEnd =
							xPosEnd > this.plotMargin.leftMargin + plotWidth
								? this.plotMargin.leftMargin + plotWidth
								: xPosEnd;

						let xPosWidth = xPosEnd - xPosStart;
						ctx.fillStyle = this.getColorIndex(annotation);
						ctx.fillRect(
							xPosStart,
							renderHeight,
							xPosWidth,
							perTissue - 1
						);
						let xPosBtn = xPosStart + "_" + (xPosStart + xPosWidth);
						this.annoPosData[yPosBtn].regions[xPosBtn] = {
							start: p.start,
							end: p.end,
						};
					});

					renderHeight += perTissue;
				}
				renderHeight += btnAnnotations;
			}
		},
		renderAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#999999";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.stroke();

			// render recombination Rate y axis
			let recomXpos =
				Math.round(this.plotMargin.leftMargin + WIDTH + bump) + 0.5;

			CTX.moveTo(recomXpos, yPos);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			//render x axis
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			// X ticks

			let xStep = Math.ceil((xMax - xMin) / 5);
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(adjTickXPos, yPos + HEIGHT + bump);
				CTX.lineTo(adjTickXPos, yPos + HEIGHT + bump * 2);
				CTX.stroke();

				CTX.textAlign = "center";
				let positionLabel = i < 5 ? xMin + i * xStep : xMax;
				CTX.font = "12px Arial";
				CTX.fillStyle = "#999999";
				CTX.fillText(
					positionLabel,
					adjTickXPos,
					yPos + HEIGHT + bump * 4
				);
			}
		},
		renderByTissues() {
			var sortedTissues = Object.keys(this.tissuesData)
				.sort()
				.reduce((a, c) => ((a[c] = this.tissuesData[c]), a), {});

			var tempHeight = 0;
			let fontSize = 14;
			let perAnnotation = 14;
			let spaceBtnTissue = 10;

			for (const [tissue, annotations] of Object.entries(sortedTissues)) {
				tempHeight += fontSize;
				tempHeight += Object.keys(annotations).length * perAnnotation;
				tempHeight += spaceBtnTissue;
			}

			// findout width and height of canvas and actual plots. use #rp_region_plot to measure
			let canvasWidth =
				document.querySelector("#annotationsPlotWrapper").clientWidth *
					0.75 -
				30; //30 <- left & right padding of wrapper

			let canvasHeight =
				tempHeight +
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin;

			let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
			let plotHeight = tempHeight;
			let bump = 5.5;

			let perPixel =
				plotWidth /
				(this.searchingRegion.end - this.searchingRegion.start);

			let c, ctx;
			c = document.querySelector("#annotationsPlot");
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			ctx = c.getContext("2d");

			let renderHeight = fontSize;

			// render by tissues
			for (const [tissue, annotations] of Object.entries(sortedTissues)) {
				ctx.font = fontSize + "px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(tissue, bump, renderHeight);
				renderHeight += fontSize;
				for (const [annoKey, position] of Object.entries(annotations)) {
					//console.log("position", position);
					ctx.font = fontSize - 2 + "px Arial";
					ctx.textAlign = "left";
					ctx.fillStyle = "#000000";
					ctx.fillText(
						annoKey,
						this.plotMargin.leftMargin + plotWidth + bump * 2,
						renderHeight
					);

					ctx.fillStyle = this.getColorIndex(annoKey);

					position.region.map((p) => {
						///
						ctx.strokeStyle = "#aaaaaa";
						ctx.moveTo(
							this.plotMargin.leftMargin - bump,
							renderHeight - fontSize * 0.75
						);
						ctx.lineTo(
							this.plotMargin.leftMargin - bump,
							renderHeight - fontSize * 0.75 + perAnnotation
						);
						//ctx.stroke();

						ctx.moveTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							renderHeight - fontSize * 0.75
						);
						ctx.lineTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							renderHeight - fontSize * 0.75 + perAnnotation
						);
						ctx.stroke();

						ctx.strokeStyle = "#eaeaea";
						ctx.moveTo(
							this.plotMargin.leftMargin - bump,
							Math.round(renderHeight + fontSize * 0.25) - 0.5
						);
						ctx.lineTo(
							Math.round(
								this.plotMargin.leftMargin + plotWidth + bump
							) + 0.5,
							Math.round(renderHeight + fontSize * 0.25) - 0.5
						);
						ctx.stroke();
						///
						let xPosStart =
							(p.start - this.searchingRegion.start) * perPixel +
							this.plotMargin.leftMargin;

						xPosStart =
							xPosStart <= this.plotMargin.leftMargin
								? this.plotMargin.leftMargin
								: xPosStart;
						let xPosEnd =
							(p.end - this.searchingRegion.start) * perPixel +
							this.plotMargin.leftMargin;

						xPosEnd =
							xPosEnd > this.plotMargin.leftMargin + plotWidth
								? this.plotMargin.leftMargin + plotWidth
								: xPosEnd;

						let xPosWidth = xPosEnd - xPosStart;

						ctx.fillRect(
							xPosStart,
							renderHeight - fontSize * 0.75,
							xPosWidth,
							perAnnotation
						);
					});
					renderHeight += perAnnotation;
				}
				renderHeight += spaceBtnTissue;
			}
		},
	},
});

$(function () {});
</script>

<style>
.annotations-plots-wrapper {
	padding: 0 !important;
}

.annotations-plot-wrapper {
	padding: 0 !important;
}
.anno-plot-wrapper,
.anno-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
}
.anno-bubble {
	display: block;
	font-size: 12px;
	margin-left: 3px;
	margin-right: 3px;
	padding: 0px 3px;
	border-radius: 5px;
	float: left;
	margin-bottom: 3px;
}

#tissueInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 14px;
}
</style>



