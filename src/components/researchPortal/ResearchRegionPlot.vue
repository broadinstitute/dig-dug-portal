<template>
	<div class="mbm-plot-content row" id="rp_region_plot">
		<div v-if="plotsList.length > 1" class="show-hide-plots col-md-12">
			<strong>Show/hide region plots</strong>
			<template v-for="(item, itemIndex) in plotsList">
				<span :key="item" v-if="item != 'Combined'" class="group-bubble" v-html="item" :style="'background-color:' +
					compareGroupColors[itemIndex] +
					';'
					" @click="
		utils.uiUtils.showHideElement(
			'plotsWrapper' + item.replaceAll(' ', '_')
		)
		"></span>
				<span type="button" v-if="item == 'Combined'" class="group-bubble reference"
					style="background-color: #ffffff; border: solid 1px #666666"
					@click="utils.uiUtils.showHideElement('plotsWrapperCombined')">
					Combined
				</span>
			</template>
		</div>
		<div id="fixedInfoBox" class="fixed-info-box hidden">
			<div class="fixed-info-box-close" @click="showHidePanel('#fixedInfoBox')">
				<b-icon icon="x-circle-fill"></b-icon>
			</div>
			<div class="fixed-info-box-content">
				<div v-for="(d, dIndex) in dotsClicked">
					<div>
						<strong v-html="d"></strong>
						<b-icon v-if="!!renderConfig['star key'] &&
							checkStared(d) == true
							" icon="star-fill" style="
								color: #ffcc00;
								cursor: pointer;
								margin-left: 4px;
							" @click="removeStarItem(d)"></b-icon>
						<b-icon v-if="!!renderConfig['star key'] &&
							checkStared(d) == false
							" icon="star" style="
								color: #ffcc00;
								cursor: pointer;
								margin-left: 4px;
							" @click="addStarItem(d)"></b-icon>
					</div>
					<div>
						<strong v-html="'Set this LD reference for: '"></strong>
						<template v-for="(i, iIndex) in plotsList">
							<strong v-if="i != 'Combined' && !!assoData[i].data[d]" v-html="i" class="group-bubble" :style="'background-color:' +
								compareGroupColors[iIndex] +
								';'
								" @click="resetLdReference(i, d)"></strong>
							<strong v-if="i == 'Combined'" v-html="'All'" class="group-bubble"
								style="background-color: #dddddd" @click="resetLdReference('All', d)"></strong>
						</template>
					</div>
					<div v-if="g != 'Combined' && !!assoData[g].data[d]" v-for="(g, gIndex) in plotsList">
						<div v-for="(h, hIndex) in renderConfig['hover content']">
							<span v-html="h + '(' + g + '):' + assoData[g].data[d][h]
								"></span>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div v-if="!!renderConfig.legend" class="mbm-plot-legend col-md-12" v-html="renderConfig.legend"></div>
		<div class="col-md-12 region-plots-wrapper" :id="'plotsWrapper' + item.replaceAll(' ', '_')"
			v-for="(item, itemIndex) in plotsList">
			<div class="col-md-9 region-plot-default-legend">
				<!--<span
					v-for="(g, gIndex) in plotsList"
					v-if="item == 'Combined' && g != 'Combined'"
					class="group-bubble"
					v-html="g"
					:style="
						'background-color:' + compareGroupColors[gIndex] + ';'
					"
				></span>
				<button
					type="button"
					v-if="item == 'Combined'"
					class="group-bubble reference"
					style="background-color: #ffffff; border: solid 1px #666666"
					@click="showHideSplitPlots()"
				>
					Show/hide Individual plots
				</button>-->
				<div v-if="item != 'Combined'">
					<span class="plot-legend-dot" style="background-color: #824099cc"></span>
					<span>Reference variant</span>
					<span class="plot-legend-dot" style="background-color: #d0363360"></span><span>1 > r2 >= 0.8</span>
					<span class="plot-legend-dot" style="background-color: #ee982d50"></span><span>0.8 > r2 >= 0.6</span>
					<span class="plot-legend-dot" style="background-color: #4db05240"></span><span>0.6 > r2 >= 0.4</span>
					<span class="plot-legend-dot" style="background-color: #32afd530"></span><span>0.4 > r2 >= 0.2</span>
					<span class="plot-legend-dot" style="background-color: #2074b620"></span><span>0.2 > r2 > 0</span>

					<span class="plot-legend-dot" style="background-color: #33333320"></span>
					<span>No data</span>
				</div>
			</div>

			<div class="col-md-9 asso-plots-wrapper">
				<div :id="'assoPlotsWrapper' + item.replaceAll(' ', '_') + sectionId">
					<h6 v-if="item != 'default'" v-html="item" :class="'text color-' + itemIndex"></h6>
					<canvas :id="'asso_plot_' + item.replaceAll(' ', '_') + sectionId" class="asso-plot" width="" height=""
						@resize="onResize" @click="checkPosition($event, item, 'asso', 'click')"
						@mousemove="checkPosition($event, item, 'asso', 'move')"
						@mouseout="onMouseOut('assoInfoBox' + item + sectionId)"></canvas>
					<!--<span
						v-if="sharedPlotXpos != null"
						:style="
							'position:absolute;width: 1px; height:100%;top:0;left: ' +
							sharedPlotXpos +
							'px;border-left: solid 1px #000;'
						"
					></span>-->
					<div :id="'assoInfoBox' + item.replaceAll(' ', '_') + sectionId" class="asso-info-box hidden"></div>
				</div>
			</div>
			<div :id="'ldPlotsWrapper' + item.replaceAll(' ', '_') + sectionId"
				class="col-md-3 ld-plots-wrapper reference-area">
				<h6 v-html="item != 'default'
						? item + ' <small>*Showing only with LD</small>'
						: ' <small>*Showing only with LD</small>'
					" :class="'text color-' + itemIndex"></h6>
				<canvas :id="'ld_plot_' + item.replaceAll(' ', '_') + sectionId" class="ld-plot" width="" height=""
					@resize="onResize" @click="checkPosition($event, item, 'LD', 'click')"
					@mousemove="checkPosition($event, item, 'LD', 'move')"
					@mouseout="onMouseOut('ldInfoBox' + item + sectionId)"></canvas>

				<div :id="'ldInfoBox' + item.replaceAll(' ', '_') + sectionId" class="ld-info-box hidden"></div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-plot", {
	props: [
		"plotData",
		"renderConfig",
		"dataComparisonConfig",
		"region",
		"plotMargin",
		"compareGroupColors",
		"regionZoom",
		"regionViewArea",
		"pkgData",
		"pkgDataSelected",
		"isSectionPage",
		"sectionId",
		"utils"
	],
	data() {
		return {
			plotRenderBy: "all",
			ldColor: [
				"#2074B620",
				"#32AFD520",
				"#4DB05220",
				"#EE982D20",
				"#D0363320",
			],
			ldDotColor: [
				"#2074B650",
				"#32AFD550",
				"#4DB05250",
				"#EE982D50",
				"#D0363350",
				"#824099cc",
			],

			//rebuilding start
			assoData: {},
			ldData: {},
			recombData: "",
			assoPos: {},
			ldPos: {},
			dotsClicked: [],
			refProperties: { region: null, refVariants: {}, groups: [] },
			fixedRefVariants: {},
		};
	},
	modules: {
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		staredVariants() {
			if (!!this.renderConfig["star key"]) {
				let stared = "";
				this.pkgDataSelected
					.filter((s) => s.type == this.renderConfig["star key"])
					.map((s) => {
						stared += s.id;
					});

				return stared;
			} else {
				return null;
			}
		},
		plotsList() {
			//used rebuild
			let newRegion = false;

			if (
				!this.refProperties.region ||
				this.refProperties.region != this.region
			) {
				this.refProperties = {
					region: this.region,
					refVariants: {},
					groups: [],
				};
				newRegion = true;
			}

			if (this.plotData != null) {
				var plotsKeys = [];
				if (this.dataComparisonConfig != null) {
					var field =
						this.dataComparisonConfig["fields to compare"][0];
					// get list of data groups
					for (const [pKey, pValue] of Object.entries(
						this.plotData
					)) {
						for (const [key, value] of Object.entries(
							pValue[field]
						)) {
							plotsKeys.push(key);
						}
					}
					plotsKeys = [...new Set(plotsKeys)];

					if (plotsKeys.length > 1) {
						plotsKeys.push("Combined");
					}
				} else if (this.dataComparisonConfig == null) {
					plotsKeys.push("default");
				}

				if (!!newRegion) {
				}

				this.assoData = {}; // reset assoData
				this.ldData = {}; // reset ldData
				this.recombData = ""; // reset recombData
				this.assoPos = {};
				this.ldPos = {};

				//feed assoData + set initial reference variant
				var yAxField = this.renderConfig["y axis field"];
				var populationsType =
					this.renderConfig["ld server"]["populations type"];

				plotsKeys.map((group) => {
					this.assoData[group] = {
						yAxHigh: null,
						yAxLow: null,
						data: {},
					};

					if (!!this.ldData[group]) {
						let refVariant = this.refProperties.refVariants[group];
						if (!this.plotData[refVariant]) {
							this.ldData[group] = {
								refVariant: null,
								population: [],
								data: null,
							};

							this.refProperties.refVariants[group] = null;
						}
					} else {
						this.ldData[group] = {
							refVariant: null,
							population: [],
							data: null,
						};
					}

					if (group != "Combined") {
						this.assoPos[group] = {};
						this.ldPos[group] = {};
					}

					if (group != "default") {
						for (const [dKey, dValue] of Object.entries(
							this.plotData
						)) {
							if (group != "Combined") {
								let yAxValue = dValue[yAxField][group];

								if (!!yAxValue) {
									// set population for calling LD API

									if (populationsType == "fixed") {
										this.ldData[group].population =
											this.renderConfig["ld server"][
											"fixed population"
											];
									} else if (populationsType == "dynamic") {
										let population =
											dValue[
											this.renderConfig["ld server"][
											"populations field"
											]
											][group];

										this.ldData[group].population.push(
											population
										);
									}

									// set initial refVarint

									if (
										!this.refProperties.refVariants[group]
									) {
										this.ldData[group].refVariant =
											this.assoData[group].yAxHigh == null
												? dKey
												: yAxValue >
													this.assoData[group].yAxHigh
													? dKey
													: this.ldData[group].refVariant;
									} else {
										this.ldData[group].refVariant =
											this.refProperties.refVariants[
											group
											];
									}

									// set high / low values of the group
									this.assoData[group].yAxHigh =
										this.assoData[group].yAxHigh == null
											? Math.ceil(yAxValue)
											: yAxValue >
												this.assoData[group].yAxHigh
												? Math.ceil(yAxValue)
												: this.assoData[group].yAxHigh;

									this.assoData[group].yAxLow =
										this.assoData[group].yAxLow == null
											? Math.floor(yAxValue)
											: yAxValue <
												this.assoData[group].yAxLow
												? Math.floor(yAxValue)
												: this.assoData[group].yAxLow;
									// add data to asso data
									this.assoData[group].data[dKey] = {};

									for (const [fKey, fValue] of Object.entries(
										dValue
									)) {
										if (this.dataComparisonConfig != null) {
											this.assoData[group].data[dKey][
												fKey
											] =
												this.dataComparisonConfig[
													"fields to compare"
												].includes(fKey) == true
													? fValue[group]
													: fValue;
										} else if (
											this.dataComparisonConfig == null
										) {
											this.assoData[group].data[dKey][
												fKey
											] = fValue;
										}
									}
								}
							}
						}
					} else if (group == "default") {

						let refVariant = null;

						this.plotData.map((dValue) => {
							let yAxValue = dValue[yAxField];

							if (!!yAxValue) {
								// set population for calling LD API

								if (populationsType == "fixed") {
									this.ldData[group].population =
										this.renderConfig["ld server"][
										"fixed population"
										];
								} else if (populationsType == "dynamic") {
									let population =
										dValue[
										this.renderConfig["ld server"][
										"populations field"
										]
										];

									this.ldData[group].population.push(
										population
									);
								}

								let dKey =
									dValue[this.renderConfig["render by"]];

								// set initial refVarint
								//if (!this.fixedRefVariants[group]) {
								refVariant =
									this.assoData[group].yAxHigh == null
										? dKey
										: yAxValue >
											this.assoData[group].yAxHigh
											? dKey
											: refVariant;
								//}

								// set high / low values of the group
								this.assoData[group].yAxHigh =
									this.assoData[group].yAxHigh == null
										? Math.ceil(yAxValue)
										: yAxValue >
											this.assoData[group].yAxHigh
											? yAxValue
											: Math.ceil(
												this.assoData[group].yAxHigh
											);

								this.assoData[group].yAxLow =
									this.assoData[group].yAxLow == null
										? Math.floor(yAxValue)
										: yAxValue < this.assoData[group].yAxLow
											? yAxValue
											: Math.floor(
												this.assoData[group].yAxLow
											);
								// add data to asso data
								this.assoData[group].data[dKey] = {};

								for (const [fKey, fValue] of Object.entries(
									dValue
								)) {
									if (this.dataComparisonConfig != null) {
										this.assoData[group].data[dKey][fKey] =
											this.dataComparisonConfig[
												"fields to compare"
											].includes(fKey) == true
												? fValue[group]
												: fValue;
									} else if (
										this.dataComparisonConfig == null
									) {
										this.assoData[group].data[dKey][fKey] =
											fValue;
									}
								}
							}
						});

						if (!!this.fixedRefVariants[group] && !!this.assoData[group].data[this.fixedRefVariants[group]]) {
							this.ldData[group].refVariant = this.fixedRefVariants[group]
						} else {
							this.ldData[group].refVariant = refVariant;
						}
					}

					// set LD population
					let uniqPopulations = [
						...new Set(this.ldData[group].population),
					];
					this.ldData[group].population =
						uniqPopulations.length > 1
							? "ALL"
							: this.renderConfig["ld server"].populations[
							uniqPopulations[0]
							];
				});

				if (plotsKeys.includes("Combined") == true) {
					plotsKeys.map((p) => {
						let yAxHighValue = this.assoData[p].yAxHigh;
						let yAxLowValue = this.assoData[p].yAxLow;

						this.assoData.Combined.yAxHigh =
							this.assoData.Combined.yAxHigh == null
								? Math.ceil(yAxHighValue)
								: yAxHighValue > this.assoData.Combined.yAxHigh
									? Math.ceil(yAxHighValue)
									: this.assoData.Combined.yAxHigh;

						this.assoData.Combined.yAxLow =
							this.assoData.Combined.yAxLow == null
								? Math.floor(yAxLowValue)
								: yAxLowValue < this.assoData.Combined.yAxLow
									? Math.floor(yAxLowValue)
									: this.assoData.Combined.yAxLow;
					});
				}

				this.setUpWrappers();
				return plotsKeys;
			} else {
				return null;
			}
		},
		searchingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = parseInt(this.region.split(":")[0], 10);

				let regionArr = this.region.split(":")[1].split("-");
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

					returnObj["start"] = start + zoomNum + viewPointShift;
					returnObj["end"] = end - zoomNum + viewPointShift;
				} else if (this.regionZoom == 0) {
					returnObj["start"] = start;
					returnObj["end"] = end;
				}

				return returnObj;
			}
		},
	},
	watch: {
		staredVariants(CONTENT) {
			this.renderPlots();
		},
	},
	methods: {

		onResize(e) {
			this.renderPlots();
		},
		checkStared(ITEM) {
			let selectedItems = this.pkgDataSelected
				.filter((s) => s.type == this.renderConfig["star key"])
				.map((s) => s.id);

			if (!!selectedItems.includes(ITEM)) {
				return true;
			} else {
				return false;
			}
		},
		addStarItem(ITEM) {
			this.$store.dispatch("pkgDataSelected", {
				type: this.renderConfig["star key"],
				id: ITEM,
				action: "add",
			});
		},
		removeStarItem(ITEM) {
			this.$store.dispatch("pkgDataSelected", {
				type: this.renderConfig["star key"],
				id: ITEM,
				action: "remove",
			});
		},
		resetLdReference(GROUP, VARIANT) {
			this.showHidePanel("#fixedInfoBox");
			if (GROUP != "All") {
				this.ldData[GROUP].refVariant = VARIANT;
				this.fixedRefVariants[GROUP] = VARIANT;
				this.ldData[GROUP].data = null;
				this.refProperties.refVariants[GROUP] = VARIANT;
			} else if (GROUP == "All") {
				this.plotsList.map((p) => {
					if (p != "combined") {
						this.ldData[p].refVariant = VARIANT;
						this.fixedRefVariants[p] = VARIANT;
						this.ldData[p].data = null;
						this.refProperties.refVariants[p] = VARIANT;
					}
				});
			}

			this.callForLDData();
		},
		showHidePanel(PANEL) {
			let wrapper = document.querySelector(PANEL);
			if (wrapper.classList.contains("hidden")) {
				wrapper.classList.remove("hidden");
			} else {
				wrapper.classList.add("hidden");
			}
		},
		showHideSplitPlots() {
			this.plotsList.map((p) => {
				if (p != "Combined") {
					let wrapper = document.querySelector(
						"#plotsWrapper" + p.replaceAll(" ", "_")
					);
					if (wrapper.classList.contains("hidden")) {
						wrapper.classList.remove("hidden");
					} else {
						wrapper.classList.add("hidden");
					}
				}
			});
		},
		getDotsOnPosition(TYPE, GROUP, X, Y) {
			var posData =
				TYPE == "asso" ? this.assoPos[GROUP] : this.ldPos[GROUP];
			var dotsList = [];

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (posData[X + h] != undefined) {
						if (posData[X + h][Y + v] != undefined) {
							dotsList = dotsList.concat(posData[X + h][Y + v]);
						}
					}
				}
			}

			return dotsList;
		},
		checkPosition(event, GROUP, TYPE, EVENT_TYPE) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);
			let rawX = e.clientX;

			var dotsOnPosition = this.getDotsOnPosition(TYPE, GROUP, x, y);
			dotsOnPosition = [...new Set(dotsOnPosition)];

			let infoBoxId =
				TYPE == "asso"
					? "#assoInfoBox" + GROUP.replaceAll(" ", "_") + this.sectionId
					: "#ldInfoBox" + GROUP.replaceAll(" ", "_") + this.sectionId;

			let canvasId =
				TYPE == "asso"
					? "#asso_plot_" + GROUP.replaceAll(" ", "_") + this.sectionId
					: "#ld_plot_" + GROUP.replaceAll(" ", "_") + this.sectionId;

			let wrapper = document.querySelector(infoBoxId);
			let canvas = document.querySelector(canvasId);

			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left =
				x + canvas.offsetLeft + 150 > canvas.width
					? x + canvas.offsetLeft + -215 + "px"
					: x + canvas.offsetLeft + 15 + "px";
			wrapper.style.width =
				x + canvas.offsetLeft + 150 > canvas.width ? "200px" : "auto";

			if (dotsOnPosition.length > 0) {
				if (EVENT_TYPE == "move") {
					let infoContent =
						dotsOnPosition.length > 5
							? "<span class='info-box-direction'>Viewing 5 of " +
							dotsOnPosition.length +
							" variants. Click to view full list or to change LD reference variant.</span><br />"
							: "<span class='info-box-direction'>Click to change LD reference variant.</span><br />";

					dotsOnPosition.map((d, dIndex) => {
						if (dIndex < 5) {
							infoContent += "<strong>" + d + "</strong>";

							if (!!this.renderConfig["star key"]) {
								infoContent +=
									this.checkStared(d) == true
										? "&nbsp;<span style='color:#ffcc00'>&#9733;</span>"
										: "&nbsp;<span style='color:#ffcc00'>&#9734;</span>";
							}

							infoContent += "<br />";

							this.renderConfig["hover content"].map((h) => {
								if (GROUP != "Combined") {
									infoContent +=
										h +
										": " +
										this.assoData[GROUP].data[d][h] +
										"<br />";
								} else if (GROUP == "Combined") {
									this.plotsList.map((G) => {
										if (
											G != "Combined" &&
											this.assoData[G].data[d]
										) {
											infoContent +=
												h +
												"(" +
												G +
												")" +
												": " +
												this.assoData[G].data[d][h] +
												"<br />";
										}
									});
								}
							});
						}
					});
					wrapper.classList.remove("hidden");
					wrapper.innerHTML = infoContent;
				} else if (EVENT_TYPE == "click") {
					this.dotsClicked = dotsOnPosition;
					this.showHidePanel("#fixedInfoBox");
				}
			} else {
				wrapper.classList.add("hidden");
			}
		},
		onMouseOut(BOXID) {
			this.utils.uiUtils.removeOnMouseOut(BOXID.replaceAll(" ", "_"), 1000);
		},
		setUpWrappers() {
			this.callForRecombData();
		},
		async callForRecombData() {
			var signalURL =
				"https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/?filter=id in 15 and chromosome eq '" +
				this.searchingRegion.chr +
				"' and position gt " +
				this.searchingRegion.start +
				" and position lt " +
				this.searchingRegion.end;

			var signalJson = await fetch(signalURL).then((resp) => resp.json());
			this.recombData = {};
			if (signalJson.error == null) {
				this.recombData["position"] = signalJson.data.position;
				this.recombData["recomb_rate"] = signalJson.data.recomb_rate;
				this.callForLDData();
			}
		},
		async callForLDData() {
			const plotWrappers = document.querySelectorAll(
				".region-plots-wrapper"
			);

			plotWrappers.forEach(function (plotWrapper) {
				plotWrapper.classList.remove("hidden");
			});

			var plotID = null;

			for (var i = 0; i < this.plotsList.length; i++) {
				if (
					this.plotsList[i] != "Combined" &&
					this.ldData[this.plotsList[i]].data == null
				) {
					plotID = this.plotsList[i];
					break;
				}
			}

			if (plotID != null) {

				let ldURL =
					"https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations/" +
					this.ldData[plotID].population +
					"/variants?correlation=rsquare&variant=" +
					this.ldData[plotID].refVariant +
					"&chrom=" +
					this.searchingRegion.chr +
					"&start=" +
					this.searchingRegion.start +
					"&stop=" +
					this.searchingRegion.end +
					"&limit=100000";

				let ldJson = await fetch(ldURL).then((resp) => resp.json());

				if (ldJson.error == null) {
					let tempObj = {};
					ldJson.data.variant2.map((variant, variantIndex) => {
						tempObj[variant] =
							ldJson.data.correlation[variantIndex];
					});

					this.ldData[plotID].data = tempObj;
					this.callForLDData();
				}
			} else {
				for (var i = 0; i < this.plotsList.length; i++) {
					if (this.plotsList[i] != "Combined") {
						let plotID = this.plotsList[i];

						Object.keys(this.plotData).map((k) => {
							this.plotData[k]["LDS"] = !!this.plotData[k]["LDS"]
								? this.plotData[k]["LDS"]
								: {};

							this.plotData[k]["LDS"][plotID] =
								this.ldData[plotID].data[k];
						});

						break;
					}
				}

				if (!!this.isSectionPage) {

				} else {
					this.$store.dispatch("filteredData", this.plotData);
				}


				this.renderPlots();
			}
			this.$forceUpdate();
		},
		renderPlots() {
			let regionStart = this.searchingRegion.start;
			let regionEnd = this.searchingRegion.end;
			// findout width and height of canvas and actual plots. use #rp_region_plot to measure
			let assoCanvasWidth =
				document.querySelector("#rp_region_plot").clientWidth *
				0.75 *
				2 -
				60; //30 <- left & right padding of wrapper *2
			let ldCanvasWidth =
				document.querySelector("#rp_region_plot").clientWidth *
				0.25 *
				2 -
				60; //30 <- left & right padding of wrapper *2

			let canvasHeight = !!this.renderConfig.height
				? this.renderConfig.height * 2 +
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin
				: 600 +
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin;

			let assoPlotWidth =
				assoCanvasWidth - this.plotMargin.leftMargin * 2;
			let ldPlotWidth =
				ldCanvasWidth -
				this.plotMargin.leftMargin -
				this.plotMargin.rightMargin;

			let plotHeight = !!this.renderConfig.height
				? this.renderConfig.height * 2
				: 600;

			let bump = this.plotMargin.bump;

			this.plotsList.map((p) => {
				// first asso plot
				let c, ctx;

				c = document.getElementById(
					"asso_plot_" + p.replaceAll(" ", "_") + this.sectionId
				);
				c.setAttribute("width", assoCanvasWidth);
				c.setAttribute("height", canvasHeight);
				c.setAttribute(
					"style",
					"width:" +
					assoCanvasWidth / 2 +
					"px;height:" +
					canvasHeight / 2 +
					"px;"
				);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, assoCanvasWidth, canvasHeight);

				this.renderAxis(
					ctx,
					assoPlotWidth,
					plotHeight,
					this.assoData[p].yAxHigh,
					this.assoData[p].yAxLow,
					regionEnd,
					regionStart,
					bump,
					"asso",
					p
				);

				this.renderRecombLine(
					ctx,
					assoPlotWidth,
					plotHeight,
					regionEnd,
					regionStart
				);

				this.renderDots(
					ctx,
					assoPlotWidth,
					plotHeight,
					this.assoData[p].yAxHigh,
					this.assoData[p].yAxLow,
					regionEnd,
					regionStart,
					bump,
					"asso",
					p
				);

				// second LD plot
				c = document.getElementById(
					"ld_plot_" + p.replaceAll(" ", "_") + this.sectionId
				);
				c.setAttribute("width", ldCanvasWidth);
				c.setAttribute("height", canvasHeight);
				c.setAttribute(
					"style",
					"width:" +
					ldCanvasWidth / 2 +
					"px;height:" +
					canvasHeight / 2 +
					"px;"
				);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, ldCanvasWidth, canvasHeight);

				this.renderAxis(
					ctx,
					ldPlotWidth,
					plotHeight,
					this.assoData[p].yAxHigh,
					this.assoData[p].yAxLow,
					1,
					0,
					bump,
					"LD",
					p
				);

				this.renderDots(
					ctx,
					ldPlotWidth,
					plotHeight,
					this.assoData[p].yAxHigh,
					this.assoData[p].yAxLow,
					1,
					0,
					bump,
					"LD",
					p
				);
			});
		},
		renderDots(
			CTX,
			WIDTH,
			HEIGHT,
			yMax,
			yMin,
			xMax,
			xMin,
			bump,
			TYPE,
			GROUP
		) {
			let xStart = this.plotMargin.leftMargin;
			let yStart = this.plotMargin.topMargin + HEIGHT;
			let xPosByPixel = WIDTH / (xMax - xMin);
			let yPosByPixel = HEIGHT / (yMax - yMin);

			if (TYPE == "asso") {
				this.assoPos[GROUP] = {};
				var xField = this.renderConfig["x axis field"];
				var yField = this.renderConfig["y axis field"];

				if (GROUP != "Combined") {
					for (const [key, value] of Object.entries(
						this.assoData[GROUP].data
					)) {
						if (value[xField] >= xMin && value[xField] <= xMax) {
							let xPos =
								xStart + (value[xField] - xMin) * xPosByPixel;
							let yPos =
								yStart - (value[yField] - yMin) * yPosByPixel;

							this.feedPosData(
								this.assoPos[GROUP],
								Math.round(xPos / 2),
								Math.round(yPos / 2),
								key
							);

							let dotColor = this.getDotColor(
								this.ldData[GROUP].data[key]
							);
							if (key == this.ldData[GROUP].refVariant) {
								if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
									this.utils.plotUtils.renderStar(
										CTX,
										xPos,
										yPos,
										5,
										10,
										6,
										dotColor,
										dotColor
									);
								} else {
									this.renderDiamond(
										CTX,
										xPos,
										yPos,
										dotColor
									);
								}
							} else {
								if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
									this.utils.plotUtils.renderStar(
										CTX,
										xPos,
										yPos,
										5,
										10,
										6,
										dotColor,
										dotColor
									);
								} else {
									this.renderDot(CTX, xPos, yPos, dotColor);
								}
							}
						}
					}
				}

				if (GROUP == "Combined") {
					let linesObj = {};

					this.plotsList.map((pGroup, pIndex) => {
						if (pGroup != "Combined") {
							for (const [key, value] of Object.entries(
								this.assoData[pGroup].data
							)) {
								if (
									value[xField] >= xMin &&
									value[xField] <= xMax
								) {
									if (!linesObj[key]) {
										let tempObj = {
											xValue: [],
											yValue: [],
										};
										tempObj.xValue.push(value[xField]);
										tempObj.yValue.push(value[yField]);
										linesObj[key] = tempObj;
									} else if (!!linesObj[key]) {
										linesObj[key].xValue.push(
											value[xField]
										);
										linesObj[key].yValue.push(
											value[yField]
										);
									}

									let xPos =
										xStart +
										(value[xField] - xMin) * xPosByPixel;
									let yPos =
										yStart -
										(value[yField] - yMin) * yPosByPixel;

									this.feedPosData(
										this.assoPos[GROUP],
										Math.round(xPos / 2),
										Math.round(yPos / 2),
										key
									);

									let dotColor =
										this.compareGroupColors[pIndex];
									if (key == this.ldData[pGroup].refVariant) {
										if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
											this.utils.plotUtils.renderStar(
												CTX,
												xPos,
												yPos,
												5,
												10,
												6,
												dotColor,
												dotColor
											);
										} else {
											this.renderDiamond(
												CTX,
												xPos,
												yPos,
												dotColor
											);
										}
									} else {
										if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
											this.utils.plotUtils.renderStar(
												CTX,
												xPos,
												yPos,
												5,
												10,
												6,
												dotColor,
												dotColor
											);
										} else {
											this.renderDot(
												CTX,
												xPos,
												yPos,
												dotColor
											);
										}
									}
								}
							}
						}
					});

					this.renderConntingLine(
						CTX,
						xStart,
						yStart,
						xMin,
						yMin,
						xPosByPixel,
						yPosByPixel,
						linesObj
					);
				}
			}

			if (TYPE == "LD") {
				this.ldPos[GROUP] = {};
				if (GROUP != "Combined") {
					if (Object.keys(this.ldData[GROUP].data).length == 0) {
						CTX.textAlign = "center";
						CTX.fillStyle = "#000000";
						CTX.fillText(
							"No LD data loaded against " +
							this.ldData[GROUP].refVariant,
							this.plotMargin.leftMargin + WIDTH / 2,
							this.plotMargin.topMargin + HEIGHT / 2
						);
					} else {
						var yField = this.renderConfig["y axis field"];

						for (const [key, value] of Object.entries(
							this.ldData[GROUP].data
						)) {
							if (!!this.assoData[GROUP].data[key]) {
								let xPos = xStart + value * xPosByPixel;
								let yPos =
									yStart -
									(this.assoData[GROUP].data[key][yField] -
										yMin) *
									yPosByPixel;

								this.feedPosData(
									this.ldPos[GROUP],
									Math.round(xPos / 2),
									Math.round(yPos / 2),
									key
								);

								let dotColor = this.getDotColor(value);
								if (key == this.ldData[GROUP].refVariant) {
									if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
										this.utils.plotUtils.renderStar(
											CTX,
											xPos,
											yPos,
											5,
											10,
											6,
											dotColor,
											dotColor
										);
									} else {
										this.renderDiamond(
											CTX,
											xPos,
											yPos,
											dotColor
										);
									}
								} else {
									if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
										this.utils.plotUtils.renderStar(
											CTX,
											xPos,
											yPos,
											5,
											10,
											6,
											dotColor,
											dotColor
										);
									} else {
										this.renderDot(
											CTX,
											xPos,
											yPos,
											dotColor
										);
									}
								}
							}
						}
					}
				}

				if (GROUP == "Combined") {
					let linesObj = {};
					var yField = this.renderConfig["y axis field"];

					this.plotsList.map((pGroup, pIndex) => {
						if (pGroup != "Combined") {
							let dotColor = this.compareGroupColors[pIndex];
							if (
								Object.keys(this.ldData[pGroup].data).length !=
								0
							) {
								for (const [key, value] of Object.entries(
									this.ldData[pGroup].data
								)) {
									if (!!this.assoData[pGroup].data[key]) {
										if (!linesObj[key]) {
											let tempObj = {
												xValue: [],
												yValue: [],
											};
											tempObj.xValue.push(value);
											tempObj.yValue.push(
												this.assoData[pGroup].data[key][
												yField
												]
											);
											linesObj[key] = tempObj;
										} else if (!!linesObj[key]) {
											linesObj[key].xValue.push(value);
											linesObj[key].yValue.push(
												this.assoData[pGroup].data[key][
												yField
												]
											);
										}
										let xPos = xStart + value * xPosByPixel;
										let yPos =
											yStart -
											(this.assoData[pGroup].data[key][
												yField
											] -
												yMin) *
											yPosByPixel;

										this.feedPosData(
											this.ldPos[GROUP],
											Math.round(xPos / 2),
											Math.round(yPos / 2),
											key
										);

										if (
											key ==
											this.ldData[pGroup].refVariant
										) {
											if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
												this.utils.plotUtils.renderStar(
													CTX,
													xPos,
													yPos,
													5,
													10,
													6,
													dotColor,
													dotColor
												);
											} else {
												this.renderDiamond(
													CTX,
													xPos,
													yPos,
													dotColor
												);
											}
										} else {
											if (!!this.renderConfig["star key"] && this.checkStared(key) == true) {
												this.utils.plotUtils.renderStar(
													CTX,
													xPos,
													yPos,
													5,
													10,
													6,
													dotColor,
													dotColor
												);
											} else {
												this.renderDot(
													CTX,
													xPos,
													yPos,
													dotColor
												);
											}
										}
									}
								}
							}
						}
					});

					this.renderConntingLine(
						CTX,
						xStart,
						yStart,
						xMin,
						yMin,
						xPosByPixel,
						yPosByPixel,
						linesObj
					);
				}
			}
		},
		feedPosData(POS_DATA, X, Y, KEY) {
			let floorXpos = Math.floor(X);
			let floorYpos = Math.floor(Y);

			if (!POS_DATA[floorXpos]) {
				POS_DATA[floorXpos] = {};
				POS_DATA[floorXpos][floorYpos] = [];
				POS_DATA[floorXpos][floorYpos].push(KEY);
			} else {
				if (!POS_DATA[floorXpos][floorYpos]) {
					POS_DATA[floorXpos][floorYpos] = [];
					POS_DATA[floorXpos][floorYpos].push(KEY);
				} else {
					POS_DATA[floorXpos][floorYpos].push(KEY);
				}
			}
		},
		getDotColor(SCORE) {
			if (SCORE == undefined) {
				return "#00000030";
			} else {
				let index = Math.floor(SCORE * 5);
				return this.ldDotColor[index];
			}
		},
		renderConntingLine(
			CTX,
			xStart,
			yStart,
			xMin,
			yMin,
			xPosByPixel,
			yPosByPixel,
			linesObj
		) {
			for (const [key, value] of Object.entries(linesObj)) {
				if (value.xValue.length > 1) {
					for (let i = 0; i < value.xValue.length - 1; i++) {
						let xPos1 =
							xStart + (value.xValue[i] - xMin) * xPosByPixel;
						let xPos2 =
							xStart + (value.xValue[i + 1] - xMin) * xPosByPixel;
						let yPos1 =
							yStart - (value.yValue[i] - yMin) * yPosByPixel;
						let yPos2 =
							yStart - (value.yValue[i + 1] - yMin) * yPosByPixel;

						CTX.beginPath();
						CTX.lineWidth = 1;
						CTX.strokeStyle = "#00000050";
						CTX.moveTo(xPos1, yPos1);
						CTX.lineTo(xPos2, yPos2);
						CTX.stroke();
					}
				}
			}
		},
		renderDot(CTX, XPOS, YPOS, DOT_COLOR) {
			CTX.fillStyle = DOT_COLOR;
			CTX.lineWidth = 0;
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 9, 0, 2 * Math.PI);
			CTX.fill();
		},
		renderDiamond(CTX, XPOS, YPOS, DOT_COLOR) {
			let WIDTH = 18;
			let HEIGHT = 24;
			let xpos = XPOS;
			let ypos = YPOS;
			CTX.save();
			CTX.fillStyle = DOT_COLOR;
			CTX.lineWidth = 0;

			CTX.beginPath();
			CTX.moveTo(xpos, ypos - HEIGHT / 2);

			// top left edge
			CTX.lineTo(xpos - WIDTH / 2, ypos);

			// bottom left edge
			CTX.lineTo(xpos, ypos + HEIGHT / 2);

			// bottom right edge
			CTX.lineTo(xpos + WIDTH / 2, ypos);

			CTX.closePath();
			CTX.strokeStyle = "#824099";
			CTX.stroke();
			CTX.fill();
			CTX.restore();
		},
		renderRecombLine(CTX, PWIDTH, PHEIGHT, END, START) {
			var DATA = this.recombData;
			var xPixel = PWIDTH / (END - START);
			var yPixel = PHEIGHT / 100;

			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#007BFF";

			if (!!DATA && !!DATA.position) {
				DATA.position.map((xPos, xPosIndex) => {
					let x1PosPixel = (xPos - START) * xPixel;
					let y1PosPixel = DATA.recomb_rate[xPosIndex] * yPixel;
					let x2PosPixel =
						(DATA.position[xPosIndex + 1] - START) * xPixel;
					let y2PosPixel = DATA.recomb_rate[xPosIndex + 1] * yPixel;

					CTX.moveTo(
						this.plotMargin.leftMargin + x1PosPixel,
						this.plotMargin.topMargin + PHEIGHT - y1PosPixel
					);
					CTX.lineTo(
						this.plotMargin.leftMargin + x2PosPixel,
						this.plotMargin.topMargin + PHEIGHT - y2PosPixel
					);
					CTX.stroke();
				});
			}

		},
		renderAxis(
			CTX,
			WIDTH,
			HEIGHT,
			yMax,
			yMin,
			xMax,
			xMin,
			bump,
			TYPE,
			GROUP
		) {
			let yMaxMinGap = yMax - yMin;
			let yDecimal = yMaxMinGap <= 1 ? 2 : yMaxMinGap <= 50 ? 1 : 0;

			let xMaxMinGap = xMax - xMin;
			let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.font = "24px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(
				this.plotMargin.leftMargin - bump,
				this.plotMargin.topMargin
			);
			CTX.lineTo(
				this.plotMargin.leftMargin - bump,
				HEIGHT + this.plotMargin.topMargin + bump
			);
			CTX.stroke();

			// render recombination Rate y axis
			let recomXpos = Math.round(
				this.plotMargin.leftMargin + WIDTH + bump
			);

			if (TYPE == "asso") {
				CTX.moveTo(recomXpos, this.plotMargin.topMargin);
				CTX.lineTo(
					recomXpos,
					HEIGHT + this.plotMargin.topMargin + bump
				);
				CTX.stroke();
			}

			//render x axis
			CTX.moveTo(
				this.plotMargin.leftMargin - bump,
				HEIGHT + this.plotMargin.topMargin + bump
			);
			CTX.lineTo(
				TYPE == "asso"
					? WIDTH + this.plotMargin.leftMargin + bump
					: WIDTH + this.plotMargin.leftMargin,
				HEIGHT + this.plotMargin.topMargin + bump
			);
			CTX.stroke();

			// Y ticks
			let yStep = (yMax - yMin) / 5;
			let yTickDistance = HEIGHT / 5;
			for (let i = 0; i < 6; i++) {
				let tickYPos = this.plotMargin.topMargin + i * yTickDistance;
				let adjTickYPos = Math.floor(tickYPos); // .5 is needed to render crisp line
				CTX.moveTo(this.plotMargin.leftMargin - bump * 2, adjTickYPos);
				CTX.lineTo(this.plotMargin.leftMargin - bump, adjTickYPos);
				CTX.stroke();

				CTX.textAlign = "right";

				let tickValue = this.utils.Formatters.decimalFormatter(
					yMin + i * yStep,
					yDecimal
				);

				tickValue += yMaxMinGap >= 100000 ? "k" : "";

				CTX.fillText(
					tickValue,
					this.plotMargin.leftMargin - bump * 3,
					this.plotMargin.topMargin +
					HEIGHT +
					bump -
					i * yTickDistance
				);
			}

			// render recombination Rate y ticks
			if (TYPE == "asso") {
				let yStep = 20;
				let yTickDistance = HEIGHT / 5;
				let recombYMin = 0;
				for (let i = 0; i < 6; i++) {
					let tickYPos =
						this.plotMargin.topMargin + i * yTickDistance;
					let adjTickYPos = Math.floor(tickYPos); // .5 is needed to render crisp line
					CTX.moveTo(recomXpos, adjTickYPos);
					CTX.lineTo(recomXpos + bump, adjTickYPos);
					CTX.stroke();

					CTX.textAlign = "left";

					CTX.fillText(
						recombYMin + i * yStep,
						this.plotMargin.leftMargin + WIDTH + bump * 3,
						this.plotMargin.topMargin +
						HEIGHT +
						5 -
						i * yTickDistance
					);
				}
			}

			// X ticks
			let xStep = TYPE == "asso" ? Math.ceil((xMax - xMin) / 5) : 0.2;
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos); // .5 is needed to render crisp line
				CTX.moveTo(
					adjTickXPos,
					this.plotMargin.topMargin + HEIGHT + bump
				);
				CTX.lineTo(
					adjTickXPos,
					this.plotMargin.topMargin + HEIGHT + bump * 2
				);
				CTX.stroke();

				CTX.textAlign = "center";

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
					this.plotMargin.topMargin + HEIGHT + bump * 4
				);
			}

			//Render y axis label
			CTX.textAlign = "center";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				this.renderConfig["y axis label"],
				-(this.plotMargin.topMargin + HEIGHT / 2),
				bump + 24
			);

			//Render recombination rate y axis label
			if (TYPE == "asso") {
				CTX.fillText(
					"Recombination Rate (cM/Mb)",
					-(this.plotMargin.topMargin + HEIGHT / 2),
					this.plotMargin.leftMargin * 2 + WIDTH - (bump + 24)
				);
			}

			//Render x axis label
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.fillText(
				TYPE == "LD" ? "LD(r2)" : this.renderConfig["x axis label"],
				WIDTH / 2 + this.plotMargin.leftMargin,
				this.plotMargin.topMargin +
				this.plotMargin.bottomMargin +
				HEIGHT -
				24
			);

			//render LD plots background
			if (TYPE == "LD" && GROUP == "Combined") {
				let xBGDistance = WIDTH / 5;

				for (let i = 0; i < 5; i++) {
					let bgXPos = this.plotMargin.leftMargin + i * xBGDistance;
					let adBGXPos = Math.floor(bgXPos);
					CTX.fillStyle = this.ldColor[i];
					CTX.fillRect(
						adBGXPos,
						this.plotMargin.topMargin,
						xBGDistance - 1,
						HEIGHT
					);
				}
			}
		},
	},
});

