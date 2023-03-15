<template>
	<div class="mbm-plot-content row">
		<div
			class="col-md-12 biosamples-plot-wrapper"
			v-if="searchingRegion != null"
		>
			<div class="col-md-12">
				<div
					id="biosamplesUIWrapper"
					v-if="
						!renderConfig['with annotations viewer'] ||
						renderConfig['with annotations viewer'] == 'false'
					"
				>
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
								>
									<option value="null">
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
									v-if="annotationOnFocus != 'null'"
									class="label"
									style="
										display: inline-block;
										margin: 0 10px;
									"
								>
									Select Tissue Category
								</div>
								<select
									class="custom-select"
									v-if="annotationOnFocus != 'null'"
									v-model="tissueOnFocus"
								>
									<option value="null">
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
									v-if="
										annotationOnFocus != 'null' &&
										tissueOnFocus != 'null'
									"
									class="
										btn btn-primary btn-sm btn-biosamples
									"
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
									@click="removeAnno(a.id)"
								></span>
							</template>
							<template
								v-for="t in pkgDataSelected.filter(
									(s) => s.type == 'Tissue'
								)"
							>
								<span
									:key="t.id"
									:class="'btn search-bubble '"
									:style="'background-color:#999999'"
									v-html="
										t.id +
										'&nbsp;<span class=\'remove\'>X</span>'
									"
									@click="removeTissue(t.id)"
								></span>
							</template>
						</div>
					</div>
				</div>
				<div
					class="col-md-12 bio-plot-ui-wrapper"
					style="border-bottom: solid 1px #dddddd"
					v-if="
						!renderConfig['with annotations viewer'] ||
						renderConfig['with annotations viewer'] == 'false'
					"
				>
					<h6><strong>Global Enrichment</strong></h6>
					<div>
						<div
							v-for="(annoValue, annoKey, annoIndex) in annoData"
							:key="annoKey"
							class="bio-bubble-wrapper"
						>
							<span
								class="bio-bubble"
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

				<span
					v-if="
						pkgDataSelected.filter((s) => s.type == 'Annotation')
							.length > 0 &&
						pkgDataSelected.filter((s) => s.type == 'Tissue')
							.length > 0
					"
				>
					<strong
						>Filter associated variants by location within
						regulatory regions annotated in specific tissue or cell
						types within the tissue categories selected above.
					</strong>
				</span>
				<!--<div
					class="filtering-ui-wrapper add-content"
					style="width: 100%; padding: 0 10px; text-align: left"
					v-if="
						pkgDataSelected.filter((s) => s.type == 'Annotation')
							.length > 0 &&
						pkgDataSelected.filter((s) => s.type == 'Tissue')
							.length > 0
					"
				>
					<div
						class="filtering-ui-content"
						style="padding: 5px; text-align: left"
					>
						<strong>Select biosamples by clicking tracks</strong>
						<div
							class=""
							v-if="
								pkgDataSelected.filter(
									(s) => s.type == 'Biosample'
								).length > 0 &&
								!renderConfig['no search key bubbles']
							"
							style="float: right"
						>
							<template
								v-for="a in pkgDataSelected.filter(
									(s) => s.type == 'Biosample'
								)"
							>
								<span
									:key="a.id"
									:class="'btn search-bubble '"
									:style="
										'background-color:' +
										getColorIndex(a.id.split(' / ')[0])
									"
									v-html="
										a.id.split(' / ')[2] +
										'&nbsp;<span class=\'remove\'>X</span>'
									"
									@click="addRemoveBiosampleTrack(a.id)"
								></span>
							</template>
						</div>
					</div>
				</div>-->
			</div>
			<div class="col-md-9 bio-plot-wrapper">
				<div
					id="biosamplesPlotWrapper"
					:class="
						pkgDataSelected.filter((s) => s.type == 'Annotation')
							.length == 0 ||
						pkgDataSelected.filter((s) => s.type == 'Tissue')
							.length == 0
							? 'height-1px'
							: 'height-auto'
					"
				>
					<!--working part-->

					<div id="biosampleInfoBox" class="hidden"></div>
					<!--<div
						id="bioInitialMessage"
						:class="
							getSelectedParameters('Annotation').length > 0 &&
							getSelectedParameters('Tissue').length > 0
								? 'hidden'
								: ''
						"
						v-html="
							!!renderConfig['with annotations viewer'] &&
							renderConfig['with annotations viewer'] == 'true'
								? 'Please select annotation and tissue under annotations filter.'
								: 'Please select annotation and tissue.'
						"
					></div>-->

					<canvas
						id="biosamplesPlot"
						@resize="onResize"
						@mousemove="checkPosition($event, 'hover')"
						@click="checkPosition($event, 'click')"
						@mouseout="onMouseOut('biosampleInfoBox')"
						width=""
						height="0"
					></canvas>
				</div>
			</div>
			<div
				class="col-md-3 reference-area"
				style="display: inline-block; vertical-align: top"
				v-if="
					getPropsArr('methods') != null &&
					getPropsArr('sources') != null
				"
			>
				<button
					class="btn btn-sm btn-outline-secondary"
					style="margin-right: 5px; margin-bottom: 10px"
					@click="checkUncheckAll('check')"
				>
					Select all
				</button>
				<button
					class="btn btn-sm btn-outline-secondary"
					style="margin-bottom: 10px"
					@click="checkUncheckAll('uncheck')"
				>
					Unselect all
				</button>
				<h6>
					<strong>Methods</strong>
				</h6>
				<div
					v-for="g in getPropsArr('methods')"
					:key="g"
					style="display: inline-block"
				>
					<label style="padding-right: 10px"
						><input
							type="checkbox"
							:value="g"
							@click="addRemoveParameter(g, 'BS-Method')"
							:checked="
								!pkgDataSelected
									.filter((s) => s.type == 'BS-Method')
									.map((s) => s.id)
									.includes(g)
							"
						/>{{ " " + g + " " }}
					</label>
				</div>

				<h6>
					<strong>Sources</strong>
				</h6>
				<div
					v-for="g in getPropsArr('sources')"
					:key="g"
					style="display: inline-block"
				>
					<label style="padding-right: 10px"
						><input
							type="checkbox"
							:value="g"
							@click="addRemoveParameter(g, 'BS-Source')"
							:checked="
								!pkgDataSelected
									.filter((s) => s.type == 'BS-Source')
									.map((s) => s.id)
									.includes(g)
							"
						/>{{ " " + g + " " }}
					</label>
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

