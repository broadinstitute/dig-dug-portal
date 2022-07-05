<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-12 anno-plot-wrapper">
				<div id="annotationsUIWrapper">
					<div
						class="filtering-ui-wrapper add-content"
						style="width: 100%; padding: 0 10px; text-align: left"
					>
						<div class="filtering-ui-content">
							<div class="col" style="padding: 2px">
								<div
									class="label"
									style="
										display: inline-block;
										margin-right: 10px;
									"
								>
									Select Annotation
								</div>
								<!--<select
									class="custom-select"
									@change="addAnnoTrack($event)"
								>-->
								<select
									class="custom-select"
									@change="setAnnotation($event)"
								>
									<option value="">
										{{ "Select annotation" }}
									</option>
									<option
										v-for="(annoValue, annoKey) in annoData"
										:key="annoKey"
										:value="annoKey"
										v-html="annoKey"
									></option>
								</select>
								<div
									v-if="annotationOnFocus != null"
									class="label"
									style="
										display: inline-block;
										margin: 0 10px;
									"
								>
									Select Tissue
								</div>
								<select
									class="custom-select"
									@change="setTissue($event)"
									v-if="annotationOnFocus != null"
								>
									<option value="">
										{{ "Select tissue" }}
									</option>
									<option
										v-for="tissue in annoAssoTissues"
										:key="tissue"
										:value="tissue"
										v-html="tissue"
									></option>
								</select>
								<span
									class="btn btn-default"
									@click="
										getBiosamples(
											annotationOnFocus,
											tissueOnFocus
										)
									"
									>Get biosamples</span
								>
							</div>
						</div>
						<div
							class=""
							v-if="
								pkgDataSelected.filter(
									(s) => s.type == 'Annotation'
								).length > 0 &&
								!renderConfig['no search key bubbles']
							"
							style="position: absolute; right: 10px; top: 7px"
						>
							<template
								v-for="a in pkgDataSelected.filter(
									(s) => s.type == 'Annotation'
								)"
							>
								<span
									:key="a.id"
									:class="'btn search-bubble '"
									:style="
										'background-color:' +
										getColorIndex(a.id)
									"
									v-html="
										a.id +
										'&nbsp;<span class=\'remove\'>X</span>'
									"
									@click="removeAnnoTrack(a.id)"
								></span>
							</template>
						</div>
					</div>
				</div>
				<div
					class="col-md-12 anno-plot-ui-wrapper"
					style="border-bottom: solid 1px #dddddd"
				>
					<h6><strong>Global Enrichment</strong></h6>
					<div>
						<div
							v-for="(annoValue, annoKey, annoIndex) in annoData"
							:key="annoKey"
							class="anno-bubble-wrapper"
						>
							<span
								class="anno-bubble"
								v-html="'&nbsp;'"
								:style="
									'background-color:' +
									compareGroupColors[annoIndex] +
									';'
								"
							></span
							><span v-html="annoKey"></span>
						</div>
					</div>
					<div id="BSGEPlotWrapper" v-if="searchingPhenotype != null">
						<div id="BSGEInfoBox" class="hidden"></div>
						<canvas
							id="BSGEPlot"
							width=""
							height=""
							style="background-color: #ffffff"
							@mousemove="checkGEPosition($event)"
							@mouseout="onMouseOut('BSGEInfoBox')"
						></canvas>
					</div>
				</div>

				<div id="biosamplesPlotWrapper">
					<div id="biosampleInfoBox" class="hidden"></div>

					<canvas
						id="biosamplesPlot"
						@resize="onResize"
						@mousemove="checkPosition($event, 'hover')"
						@click="checkPosition($event, 'click')"
						@mouseout="onMouseOut('biosampleInfoBox')"
						width=""
						height=""
					></canvas>

					<div
						id="annoInitialMessage"
						:class="
							pkgDataSelected.filter(
								(s) => s.type == 'Annotation'
							).length > 0
								? 'hidden'
								: ''
						"
						v-html="'Please select annotation.'"
					></div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-biosamples-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"plotMargin",
		"compareGroupColors",
		"dataComparison",
		"plotData",
		"pkgData",
		"pkgDataSelected",
		"regionZoom",
		"regionViewArea",
	],
	data() {
		return {
			annoData: {},
			biosamplesData: {},
			GEData: {},
			GEPosData: {},
			tissuesData: {},
			tissuesPosData: {},
			selectedAnnos: [],
			selectedTissues: [],
			selectedBiosamples: [],
			biosamplesPosData: {},
			spaceBy: 12,
			annotationOnFocus: null,
			tissueOnFocus: null,
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
		this.getBSAnnotations(this.searchingRegion);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		annoAssoTissues() {
			if (
				this.annotationOnFocus != null &&
				Object.keys(this.tissuesData).length > 0
			) {
				let tissues = [];
				Object.keys(this.tissuesData).filter((t) => {
					if (!!this.tissuesData[t][this.annotationOnFocus]) {
						tissues.push(t);
					}
				});
				////console.log(tissues);
				return tissues;
			} else {
				return null;
			}
		},
		searchingParameters() {
			if (
				this.searchingRegion != null &&
				this.searchingPhenotype != null
			) {
				return this.searchingRegion + "," + this.searchingPhenotype;
			}
		},
		searchingRegion() {
			////console.log("this.region", this.region);
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			uiUtils.showElement("biosamplesPlotWrapper");

			//this.getAnnotations(returnObj);

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
		searchingPhenotype() {
			if (this.phenotype != null) {
				uiUtils.showElement("biosamplesPlotWrapper");

				let returnPhenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;

				return returnPhenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					uiUtils.showElement("biosamplesPlotWrapper");
					return keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					return null;
				}
			}
		},
	},
	watch: {
		searchingParameters(PARAM) {
			this.getBSAnnotations(this.searchingRegion);
		},
		pkgDataSelected: {
			handler: function (n, o) {
				this.renderBiosamplesTrack();
			},
			deep: true,
			immediate: true,
		},
		viewingRegion: {
			handler: function (n, o) {
				this.renderBiosamplesTrack();
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		...uiUtils,
		setAnnotation(EVENT) {
			if (EVENT.target.value != "") {
				this.annotationOnFocus = EVENT.target.value;
			}
		},
		setTissue(EVENT) {
			if (EVENT.target.value != "") {
				this.tissueOnFocus = EVENT.target.value;
			}
		},
		getOverlappingRegion() {
			//"overlapping regions" can be 'and', 'or' or 'false'
			if (
				!!this.renderConfig["overlapping regions"] &&
				this.renderConfig["overlapping regions"] != "false"
			) {
				let selectedBy = {};
				if (this.pkgDataSelected.length > 0) {
					this.pkgDataSelected.map((p) => {
						if (!selectedBy[p.type]) {
							selectedBy[p.type] = [];
						}
						selectedBy[p.type].push(p.id);
					});
				}
				if (
					!!selectedBy["Tissue"] &&
					selectedBy["Tissue"].length > 0 &&
					!!selectedBy["Annotation"] &&
					selectedBy["Annotation"].length > 0
				) {
					let enrichedPosition = { and: null, or: null };

					selectedBy["Annotation"].map((a) => {
						selectedBy["Tissue"].map((t) => {
							if (
								!!this.pkgData.annoData[a] &&
								!!this.pkgData.annoData[a][t]
							) {
								for (const [key, arr] of Object.entries(
									enrichedPosition
								)) {
									let tempArr = [];
									this.pkgData.annoData[a][t].region.map(
										(r) => {
											for (
												let i = r.start;
												i <= r.end;
												i++
											) {
												tempArr.push(i);
											}
										}
									);

									if (arr == null) {
										enrichedPosition[key] = tempArr;
									} else {
										enrichedPosition[key] =
											key == "and"
												? this.getArraysIntersection(
														enrichedPosition[key],
														tempArr
												  )
												: enrichedPosition[key].concat(
														tempArr
												  ); // getting only intersecting positions
									}
								}
							}
						});
					});

					//sort enriched position so I can remove position between start and end positions
					for (const [key, arr] of Object.entries(enrichedPosition)) {
						enrichedPosition[key].sort(function (a, b) {
							return a - b;
						});
					}

					//leave only start and end of overlapping regions
					let enrichedRegion = { and: [], or: [] };
					for (const [key, arr] of Object.entries(enrichedRegion)) {
						for (let i = 0; i < enrichedPosition[key].length; i++) {
							if (
								i == 0 ||
								i == enrichedPosition[key].length - 1
							) {
								enrichedRegion[key].push(
									enrichedPosition[key][i]
								);
							} else {
								let pos1 = enrichedPosition[key][i - 1] + 1;
								let pos2 = enrichedPosition[key][i];

								if (pos2 > pos1) {
									enrichedRegion[key].push(
										enrichedPosition[key][i - 1]
									);
									enrichedRegion[key].push(
										enrichedPosition[key][i]
									);
								}
							}
						}
					}

					///build object of overlapping regions
					let overlappingRegions = { and: [], or: [] };
					for (const [key, arr] of Object.entries(enrichedRegion)) {
						for (
							let i = 0;
							i < enrichedRegion[key].length - 1;
							i += 2
						) {
							let tempObj = {};
							tempObj["start"] = enrichedRegion[key][i];
							tempObj["end"] = enrichedRegion[key][i + 1];
							overlappingRegions[key].push(tempObj);
						}
					}

					Vue.set(
						this.pkgData,
						"overlappingRegions",
						overlappingRegions
					);
				}
			}
		},
		getArraysIntersection(a1, a2) {
			return a1.filter(function (n) {
				return a2.indexOf(n) !== -1;
			});
		},
		onMouseOut(BOXID) {
			uiUtils.removeOnMouseOut(BOXID, 1000);
		},
		onResize(e) {
			uiUtils.showElement("biosamplesPlotWrapper");
			this.renderBiosamplesTrack();
			this.renderGE();
			//this.renderTissuesTracks();
		},
		showHideAnnoPlots() {
			uiUtils.showHideElement("biosamplesPlotWrapper");
		},
		getGEContent(PKEY, TISSUE) {
			let content = "";

			this.pkgDataSelected
				.filter((s) => s.type == "Annotation")
				.map((a) => {
					if (this.pkgData.GEByTissueData[PKEY][TISSUE]) {
						if (this.pkgData.GEByTissueData[PKEY][TISSUE][a.id]) {
							let data =
								this.pkgData.GEByTissueData[PKEY][TISSUE][a.id];
							content +=
								"<strong>" +
								a.id +
								"</strong> (" +
								Formatters.pValueFormatter(data.pValue) +
								" / " +
								Formatters.pValueFormatter(data.fold) +
								")<br />";
						}
					}
				});
			return content;
		},
		getSortByAnno(DATA) {
			let contentObj = {};

			let sortedData = [];
			for (const [tissue, annotations] of Object.entries(DATA)) {
				for (const [annotation, annoParams] of Object.entries(
					annotations
				)) {
					if (
						this.pkgDataSelected
							.map((s) => s.id)
							.includes(annotation) == true &&
						!!this.annoData[annotation][tissue]
					) {
						let tempObj = {
							tissue: tissue,
							fold: null,
							render: null,
						};
						tempObj.render = true;
						if (tempObj.fold == null) {
							tempObj.fold = annoParams.fold;
						} else {
							tempObj.fold =
								annoParams.fold > tempObj.fold
									? annoParams.fold
									: tempObj.fold;
						}
						sortedData.push(tempObj);
					}
				}
			}

			sortedData = sortedData.sort((a, b) => (a.fold < b.fold ? 1 : -1));

			sortedData.map((d) => {
				if (d.render == true) {
					contentObj[d.tissue] = DATA[d.tissue];
				}
			});

			return contentObj;
		},

		removeAnnoTrack(ANNO) {
			////console.log("called", ANNO);
			let selectedAnnotations = this.pkgDataSelected
				.filter((s) => s.type == "Annotation")
				.map((s) => s.id);
			const aIndex = selectedAnnotations.indexOf(ANNO);
			////console.log("called2", aIndex, selectedAnnotations);
			if (aIndex > -1) {
				selectedAnnotations.splice(aIndex, 1);
				if (this.pkgData != null) {
					this.$store.dispatch("pkgDataSelected", {
						type: "Annotation",
						id: ANNO,
						action: "remove",
					});

					Vue.set(this.pkgData, "selectedAnnos", selectedAnnotations);
				}
				this.renderGE();
			}
		},
		addRemoveBiosampleTrack(BIOSAMPLE) {
			let selectedBiosamples = this.pkgDataSelected
				.filter((s) => s.type == "Biosample")
				.map((s) => s.id);

			const bIndex = selectedBiosamples.indexOf(BIOSAMPLE);

			if (bIndex > -1) {
				if (this.pkgData != null) {
					this.$store.dispatch("pkgDataSelected", {
						type: "Biosample",
						id: BIOSAMPLE,
						action: "remove",
					});
				}
			} else {
				if (this.pkgData != null) {
					this.$store.dispatch("pkgDataSelected", {
						type: "Biosample",
						id: BIOSAMPLE,
						action: "add",
					});
				}
			}
		},
		renderTissuesTracks() {
			/// this method is not used but kept in case
			let canvas = document.querySelector("#tissuesPlot");
			let wrapper = document.querySelector("#tissuesPlotWrapper");
			if (!!canvas && !!wrapper) {
				let tempHeight = 0;
				let tissueTitleH = this.spaceBy * 2;
				let btwnTissues = this.spaceBy * 3;
				let perAnnotation = this.spaceBy;
				let topMargin = this.spaceBy;
				let bottomMargin = this.spaceBy * 2;
				let bump = this.plotMargin.bump;
				let regionStart = this.viewingRegion.start;
				let regionEnd = this.viewingRegion.end;

				let canvasWidth = wrapper.clientWidth;
				let canvasHeight = this.plotMargin.topMargin;

				let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
				let xPerPixel = plotWidth / (regionEnd - regionStart);

				let selectedAnnotations = this.pkgDataSelected
					.filter((s) => s.type == "Annotation")
					.map((s) => s.id);

				let selectedTissues = this.pkgDataSelected
					.filter((s) => s.type == "Tissue")
					.map((s) => s.id);

				selectedTissues.map((t) => {
					let selectedAnnosNum = 0;
					for (const [annoKey, annoValue] of Object.entries(
						this.tissuesData[t]
					)) {
						if (selectedAnnotations.includes(annoKey) == true) {
							selectedAnnosNum++;
						}
					}
					canvasHeight +=
						tissueTitleH +
						btwnTissues +
						topMargin +
						perAnnotation * selectedAnnosNum;
				});

				canvas.setAttribute("width", canvasWidth);
				canvas.setAttribute("height", canvasHeight);

				let c, ctx;
				c = canvas;
				ctx = c.getContext("2d");
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let renderHeight = this.plotMargin.topMargin;

				selectedTissues.map((t, tIndex) => {
					let selectedAnnosNum = 0;
					for (const [annoKey, annoValue] of Object.entries(
						this.tissuesData[t]
					)) {
						if (selectedAnnotations.includes(annoKey) == true) {
							selectedAnnosNum++;
						}
					}

					ctx.font = "14px Arial";
					ctx.textAlign = "left";
					ctx.fillStyle = "#000000";
					ctx.fillText(t, bump, renderHeight + this.spaceBy);

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

					ctx.font = "12px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#ffffff";
					ctx.fillText(
						"\u{2715}",
						this.plotMargin.leftMargin + plotWidth + bump * 3,
						renderHeight + bump * 2 + 3.5
					);

					//feed close button position
					let yPosBtwn = Math.ceil(
						(renderHeight + bump * 2) / this.spaceBy
					);
					let xPos =
						this.plotMargin.leftMargin + plotWidth + bump * 3;
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
						renderHeight + bump + perAnnotation * selectedAnnosNum
					);
					ctx.stroke();

					ctx.moveTo(
						this.plotMargin.leftMargin + plotWidth + bump,
						renderHeight
					);
					ctx.lineTo(
						this.plotMargin.leftMargin + plotWidth + bump,
						renderHeight + bump + perAnnotation * selectedAnnosNum
					);
					ctx.stroke();

					ctx.moveTo(
						this.plotMargin.leftMargin - bump,
						renderHeight + bump + perAnnotation * selectedAnnosNum
					);
					ctx.lineTo(
						this.plotMargin.leftMargin + plotWidth + bump,
						renderHeight + bump + perAnnotation * selectedAnnosNum
					);
					ctx.stroke();

					if (tIndex + 1 == selectedTissues.length) {
						let xStep = (regionEnd - regionStart) / 5;
						let xTickDistance = plotWidth / 5;

						for (let i = 0; i < 6; i++) {
							let tickXPos =
								this.plotMargin.leftMargin + i * xTickDistance;

							let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line

							ctx.moveTo(
								adjTickXPos,
								renderHeight +
									bump +
									perAnnotation * selectedAnnosNum
							);
							ctx.lineTo(
								adjTickXPos,
								renderHeight +
									bump * 2 +
									perAnnotation * selectedAnnosNum
							);
							ctx.stroke();

							ctx.textAlign = "center";
							ctx.font = "12px Arial";
							ctx.fillStyle = "#999999";

							let positionLabel =
								i < 5
									? Number(regionStart) + i * xStep
									: Number(regionEnd);

							ctx.fillText(
								Math.floor(positionLabel),
								adjTickXPos,
								renderHeight +
									bump * 4 +
									perAnnotation * selectedAnnosNum
							);
						}
					}

					let aIndex = 0;
					for (const [a, aValue] of Object.entries(
						this.tissuesData[t]
					)) {
						if (selectedAnnotations.includes(a) == true) {
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
							let yPosBtwn = Math.ceil(
								renderHeight / this.spaceBy
							);

							this.tissuesPosData[yPosBtwn] = {
								tissue: t,
								annotation: a,
								regions: {},
							};

							region.map((p) => {
								if (
									p.start <= regionEnd &&
									p.end >= regionStart
								) {
									let xPosStart =
										(p.start - regionStart) * xPerPixel +
										this.plotMargin.leftMargin;

									xPosStart =
										xPosStart <= this.plotMargin.leftMargin
											? this.plotMargin.leftMargin
											: xPosStart;
									let xPosEnd =
										(p.end - regionStart) * xPerPixel +
										this.plotMargin.leftMargin;

									xPosEnd =
										xPosEnd >
										this.plotMargin.leftMargin + plotWidth
											? this.plotMargin.leftMargin +
											  plotWidth
											: xPosEnd;

									//let xPosWidth = xPosEnd - xPosStart;
									let xPosWidth =
										xPosEnd - xPosStart < 1
											? 1
											: xPosEnd - xPosStart;
									ctx.fillRect(
										xPosStart,
										renderHeight,
										xPosWidth,
										perAnnotation - 1
									);

									let xPosBtwn =
										xPosStart +
										"_" +
										(xPosStart + xPosWidth);
									this.tissuesPosData[yPosBtwn].regions[
										xPosBtwn
									] = {
										start: p.start,
										end: p.end,
									};
								}
							});

							renderHeight += perAnnotation;
						}
					}
					renderHeight += btwnTissues;
				});
			}
		},
		removeTissueTrack(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let rawX = e.clientX - rect.left;
			let y = Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy);

			let selectedTissues = this.pkgDataSelected
				.filter((s) => s.type == "Tissue")
				.map((s) => s.id);

			if (
				x > rect.width - this.plotMargin.leftMargin &&
				!!this.tissuesPosData[y]
			) {
				for (const [region, regionValue] of Object.entries(
					this.tissuesPosData[y].regions
				)) {
					let hPosition = region.split("_");
					let start = hPosition[0];
					let end = hPosition[1];
					if (x >= start && x <= end) {
						let tissue = this.tissuesPosData[y].tissue;
						const tIndex = selectedTissues.indexOf(tissue);
						if (tIndex > -1) {
							if (this.pkgData != null) {
								this.$store.dispatch("pkgDataSelected", {
									type: "Tissue",
									id: tissue,
									action: "remove",
								});
							}
						}
					}
				}
			}
		},
		checkTissuesPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let rawX = e.clientX - rect.left;
			let y = Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy);

			let rawY = e.clientY - rect.top;

			const infoBox = document.querySelector("#selectedbiosampleInfoBox");
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
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			const infoBox = document.querySelector("#BSGEInfoBox");

			let infoBoxContent = "";
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
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let y =
				Math.ceil(Math.floor(e.clientY - rect.top) / this.spaceBy) - 1;

			const infoBox = document.querySelector("#biosampleInfoBox");
			let infoContent = "";

			if (TYPE == "hover") {
				if (
					x >= this.plotMargin.leftMargin &&
					x <= rect.width - this.plotMargin.leftMargin
				) {
					if (!!this.biosamplesPosData[y]) {
						//this.$store.dispatch("sharedPlotXpos", rawX);
						infoContent += this.biosamplesPosData[y].biosample;
						for (const [region, regionValue] of Object.entries(
							this.biosamplesPosData[y].regions
						)) {
							let hPosition = region.split("_");
							let start = hPosition[0];
							let end = hPosition[1];
							if (x >= start && x <= end) {
								infoContent +=
									"<br />" +
									regionValue.start +
									"-" +
									regionValue.end +
									"<br />" +
									"dataset: " +
									regionValue.dataset +
									"<br />" +
									"source: " +
									regionValue.source +
									"<br />" +
									"method: " +
									regionValue.method +
									"<br />";
							}
						}
					}
				} else if (
					x >= rect.width - this.plotMargin.leftMargin &&
					x <= rect.width
				) {
					let floorY = Math.floor(rawY);
					let yStart = floorY - 4;
					let yEnd = floorY + 4;
					for (let i = yStart; i <= yEnd; i++) {
						if (
							!!this.biosamplesPosData[i] &&
							!!this.biosamplesPosData[i].annotation
						) {
							for (const [region, regionValue] of Object.entries(
								this.biosamplesPosData[i].regions
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
				}
			}

			if (TYPE == "click") {
				if (
					x >= this.plotMargin.leftMargin &&
					x <= rect.width - this.plotMargin.leftMargin
				) {
					if (!!this.biosamplesPosData[y]) {
						//this.$store.dispatch("sharedPlotXpos", rawX);
						infoContent +=
							this.biosamplesPosData[y].annotation +
							" / " +
							this.biosamplesPosData[y].tissue +
							" / " +
							this.biosamplesPosData[y].biosample;
					}
				}
			}

			if (TYPE == "hover") {
				if (infoContent == "") {
					infoBox.innerHTML = "";
					infoBox.setAttribute("class", "hidden");
				} else {
					infoBox.innerHTML = infoContent;
					infoBox.setAttribute("class", "");
					infoBox.style.left = rawX + 15 + "px";
					infoBox.style.top = rawY + this.spaceBy + "px";
				}
			}

			if (TYPE == "click") {
				if (infoContent != "") {
					//////console.log(infoContent);
					this.addRemoveBiosampleTrack(infoContent);
				}
			}
		},
		getColorIndex(anno) {
			let annoArry = Object.keys(this.annoData);
			let i = annoArry.indexOf(anno);
			return this.compareGroupColors[i];
		},
		async getGlobalEnrichment() {
			//////console.log("calling GE");
			let biosamplesServer =
				this.renderConfig["biosamples server"] == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig["biosamples server"];

			let phenotype = this.searchingPhenotype;

			let GEIndex = !!this.renderConfig["global enrichment index"]
				? this.renderConfig["global enrichment index"]
				: "global-enrichment";

			let GEURL =
				biosamplesServer + "/query/" + GEIndex + "?q=" + phenotype;

			//console.log("GEURL", GEURL);

			let GEJson = await fetch(GEURL).then((resp) => resp.json());

			if (GEJson.error == null) {
				//console.log("GEJson", GEJson);
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

				let GEByTissue = this.getGEByTissue();

				//console.log("this.tissuesData", this.tissuesData);

				if (this.pkgData != null) {
					Vue.set(this.pkgData, "GEByTissueData", GEByTissue);
					Vue.set(this.pkgData, "GEData", this.GEData);
					Vue.set(this.pkgData, "annoData", this.annoData);
					Vue.set(this.pkgData, "tissuesData", this.tissuesData);
				}

				this.renderBiosamplesTrack();
				this.renderGE();
			}
			this.$forceUpdate();
		},

		getGEByTissue() {
			/// put lowest pValue and fold across ancestries

			let annotations = {};

			Object.keys(this.GEData).map((pKey) => {
				annotations[pKey] = {};
				Object.keys(this.annoData).map((aKey) => {
					annotations[pKey][aKey] = [];
				});
			});

			let GEByTissue = {};
			for (const [phenotype, phenotypeGE] of Object.entries(
				this.GEData
			)) {
				GEByTissue[phenotype] = {};
				phenotypeGE.map((g) => {
					if (!GEByTissue[phenotype][g.tissue]) {
						GEByTissue[phenotype][g.tissue] = {};
					}
					///Adding "gregor" slot for later use.
					if (!GEByTissue[phenotype][g.tissue][g.annotation]) {
						GEByTissue[phenotype][g.tissue][g.annotation] = {
							pValue: null,
							fold: null,
							gregor: null,
							rank: null,
						};
					}

					let pPerTissue =
						GEByTissue[phenotype][g.tissue][g.annotation].pValue;

					if (pPerTissue == null) {
						GEByTissue[phenotype][g.tissue][g.annotation].pValue =
							Formatters.pValueFormatter(g.pValue);
						GEByTissue[phenotype][g.tissue][g.annotation].fold =
							Formatters.pValueFormatter(g.SNPs / g.expectedSNPs);
					} else if (g.pValue < pPerTissue) {
						GEByTissue[phenotype][g.tissue][g.annotation].pValue =
							Formatters.pValueFormatter(g.pValue);
						GEByTissue[phenotype][g.tissue][g.annotation].fold =
							Formatters.pValueFormatter(g.SNPs / g.expectedSNPs);
					}

					if (!!annotations[phenotype][g.annotation]) {
						annotations[phenotype][g.annotation].push({
							tissue: g.tissue,
							fold: GEByTissue[phenotype][g.tissue][g.annotation]
								.fold,
						});
					}

					/*annotations[phenotype][g.annotation].sort(
						(a, b) => b.fold - a.fold
					);*/
				});
			}

			/// get the ranks of tissues by fold
			Object.keys(annotations).map((pKey) => {
				Object.keys(annotations[pKey]).map((aKey) => {
					annotations[pKey][aKey] = [
						...new Map(
							annotations[pKey][aKey].map((item) => [
								item["tissue"],
								item,
							])
						).values(),
					];

					annotations[pKey][aKey].sort((a, b) => b.fold - a.fold);

					////console.log(aKey);
					let tIndex = 0;
					annotations[pKey][aKey].map((tValue) => {
						////console.log(tValue.tissue, tIndex);
						if (
							!!this.tissuesData[tValue.tissue] &&
							!!this.tissuesData[tValue.tissue][aKey]
						) {
							GEByTissue[pKey][tValue.tissue][aKey].rank = tIndex;
							tIndex++;
						}
					});
				});
			});

			return GEByTissue;
		},
		async getBiosamples(ANNOTATION, TISSUE) {
			//console.log(ANNOTATION, TISSUE);

			let biosamplesServer =
				this.renderConfig["biosamples server"] == "KP BioIndex"
					? "https://bioindex-dev.hugeamp.org/api/bio"
					: this.renderConfig["biosamples server"];

			let biosamplesIndex = !!this.renderConfig["biosamples index"]
				? this.renderConfig["biosamples index"]
				: "tissue-regions";

			let tissue = TISSUE;
			let region = this.searchingRegion;

			let biosamplesURL =
				biosamplesServer +
				"/query/" +
				biosamplesIndex +
				"?q=" +
				tissue +
				"," +
				region.chr +
				":" +
				region.start +
				"-" +
				region.end;

			//console.log(biosamplesURL);

			let biosamplesJson = await fetch(biosamplesURL).then((resp) =>
				resp.json()
			);

			if (biosamplesJson.error == null) {
				let regions = [];
				biosamplesJson.data.map((d) => {
					if (d.annotation == ANNOTATION) {
						regions.push(d);
					}
				});

				if (regions.length > 0) {
					//newRows = [...new Set(this.pkgDataSelected.map((p) => p.type))];
					let biosampleKeys = [
						...new Set(regions.map((r) => r.biosample)),
					].sort(Intl.Collator().compare);

					//console.log("biosampleKeys", biosampleKeys);

					if (!this.biosamplesData[ANNOTATION]) {
						this.biosamplesData[ANNOTATION] = {};
					}

					if (!this.biosamplesData[ANNOTATION][TISSUE]) {
						this.biosamplesData[ANNOTATION][TISSUE] = {};
					}

					biosampleKeys.map((b) => {
						if (!this.biosamplesData[ANNOTATION][TISSUE][b]) {
							this.biosamplesData[ANNOTATION][TISSUE][b] = [];
						}
						regions.map((r) => {
							if (r.biosample == b) {
								this.biosamplesData[ANNOTATION][TISSUE][
									r.biosample
								].push(r);
							}
						});
					});
				}

				if (this.pkgData != null) {
					Vue.set(
						this.pkgData,
						"biosamplesData",
						this.biosamplesData
					);
				}

				this.renderBiosamplesTrack();
			}
		},

		renderBiosamplesTrack() {
			//console.log("render", "this.biosamplesData", this.biosamplesData);

			let staredPositions = [];

			if (!!this.renderConfig["star key"]) {
				let plotData = !!Array.isArray(this.plotData)
					? this.array2Object(
							this.renderConfig["star key"]["key"],
							this.plotData
					  )
					: this.plotData;

				let starKey = this.renderConfig["star key"]["key"];
				let starPosition = this.renderConfig["star key"]["position"];

				this.pkgDataSelected
					.filter((s) => s.type == starKey)
					.map((s) => s.id)
					.map((s) => {
						////console.log("this.plotData[s]", plotData[s]);
						staredPositions.push(plotData[s][starPosition]);
					});
			}

			let tempHeight = 0;
			let annotationTitleH = this.spaceBy * 2;
			let btwnAnnotations = this.spaceBy * 7;
			let perBiosample = this.spaceBy;
			let topMargin = this.spaceBy * 2;
			let bottomMargin = this.spaceBy * 2;
			let regionStart = this.viewingRegion.start;
			let regionEnd = this.viewingRegion.end;
			let pvalueFoldWidth = 120;

			let selectedBiosamples = this.pkgDataSelected
				.filter((s) => s.type == "Biosample")
				.map((s) => s.id);

			let annotationTissueArr = [];

			for (const [aKey, aValue] of Object.entries(this.biosamplesData)) {
				for (const [tKey, biosamples] of Object.entries(aValue)) {
					annotationTissueArr.push(aKey + " / " + tKey);
					tempHeight += annotationTitleH;
					tempHeight += Object.keys(biosamples).length * perBiosample;
					tempHeight += btwnAnnotations;
				}
			}

			//console.log("annotationTissueArr", annotationTissueArr);

			let wrapper = document.querySelector("#biosamplesPlotWrapper");
			let canvas = document.querySelector("#biosamplesPlot");

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth * 0.75;
				let canvasHeight = tempHeight + topMargin + bottomMargin;
				let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
				let plotHeight = tempHeight;
				let bump = 5.5;

				let xPerPixel = plotWidth / (regionEnd - regionStart);

				let c, ctx;
				c = canvas;
				c.setAttribute("width", canvasWidth);
				c.setAttribute("height", canvasHeight);
				ctx = c.getContext("2d");
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let renderHeight = annotationTitleH;

				annotationTissueArr.map((at) => {
					ctx.font = "14px Arial";
					ctx.textAlign = "left";
					ctx.fillStyle = "#000000";
					ctx.fillText(at, bump, renderHeight);

					renderHeight += annotationTitleH;

					let atPath = at.split(" / ");

					let blockHeight =
						Object.keys(this.biosamplesData[atPath[0]][atPath[1]])
							.length * perBiosample;

					this.renderAnnoAxis(
						ctx,
						plotWidth,
						blockHeight,
						Number(regionEnd),
						Number(regionStart),
						renderHeight,
						bump
					);

					if (
						!!this.renderConfig["star key"] &&
						staredPositions.length > 0
					) {
						this.renderStaredPositions(
							ctx,
							plotWidth,
							blockHeight,
							staredPositions,
							xPerPixel,
							Number(regionEnd),
							Number(regionStart),
							renderHeight,
							bump
						);
					}

					let biosampleIndex = 0;
					for (const [bKey, bRegions] of Object.entries(
						this.biosamplesData[atPath[0]][atPath[1]]
					)) {
						let yPosBtn = Math.ceil(renderHeight / this.spaceBy);

						if (!this.biosamplesPosData[yPosBtn]) {
							this.biosamplesPosData[yPosBtn] = {
								biosample: bKey,
								annotation: atPath[0],
								tissue: atPath[1],
								regions: {},
							};
						} else {
							this.biosamplesPosData[yPosBtn]["biosample"] = bKey;
						}

						if (biosampleIndex % 2 == 0) {
							ctx.fillStyle = "#00000010";
							ctx.fillRect(
								this.plotMargin.leftMargin,
								renderHeight,
								plotWidth,
								perBiosample
							);
						}

						biosampleIndex++;

						bRegions.map((p) => {
							if (p.start <= regionEnd && p.end >= regionStart) {
								let xPosStart =
									(p.start - regionStart) * xPerPixel +
									this.plotMargin.leftMargin;

								xPosStart =
									xPosStart <= this.plotMargin.leftMargin
										? this.plotMargin.leftMargin
										: xPosStart;
								let xPosEnd =
									(p.end - regionStart) * xPerPixel +
									this.plotMargin.leftMargin;

								xPosEnd =
									xPosEnd >
									this.plotMargin.leftMargin + plotWidth
										? this.plotMargin.leftMargin + plotWidth
										: xPosEnd;

								//let xPosWidth = xPosEnd - xPosStart;
								let xPosWidth =
									xPosEnd - xPosStart < 1
										? 1
										: xPosEnd - xPosStart;

								if (
									selectedBiosamples.indexOf(
										atPath[0] +
											" / " +
											atPath[1] +
											" / " +
											bKey
									) > -1
								) {
									ctx.fillStyle = "#FF0000";
								} else {
									ctx.fillStyle = this.getColorIndex(
										atPath[0]
									);
								}

								ctx.fillRect(
									xPosStart,
									renderHeight,
									xPosWidth,
									perBiosample - 1
								);
								let xPosBtn =
									xPosStart + "_" + (xPosStart + xPosWidth);
								this.biosamplesPosData[yPosBtn].regions[
									xPosBtn
								] = {
									start: p.start,
									end: p.end,
									dataset: p.dataset,
									method: p.method,
									source: p.source,
								};
							}
						});

						renderHeight += perBiosample;

						ctx.fillStyle = "#000000";
						ctx.textAlign = "start";
						ctx.textBaseline = "middle";
						ctx.font = "12px Arial";
						ctx.fillText(bKey, 5, renderHeight - 4);
					}

					renderHeight += btwnAnnotations;
				});
			}
		},

		async getBSAnnotations(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				////console.log("calling annotations");
				let biosamplesServer =
					this.renderConfig["biosamples server"] == "KP BioIndex"
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["biosamples server"];

				let biosamplesIndex = !!this.renderConfig["biosamples index"]
					? this.renderConfig["biosamples index"]
					: "regions";

				let biosamplesURL =
					biosamplesServer +
					"/query/" +
					biosamplesIndex +
					"?q=" +
					REGION_OBJ.chr +
					":" +
					REGION_OBJ.start +
					"-" +
					REGION_OBJ.end;

				let biosamplesJson = await fetch(biosamplesURL).then((resp) =>
					resp.json()
				);

				if (biosamplesJson.error == null) {
					this.annoData = {};
					this.tissuesData = {};

					biosamplesJson.data.map((a) => {
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

					if (this.pkgData != null) {
						Vue.set(this.pkgData, "annoData", this.annoData);
						Vue.set(this.pkgData, "tissuesData", this.tissuesData);
					}

					this.getGlobalEnrichment();
				}
			}
		},
		renderGE() {
			this.GEPosData = {};
			let sortedGEData = {};

			////console.log("renderGE", this.pkgData.selectedAnnos);

			////console.log("this.GEData", this.GEData);
			////console.log("this.annoData", this.annoData);

			for (const [phenotype, GE] of Object.entries(this.GEData)) {
				sortedGEData[phenotype] = {
					xMax: null,
					xMin: null,
					yMax: null,
					yMin: null,
				};

				GE.map((g) => {
					if (
						!!this.annoData[g.annotation] &&
						!!this.annoData[g.annotation][g.tissue]
					) {
						if (!sortedGEData[phenotype][g.annotation]) {
							sortedGEData[phenotype][g.annotation] = {};
						}
						let pValue = -Math.log10(g.pValue);
						let fold = g.SNPs / g.expectedSNPs;

						sortedGEData[phenotype].yMax =
							sortedGEData[phenotype].yMax == null
								? fold
								: fold > sortedGEData[phenotype].yMax
								? fold
								: sortedGEData[phenotype].yMax;

						sortedGEData[phenotype].yMin =
							sortedGEData[phenotype].yMin == null
								? fold
								: fold < sortedGEData[phenotype].yMin
								? fold
								: sortedGEData[phenotype].yMin;

						sortedGEData[phenotype].xMax =
							sortedGEData[phenotype].xMax == null
								? pValue
								: pValue > sortedGEData[phenotype].xMax
								? pValue
								: sortedGEData[phenotype].xMax;

						sortedGEData[phenotype].xMin =
							sortedGEData[phenotype].xMin == null
								? pValue
								: pValue < sortedGEData[phenotype].xMin
								? pValue
								: sortedGEData[phenotype].xMin;

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

			let numOfPhenotypes = Object.keys(sortedGEData).length;

			let canvasWidth =
				document.querySelector("#BSGEPlotWrapper").clientWidth * 0.25;

			let allCanvasWidth = canvasWidth * numOfPhenotypes;

			let plotHeight = 130;
			let titleSize = this.spaceBy * 2;
			let canvasHeight =
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin +
				plotHeight +
				titleSize;

			let plotWidth =
				canvasWidth -
				this.plotMargin.leftMargin -
				this.plotMargin.rightMargin;
			let bump = 5.5;

			let c, ctx;
			c = document.querySelector("#BSGEPlot");
			c.setAttribute("width", allCanvasWidth);
			c.setAttribute("height", canvasHeight);
			ctx = c.getContext("2d");

			let pIndex = 0;
			for (const [phenotype, GE] of Object.entries(sortedGEData)) {
				let titleYPos = titleSize;

				let canvasLeft = bump + canvasWidth * pIndex;

				ctx.font = "14px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(phenotype, canvasLeft, titleYPos);

				this.renderGEAxis(
					ctx,
					plotWidth,
					plotHeight,
					GE.xMax,
					GE.xMin,
					GE.yMax,
					GE.yMin,
					canvasLeft,
					titleYPos,
					bump
				);

				let annotationsArr = Object.keys(this.annoData);
				//let tissuesCount = 0;

				let foldArr = [];
				let pValArr = [];
				annotationsArr.map((annotation) => {
					for (const [tissue, tissueValue] of Object.entries(
						GE[annotation]
					)) {
						//tissuesCount++;
						pValArr.push(tissueValue.pValue);
						foldArr.push(tissueValue.fold);
					}
				});

				foldArr.sort((a, b) => b - a);
				pValArr.sort((a, b) => b - a);

				let xPosByPixel = plotWidth / (GE.xMax - GE.xMin);
				let yPosByPixel = plotHeight / (GE.yMax - GE.yMin);

				annotationsArr.map((annotation, annoIndex) => {
					let dotColor =
						!this.pkgData.selectedAnnos ||
						this.pkgData.selectedAnnos.length == 0
							? this.compareGroupColors[annoIndex]
							: !!this.pkgData.selectedAnnos &&
							  !!this.pkgData.selectedAnnos.includes(annotation)
							? this.compareGroupColors[annoIndex]
							: "#00000030";

					//let firstTissueInAnno = 0;
					for (const [tissue, tValue] of Object.entries(
						GE[annotation]
					)) {
						let xPos =
							canvasLeft +
							this.plotMargin.leftMargin +
							(tValue.pValue - GE.xMin) * xPosByPixel;

						let yPos =
							titleYPos +
							this.plotMargin.topMargin +
							plotHeight -
							(tValue.fold - GE.yMin) * yPosByPixel;

						ctx.fillStyle = dotColor;
						ctx.lineWidth = 0;
						ctx.beginPath();
						ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI);
						ctx.fill();

						if (
							tValue.fold >= foldArr[2] ||
							tValue.pValue >= pValArr[2]
						) {
							ctx.font = "12px Arial";
							ctx.fillStyle =
								!this.pkgData.selectedAnnos ||
								this.pkgData.selectedAnnos.length == 0
									? "#000000"
									: !!this.pkgData.selectedAnnos &&
									  !!this.pkgData.selectedAnnos.includes(
											annotation
									  )
									? "#000000"
									: "#00000050";
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
		},
		renderGEAxis(
			CTX,
			WIDTH,
			HEIGHT,
			XMAX,
			XMIN,
			YMAX,
			YMIN,
			XPOS,
			YPOS,
			BUMP
		) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			let yAxisXPos =
				Math.round(XPOS + this.plotMargin.leftMargin - BUMP) - 0.5;
			CTX.moveTo(yAxisXPos, YPOS + this.plotMargin.topMargin);
			CTX.lineTo(
				yAxisXPos,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);

			// Y ticks
			let yStep = (YMAX - YMIN) / 5;
			let yTickDistance = HEIGHT / 5;

			for (let i = 0; i < 6; i++) {
				let tickYPos =
					YPOS + this.plotMargin.topMargin + i * yTickDistance;

				let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line

				CTX.moveTo(
					XPOS + this.plotMargin.leftMargin - BUMP * 2,
					adjTickYPos
				);
				CTX.lineTo(
					XPOS + this.plotMargin.leftMargin - BUMP,
					adjTickYPos
				);
				CTX.stroke();

				CTX.textAlign = "right";
				CTX.font = "12px Arial";

				CTX.fillText(
					Formatters.floatFormatter(YMIN + i * yStep),
					XPOS + this.plotMargin.leftMargin - BUMP * 3,
					YPOS +
						this.plotMargin.topMargin +
						HEIGHT +
						BUMP -
						i * yTickDistance
				);
			}

			//Render y axis label
			let yLabel = !!this.renderConfig["global enrichment y axis label"]
				? this.renderConfig["global enrichment y axis label"]
				: "Fold(SNPs/expectedSNPs)";
			CTX.textAlign = "center";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				yLabel,
				-(this.plotMargin.topMargin + HEIGHT / 2) - YPOS,
				XPOS + BUMP + 12
			);

			// render x axis
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.moveTo(
				XPOS + this.plotMargin.leftMargin - BUMP,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);
			CTX.lineTo(
				XPOS + this.plotMargin.leftMargin + WIDTH,
				YPOS + this.plotMargin.topMargin + HEIGHT + BUMP
			);
			CTX.stroke();

			// x ticks
			let xStep = (XMAX - XMIN) / 5;
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos =
					XPOS + this.plotMargin.leftMargin + i * xTickDistance;

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
			let xLabel = !!this.renderConfig["global enrichment x axis label"]
				? this.renderConfig["global enrichment x axis label"]
				: "-Log10(p-value)";
			CTX.textAlign = "center";
			CTX.fillText(
				xLabel,
				XPOS + this.plotMargin.leftMargin + WIDTH / 2,
				YPOS + HEIGHT + BUMP * 6 + this.plotMargin.topMargin + 12
			);
		},
		array2Object(KEY, ARRAY) {
			var convertedObj = {};
			ARRAY.map((a) => {
				let key = a[KEY];
				convertedObj[key] = a;
			});
			return convertedObj;
		},
		object2Array() {},

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
		renderStaredPositions(
			CTX,
			WIDTH,
			HEIGHT,
			STARED,
			XPERPIXEL,
			xMax,
			xMin,
			yPos,
			bump
		) {
			////console.log("called");
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#FFAA00";
			CTX.setLineDash([3, 3]); // cancel dashed line incase dashed lines rendered some where

			// render dased lines
			STARED.map((s) => {
				let xPos = (s - xMin) * XPERPIXEL + this.plotMargin.leftMargin;
				CTX.moveTo(xPos, yPos - bump);
				CTX.lineTo(xPos, yPos + HEIGHT + bump);
				CTX.stroke();
			});
		},
	},
});

$(function () {});
</script>

<style>
.search-bubble {
	font-size: 12px;
	margin-right: 5px;
	border-radius: 5px;
	margin-bottom: 3px;
	color: #fff;
	float: left;
	font-weight: 400;
	line-height: 1;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	user-select: none;
	border: 1px solid transparent;
	padding: 0.25em 0.4em;
	padding-right: 0.6em;
	padding-left: 0.6em;
	border-radius: 10rem;
}

.search-bubble.hidden {
	display: none !important;
}
.phenotype-tissue-td {
	vertical-align: top !important;
}

.annotations-table-wrapper {
	/*
	max-height: 300px;
	overflow: auto;
	padding: 15px;
	background-color: #eee;
	border: solid 1px #ddd;
	border-radius: 5px;
	margin-bottom: 15px;*/
}
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
.anno-bubble-wrapper {
	width: auto;
	display: inline-block;
	margin-left: 3px;
	margin-right: 3px;
	margin-bottom: 3px;
}
.anno-bubble-wrapper span {
	font-size: 12px;
	display: inline-block;
}
.anno-bubble {
	border-radius: 12px;
	margin-right: 3px;
	width: 12px;
	height: 12px;
	vertical-align: -3px;
}

#BSGEPlotWrapper,
#tissuesPlotWrapper,
#biosamplesPlotWrapper {
	position: relative;
}

#biosampleInfoBox,
#selectedbiosampleInfoBox,
#BSGEInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 14px;
}
#annoInitialMessage,
#tissueInitialMessage {
	width: 300px;
	border: solid 1px #ddd;
	color: #666;
	margin: 0 auto;
	border-radius: 25px;
	text-align: center;
	font-size: 13px;
}

table.ge-data-table {
	border-top: solid 1px #ddd;
	border-right: solid 1px #ddd;
	border-collapse: inherit;
	text-align: center;
	background-color: #fff;
}

.ge-data-table table {
	border: none;
}

.ge-data-table th {
	background-color: #cccccc;
	color: #333333;
	border: none !important;
	border-left: solid 1px #ddd !important;
	border-bottom: solid 1px #ddd !important;
	font-size: 13px;
}

.ge-data-table td {
	border: none !important;
	border-left: solid 1px #eee !important;
	border-bottom: solid 1px #ddd !important;
	vertical-align: middle;
	font-size: 14px;
}
</style>