$(function () { });
</script>

<style>
.show-hide-plots {
	text-align: left;
	padding-bottom: 25px;
}

.show-hide-plots span {
	display: inline-block;
}

.show-hide-plots span:hover {
	cursor: pointer;
}

.region-plots-wrapper {
	padding: 0 !important;
}

.asso-plots-wrapper,
.ld-plots-wrapper {
	display: inline-block;
	height: auto !important;
	padding-bottom: 0 !important;
}

.asso-info-box,
.ld-info-box {
	position: absolute;
	max-width: 300px;
	padding: 5px 10px;
	border: solid 1px #ddd;
	border-radius: 5px;
	background-color: #fff;
	z-index: 10;
	font-size: 14px;
}

.info-box-direction {
	color: #36c;
	font-weight: bold;
}

.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}

.fixed-info-box-close:hover {
	color: #36c;
}

.fixed-info-box {
	position: fixed;
	width: 400px;
	height: 300px;
	left: calc(50% - 200px);
	top: calc(50% - 150px);
	padding: 20px 0px 3px 15px;
	border-radius: 5px;
	border: solid 1px #ddd;
	background-color: #fff;
	z-index: 100;
}

.fixed-info-box-content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px !important;
}

.group-bubble {
	font-size: 12px;
	margin-left: 3px;
	margin-right: 3px;
	padding: 0px 8px;
	border-radius: 8px;
}

/* remove later if unused */
.region-plot-default-legend {
	text-align: center;
}

.region-plot-default-legend span {
	font-size: 12px;
	display: inline-block;
	margin-right: 5px;
}

.plot-legend-dot {
	width: 12px;
	height: 12px;
	border-radius: 0px;
}

.asso-plot.hover,
.ld-plot.hover {
	cursor: pointer;
}

.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
	display: block !important;
}

#clicked_dot_value,
#ld_clicked_dot_value {
	padding: 8px 20px 8px 10px !important;
}

.content-on-clicked-dot-values {
	padding-left: 10px;
}
</style>