export default Vue.component("research-biosamples-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"plotMargin",
		"compareGroupColors",
		"searchType",
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
			biosamplesPosData: {},
			spaceBy: 24,
			annotationOnFocus: "null",
			tissueOnFocus: "null",
			trigger: 0,
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
		if (
			!this.renderConfig["with annotations plot"] ||
			this.renderConfig["with annotations plot"] == "false"
		) {
			this.getBSAnnotations(this.searchingRegion);
		}
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		annoAssoTissues() {
			if (
				this.annotationOnFocus != "null" &&
				Object.keys(this.tissuesData).length > 0
			) {
				let tissues = [];
				Object.keys(this.tissuesData).filter((t) => {
					if (!!this.tissuesData[t][this.annotationOnFocus]) {
						tissues.push(t);
					}
				});

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
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			uiUtils.showElement("biosamplesPlotWrapper");

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
		searchingParameters(PARAM) {
			if (this.searchType == "newSearch") {
				this.resetAll();
			} else {
				if (
					!this.renderConfig["with annotations plot"] ||
					this.renderConfig["with annotations plot"] == "false"
				) {
					this.getBSAnnotations(this.searchingRegion);
				}
			}
		},
		pkgDataSelected: {
			handler: function (DATA) {
				let annotations = this.getSelectedParameters("Annotation");
				let tissues = this.getSelectedParameters("Tissue");

				if (annotations.length == 0 || tissues.length == 0) {
					this.resetAll();
				} else {
					this.handleSearchUpdate(DATA);
				}
			},
		},
		viewingRegion: {
			handler: function (n, o) {
				this.renderBiosamplesTrack("viewing region change");
			},
			deep: true,
			immediate: true,
		},
		annotationOnFocus() {
			this.renderGE();
		},
	},
	methods: {
		...uiUtils,
		getSelectedParameters(PARAM) {
			let arr = [
				...new Set(
					this.pkgDataSelected
						.filter((d) => d.type == PARAM)
						.map((d) => d.id)
				),
			];
			return arr;
		},
		handleSearchUpdate(DATA) {
			let annotations = this.getSelectedParameters("Annotation");
			let tissues = this.getSelectedParameters("Tissue");

			if (annotations.length > 0 && tissues.length > 0) {
				annotations.map((a) => {
					tissues.map((t) => {
						this.getBiosamples(a, t);
					});
				});
			} else {
				this.renderBiosamplesTrack("anno or tissue missing");
			}
		},
		resetAll() {
			this.annoData = {};
			this.biosamplesData = {};
			this.GEData = {};
			this.GEPosData = {};
			this.tissuesData = {};
			this.biosamplesPosData = {};
			this.annotationOnFocus = "null";
			this.tissueOnFocus = "null";
			this.trigger = 0;

			this.pkgDataSelected.map((i) => {
				if (
					i.type == "Biosample" ||
					i.type == "BS-Method" ||
					i.type == "BS-Source"
				) {
					this.$store.dispatch("pkgDataSelected", {
						type: i.type,
						id: i.id,
						action: "remove",
					});
				}
			});

			this.renderBiosamplesTrack("reset all");

			if (
				!this.renderConfig["with annotations viewer"] ||
				this.renderConfig["with annotations viewer"] == "false"
			) {
				this.getBSAnnotations(this.searchingRegion);
			}
		},
		checkUncheckAll(CHECK) {
			switch (CHECK) {
				case "check":
					[
						{
							type: "BS-Method",
							items: this.getPropsArr("methods"),
						},
						{
							type: "BS-Source",
							items: this.getPropsArr("sources"),
						},
					].map((o) => {
						o.items.map((g) => {
							//this.removeParameter(g, o.type);
							if (
								this.pkgDataSelected.filter(
									(p) => p.id == g && p.type == o.type
								).length > 0
							) {
								this.$store.dispatch("pkgDataSelected", {
									type: o.type,
									id: g,
									action: "remove",
								});
							}
						});
					});

					break;
				case "uncheck":
					[
						{
							type: "BS-Method",
							items: this.getPropsArr("methods"),
						},
						{
							type: "BS-Source",
							items: this.getPropsArr("sources"),
						},
					].map((o) => {
						o.items.map((g) => {
							//this.addParameter(g, o.type);
							if (
								this.pkgDataSelected.filter(
									(p) => p.id == g && p.type == o.type
								).length == 0
							) {
								this.$store.dispatch("pkgDataSelected", {
									type: o.type,
									id: g,
									action: "add",
								});
							}
						});
					});
					break;
			}

			this.trigger++;
		},
		getPropsArr(PROP) {
			let selectedBSObjs = this.pkgDataSelected.filter(
				(p) => p.type == "Biosample"
			);

			let selectedBSArr = [];

			selectedBSObjs.map((s) => {
				selectedBSArr.push(s.id);
			});

			if (selectedBSArr.length > 0) {
				let methods = [];
				let sources = [];

				selectedBSArr.map((p) => {
					let path = p.split(" / ");
					let a = path[0];
					let t = path[1];
					let b = path[2];

					if (
						!!this.pkgData.biosamplesData &&
						this.pkgData.biosamplesData[a] &&
						this.pkgData.biosamplesData[a][t] &&
						this.pkgData.biosamplesData[a][t][b]
					) {
						this.pkgData.biosamplesData[a][t][b].map((r) => {
							methods.push(r.method);
							sources.push(r.source);
						});
					}
				});

				methods = [...new Set(methods)];
				sources = [...new Set(sources)];

				let tempObj = { methods: methods, sources: sources };

				return tempObj[PROP];
			} else {
				return null;
			}
		},
		addRemoveParameter(ID, TYPE) {
			if (
				this.pkgDataSelected.filter((p) => p.id == ID && p.type == TYPE)
					.length > 0
			) {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "remove",
				});
			} else {
				this.$store.dispatch("pkgDataSelected", {
					type: TYPE,
					id: ID,
					action: "add",
				});
			}
		},
		getOverlappingBSRegion() {
			//"overlapping regions" can be 'and', 'or' or 'false'
			if (
				!!this.renderConfig["overlapping regions"] &&
				this.renderConfig["overlapping regions"] != "false"
			) {
				let removedBSMethods = this.$store.state.pkgDataSelected
					.filter((s) => s.type == "BS-Method")
					.map((s) => s.id);

				let removedBSSources = this.$store.state.pkgDataSelected
					.filter((s) => s.type == "BS-Source")
					.map((s) => s.id);

				let selectedBy = {};
				if (this.pkgDataSelected.length > 0) {
					this.pkgDataSelected.map((p) => {
						if (!selectedBy[p.type]) {
							selectedBy[p.type] = [];
						}
						selectedBy[p.type].push(p.id);
					});
				}
				if (!!selectedBy["Biosample"]) {
					let enrichedPosition = { and: null, or: null };

					selectedBy["Biosample"].map((ID) => {
						let bsDataPath = ID.split(" / ");
						let a = bsDataPath[0];
						let t = bsDataPath[1];
						let b = bsDataPath[2];

						for (const [key, arr] of Object.entries(
							enrichedPosition
						)) {
							let tempArr = [];
							if (
								!!this.pkgData.biosamplesData &&
								!!this.pkgData.biosamplesData[a] &&
								!!this.pkgData.biosamplesData[a][t] &&
								!!this.pkgData.biosamplesData[a][t][b]
							)
								this.pkgData.biosamplesData[a][t][b].map(
									(r) => {
										if (
											removedBSMethods.indexOf(
												r.method
											) == -1 &&
											removedBSSources.indexOf(
												r.source
											) == -1
										) {
											for (
												let i = r.start;
												i <= r.end;
												i++
											) {
												tempArr.push(i);
											}
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
										: enrichedPosition[key].concat(tempArr); // getting only intersecting positions
							}
						}
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
						"overlappingBiosampleRegions",
						overlappingRegions
					);
				} else {
					if (!!this.pkgData["overlappingBiosampleRegions"]) {
						delete this.pkgData["overlappingBiosampleRegions"];
					}
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
			this.renderBiosamplesTrack("on resize");
			if (
				!this.renderConfig["with annotations viewer"] ||
				this.renderConfig["with annotations viewer"] == "false"
			) {
				this.renderGE();
			}
		},

		removeAnno(ID) {
			this.$store.dispatch("pkgDataSelected", {
				type: "Annotation",
				id: ID,
				action: "remove",
			});
		},

		removeTissue(ID) {
			this.$store.dispatch("pkgDataSelected", {
				type: "Tissue",
				id: ID,
				action: "remove",
			});
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

		checkGEPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);
			let localSpaceBy = Math.round(this.spaceBy / 2);

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
					infoBox.style.top = y + localSpaceBy + "px";
				} else {
					infoBox.style.width = "200px";
					infoBox.style.left = x - (200 + 15) + "px";
					infoBox.style.top = y + localSpaceBy + "px";
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

			const infoBox = document.querySelector("#biosampleInfoBox");
			let infoContent = "";

			if (TYPE == "hover") {
				if (
					x >= this.plotMargin.leftMargin / 2 &&
					x <= rect.width - this.plotMargin.leftMargin / 2
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
									"<br />" +
									"state: " +
									regionValue.state +
									"<br />";
							}
						}
					}
				} else if (
					x >= rect.width - this.plotMargin.leftMargin / 2 &&
					x <= rect.width
				) {
					let floorY = Math.floor(rawY);
					let yStart = floorY - 8;
					let yEnd = floorY + 8;
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
					x >= this.plotMargin.leftMargin / 2 &&
					x <= rect.width - this.plotMargin.leftMargin / 2
				) {
					if (!!this.biosamplesPosData[y]) {
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
					infoBox.style.top = rawY + localSpaceBy + "px";
				}
			}

			if (TYPE == "click") {
				if (infoContent != "") {
					this.addRemoveBiosampleTrack(infoContent);
				}
			}
		},
		getColorIndex(anno) {
			let annoArry = Object.keys(this.pkgData.annoData);
			let i = annoArry.indexOf(anno);
			return this.compareGroupColors[i];
		},
		async getGlobalEnrichment() {
			let biosamplesServer =
				this.renderConfig["biosamples server"] == "KP BioIndex"
					? uiUtils.biDomain() + "/api/bio"
					: this.renderConfig["biosamples server"];

			let phenotype = this.searchingPhenotype;

			let GEIndex = !!this.renderConfig["global enrichment index"]
				? this.renderConfig["global enrichment index"]
				: "global-enrichment";

			let GEURL =
				biosamplesServer + "/query/" + GEIndex + "?q=" + phenotype;

			let GEJson = await fetch(GEURL).then((resp) => resp.json());

			if (GEJson.error == null) {
				if (this.searchType == "newSearch") {
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

				//this.renderBiosamplesTrack();
				this.renderGE();
				this.renderBiosamplesTrack();
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

					let tIndex = 0;
					annotations[pKey][aKey].map((tValue) => {
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
			let annotations = this.getSelectedParameters("Annotation").sort();
			let tissues = this.getSelectedParameters("Tissue").sort();

			if (!annotations.includes(ANNOTATION)) {
				this.$store.dispatch("pkgDataSelected", {
					type: "Annotation",
					id: ANNOTATION,
					action: "add",
				});
			}

			if (!tissues.includes(TISSUE)) {
				this.$store.dispatch("pkgDataSelected", {
					type: "Tissue",
					id: TISSUE,
					action: "add",
				});
			}

			if (
				!!this.biosamplesData[ANNOTATION] &&
				!!this.biosamplesData[ANNOTATION][TISSUE]
			) {
				this.renderBiosamplesTrack("after bs data load");
			} else {
				let biosamplesServer =
					this.renderConfig["biosamples server"] == "KP BioIndex"
						? uiUtils.biDomain() + "/api/bio"
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

				let biosamplesJson = await fetch(biosamplesURL).then((resp) =>
					resp.json()
				);

				///working part
				if (biosamplesJson.error == null) {
					if (biosamplesJson.continuation == null) {
						this.runAfterBSDataLoad(
							biosamplesJson,
							ANNOTATION,
							TISSUE
						);
					} else {
						this.loadContinue(biosamplesJson, ANNOTATION, TISSUE);
					}
				}
			}
		},

		async loadContinue(CONTENT, ANNOTATION, TISSUE) {
			let biosamplesServer =
				this.renderConfig["biosamples server"] == "KP BioIndex"
					? uiUtils.biDomain() + "/api/bio"
					: this.renderConfig["biosamples server"];

			let contURL =
				biosamplesServer + "/cont?token=" + CONTENT.continuation;

			let contJson = await fetch(contURL).then((resp) => resp.json());

			if (contJson.error == null) {
				let prevData = CONTENT.data;
				let newData = prevData.concat(contJson.data);

				contJson.data = newData;

				if (contJson.continuation == null) {
					this.runAfterBSDataLoad(contJson, ANNOTATION, TISSUE);
				} else {
					this.loadContinue(contJson, ANNOTATION, TISSUE);
				}
			}
		},
		runAfterBSDataLoad(DATA, ANNOTATION, TISSUE) {
			let regions = [];
			DATA.data.map((d) => {
				if (d.annotation == ANNOTATION) {
					regions.push(d);
				}
			});

			if (regions.length > 0) {
				let biosampleKeys = [
					...new Set(regions.map((r) => r.biosample)),
				].sort(Intl.Collator().compare);

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
				Vue.set(this.pkgData, "biosamplesData", this.biosamplesData);
			}

			this.renderBiosamplesTrack("after bs data load");
		},

		renderBiosamplesTrack(WHERE) {
			this.biosamplesPosData = {};

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
			//let pvalueFoldWidth = 240;

			let selectedBiosamples = this.pkgDataSelected
				.filter((s) => s.type == "Biosample")
				.map((s) => s.id);

			let annotationTissueArr = [];

			let annotations = this.getSelectedParameters("Annotation").sort();
			let tissues = this.getSelectedParameters("Tissue").sort();

			annotations.map((a) => {
				tissues.map((t) => {
					annotationTissueArr.push(a + " / " + t);
					tempHeight += annotationTitleH;
					tempHeight +=
						Object.keys(this.biosamplesData[a][t]).length *
						perBiosample;
					tempHeight += btwnAnnotations;
				});
			});

			let wrapper = document.querySelector("#biosamplesPlotWrapper");
			let canvas = document.querySelector("#biosamplesPlot");

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth * 2;
				let canvasHeight = tempHeight + topMargin + bottomMargin;
				let plotWidth = canvasWidth - this.plotMargin.leftMargin * 2;
				//let plotHeight = tempHeight;
				let bump = 11;

				let xPerPixel = plotWidth / (regionEnd - regionStart);

				let c, ctx;
				c = canvas;
				c.setAttribute("width", canvasWidth);
				c.setAttribute("height", canvasHeight);
				c.setAttribute(
					"style",
					"width:" +
						canvasWidth / 2 +
						"px;height:" +
						canvasHeight / 2 +
						"px;"
				);
				ctx = c.getContext("2d");
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let renderHeight = annotationTitleH;

				annotationTissueArr.map((at) => {
					ctx.font = "28px Arial";
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
									ctx.fillStyle = "#FF000066";
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
								/*let xPosBtn =
									xPosStart + "_" + (xPosStart + xPosWidth);*/

								let xPosBtn =
									Math.round(xPosStart / 2) +
									"_" +
									Math.round((xPosStart + xPosWidth) / 2);

								this.biosamplesPosData[yPosBtn].regions[
									xPosBtn
								] = {
									start: p.start,
									end: p.end,
									dataset: p.dataset,
									method: p.method,
									source: p.source,
									state: p.state,
								};
							}
						});

						renderHeight += perBiosample;

						ctx.fillStyle = "#000000";
						ctx.textAlign = "start";
						ctx.textBaseline = "middle";
						ctx.font = "24px Arial";
						ctx.fillText(bKey, 10, renderHeight - 8);
					}

					renderHeight += btwnAnnotations;
				});
			}
			// get ovelapping region
			this.getOverlappingBSRegion();
		},

		async getBSAnnotations(REGION_OBJ) {
			if (
				!!REGION_OBJ &&
				!!REGION_OBJ.chr &&
				!!REGION_OBJ.start &&
				REGION_OBJ.end
			) {
				///Update to 'uiUtils.biDomain() + "/api/bio"' before release
				let biosamplesServer =
					this.renderConfig["biosamples server"] == "KP BioIndex"
						? uiUtils.biDomain() + "/api/bio"
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
						let pValue =
							g.pValue == 0 ? 324 : -Math.log10(g.pValue);
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
				document.querySelector("#BSGEPlotWrapper").clientWidth *
				2 *
				0.25;

			let allCanvasWidth = canvasWidth * numOfPhenotypes;

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
			c = document.querySelector("#BSGEPlot");
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

			for (const [phenotype, GE] of Object.entries(sortedGEData)) {
				let titleYPos = titleSize;

				let canvasLeft = bump + canvasWidth * pIndex;

				ctx.font = "28px Arial";
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
						this.annotationOnFocus == "null" ||
						this.annotationOnFocus == annotation
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
						ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
						ctx.fill();

						if (
							tValue.fold >= foldArr[2] ||
							tValue.pValue >= pValArr[2]
						) {
							ctx.font = "24px Arial";
							ctx.fillStyle =
								this.annotationOnFocus == "null" ||
								this.annotationOnFocus == annotation
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

		renderAnnoAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
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

			//render x axis
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
					yPos + HEIGHT + bump * 8
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
}
.btn-biosamples {
	margin-left: 20px;
	vertical-align: bottom;
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

.biosamples-plot-wrapper {
	padding: 0 !important;
}
.bio-plot-wrapper,
.bio-plot-ui-wrapper {
	display: inline-block;
	vertical-align: top;
}
.bio-bubble-wrapper {
	width: auto;
	display: inline-block;
	margin-left: 3px;
	margin-right: 3px;
	margin-bottom: 3px;
}
.bio-bubble-wrapper span {
	font-size: 12px;
	display: inline-block;
}
.bio-bubble {
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

#biosamplesPlotWrapper {
	/*display: inline-block;
	vertical-align: top;*/
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
#bioInitialMessage,
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



