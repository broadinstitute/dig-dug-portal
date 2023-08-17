<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 annotations-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-12 anno-plot-wrapper">
				<div id="annotationsUIWrapper">
					<span>
						<strong
							>Filter associated variants by location within
							regulatory regions annotated in broad tissue
							categories.</strong
						>
					</span>
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
								<select
									class="custom-select"
									v-model="annotationOnFocus"
									@change="addAnnoTrack($event)"
								>
									<option value="null">
										{{ "Show all" }}
									</option>
									<option
										v-for="(annoValue, annoKey) in annoData"
										:key="annoKey"
										:value="annoKey"
										v-html="annoKey"
									></option>
								</select>
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
					style="padding-top: 15px"
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
					<div id="GEPlotWrapper" v-if="searchingPhenotype != null">
						<div id="GEInfoBox" class="hidden"></div>
						<canvas
							id="GEPlot"
							width=""
							height=""
							style="background-color: #ffffff"
							@mousemove="checkGEPosition($event)"
							@mouseout="onMouseOut('GEInfoBox')"
						></canvas>
					</div>
				</div>

				<div
					id="annotationsPlotWrapper"
					:class="
						pkgDataSelected.filter((s) => s.type == 'Annotation')
							.length == 0
							? 'height-1px'
							: 'height-auto'
					"
				>
					<!--<div
						class="filtering-ui-wrapper add-content"
						style="width: 100%; padding: 0 10px; text-align: left"
						v-if="
							pkgDataSelected.filter(
								(s) => s.type == 'Annotation'
							).length > 0
						"
					>
						<div
							class="filtering-ui-content"
							style="padding: 5px; text-align: left"
						>
							<strong
								>Select tissue categories by clicking
								tracks</strong
							>
							<div
								class=""
								v-if="
									pkgDataSelected.filter(
										(s) => s.type == 'Tissue'
									).length > 0 &&
									!renderConfig['no search key bubbles']
								"
								style="float: right"
							>
								<template
									v-for="a in pkgDataSelected.filter(
										(s) => s.type == 'Tissue'
									)"
								>
									<span
										:key="a.id"
										:class="'btn search-bubble '"
										:style="'background-color:#999999'"
										v-html="
											a.id +
											'&nbsp;<span class=\'remove\'>X</span>'
										"
										@click="addRemoveTissueTrack(a.id)"
									></span>
								</template>
							</div>
						</div>
					</div>-->
					<strong
						v-if="
							pkgDataSelected.filter(
								(s) => s.type == 'Annotation'
							).length > 0
						"
					>
						Click on a tissue track to see annotations in specific
						cell types.</strong
					>
					<div id="tissueInfoBox" class="hidden"></div>

					<canvas
						id="annotationsPlot"
						@resize="onResize"
						@mousemove="checkPosition($event, 'hover')"
						@click="checkPosition($event, 'click')"
						@mouseout="onMouseOut('tissueInfoBox')"
						width=""
						height=""
					></canvas>

					<!--<div
						id="annoInitialMessage"
						:class="
							pkgDataSelected.filter(
								(s) => s.type == 'Annotation'
							).length > 0
								? 'hidden'
								: ''
						"
						v-html="'Please select annotation.'"
					></div>-->
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

