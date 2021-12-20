<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-9 anno-plot-wrapper">
				<div id="tissuesPlotWrapper">
					<div id="selectedTissueInfoBox" class="hidden"></div>
					<canvas
						id="tissuesPlot"
						@resize="onResize"
						@mousemove="checkTissuesPosition($event)"
						@click="removeTissueTrack($event)"
						width="0"
						height="0"
					></canvas>
				</div>
				<div id="annotationsPlotWrapper">
					<div id="tissueInfoBox" class="hidden"></div>
					<canvas
						id="annotationsPlot"
						@resize="onResize"
						@mousemove="checkPosition($event)"
						width=""
						height=""
					></canvas>
				</div>
			</div>
			<div class="col-md-3 anno-plot-ui-wrapper">
				<h6>Add Tissue Track</h6>
				<div id="annotationsUIWrapper">
					<div class="filtering-ui-wrapper">
						<div class="filtering-ui-content">
							<div class="col">
								<!--<select
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
								</select>-->
								<select
									class="custom-select"
									@change="addTissueTrack($event)"
								>
									<option value="">
										{{ "Select tissue" }}
									</option>
									<option
										v-for="(
											tissueValue, tissueKey
										) in tissuesData"
										:key="tissueKey"
										:value="tissueKey"
									>
										<span
											v-html="tissueKey + '&nbsp;'"
										></span>
										<span
											v-for="(
												annoValue, annoKey
											) in tissueValue"
											:key="annoKey"
											:style="
												'background-color:' +
												compareGroupColors[
													getColorIndex(annoKey)
												] +
												';'
											"
											v-html="'(' + annoKey[0] + ')'"
										></span>
									</option>
								</select>
							</div>
						</div>
					</div>
				</div>
				<h6>Global Enrichment</h6>
				<div id="GEPlotWrapper" v-if="searchingPhenotype != null">
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
					<div id="GEInfoBox" class="hidden"></div>
					<canvas
						id="GEPlot"
						width=""
						height=""
						@mousemove="checkGEPosition($event)"
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
import keyParams from "@/utils/keyParams";

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
			GEPosData: {},
			tissuesData: {},
			tissuesPosData: {},
			selectedTissues: [],
			annoPosData: {},
			spaceBy: 7,
		};
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
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
			if (this.phenotype != null) {
				this.getAnnotations(this.searchingRegion);
				return this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig.phenotypeParameter]) {
					this.getAnnotations(this.searchingRegion);
					return keyParams[this.renderConfig.phenotypeParameter];
				} else {
					return null;
				}
			}
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
			this.renderGE();
			this.renderTissuesTracks();
		},
		addTissueTrack(event) {
			if (event.target.value != "") {
				this.selectedTissues.push(event.target.value);
				this.renderTissuesTracks();
			}
		},
		renderTissuesTracks() {
			let canvas = document.querySelector("#tissuesPlot");
			let wrapper = document.querySelector("#tissuesPlotWrapper");

			var tempHeight = 0;
			let tissueTitleH = this.spaceBy * 2;
			let btwnTissues = this.spaceBy * 3;
			let perAnnotation = this.spaceBy;
			let topMargin = this.spaceBy;
			let bottomMargin = this.spaceBy * 2;
			let bump = this.plotMargin.bump;

			let canvasWidth = wrapper.clientWidth;
			let canvasHeight = this.plotMargin.topMargin;

			let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
			let xPerPixel =
				plotWidth /
				(this.searchingRegion.end - this.searchingRegion.start);

			this.selectedTissues.map((t) => {
				let numOfAnno = Object.keys(this.tissuesData[t]).length;
				canvasHeight +=
					tissueTitleH +
					btwnTissues +
					topMargin +
					perAnnotation * numOfAnno;
			});

			canvas.setAttribute("width", canvasWidth);
			canvas.setAttribute("height", canvasHeight);

			let c, ctx;
			c = canvas;
			ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);

			let renderHeight = this.plotMargin.topMargin;

			this.selectedTissues.map((t, tIndex) => {
				ctx.font = "14px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(t, bump, renderHeight + this.spaceBy);

				//console.log(t, ": ", this.tissuesData[t]);

				/// Render delete track icon
				ctx.beginPath();
				ctx.fillStyle = "#666666";
				ctx.lineWidth = 0;
				ctx.arc(
					this.plotMargin.leftMargin + plotWidth + bump * 3,
					renderHeight + bump * 2,
					7,
					0,
					2 * Math.PI
				);
				ctx.fill();

				ctx.font = "bold 12px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#ffffff";
				ctx.fillText(
					eval('"\\u' + "2715" + '"'),
					this.plotMargin.leftMargin + plotWidth + bump * 3,
					renderHeight + bump * 2 + 3.5
				);

				//feed close button position
				let yPosBtwn = Math.ceil(
					(renderHeight + bump * 2) / this.spaceBy
				);
				let xPos = this.plotMargin.leftMargin + plotWidth + bump * 3;
				let xPosStart = xPos - 3.5,
					xPosEnd = xPos + 3.5;
				let xPosBtwn = xPosStart + "_" + xPosEnd;

				this.tissuesPosData[yPosBtwn] = {
					tissue: t,
					annotation: "close",
					regions: {},
				};

				this.tissuesPosData[yPosBtwn].regions[xPosBtwn] =
					"Remove track";

				///

				renderHeight += tissueTitleH;

				ctx.beginPath();

				ctx.strokeStyle = "#999999";

				ctx.moveTo(this.plotMargin.leftMargin - bump, renderHeight);
				ctx.lineTo(
					this.plotMargin.leftMargin - bump,
					renderHeight +
						bump +
						perAnnotation * Object.keys(this.tissuesData[t]).length
				);
				ctx.stroke();

				ctx.moveTo(
					this.plotMargin.leftMargin + plotWidth + bump,
					renderHeight
				);
				ctx.lineTo(
					this.plotMargin.leftMargin + plotWidth + bump,
					renderHeight +
						bump +
						perAnnotation * Object.keys(this.tissuesData[t]).length
				);
				ctx.stroke();

				ctx.moveTo(
					this.plotMargin.leftMargin - bump,
					renderHeight +
						bump +
						perAnnotation * Object.keys(this.tissuesData[t]).length
				);
				ctx.lineTo(
					this.plotMargin.leftMargin + plotWidth + bump,
					renderHeight +
						bump +
						perAnnotation * Object.keys(this.tissuesData[t]).length
				);
				ctx.stroke();
				if (tIndex + 1 == this.selectedTissues.length) {
					let xStep =
						(this.searchingRegion.end -
							this.searchingRegion.start) /
						5;
					let xTickDistance = plotWidth / 5;

					for (let i = 0; i < 6; i++) {
						let tickXPos =
							this.plotMargin.leftMargin + i * xTickDistance;

						let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line

						ctx.moveTo(
							adjTickXPos,
							renderHeight +
								bump +
								perAnnotation *
									Object.keys(this.tissuesData[t]).length
						);
						ctx.lineTo(
							adjTickXPos,
							renderHeight +
								bump * 2 +
								perAnnotation *
									Object.keys(this.tissuesData[t]).length
						);
						ctx.stroke();

						ctx.textAlign = "center";
						ctx.font = "12px Arial";
						ctx.fillStyle = "#999999";

						let positionLabel =
							i < 5
								? Number(this.searchingRegion.start) + i * xStep
								: Number(this.searchingRegion.end);

						ctx.fillText(
							Math.floor(positionLabel),
							adjTickXPos,
							renderHeight +
								bump * 4 +
								perAnnotation *
									Object.keys(this.tissuesData[t]).length
						);
					}
				}

				let aIndex = 0;
				for (const [a, aValue] of Object.entries(this.tissuesData[t])) {
					let region = aValue.region;

					if (aIndex % 2 == 0) {
						ctx.fillStyle = "#eeeeee";
						ctx.fillRect(
							this.plotMargin.leftMargin,
							renderHeight,
							plotWidth,
							perAnnotation
						);
					}

					aIndex++;

					ctx.fillStyle = this.getColorIndex(a);

					//feed close button position
					let yPosBtwn = Math.ceil(renderHeight / this.spaceBy);

					this.tissuesPosData[yPosBtwn] = {
						tissue: t,
						annotation: a,
						regions: {},
					};

					region.map((p) => {
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
						ctx.fillRect(
							xPosStart,
							renderHeight,
							xPosWidth,
							perAnnotation - 1
						);

						let xPosBtwn =
							xPosStart + "_" + (xPosStart + xPosWidth);
						this.tissuesPosData[yPosBtwn].regions[xPosBtwn] = {
							start: p.start,
							end: p.end,
						};
					});

					renderHeight += perAnnotation;
				}
				renderHeight += btwnTissues;
			});
			//console.log("this.tissuesPosData", this.tissuesPosData);
		},
		removeTissueTrack(event) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var rawX = e.clientX - rect.left;
			var y = Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy);

			if (!!this.tissuesPosData[y]) {
				for (const [region, regionValue] of Object.entries(
					this.tissuesPosData[y].regions
				)) {
					let hPosition = region.split("_");
					let start = hPosition[0];
					let end = hPosition[1];
					if (x >= start && x <= end) {
						let tissue = this.tissuesPosData[y].tissue;
						const tIndex = this.selectedTissues.indexOf(tissue);
						if (tIndex > -1) {
							this.selectedTissues.splice(tIndex, 1);
							this.renderTissuesTracks();
						}
					}
				}
			}
		},
		checkTissuesPosition(event) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var rawX = e.clientX - rect.left;
			var y = Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy);

			let rawY = e.clientY - rect.top;

			const infoBox = document.querySelector("#selectedTissueInfoBox");
			let infoContent = "";

			if (
				x >= this.plotMargin.leftMargin &&
				x <= rect.width - this.plotMargin.leftMargin
			) {
				if (!!this.tissuesPosData[y]) {
					infoContent =
						this.tissuesPosData[y].annotation == "close"
							? ""
							: this.tissuesPosData[y].annotation;

					for (const [region, regionValue] of Object.entries(
						this.tissuesPosData[y].regions
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
				}
			} else {
				if (!!this.tissuesPosData[y]) {
					for (const [region, regionValue] of Object.entries(
						this.tissuesPosData[y].regions
					)) {
						let hPosition = region.split("_");
						let start = hPosition[0];
						let end = hPosition[1];
						if (x >= start && x <= end) {
							infoContent += regionValue;
						}
					}
				}
			}

			if (infoContent != "") {
				infoBox.innerHTML = infoContent;
				infoBox.setAttribute("class", "");
				infoBox.style.left = rawX + 15 + "px";
				infoBox.style.top = rawY + this.spaceBy + "px";
			} else {
				infoBox.innerHTML = "";
				infoBox.setAttribute("class", "hidden");
			}
		},
		checkGEPosition(event) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			const infoBox = document.querySelector("#GEInfoBox");

			var infoBoxContent = "";
			for (let v = -5; v <= 5; v++) {
				for (let h = -5; h <= 5; h++) {
					if (this.GEPosData[y + v] != undefined) {
						if (this.GEPosData[y + v][x + h] != undefined) {
							for (const [key, value] of Object.entries(
								this.GEPosData[y + v][x + h]
							)) {
								infoBoxContent +=
									"<span style='color:" +
									this.compareGroupColors[
										value.annotationIndex
									] +
									"'>" +
									key +
									"</span><br />";
							}
						}
					}
				}
			}

			if (infoBoxContent != "") {
				infoBox.innerHTML = infoBoxContent;
				infoBox.setAttribute("class", "");
				if (x < rect.width * 0.75) {
					infoBox.style.width = "auto";
					infoBox.style.left = x + 15 + "px";
					infoBox.style.top = y + this.spaceBy + "px";
				} else {
					infoBox.style.width = "200px";
					infoBox.style.left = x - (200 + 15) + "px";
					infoBox.style.top = y + this.spaceBy + "px";
				}
			} else {
				infoBox.setAttribute("class", "hidden");
			}
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

			//console.log("phenotype", phenotype);

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

				this.tissuesData = Object.fromEntries(
					Object.entries(this.tissuesData).sort()
				);

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
			this.GEPosData = {};
			let sortedGEData = {};

			for (const [phenotype, GE] of Object.entries(this.GEData)) {
				sortedGEData[phenotype] = {
					xMax: null,
					xMin: null,
					yMax: null,
					yMin: null,
				};

				GE.map((g) => {
					if (!!this.annoData[g.annotation][g.tissue]) {
						if (!sortedGEData[phenotype][g.annotation]) {
							sortedGEData[phenotype][g.annotation] = {};
						}
						let pValue = -Math.log10(g.pValue);
						let fold = g.SNPs / g.expectedSNPs;

						sortedGEData[phenotype].xMax =
							sortedGEData[phenotype].xMax == null
								? fold
								: fold > sortedGEData[phenotype].xMax
								? fold
								: sortedGEData[phenotype].xMax;

						sortedGEData[phenotype].xMin =
							sortedGEData[phenotype].xMin == null
								? fold
								: fold < sortedGEData[phenotype].xMin
								? fold
								: sortedGEData[phenotype].xMin;

						sortedGEData[phenotype].yMax =
							sortedGEData[phenotype].yMax == null
								? pValue
								: pValue > sortedGEData[phenotype].yMax
								? pValue
								: sortedGEData[phenotype].yMax;

						sortedGEData[phenotype].yMin =
							sortedGEData[phenotype].yMin == null
								? pValue
								: pValue < sortedGEData[phenotype].yMin
								? pValue
								: sortedGEData[phenotype].yMin;

						sortedGEData[phenotype][g.annotation][g.tissue] =
							!sortedGEData[phenotype][g.annotation][g.tissue]
								? { pValue: null, fold: null }
								: sortedGEData[phenotype][g.annotation][
										g.tissue
								  ];

						let currentPvalue =
							sortedGEData[phenotype][g.annotation][g.tissue]
								.pValue;

						let currentFold =
							sortedGEData[phenotype][g.annotation][g.tissue]
								.fold;

						sortedGEData[phenotype][g.annotation][g.tissue].pValue =
							currentPvalue == null
								? pValue
								: pValue > currentPvalue
								? pValue
								: currentPvalue;

						sortedGEData[phenotype][g.annotation][g.tissue].fold =
							currentFold == null
								? fold
								: fold > currentFold
								? fold
								: currentFold;
					}
				});
			}

			//console.log("this.GEData", sortedGEData);
			//console.log("annoData", this.annoData);

			let canvasWidth =
				document.querySelector("#GEPlotWrapper").clientWidth;

			let numOfPhenotypes = Object.keys(sortedGEData).length;
			let plotHeight = 130;
			let titleSize = this.spaceBy * 2;
			let canvasHeight =
				(this.plotMargin.topMargin +
					this.plotMargin.bottomMargin +
					plotHeight +
					titleSize) *
				numOfPhenotypes;

			let plotWidth =
				canvasWidth -
				this.plotMargin.leftMargin -
				this.plotMargin.rightMargin;
			let bump = 5.5;

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

				this.renderGEAxis(
					ctx,
					plotWidth,
					plotHeight,
					GE.xMax,
					GE.xMin,
					GE.yMax,
					GE.yMin,
					titleYPos,
					bump
				);

				let annotationsArr = Object.keys(this.annoData);
				//let tissuesCount = 0;

				let pValArr = [];
				annotationsArr.map((annotation) => {
					for (const [tissue, tissueValue] of Object.entries(
						GE[annotation]
					)) {
						//tissuesCount++;
						pValArr.push(tissueValue.pValue);
					}
				});

				//console.log("pValArr1", pValArr);
				pValArr.sort((a, b) => b - a);

				//console.log("pValArr2", pValArr);

				let xPosByPixel = plotWidth / (GE.xMax - GE.xMin);
				let yPosByPixel = plotHeight / (GE.yMax - GE.yMin);

				//tissuesCount = 0;

				annotationsArr.map((annotation, annoIndex) => {
					let dotColor = this.compareGroupColors[annoIndex];

					//let firstTissueInAnno = 0;
					for (const [tissue, tValue] of Object.entries(
						GE[annotation]
					)) {
						let xPos =
							this.plotMargin.leftMargin +
							(tValue.fold - GE.xMin) * xPosByPixel;

						let yPos =
							titleYPos +
							this.plotMargin.topMargin +
							plotHeight -
							(tValue.pValue - GE.yMin) * yPosByPixel;

						ctx.fillStyle = dotColor;
						ctx.lineWidth = 0;
						ctx.beginPath();
						ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
						ctx.fill();

						//console.log(tValue.pValue, ":", pValArr[3]);

						if (tValue.pValue >= pValArr[2]) {
							ctx.font = "12px Arial";
							ctx.fillStyle = "#000000";
							if (xPos > canvasWidth * 0.75) {
								ctx.textAlign = "right";
								ctx.fillText(tissue, xPos - 7, yPos + 3);
							} else {
								ctx.textAlign = "left";
								ctx.fillText(tissue, xPos + 7, yPos + 3);
							}
						}

						if (!this.GEPosData[Math.round(yPos)]) {
							this.GEPosData[Math.round(yPos)] = {};
						}
						if (
							!this.GEPosData[Math.round(yPos)][Math.round(xPos)]
						) {
							this.GEPosData[Math.round(yPos)][Math.round(xPos)] =
								{};
						}

						this.GEPosData[Math.round(yPos)][Math.round(xPos)][
							tissue
						] = { pValue: null, fold: null };

						this.GEPosData[Math.round(yPos)][Math.round(xPos)][
							tissue
						]["pValue"] = tValue.pValue;

						this.GEPosData[Math.round(yPos)][Math.round(xPos)][
							tissue
						]["fold"] = tValue.fold;

						this.GEPosData[Math.round(yPos)][Math.round(xPos)][
							tissue
						]["annotationIndex"] = annoIndex;

						//tissuesCount++;
						//firstTissueInAnno++;
					}
				});

				pIndex++;
			}

			//console.log("this.GEPosData", this.GEPosData);
		},
		renderGEAxis(CTX, WIDTH, HEIGHT, XMAX, XMIN, YMAX, YMIN, YPOS, BUMP) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(
				this.plotMargin.leftMargin - BUMP,
				YPOS + this.plotMargin.topMargin
			);
			CTX.lineTo(
				this.plotMargin.leftMargin - BUMP,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);

			// Y ticks
			let yStep = (YMAX - YMIN) / 5;
			let yTickDistance = HEIGHT / 5;

			for (let i = 0; i < 6; i++) {
				let tickYPos =
					YPOS + this.plotMargin.topMargin + i * yTickDistance;

				let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line

				CTX.moveTo(this.plotMargin.leftMargin - BUMP * 2, adjTickYPos);
				CTX.lineTo(this.plotMargin.leftMargin - BUMP, adjTickYPos);
				CTX.stroke();

				CTX.textAlign = "right";
				CTX.font = "12px Arial";

				CTX.fillText(
					Formatters.floatFormatter(YMIN + i * yStep),
					this.plotMargin.leftMargin - BUMP * 3,
					YPOS +
						this.plotMargin.topMargin +
						HEIGHT +
						BUMP -
						i * yTickDistance
				);
			}

			//Render y axis label
			CTX.textAlign = "center";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				"-Log10(p-value)",
				-(this.plotMargin.topMargin + HEIGHT / 2) - YPOS,
				BUMP + 12
			);

			// render x axis
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.moveTo(
				this.plotMargin.leftMargin - BUMP,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);
			CTX.lineTo(
				this.plotMargin.leftMargin + WIDTH,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);
			CTX.stroke();

			// x ticks
			let xStep = (XMAX - XMIN) / 5;
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;

				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line

				CTX.moveTo(
					adjTickXPos,
					YPOS + HEIGHT + this.plotMargin.topMargin + BUMP
				);
				CTX.lineTo(
					adjTickXPos,
					YPOS + HEIGHT + this.plotMargin.topMargin + BUMP * 2
				);
				CTX.stroke();

				CTX.textAlign = "center";
				CTX.font = "12px Arial";

				CTX.fillText(
					Formatters.floatFormatter(XMIN + i * xStep),
					adjTickXPos,
					YPOS + HEIGHT + this.plotMargin.topMargin + BUMP * 4
				);
			}

			//Render x axis label
			CTX.textAlign = "center";
			CTX.fillText(
				"Fold",
				this.plotMargin.leftMargin + WIDTH / 2,
				YPOS + HEIGHT + BUMP * 6 + this.plotMargin.topMargin + 12
			);
		},
		renderByAnnotations() {
			var tempHeight = 0;
			let annotationTitleH = this.spaceBy * 2;
			let btwnAnnotations = this.spaceBy * 7;
			let perTissue = this.spaceBy;
			let topMargin = this.spaceBy * 2;
			let bottomMargin = this.spaceBy * 2;

			for (const [annotation, tissues] of Object.entries(this.annoData)) {
				tempHeight += annotationTitleH;
				tempHeight += Object.keys(tissues).length * perTissue;
				tempHeight += btwnAnnotations;
			}

			let canvasWidth = document.querySelector(
				"#annotationsPlotWrapper"
			).clientWidth;

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

				this.renderAnnoAxis(
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
				renderHeight += btwnAnnotations;
			}
		},
		renderAnnoAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
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

#GEPlotWrapper,
#tissuesPlotWrapper,
#annotationsPlotWrapper {
	position: relative;
}

#tissueInfoBox,
#selectedTissueInfoBox,
#GEInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 14px;
}
</style>