export default Vue.component("research-annotations-plot-v2", {
	props: [
		"region",
		"phenotype",
		"ancestry",
		"renderConfig",
		"plotMargin",
		"compareGroupColors",
		"dataComparison",
		"plotData",
		"pkgData",
		"pkgDataSelected",
		"regionZoom",
		"regionViewArea",
		"searchParameters",
		"searchParametersArr",
	],
	data() {
		return {
			annoData: {},
			GEData: {},
			GEPosData: {},
			tissuesData: {},
			tissuesPosData: {},
			selectedAnnos: [],
			selectedTissues: [],
			annoPosData: {},
			spaceBy: 24,
			annotationOnFocus: "null",
			tissueOnFocus: "null",
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
		this.getAnnotations(this.searchingRegion);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingParameters() {
			let content = "";
			if (
				this.searchingRegion != null &&
				this.searchingPhenotype != null
			) {
				let region =
					this.searchingRegion.chr +
					":" +
					this.searchingRegion.start +
					"-" +
					this.searchingRegion.end;

				content = region + "," + this.searchingPhenotype;
			}

			content += !!this.renderConfig["ancestry parameter"]
				? "," +
				  document.querySelector(
						"#search_param_" +
							this.renderConfig["ancestry parameter"]
				  ).value
				: "";

			return content;
		},
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			uiUtils.showElement("annotationsPlotWrapper");

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
				uiUtils.showElement("annotationsPlotWrapper");
				//this.getAnnotations(this.searchingRegion);

				let returnPhenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;

				return returnPhenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					uiUtils.showElement("annotationsPlotWrapper");
					//this.getAnnotations(this.searchingRegion);

					let phenotype =
						keyParams[this.renderConfig["phenotype parameter"]];

					let returnPhenotype = !!this.renderConfig["phenotype match"]
						? this.renderConfig["phenotype match"][phenotype]
						: phenotype;

					return returnPhenotype;
				} else {
					return null;
				}
			}
		},
	},
	watch: {
		///use searchParametersArr to rerender plots on search.
		searchParametersArr(PARAM) {
			this.renderGE();
			this.renderByAnnotations();
		},
		searchingParameters(PARAM) {
			this.getAnnotations(this.searchingRegion);
		},
		pkgDataSelected: {
			handler: function (DATA) {
				let annotations = [
					...new Set(
						this.pkgDataSelected.filter(
							(p) => p.type == "Annotation"
						)
					),
				];

				if (DATA.length == 0 || annotations.length == 0) {
					this.resetAll();
				} else {
					this.renderByAnnotations();
				}
			},
			deep: true,
			immediate: true,
		},
		viewingRegion: {
			handler: function (DATA) {
				this.renderByAnnotations();
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		...uiUtils,
		resetAll(TYPE) {
			if (!!TYPE && TYPE == "all") {
				this.GEData = {};
				this.GEPosData = {};
			}

			this.annoData = {};
			this.tissuesData = {};
			this.tissuesPosData = {};
			this.selectedAnnos = [];
			this.selectedTissues = [];
			this.annoPosData = {};
			this.annotationOnFocus = "null";
			this.tissueOnFocus = "null";
			//this.renderGE();

			this.pkgDataSelected.map((i) => {
				if (i.type == "Tissue") {
					this.$store.dispatch("pkgDataSelected", {
						type: i.type,
						id: i.id,
						action: "remove",
					});
				}
			});

			this.getAnnotations(this.searchingRegion);
			this.renderByAnnotations();
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
				} else {
					delete this.pkgData["overlappingRegions"];
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
			uiUtils.showElement("annotationsPlotWrapper");
			this.renderByAnnotations();
			this.renderGE();
		},

		addAnnoTrack(event) {
			if (event.target.value != "null") {
				//this.annotationOnFocus = event.target.value;

				/// this part may not be needed
				let selectedAnnotations = this.pkgDataSelected
					.filter((s) => s.type == "Annotation")
					.map((s) => s.id);

				if (selectedAnnotations.indexOf(event.target.value) < 0) {
					selectedAnnotations.push(event.target.value);

					if (this.pkgData != null) {
						this.$store.dispatch("pkgDataSelected", {
							type: "Annotation",
							id: event.target.value,
							action: "add",
						});

						Vue.set(
							this.pkgData,
							"selectedAnnos",
							selectedAnnotations
						);
					}
				}
			}
			this.renderGE();
		},
		removeAnnoTrack(ANNO) {
			let selectedAnnotations = this.pkgDataSelected
				.filter((s) => s.type == "Annotation")
				.map((s) => s.id);
			const aIndex = selectedAnnotations.indexOf(ANNO);

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
		addRemoveTissueTrack(TISSUE) {
			let selectedTissues = this.pkgDataSelected
				.filter((s) => s.type == "Tissue")
				.map((s) => s.id);

			const tIndex = selectedTissues.indexOf(TISSUE);

			if (tIndex > -1) {
				if (this.pkgData != null) {
					this.$store.dispatch("pkgDataSelected", {
						type: "Tissue",
						id: TISSUE,
						action: "remove",
					});
				}
			} else {
				if (this.pkgData != null) {
					this.$store.dispatch("pkgDataSelected", {
						type: "Tissue",
						id: TISSUE,
						action: "add",
					});
				}
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

		checkGEPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			const infoBox = document.querySelector("#GEInfoBox");

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
			let localSpaceBy = Math.round(this.spaceBy / 2);

			let y =
				Math.ceil(Math.floor(e.clientY - rect.top) / localSpaceBy) - 1;

			const infoBox = document.querySelector("#tissueInfoBox");
			let infoContent = "";

			if (TYPE == "hover") {
				if (x >= this.plotMargin.leftMargin / 2 && x <= rect.width) {
					if (!!this.annoPosData[y]) {
						//this.$store.dispatch("sharedPlotXpos", rawX);
						infoContent += this.annoPosData[y].tissue;
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
									regionValue.end +
									"<br />State: " +
									regionValue.state;
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
							!!this.annoPosData[i] &&
							!!this.annoPosData[i].annotation
						) {
							for (const [region, regionValue] of Object.entries(
								this.annoPosData[i].regions
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
				if (x >= this.plotMargin.leftMargin / 2 && x <= rect.width) {
					if (!!this.annoPosData[y]) {
						infoContent += this.annoPosData[y].tissue;
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
					infoBox.style.top = rawY + localSpaceBy + "px";
				}
			}

			if (TYPE == "click") {
				if (infoContent != "") {
					this.addRemoveTissueTrack(infoContent);
				}
			}
		},
		getColorIndex(anno) {
			let annoArry = Object.keys(this.annoData);
			let i = annoArry.indexOf(anno);
			return this.compareGroupColors[i];
		},
		async getGlobalEnrichment() {
			let annoServer =
				this.renderConfig["annotations server"] == "KP BioIndex"
					? uiUtils.biDomain() + "/api/bio"
					: this.renderConfig["annotations server"];

			let phenotype = this.searchingPhenotype;

			let GEIndex = !!this.renderConfig["global enrichment index"]
				? this.renderConfig["global enrichment index"]
				: "global-enrichment";

			let GEURL = annoServer + "/query/" + GEIndex + "?q=" + phenotype;

			let GEJson = await fetch(GEURL).then((resp) => resp.json());

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

				let GEByTissue = this.getGEByTissue();

				if (this.pkgData != null) {
					Vue.set(this.pkgData, "GEByTissueData", GEByTissue);
					Vue.set(this.pkgData, "GEData", this.GEData);
					Vue.set(this.pkgData, "annoData", this.annoData);
					Vue.set(this.pkgData, "tissuesData", this.tissuesData);
				}

				this.renderByAnnotations();
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
					annotations[pKey][aKey] = {};
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
							ancestries: {},
						};
					}
					let perTissueObj =
						GEByTissue[phenotype][g.tissue][g.annotation];
					/// p and fold per ancestries
					if (!perTissueObj.ancestries[g.ancestry]) {
						perTissueObj.ancestries[g.ancestry] = {
							fold: null,
							pValue: null,
							rank: null,
						};
					}

					perTissueObj.ancestries[g.ancestry].pValue =
						Formatters.pValueFormatter(g.pValue);
					perTissueObj.ancestries[g.ancestry].fold =
						Formatters.pValueFormatter(g.SNPs / g.expectedSNPs);

					///

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

					if (!annotations[phenotype][g.annotation][g.ancestry]) {
						annotations[phenotype][g.annotation][g.ancestry] = [];
					}

					annotations[phenotype][g.annotation][g.ancestry].push({
						tissue: g.tissue,
						fold: perTissueObj.ancestries[g.ancestry].fold,
					});
				});
			}

			/// get the ranks of tissues by fold
			Object.keys(annotations).map((pKey) => {
				Object.keys(annotations[pKey]).map((aKey) => {
					Object.keys(annotations[pKey][aKey]).map((anceKey) => {
						annotations[pKey][aKey][anceKey] = [
							...new Map(
								annotations[pKey][aKey][anceKey].map((item) => [
									item["tissue"],
									item,
								])
							).values(),
						];

						annotations[pKey][aKey][anceKey].sort(
							(a, b) => b.fold - a.fold
						);

						let tIndex = 0;
						annotations[pKey][aKey][anceKey].map((tValue) => {
							if (
								!!this.tissuesData[tValue.tissue] &&
								!!this.tissuesData[tValue.tissue][aKey]
							) {
								GEByTissue[pKey][tValue.tissue][
									aKey
								].ancestries[anceKey].rank = tIndex;
								tIndex++;
							}
						});
					});
				});
			});

			return GEByTissue;
		},

		async getAnnotations(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				/// replace to uiUtils.biDomain()+"/api/bio"
				let annoServer =
					this.renderConfig["annotations server"] == "KP BioIndex"
						? uiUtils.biDomain() + "/api/bio"
						: this.renderConfig["annotations server"];

				let annoIndex = !!this.renderConfig["annotations index"]
					? this.renderConfig["annotations index"]
					: "regions";

				let annotationsURL =
					annoServer +
					"/query/" +
					annoIndex +
					"?q=" +
					REGION_OBJ.chr +
					":" +
					REGION_OBJ.start +
					"-" +
					REGION_OBJ.end;

				let annotationsJson = await fetch(annotationsURL).then((resp) =>
					resp.json()
				);

				if (annotationsJson.error == null) {
					if (annotationsJson.continuation == null) {
						this.runAfterAnnoDataLoad(annotationsJson);
					} else {
						this.loadContinue(annotationsJson);
					}
				}
			}
		},
		async loadContinue(CONTENT) {
			let annoServer =
				this.renderConfig["annotations server"] == "KP BioIndex"
					? uiUtils.biDomain() + "/api/bio"
					: this.renderConfig["annotations server"];

			let contURL = annoServer + "/cont?token=" + CONTENT.continuation;

			let contJson = await fetch(contURL).then((resp) => resp.json());

			if (contJson.error == null) {
				let prevData = CONTENT.data;
				let newData = prevData.concat(contJson.data);

				contJson.data = newData;

				if (contJson.continuation == null) {
					this.runAfterAnnoDataLoad(contJson);
				} else {
					this.loadContinue(contJson);
				}
			}
		},

		runAfterAnnoDataLoad(annotationsJson) {
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

			if (this.pkgData != null) {
				Vue.set(this.pkgData, "annoData", this.annoData);
				Vue.set(this.pkgData, "tissuesData", this.tissuesData);
			}

			this.getGlobalEnrichment();
		},
		renderGE() {
			//working part

			/*let ancestries = [
				...new Set(this.GEData["T2D"].map((d) => d.ancestry)),
			];

			console.log("ancestries", ancestries);*/

			this.GEPosData = {};
			let sortedGEData = {};
			let searchGroups = [];
			let phenotypeParam = this.renderConfig["phenotype parameter"];
			let ancestryParam = this.renderConfig["ancestry parameter"];

			let indexNum = 0;
			this.searchParameters[phenotypeParam].search.map((p) => {
				searchGroups[indexNum] = {};
				searchGroups[indexNum]["phenotype"] = p;
				searchGroups[indexNum]["ancestry"] = !!ancestryParam
					? this.searchParameters[ancestryParam].search[indexNum]
					: "Mixed";

				indexNum++;
			});

			searchGroups.map((group) => {
				let phenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][group.phenotype]
					: group.phenotype;
				let ancestry = group.ancestry;
				let GE = this.GEData[phenotype];

				if (!sortedGEData[phenotype]) {
					sortedGEData[phenotype] = {};
				}

				sortedGEData[phenotype][ancestry] = {
					xMax: null,
					xMin: null,
					yMax: null,
					yMin: null,
				};
				if(!!GE) {
					GE.map((g) => {
						if (g.ancestry == ancestry) {
							let meetCondition = null;

							if (
								!!ancestry &&
								!!this.annoData[g.annotation][g.tissue] &&
								!!this.annoData[g.annotation][g.tissue][
								"ancestries"
								][ancestry]
							) {
								meetCondition = true;
							} else if (
								!ancestry &&
								!!this.annoData[g.annotation][g.tissue] &&
								!!this.annoData[g.annotation][g.tissue]
							) {
								meetCondition = true;
							}

							if (!!meetCondition) {
								if (
									!sortedGEData[phenotype][ancestry][g.annotation]
								) {
									sortedGEData[phenotype][ancestry][
										g.annotation
									] = {};
								}

								let pValue = !!ancestry
									? this.annoData[g.annotation][g.tissue][
									"ancestries"
									][ancestry][phenotype]
									: g.pValue;

								pValue = pValue == 0 ? 324 : -Math.log10(pValue);

								let fold = g.SNPs / g.expectedSNPs;

								sortedGEData[phenotype][ancestry].yMax =
									sortedGEData[phenotype][ancestry].yMax == null
										? fold
										: fold >
											sortedGEData[phenotype][ancestry].yMax
											? fold
											: sortedGEData[phenotype][ancestry].yMax;

								sortedGEData[phenotype][ancestry].yMin =
									sortedGEData[phenotype][ancestry].yMin == null
										? fold
										: fold <
											sortedGEData[phenotype][ancestry].yMin
											? fold
											: sortedGEData[phenotype][ancestry].yMin;

								sortedGEData[phenotype][ancestry].xMax =
									sortedGEData[phenotype][ancestry].xMax == null
										? pValue
										: pValue >
											sortedGEData[phenotype][ancestry].xMax
											? pValue
											: sortedGEData[phenotype][ancestry].xMax;

								sortedGEData[phenotype][ancestry].xMin =
									sortedGEData[phenotype][ancestry].xMin == null
										? pValue
										: pValue <
											sortedGEData[phenotype][ancestry].xMin
											? pValue
											: sortedGEData[phenotype][ancestry].xMin;

								sortedGEData[phenotype][ancestry][g.annotation][
									g.tissue
								] = !sortedGEData[phenotype][ancestry][
									g.annotation
								][g.tissue]
										? { pValue: null, fold: null }
										: sortedGEData[phenotype][ancestry][
										g.annotation
										][g.tissue];

								let currentPvalue =
									sortedGEData[phenotype][ancestry][g.annotation][
										g.tissue
									].pValue;

								let currentFold =
									sortedGEData[phenotype][ancestry][g.annotation][
										g.tissue
									].fold;

								sortedGEData[phenotype][ancestry][g.annotation][
									g.tissue
								].pValue =
									currentPvalue == null
										? pValue
										: pValue > currentPvalue
											? pValue
											: currentPvalue;

								sortedGEData[phenotype][ancestry][g.annotation][
									g.tissue
								].fold =
									currentFold == null
										? fold
										: fold > currentFold
											? fold
											: currentFold;
							}
						}
					});

				}
				
			});

			let numOfPlots = 0;

			Object.keys(sortedGEData).map((p) => {
				numOfPlots += Object.keys(sortedGEData[p]).length;
			});

			let canvasWidth =
				document.querySelector("#GEPlotWrapper").clientWidth * 2 * 0.25;

			let allCanvasWidth = canvasWidth * numOfPlots;

			let plotHeight = 260;
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

			let bump = 11;

			let c, ctx;
			c = document.querySelector("#GEPlot");
			c.setAttribute("width", allCanvasWidth);
			c.setAttribute("height", canvasHeight);
			c.setAttribute(
				"style",
				"width:" +
					allCanvasWidth / 2 +
					"px;height:" +
					canvasHeight / 2 +
					"px;"
			);

			ctx = c.getContext("2d");

			let pIndex = 0;

			searchGroups.map((group) => {
				let phenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][group.phenotype]
					: group.phenotype;
				let ancestry = group.ancestry;
				let GE = sortedGEData[phenotype][ancestry];

				let titleYPos = titleSize;
				let canvasLeft = bump + canvasWidth * pIndex;
				let titleLabel = phenotype + "(" + ancestry + ")";

				ctx.font = "28px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(titleLabel, canvasLeft, titleYPos);

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

				let foldArr = [];
				let pValArr = [];
				annotationsArr.map((annotation) => {
					if(!!GE[annotation]){
						for (const [tissue, tissueValue] of Object.entries(
							GE[annotation]
						)) {
							//tissuesCount++;
							pValArr.push(tissueValue.pValue);
							foldArr.push(tissueValue.fold);
						}
					}
				});

				foldArr.sort((a, b) => b - a);
				pValArr.sort((a, b) => b - a);

				let xPosByPixel = plotWidth / (GE.xMax - GE.xMin);
				let yPosByPixel = plotHeight / (GE.yMax - GE.yMin);

				annotationsArr.map((annotation, annoIndex) => {
					let dotColor =
						this.annotationOnFocus == "null"
							? this.compareGroupColors[annoIndex]
							: annotation == this.annotationOnFocus
							? this.compareGroupColors[annoIndex]
							: "#00000030";

					//let firstTissueInAnno = 0;
					if (!!GE[annotation]) {
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
							ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
							ctx.fill();

							if (
								tValue.fold >= foldArr[2] ||
								tValue.pValue >= pValArr[2]
							) {
								ctx.font = "24px Arial";
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
									ctx.fillText(tissue, xPos - 14, yPos + 6);
								} else {
									ctx.textAlign = "left";
									ctx.fillText(tissue, xPos + 14, yPos + 6);
								}
							}

							if (!this.GEPosData[Math.round(yPos / 2)]) {
								this.GEPosData[Math.round(yPos / 2)] = {};
							}
							if (
								!this.GEPosData[Math.round(yPos / 2)][
									Math.round(xPos / 2)
								]
							) {
								this.GEPosData[Math.round(yPos / 2)][
									Math.round(xPos / 2)
								] = {};
							}

							this.GEPosData[Math.round(yPos / 2)][
								Math.round(xPos / 2)
							][tissue] = { pValue: null, fold: null };

							this.GEPosData[Math.round(yPos / 2)][
								Math.round(xPos / 2)
							][tissue]["pValue"] = tValue.pValue;

							this.GEPosData[Math.round(yPos / 2)][
								Math.round(xPos / 2)
							][tissue]["fold"] = tValue.fold;

							this.GEPosData[Math.round(yPos / 2)][
								Math.round(xPos / 2)
							][tissue]["annotationIndex"] = annoIndex;
						}
					}
				});

				pIndex++;
			});
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
			let yAxisXPos = Math.round(
				XPOS + this.plotMargin.leftMargin - BUMP
			);
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

				let adjTickYPos = Math.floor(tickYPos);

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
				CTX.font = "24px Arial";

				let yMaxMinGap = YMAX - YMIN;
				let yDecimal = yMaxMinGap <= 1 ? 2 : yMaxMinGap <= 50 ? 1 : 0;

				let yValue = Formatters.decimalFormatter(
					YMIN + i * yStep,
					yDecimal
				);

				yValue =
					yValue >= 100000
						? Math.round(yValue * 0.001) + "k"
						: yValue;

				CTX.fillText(
					yValue,
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
				XPOS + BUMP + 24
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

				let adjTickXPos = Math.floor(tickXPos);

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
				CTX.font = "24px Arial";

				let xMaxMinGap = XMAX - XMIN;
				let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

				let xValue = Formatters.decimalFormatter(
					XMIN + i * xStep,
					xDecimal
				);

				xValue =
					xValue >= 100000
						? Math.round(xValue * 0.001) + "k"
						: xValue;

				CTX.fillText(
					xValue,
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
				YPOS + HEIGHT + BUMP * 6 + this.plotMargin.topMargin + 24
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

		renderByAnnotations() {
			if (!!this.pkgData.GEByTissueData) {
				let GEByTissue = this.getGEByTissue();

				let searchGroups = [];
				let phenotypeParam = this.renderConfig["phenotype parameter"];
				let ancestryParam = this.renderConfig["ancestry parameter"];

				let indexNum = 0;
				this.searchParameters[phenotypeParam].search.map((p) => {
					searchGroups[indexNum] = {};
					searchGroups[indexNum]["phenotype"] = p;
					searchGroups[indexNum]["ancestry"] = !!ancestryParam
						? this.searchParameters[ancestryParam].search[indexNum]
						: "Mixed";

					indexNum++;
				});

				let staredPositions = [];
				this.annoPosData = {};

				if (!!this.renderConfig["star key"]) {
					let plotData = !!Array.isArray(this.plotData)
						? this.array2Object(
								this.renderConfig["star key"]["key"],
								this.plotData
						  )
						: this.plotData;

					let starKey = this.renderConfig["star key"]["key"];
					let starPosition =
						this.renderConfig["star key"]["position"];

					this.pkgDataSelected
						.filter((s) => s.type == starKey)
						.map((s) => s.id)
						.map((s) => {
							staredPositions.push(plotData[s][starPosition]);
						});
				}

				let tempHeight = 0;
				let annotationTitleH = this.spaceBy * 2;
				let btwnAnnotations = this.spaceBy * 7;
				let perTissue = this.spaceBy;
				let topMargin = this.spaceBy * 2;
				let bottomMargin = this.spaceBy * 2;
				let regionStart = this.viewingRegion.start;
				let regionEnd = this.viewingRegion.end;
				let pvalueFoldWidth = 240;

				let selectedAnnotations = this.pkgDataSelected
					.filter((s) => s.type == "Annotation")
					.map((s) => s.id);

				let selectedTissues = this.pkgDataSelected
					.filter((s) => s.type == "Tissue")
					.map((s) => s.id);

				for (const [annotation, tissues] of Object.entries(
					this.annoData
				)) {
					if (selectedAnnotations.includes(annotation)) {
						tempHeight += annotationTitleH;
						tempHeight += Object.keys(tissues).length * perTissue;
						tempHeight += btwnAnnotations;
					}
				}

				let wrapper = document.querySelector("#annotationsPlotWrapper");
				let canvas = document.querySelector("#annotationsPlot");

				if (!!canvas && !!wrapper) {
					let canvasWidth =
						document.querySelector("#annotationsPlotWrapper")
							.clientWidth *
						2 *
						0.75;

					let wrapperWidth =
						canvasWidth + searchGroups.length * pvalueFoldWidth;

					let canvasHeight = tempHeight + topMargin + bottomMargin;

					let plotWidth =
						canvasWidth - this.plotMargin.leftMargin * 2;
					let plotHeight = tempHeight;
					let bump = 11;

					let xPerPixel = plotWidth / (regionEnd - regionStart);

					let c, ctx;
					c = document.querySelector("#annotationsPlot");
					c.setAttribute("width", wrapperWidth);
					c.setAttribute("height", canvasHeight);
					c.setAttribute(
						"style",
						"width:" +
							wrapperWidth / 2 +
							"px;height:" +
							canvasHeight / 2 +
							"px;"
					);
					ctx = c.getContext("2d");

					ctx.clearRect(0, 0, canvasWidth, canvasHeight);

					let renderHeight = annotationTitleH;

					for (const [annotation, tissues] of Object.entries(
						this.annoData
					)) {
						if (selectedAnnotations.includes(annotation)) {
							ctx.font = "28px Arial";
							ctx.textAlign = "left";
							ctx.fillStyle = "#000000";
							ctx.fillText(annotation, bump, renderHeight);

							searchGroups.map((gValue, gIndex) => {
								ctx.fillStyle = "#000000";
								ctx.textAlign = "start";
								ctx.textBaseline = "middle";
								ctx.font = "28px Arial";

								let labelText =
									gValue.phenotype +
									" (" +
									gValue.ancestry +
									")";

								ctx.fillText(
									labelText,
									canvasWidth + pvalueFoldWidth * gIndex,
									renderHeight
								);
							});

							let blockHeight =
								Object.keys(tissues).length * perTissue;
							renderHeight += annotationTitleH;

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

							let tissueIndex = 0;

							let tissuesArr = Object.keys(tissues).sort();
							tissuesArr.map((tissue) => {
								let regions = tissues[tissue];

								let yPosBtn = Math.ceil(
									renderHeight / this.spaceBy
								);

								if (!this.annoPosData[yPosBtn]) {
									this.annoPosData[yPosBtn] = {
										annotation: annotation,
										tissue: tissue,
										regions: {},
									};
								} else {
									this.annoPosData[yPosBtn]["tissue"] =
										tissue;
								}

								if (tissueIndex % 2 == 0) {
									ctx.fillStyle = "#00000010";
									ctx.fillRect(
										this.plotMargin.leftMargin,
										renderHeight,
										plotWidth,
										perTissue
									);
								}

								tissueIndex++;

								regions.region.map((p) => {
									if (
										p.start <= regionEnd &&
										p.end >= regionStart
									) {
										let xPosStart =
											(p.start - regionStart) *
												xPerPixel +
											this.plotMargin.leftMargin;

										xPosStart =
											xPosStart <=
											this.plotMargin.leftMargin
												? this.plotMargin.leftMargin
												: xPosStart;
										let xPosEnd =
											(p.end - regionStart) * xPerPixel +
											this.plotMargin.leftMargin;

										xPosEnd =
											xPosEnd >
											this.plotMargin.leftMargin +
												plotWidth
												? this.plotMargin.leftMargin +
												  plotWidth
												: xPosEnd;

										//let xPosWidth = xPosEnd - xPosStart;
										let xPosWidth =
											xPosEnd - xPosStart < 2
												? 2
												: xPosEnd - xPosStart;

										if (
											selectedTissues.indexOf(tissue) > -1
										) {
											ctx.fillStyle = "#FF0000";
										} else {
											ctx.fillStyle =
												this.getColorIndex(annotation);
										}

										ctx.fillRect(
											xPosStart,
											renderHeight,
											xPosWidth,
											perTissue - 1
										);
										let xPosBtn =
											Math.round(xPosStart / 2) +
											"_" +
											Math.round(
												(xPosStart + xPosWidth) / 2
											);
										this.annoPosData[yPosBtn].regions[
											xPosBtn
										] = {
											start: p.start,
											end: p.end,
											state: p.state,
										};
									}
								});

								renderHeight += perTissue;

								ctx.fillStyle = "#000000";
								ctx.textAlign = "start";
								ctx.textBaseline = "middle";
								ctx.font = "24px Arial";
								ctx.fillText(tissue, 10, renderHeight - 8);

								searchGroups.map((gValue, gIndex) => {
									let pKey = !!this.renderConfig[
										"phenotype match"
									]
										? this.renderConfig["phenotype match"][
												gValue.phenotype
										  ]
										: gValue.phenotype;

									let aKey = gValue.ancestry;

									if (
										!!GEByTissue[pKey][tissue] &&
										!!GEByTissue[pKey][tissue][annotation]
									) {
										let pvalueFold =
											GEByTissue[pKey][tissue][annotation]
												.ancestries[aKey]["pValue"] +
											" / " +
											Number(
												GEByTissue[pKey][tissue][
													annotation
												].ancestries[aKey]["fold"]
											).toFixed(3);

										if (
											GEByTissue[pKey][tissue][annotation]
												.ancestries[aKey]["rank"] < 5
										) {
											ctx.fillStyle =
												this.getColorIndex(annotation);
											ctx.lineWidth = 0;
											ctx.beginPath();
											ctx.arc(
												canvasWidth +
													pvalueFoldWidth * gIndex -
													10,
												renderHeight - 8,
												6,
												0,
												2 * Math.PI
											);
											ctx.fill();
										}

										if (
											GEByTissue[pKey][tissue][annotation]
												.ancestries[aKey]["pValue"] <
											0.05
										) {
											ctx.fillStyle = "#FF9999";
											ctx.lineWidth = 0;
											ctx.beginPath();
											ctx.arc(
												canvasWidth +
													pvalueFoldWidth * gIndex -
													20,
												renderHeight - 8,
												6,
												0,
												2 * Math.PI
											);
											ctx.fill();
										}

										ctx.fillStyle = "#000000";
										ctx.textAlign = "start";
										ctx.textBaseline = "middle";
										ctx.font = "22px Arial";

										ctx.fillText(
											pvalueFold,
											canvasWidth +
												pvalueFoldWidth * gIndex,
											renderHeight - 8
										);
									}
								});
							});
							renderHeight += btwnAnnotations;
						}
					}
				}

				// get ovelapping region
				this.getOverlappingRegion();
			}
		},
		renderAnnoAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
			CTX.lineWidth = 1;

			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.beginPath();
			CTX.strokeStyle = "#999999";
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.stroke();

			// render recombination Rate y axis
			let recomXpos = Math.round(
				this.plotMargin.leftMargin + WIDTH + bump
			);

			CTX.moveTo(recomXpos, yPos);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			CTX.closePath();

			//render x axis
			CTX.beginPath();
			CTX.strokeStyle = "#000000";
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			// X ticks

			let xStep = Math.ceil((xMax - xMin) / 5);
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos);
				CTX.moveTo(adjTickXPos, yPos + HEIGHT + bump);
				CTX.lineTo(adjTickXPos, yPos + HEIGHT + bump * 2);
				CTX.stroke();

				CTX.textAlign = "center";
				//let positionLabel = i < 5 ? xMin + i * xStep : xMax;
				CTX.font = "24px Arial";
				CTX.fillStyle = "#000000";

				let xMaxMinGap = xMax - xMin;
				let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

				let positionLabel = Formatters.decimalFormatter(
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
					yPos + HEIGHT + bump * 4
				);
			}
			CTX.closePath();
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
			CTX.beginPath();
			CTX.lineWidth = 2;
			CTX.strokeStyle = "#FFAA00";
			CTX.setLineDash([6, 6]); // cancel dashed line incase dashed lines rendered some where

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
.height-1px {
	height: 1px !important;
}
.height-auto {
	height: auto;
	border-top: solid 1px #ddd;
}
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



