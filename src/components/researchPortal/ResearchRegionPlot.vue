<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12">
			<div class="score-plot-bubbles" v-if="dataComparisonConfig != null">
				<span
					v-for="(item, itemIndex) in yAxisFieldItems"
					v-html="item"
					:class="'plot-item-bubble reference bg-color-' + itemIndex"
				></span>
				<span
					v-if="this.plotRenderBy == 'combined'"
					class="plot-item-bubble reference"
					style="background-color: #00000030"
					>Combined</span
				>
				<span
					v-if="yAxisFieldItems.length > 0"
					class="plot-item-bubble reference"
					style="background-color: #ffffff; border: solid 1px #666666"
					@click="showHideSplitPlots()"
					>Show/hide split plots</span
				>
			</div>
			<div class="plot-score-options-ui">
				<label v-if="dataComparisonConfig != null"
					>Render plot by:
					<select
						v-model="plotRenderBy"
						class="score-plot-render-by"
						@change="renderPlot()"
					>
						<option value="combined">Combined</option>
						<option value="high">Highest in row</option>
						<option value="all">All</option>
					</select>
				</label>
			</div>
		</div>
		<div class="col-md-9 region-plot-default-legend"></div>
		<div class="col-md-3 region-plot-default-legend">
			<span
				class="plot-legend-dot"
				style="background-color: #82409970"
			></span>
			<span>Reference variant</span>
			<!--<span
                class="plot-legend-dot"
                style="background-color: #d0363360"
            ></span
            ><span>1 > r2 >= 0.8</span>
            <span
                class="plot-legend-dot"
                style="background-color: #ee982d50"
            ></span
            ><span>0.8 > r2 >= 0.6</span>
            <span
                class="plot-legend-dot"
                style="background-color: #4db05240"
            ></span
            ><span>0.6 > r2 >= 0.4</span>
            <span
                class="plot-legend-dot"
                style="background-color: #32afd530"
            ></span
            ><span>0.4 > r2 >= 0.2</span>
            <span
                class="plot-legend-dot"
                style="background-color: #2074b620"
            ></span
            ><span>0.2 > r2 > 0</span>

            <span
                class="plot-legend-dot"
                style="background-color: #33333320"
            ></span>
            <span>No data</span>-->
		</div>
		<div id="regionPlotWrapper" class="col-md-9">
			<div id="clicked_dot_value" class="clicked-dot-value hidden">
				<div id="clicked_dot_value_content">
					<span
						v-if="hoverDotPosFullList.length > 5"
						class="gene-on-clicked-dot-mplot"
						style="color: #36c; font-weight: bold"
						v-html="
							'Viewing 5 of ' +
							hoverDotPosFullList.length +
							' variants. Click dot to view full list.'
						"
					></span>
					<span
						class="gene-on-clicked-dot-mplot"
						style="color: #36c; font-weight: bold"
						v-html="'Click dot for more options.'"
					></span>
					<template
						v-for="(variant, vIndex) in hoverDotPosFullList"
						v-if="vIndex < 5"
					>
						<span class="gene-on-clicked-dot-mplot">
							<b v-html="variant[renderConfig.renderBy]"></b
						></span>
						<span
							v-if="
								dataComparisonConfig == null ||
								dataComparisonConfig.fieldsToCompare.includes(
									infoKey
								) == false
							"
							class="content-on-clicked-dot"
							v-for="(info, infoKey, infoIndex) in variant"
							v-html="infoKey + ': ' + info"
						>
						</span>
						<span
							v-if="
								dataComparisonConfig != null &&
								dataComparisonConfig.fieldsToCompare.includes(
									infoKey
								) == true
							"
							class="content-on-clicked-dot"
							v-for="(info, infoKey, infoIndex) in variant"
						>
							{{ infoKey }}: <br />
							<span
								class="content-on-clicked-dot-values"
								v-for="(infoItem, infoItemKey) in info"
								v-html="
									infoItemKey + ': ' + infoItem + '<br />'
								"
							></span>
						</span>
					</template>
				</div>
			</div>
			<div id="dot_value_full_list" class="dot-value-full-list hidden">
				<div
					class="clicked-dot-value-close"
					@click="hidePanel('dot_value_full_list')"
				>
					<b-icon icon="x-circle-fill"></b-icon>
				</div>
				<div id="dot_value_full_list_content">
					<template
						v-for="(variant, vIndex) in clickedDotPosFullList"
					>
						<span class="gene-on-clicked-dot-mplot">
							<b v-html="variant[renderConfig.renderBy]"></b
						></span>
						<span
							v-if="
								dataComparisonConfig == null ||
								dataComparisonConfig.fieldsToCompare.includes(
									infoKey
								) == false
							"
							class="content-on-clicked-dot"
							v-for="(info, infoKey) in variant"
							v-html="infoKey + ': ' + info"
						>
						</span>
						<span
							v-if="
								dataComparisonConfig != null &&
								dataComparisonConfig.fieldsToCompare.includes(
									infoKey
								) == true
							"
							class="content-on-clicked-dot"
							v-for="(info, infoKey) in variant"
						>
							{{ infoKey }}: <br />
							<span
								class="content-on-clicked-dot-values"
								v-for="(infoItem, infoItemKey) in info"
								v-html="
									infoItemKey + ': ' + infoItem + '<br />'
								"
							></span>
						</span>

						<!--<span class="set-it-ld-reference"
							><a
								href="javascript:;"
								@click="
									setLDReference(
										variant[renderConfig.renderBy]
									)
								"
								>Set this LD reference</a
							>
						</span>-->
					</template>
				</div>
			</div>
			<div
				v-if="!!renderConfig.legend"
				class="mbm-plot-legend"
				v-html="renderConfig.legend"
			></div>
			<div
				id="splitPlots"
				class="hidden"
				v-if="!!renderConfig && yAxisFieldItems.length > 0"
			>
				<div v-for="(item, itemIndex) in yAxisFieldItems">
					<h6 v-html="item" :class="'text color-' + itemIndex"></h6>
					<canvas
						:id="'splitPlot' + itemIndex"
						@mousemove="
							checkPosition($event, 'splitPlot' + itemIndex)
						"
						@click="getFullList"
						width=""
						height=""
					></canvas>
				</div>
			</div>
			<canvas
				v-if="!!renderConfig"
				id="regionPlot"
				@mousemove="checkPosition($event, 'regionPlot')"
				@resize="onResize"
				@click="getFullList"
				width=""
				height=""
			>
			</canvas>

			<div
				v-if="!!renderConfig.label"
				class="mbm-plot-label"
				v-html="renderConfig.label"
			></div>
		</div>
		<div id="ldPlotWrapper" class="col-md-3">
			<div id="ld_clicked_dot_value" class="ld-clicked-dot-value hidden">
				<div id="ld_clicked_dot_value_content">
					<span
						v-if="hoverLdDotPosFullList.length > 5"
						class="gene-on-clicked-dot-mplot"
						style="color: #36c; font-weight: bold"
						v-html="
							'Viewing 5 of ' +
							hoverLdDotPosFullList.length +
							' variants. Click dot to view full list.'
						"
					></span>
					<span
						class="gene-on-clicked-dot-mplot"
						style="color: #36c; font-weight: bold"
						v-html="'Click dot for more options.'"
					></span>
					<template
						v-for="(hLdVariant, hLdVIndex) in hoverLdDotPosFullList"
						v-if="hLdVIndex < 5"
					>
						<span class="gene-on-clicked-dot-mplot">
							<b v-html="hLdVariant[renderConfig.renderBy]"></b
						></span>
						<span
							v-if="
								dataComparisonConfig == null ||
								dataComparisonConfig.fieldsToCompare.includes(
									hLdVInfoKey
								) == false
							"
							class="content-on-clicked-dot"
							v-for="(hLdVInfo, hLdVInfoKey) in hLdVariant"
							v-html="hLdVInfoKey + ': ' + hLdVInfo"
						>
						</span>
						<span
							v-if="
								dataComparisonConfig != null &&
								dataComparisonConfig.fieldsToCompare.includes(
									hLdVInfoKey
								) == true
							"
							class="content-on-clicked-dot"
							v-for="(hLdVInfo, hLdVInfoKey) in hLdVariant"
						>
							{{ hLdVInfoKey }}: <br />
							<span
								class="content-on-clicked-dot-values"
								v-for="(hLdVItem, hLdVItemKey) in hLdVInfo"
								v-html="
									hLdVItemKey + ': ' + hLdVItem + '<br />'
								"
							></span>
						</span>
					</template>
				</div>
			</div>
			<div
				id="ld_dot_value_full_list"
				class="ld-dot-value-full-list hidden"
			>
				<div
					class="clicked-dot-value-close"
					@click="hidePanel('ld_dot_value_full_list')"
				>
					<b-icon icon="x-circle-fill"></b-icon>
				</div>
				<div id="ld_dot_value_full_list_content">
					<template
						v-for="(ldVariant, ldIndex) in clickedLdDotPosFullList"
					>
						<span class="gene-on-clicked-dot-mplot">
							<b v-html="ldVariant[renderConfig.renderBy]"></b
						></span>
						<span
							v-if="
								dataComparisonConfig == null ||
								dataComparisonConfig.fieldsToCompare.includes(
									ldInfoKey
								) == false
							"
							class="content-on-clicked-dot"
							v-for="(ldInfo, ldInfoKey) in ldVariant"
							v-html="ldInfoKey + ': ' + ldInfo"
						>
						</span>
						<span
							v-if="
								dataComparisonConfig != null &&
								dataComparisonConfig.fieldsToCompare.includes(
									ldInfoKey
								) == true
							"
							class="content-on-clicked-dot"
							v-for="(ldInfo, ldInfoKey) in ldVariant"
						>
							{{ ldInfoKey }}: <br />
							<span
								class="content-on-clicked-dot-values"
								v-for="(ldInfoItem, ldInfoItemKey) in ldInfo"
								v-html="
									ldInfoItemKey + ': ' + ldInfoItem + '<br />'
								"
							></span>
						</span>
						<!--<span class="set-it-ld-reference"
							><a
								href="javascript:;"
								@click="
									setLDReference(
										ldVariant[renderConfig.renderBy]
									)
								"
								>Set this LD Reference</a
							>
						</span>-->
					</template>
				</div>
			</div>
			<div
				id="splitLDPlots"
				class="hidden"
				v-if="!!renderConfig && yAxisFieldItems.length > 0"
			>
				<div v-for="(item, itemIndex) in yAxisFieldItems">
					<h6 v-html="item" :class="'text color-' + itemIndex"></h6>
					<canvas
						:id="'splitLDPlot' + itemIndex"
						@mousemove="
							checkLDPosition($event, 'splitLDPlot' + itemIndex)
						"
						@click="getLDFullList"
						width=""
						height=""
					></canvas>
				</div>
			</div>
			<canvas
				v-if="!!renderConfig"
				id="ldPlot"
				@mousemove="checkLDPosition($event, 'ldPlot')"
				@click="getLDFullList"
				width=""
				height=""
			>
			</canvas>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

import Chi from "chi-squared";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-plot", {
	props: [
		"plotData",
		"renderConfig",
		"searchParameters",
		"dataComparisonConfig",
		"region",
		"plotMargin",
	],
	data() {
		return {
			plotRenderBy: "all",
			plotRendered: 0,
			dotPosData: {},
			ldDotPosData: {},
			hoverDotPosFullList: [],
			hoverLdDotPosFullList: [],
			clickedDotPosFullList: [],
			clickedLdDotPosFullList: [],
			refVariant: null,
			ldColor: [
				"#2074B620",
				"#32AFD520",
				"#4DB05220",
				"#EE982D20",
				"#D0363320",
			],
			compareGroupColors: [
				"#007bff50",
				"#04884550",
				"#8490C850",
				"#BF61A550",
				"#EE312450",
				"#FCD70050",
				"#5555FF50",
				"#7aaa1c50",
				"#9F78AC50",
				"#F8808450",
				"#F5A4C750",
				"#CEE6C150",
				"#cccc0050",
				"#6FC7B650",
				"#D5A76850",
				"#d4d4d450",
			],
			yAxisFieldItems: [],
			ldPopulations: {},
			ldDataCalled: {},
			ancestryOnCall: null,
			ldPosItems: null,
		};
	},
	modules: {
		uiUtils,
		Formatters,
	},
	components: {},
	mounted: function () {
		if (this.renderData != null) {
			this.setRefVariant();
		}
		if (this.renderData != null && this.searchingRegion != null) {
			this.getSignalData();
		}

		window.addEventListener("resize", this.onResize);
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		renderData() {
			if (this.plotData == null) {
				return null;
			} else {
				let rawData = this.plotData;
				let comparingData = [];
				this.yAxisFieldItems = [];

				if (!!this.dataComparisonConfig) {
					for (const [rKey, r] of Object.entries(rawData)) {
						let tempObj = r;

						if (!!this.renderConfig.ifCombineYAxisField) {
							let yAxisFieldArr = [];
							let yAxisField =
								r[this.renderConfig.ifCombineYAxisField.field];

							for (const [yKey, y] of Object.entries(
								yAxisField
							)) {
								this.yAxisFieldItems.push(yKey);
								yAxisFieldArr.push(y);
							}
							let combined;
							switch (
								this.renderConfig.ifCombineYAxisField.type
							) {
								case "chi-square":
									combined = this.chiSquared(yAxisFieldArr);
									break;
								case "average":
									let X = 0;
									let index = 0;
									yAxisFieldArr.map((n) => {
										X += n;
										index++;
									});

									combined = X / index;
									break;
							}

							if (
								!!this.renderConfig.ifCombineYAxisField
									.calculate
							) {
								switch (
									this.renderConfig.ifCombineYAxisField
										.calculate
								) {
									case "-log10":
										tempObj["combined"] =
											-Math.log10(combined);
										break;
								}
							} else {
								tempObj["combined"] = combined;
							}
						}

						comparingData.push(tempObj);
					}

					this.yAxisFieldItems = [...new Set(this.yAxisFieldItems)];

					return comparingData;
				} else {
					return rawData;
				}
			}
		},
		ldVariantCorrelationsData() {
			let contents = this.$store.state.umLdServer.variantCorrelations;

			if (contents == "") {
				return null;
			} else {
				return contents;
			}
		},

		recombinationData() {
			let contents = this.$store.state.umLdServer.recombRate;

			if (contents == "") {
				return null;
			} else {
				return contents;
			}
		},

		searchingRegion() {
			if (this.region == null) {
				return null;
			} else {
				let returnObj = {};

				returnObj["chr"] = this.region.split(":")[0];

				let regionArr = this.region.split(":")[1].split("-");
				returnObj["start"] = regionArr[0];
				returnObj["end"] = regionArr[1];

				return returnObj;
			}
		},
	},
	watch: {
		searchingRegion(DATA) {
			if (DATA != null) {
				this.getSignalData();
			}
		},
		ldVariantCorrelationsData(data) {
			this.checkIfAllDataLoaded();
			let ldData = {};

			if (data.data.correlation.length > 0) {
				data.data.variant2.map((v, index) => {
					ldData[v] = data.data.correlation[index];
				});
			}

			this.ldPopulations[this.ancestryOnCall].ldData = ldData;

			let notLoadedLDScore = 0;
			let refVariant = null;
			let ancester = null;

			for (const [key, item] of Object.entries(this.ldPopulations)) {
				if (item.ldData == null) {
					notLoadedLDScore++;
					this.ancestryOnCall = item.name;
					ancester = item.ancestry;
					refVariant = item.refVariant;
				}
			}

			if (notLoadedLDScore > 0) {
				this.getLDData(refVariant, ancester);
			} else if (
				notLoadedLDScore == 0 &&
				this.recombinationData != null
			) {
				this.renderPlot();
			}
		},
		recombinationData(DATA) {
			if (DATA != null) {
				this.checkIfAllDataLoaded();
			}
		},
		renderData(data) {
			this.checkIfAllDataLoaded();
			this.setRefVariant();
			this.getSignalData();
		},
	},
	methods: {
		...uiUtils,
		checkIfAllDataLoaded() {
			//console.log("check if called");
			//console.log("renderData", Object.keys(this.plotData).length);
			//console.log("recombinationData", this.recombinationData);
			/*console.log(
				"ldVariantCorrelationsData",
				this.ldVariantCorrelationsData
			);*/
		},
		getSignalData() {
			if (this.searchingRegion != null) {
				var signalURL =
					"https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/?filter=id in 15 and chromosome eq '" +
					this.searchingRegion.chr +
					"' and position gt " +
					this.searchingRegion.start +
					" and position lt " +
					this.searchingRegion.end;
				//console.log("signalURL", signalURL);
				this.$store.dispatch("umLdServer/getRecombRate", {
					url: signalURL,
				});
			}
		},
		chiSquared(ARRAY) {
			let X = 0.0;
			let n = ARRAY.length;

			ARRAY.map((p) => {
				X += -2 * Math.log(p);
			});

			let pdf = Chi.pdf(X, 2 * n);
			let returnPdf = 2 * pdf;

			return returnPdf;
		},
		setRefVariant() {
			let DATA = this.renderData;
			let yMax = null;
			let dataGroups = {};
			let populations = [];
			this.ldPopulations = {};

			if (!!DATA && DATA.length > 0) {
				DATA.map((d) => {
					if (
						!!this.dataComparisonConfig &&
						!!this.renderConfig.ldServer.populations_field
					) {
						// case of ancestry value of dynamic
						if (
							this.renderConfig.ldServer.populations_type ==
							"dynamic"
						) {
							for (const [key, ancestry] of Object.entries(
								d[this.renderConfig.ldServer.populations_field]
							)) {
								if (!!dataGroups[key]) {
									dataGroups[key].push(ancestry);
								} else {
									dataGroups[key] = [];
									dataGroups[key].push(ancestry);
								}
							}
						} else if (
							this.renderConfig.ldServer.populations_type ==
							"fixed"
						) {
							for (const [key, ancestry] of Object.entries(
								d[this.renderConfig.ldServer.populations_field]
							)) {
								dataGroups[key] = [];
								dataGroups[key].push(
									this.renderConfig.ldServer.fixed_population
								);
							}
						}
					} else if (
						// fixed data but multiple values in ancesry column
						!this.dataComparisonConfig &&
						!!this.renderConfig.ldServer.populations_field
					) {
						// case of ancestry value of dynamic
						if (
							this.renderConfig.ldServer.populations_type ==
							"dynamic"
						) {
							if (
								d[
									this.renderConfig.ldServer.populations_field
								] != null &&
								d[
									this.renderConfig.ldServer.populations_field
								] != undefined &&
								d[
									this.renderConfig.ldServer.populations_field
								] != ""
							) {
								if (!!dataGroups["default"]) {
									dataGroups["default"].push(
										this.renderConfig.ldServer
											.populations_fixed_ancestry
									);
								} else {
									dataGroups["default"] = [];
									dataGroups["default"].push(
										this.renderConfig.ldServer
											.populations_fixed_ancestry
									);
								}
							}
						} else if (
							this.renderConfig.ldServer.populations_type ==
							"fixed"
						) {
							dataGroups["default"] = [];
							dataGroups["default"].push(
								d[this.renderConfig.ldServer.populations_field]
							);
						}
					}
				});

				for (const [dataGroupKey, dataGroupAncestry] of Object.entries(
					dataGroups
				)) {
					dataGroups[dataGroupKey] = [...new Set(dataGroupAncestry)];
				}

				for (const [dataGroupKey, dataGroupAncestry] of Object.entries(
					dataGroups
				)) {
					let tempObj = {};
					tempObj["ancestry"] =
						this.renderConfig.ldServer.populations[
							dataGroupAncestry[0]
						];
					tempObj["id"] = dataGroupKey;
					tempObj["name"] = dataGroupKey;
					tempObj["high"] = null;
					tempObj["refVariant"] = null;
					tempObj["ldData"] = null;
					this.ldPopulations[dataGroupKey] = tempObj;
				}

				let yValue;
				DATA.map((d) => {
					if (!!this.dataComparisonConfig) {
						Object.keys(dataGroups).map((p) => {
							yValue = Number(d[this.renderConfig.yAxisField][p]);

							if (this.ldPopulations[p].high == null) {
								this.ldPopulations[p].high = yValue;
								this.ldPopulations[p].refVariant =
									d[
										this.renderConfig.ldServer.ref_variant_field
									];

								this.ldPopulations[p].high = yValue;
							}
							if (yValue > this.ldPopulations[p].high) {
								this.ldPopulations[p].refVariant =
									d[
										this.renderConfig.ldServer.ref_variant_field
									];

								this.ldPopulations[p].high = yValue;
							}
						});
					}
				});

				if (!!this.dataComparisonConfig) {
					let searchItem = Object.keys(this.ldPopulations)[0];

					this.ancestryOnCall = this.ldPopulations[searchItem].name;

					this.setLDReference(
						true,
						this.ldPopulations[searchItem].refVariant,
						this.ldPopulations[searchItem].ancestry
					);
				}
			}
		},
		setLDReference(DATA_COMPARE, VARIANT, ANCESTRY_ID) {
			this.hidePanel("ld_dot_value_full_list");
			this.hidePanel("dot_value_full_list");

			if (DATA_COMPARE == true) {
				//make the first LD score call

				this.getLDData(VARIANT, ANCESTRY_ID);
			}
		},

		showHideSplitPlots() {
			uiUtils.showHideElement("splitPlots");
			uiUtils.showHideElement("splitLDPlots");
		},

		hidePanel(element) {
			uiUtils.hideElement(element);
		},
		onResize(e) {
			this.renderPlot();
		},
		getLDData(REF_VARIANT, ANCESTRY) {
			let ldUrl =
				"https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations/" +
				ANCESTRY +
				"/variants?correlation=rsquare&variant=" +
				REF_VARIANT +
				"&chrom=" +
				this.searchingRegion.chr +
				"&start=" +
				this.searchingRegion.start +
				"&stop=" +
				this.searchingRegion.end +
				"&limit=100000";

			this.$store.dispatch("umLdServer/getVariantCorrelations", {
				ldUrl: ldUrl,
			});
		},

		getFullList(event) {
			this.clickedDotPosFullList = [];
			let wrapper = document.getElementById("dot_value_full_list");
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.dotPosData[x + h] != undefined) {
						if (this.dotPosData[x + h][y + v] != undefined) {
							let dotObject = this.dotPosData[x + h][y + v];
							this.clickedDotPosFullList.push(dotObject);
						}
					}
				}
			}

			if (this.clickedDotPosFullList.length > 0) {
				document.getElementById("regionPlot").classList.add("hover");
				document
					.getElementById("clicked_dot_value")
					.classList.add("hidden");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("regionPlot").classList.remove("hover");
			}
		},
		getLDFullList(event) {
			this.clickedLdDotPosFullList = [];
			let wrapper = document.getElementById("ld_dot_value_full_list");
			//let canvas = document.getElementById("ldPlot");
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.ldDotPosData[x + h] != undefined) {
						if (this.ldDotPosData[x + h][y + v] != undefined) {
							let dotObject = this.ldDotPosData[x + h][y + v];
							this.clickedLdDotPosFullList.push(dotObject);
						}
					}
				}
			}

			if (this.clickedLdDotPosFullList.length > 0) {
				document.getElementById("ldPlot").classList.add("hover");
				document
					.getElementById("ld_clicked_dot_value")
					.classList.add("hidden");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("ldPlot").classList.remove("hover");
			}
		},

		checkPosition(event, PLOT_ID) {
			this.hoverDotPosFullList = [];
			let wrapper = document.getElementById("clicked_dot_value");
			let canvas = document.getElementById(PLOT_ID);
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);
			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left =
				x + canvas.offsetLeft + 150 > canvas.width
					? x + canvas.offsetLeft + -215 + "px"
					: x + canvas.offsetLeft + 15 + "px";
			wrapper.style.width =
				x + canvas.offsetLeft + 150 > canvas.width ? "200px" : "auto";

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.dotPosData[x + h] != undefined) {
						if (this.dotPosData[x + h][y + v] != undefined) {
							let dotObject = this.dotPosData[x + h][y + v];
							this.hoverDotPosFullList.push(dotObject);
						}
					}
				}
			}

			if (this.hoverDotPosFullList.length > 0) {
				document.getElementById("regionPlot").classList.add("hover");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("regionPlot").classList.remove("hover");
			}
		},
		checkLDPosition(event, PLOT_ID) {
			this.hoverLdDotPosFullList = [];
			let wrapper = document.getElementById("ld_clicked_dot_value");
			let canvas = document.getElementById(PLOT_ID);
			wrapper.classList.remove("hidden");
			let e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);
			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left =
				x + canvas.offsetLeft + 150 > canvas.width
					? x + canvas.offsetLeft + -215 + "px"
					: x + canvas.offsetLeft + 15 + "px";
			wrapper.style.width =
				x + canvas.offsetLeft + 150 > canvas.width ? "200px" : "auto";

			let numOfValues = 0;

			for (let h = -5; h <= 5; h++) {
				for (let v = -5; v <= 5; v++) {
					if (this.ldDotPosData[x + h] != undefined) {
						if (this.ldDotPosData[x + h][y + v] != undefined) {
							let dotObject = this.ldDotPosData[x + h][y + v];
							this.hoverLdDotPosFullList.push(dotObject);
						}
					}
				}
			}

			if (this.hoverLdDotPosFullList.length > 0) {
				document.getElementById("ldPlot").classList.add("hover");
			} else {
				wrapper.classList.add("hidden");
				document.getElementById("ldPlot").classList.remove("hover");
			}
		},
		renderSplitPlots() {
			let canvasRenderWidth = document
				.getElementById("regionPlot")
				.getAttribute("width");

			let canvasRenderHeight = !!this.renderConfig.height
				? this.renderConfig.height +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin
				: 300 +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin;

			let plotWidth = canvasRenderWidth - this.plotMargin.leftMargin * 2;

			let plotHeight = !!this.renderConfig.height
				? this.renderConfig.height
				: 300;

			this.yAxisFieldItems.map((item, itemIndex) => {
				let c = document.getElementById("splitPlot" + itemIndex);
				c.setAttribute("width", canvasRenderWidth);
				c.setAttribute("height", canvasRenderHeight);
				let ctx = c.getContext("2d");

				ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

				let yMin = null,
					yMax = null,
					xMin = Number(this.searchingRegion.start),
					xMax = Number(this.searchingRegion.end);

				this.renderData.map((d) => {
					let highNum = null;
					let lowNum = null;
					this.yAxisFieldItems.map((i) => {
						if (highNum == null) {
							highNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] > highNum) {
								highNum = d[this.renderConfig.yAxisField][i];
							}
						}

						if (lowNum == null) {
							lowNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] < lowNum) {
								lowNum = d[this.renderConfig.yAxisField][i];
							}
						}
					});

					if (yMin == null) {
						yMin = lowNum;
					}
					if (yMax == null) {
						yMax = highNum;
					}

					if (lowNum < yMin) {
						yMin = lowNum;
					}
					if (highNum > yMax) {
						yMax = highNum;
					}
				});

				this.renderAxis(
					ctx,
					plotWidth,
					plotHeight,
					xMin,
					xMax,
					yMin,
					yMax,
					"asso"
				);

				this.renderRecombRate(ctx, plotWidth, plotHeight, xMin, xMax);

				let xStart = this.plotMargin.leftMargin + 5;
				let yStart = this.plotMargin.topMargin;
				let xPosByPixel = (plotWidth - 5) / (xMax - xMin);
				let yPosByPixel = plotHeight / (yMax - yMin);

				let dotColor; //this.getColorIndex(item);

				//console.log("item", item);
				//console.log("this.ldPosItems", this.ldPopulations[item].ldData);
				this.renderData.map((g) => {
					let varID = g[this.renderConfig.renderBy];

					/*console.log(
						item +
							" " +
							g[this.renderConfig.renderBy] +
							" ld score:",
						this.ldPopulations[item].ldData[varID]
					);*/

					if (this.ldPopulations[item].ldData[varID] != undefined) {
						dotColor = this.getColorIndex(item);
					} else {
						dotColor = "#00000030";
					}
					let xPos =
						xStart +
						xPosByPixel * (g[this.renderConfig.xAxisField] - xMin);

					let yPos;

					if (!!g[this.renderConfig.yAxisField][item]) {
						yPos =
							yStart +
							plotHeight -
							yPosByPixel *
								(g[this.renderConfig.yAxisField][item] - yMin);

						ctx.fillStyle = dotColor;

						this.renderDot(ctx, xPos, yPos, dotColor);
					}
				});
			});
		},

		renderAxis(CTX, plotWidth, plotHeight, xMin, xMax, yMin, yMax, TYPE) {
			let bump = 5.5;
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(
				this.plotMargin.leftMargin - bump,
				this.plotMargin.topMargin
			);
			CTX.lineTo(
				this.plotMargin.leftMargin - bump,
				plotHeight + this.plotMargin.topMargin + bump
			);
			CTX.stroke();

			// render recombination Rate y axis
			if (TYPE == "asso") {
				CTX.moveTo(
					this.plotMargin.leftMargin + plotWidth + bump,
					this.plotMargin.topMargin
				);
				CTX.lineTo(
					this.plotMargin.leftMargin + plotWidth + bump,
					plotHeight + this.plotMargin.topMargin + bump
				);

				CTX.stroke();
			}

			//render x axis
			CTX.moveTo(
				this.plotMargin.leftMargin - bump,
				plotHeight + this.plotMargin.topMargin + bump
			);
			CTX.lineTo(
				TYPE == "asso"
					? plotWidth + this.plotMargin.leftMargin + bump
					: plotWidth + this.plotMargin.leftMargin,
				plotHeight + this.plotMargin.topMargin + bump
			);
			CTX.stroke();

			// Y ticks
			let yStep = (yMax - yMin) / 5;
			let yTickDistance = plotHeight / 5;
			for (let i = 0; i < 6; i++) {
				let tickYPos = this.plotMargin.topMargin + i * yTickDistance;
				let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(this.plotMargin.leftMargin - bump * 2, adjTickYPos);
				CTX.lineTo(this.plotMargin.leftMargin - bump, adjTickYPos);
				CTX.stroke();

				CTX.font = "12px Arial";
				CTX.textAlign = "right";
				CTX.fillStyle = "#000000";

				CTX.fillText(
					Formatters.floatFormatter(yMin + i * yStep),
					this.plotMargin.leftMargin - bump * 3,
					this.plotMargin.topMargin +
						plotHeight +
						bump -
						i * yTickDistance
				);
			}

			// render recombination Rate y ticks
			if (TYPE == "asso") {
				let yStep = 20;
				let yTickDistance = plotHeight / 5;
				let recombYMin = 0;
				for (let i = 0; i < 6; i++) {
					let tickYPos =
						this.plotMargin.topMargin + i * yTickDistance;
					let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
					CTX.moveTo(
						this.plotMargin.leftMargin + plotWidth + bump,
						adjTickYPos
					);
					CTX.lineTo(
						this.plotMargin.leftMargin + plotWidth + bump * 2,
						adjTickYPos
					);
					CTX.stroke();

					CTX.font = "12px Arial";
					CTX.textAlign = "left";
					CTX.fillStyle = "#000000";

					CTX.fillText(
						recombYMin + i * yStep,
						this.plotMargin.leftMargin + plotWidth + bump * 3,
						this.plotMargin.topMargin +
							plotHeight +
							5 -
							i * yTickDistance
					);
				}
			}

			// X ticks
			let xStep = TYPE == "asso" ? Math.ceil((xMax - xMin) / 5) : 0.2;
			let xTickDistance = plotWidth / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(
					adjTickXPos,
					this.plotMargin.topMargin + plotHeight + bump
				);
				CTX.lineTo(
					adjTickXPos,
					this.plotMargin.topMargin + plotHeight + bump * 2
				);
				CTX.stroke();

				CTX.font = "12px Arial";
				CTX.textAlign = "center";
				CTX.fillStyle = "#000000";
				let positionLabel =
					TYPE == "asso"
						? i < 5
							? xMin + i * xStep
							: xMax
						: i < 5
						? i == 0
							? 0
							: (xMin + i * xStep).toFixed(1)
						: xMax;
				CTX.fillText(
					positionLabel,
					adjTickXPos,
					this.plotMargin.topMargin + plotHeight + bump * 4
				);
			}

			//Render y axis label
			CTX.font = "12px Arial";
			CTX.textAlign = "center";
			CTX.fillStyle = "#000000";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				this.renderConfig.yAxisLabel,
				-(this.plotMargin.topMargin + plotHeight / 2),
				bump + 12
			);

			//Render recombination rate y axis label
			if (TYPE == "asso") {
				CTX.fillText(
					"Recombination Rate (cM/Mb)",
					-(this.plotMargin.topMargin + plotHeight / 2),
					this.plotMargin.leftMargin * 2 + plotWidth - (bump + 12)
				);
			}

			//Render x axis label
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.fillText(
				TYPE == "LD" ? "LD(r2)" : this.renderConfig.xAxisLabel,
				plotWidth / 2 + this.plotMargin.leftMargin,
				this.plotMargin.topMargin +
					this.plotMargin.bottomMargin +
					plotHeight -
					12
			);
		},
		renderRecombRate(CTX, PWIDTH, PHEIGHT, START, END) {
			//console.log("recomb data", this.recombinationData);
			var DATA = this.recombinationData["data"];
			var xPixel = (PWIDTH - 10) / (END - START);
			var yPixel = (PHEIGHT - 5) / 100;
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#007BFF";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			DATA.position.map((xPos, xPosIndex) => {
				let x1PosPixel = (xPos - START) * xPixel;
				let y1PosPixel = DATA.recomb_rate[xPosIndex] * yPixel;
				let x2PosPixel =
					(DATA.position[xPosIndex + 1] - START) * xPixel;
				let y2PosPixel = DATA.recomb_rate[xPosIndex + 1] * yPixel;

				CTX.moveTo(
					this.plotMargin.leftMargin + 5 + x1PosPixel,
					this.plotMargin.topMargin + PHEIGHT - y1PosPixel
				);
				CTX.lineTo(
					this.plotMargin.leftMargin + 5 + x2PosPixel,
					this.plotMargin.topMargin + PHEIGHT - y2PosPixel
				);
				CTX.stroke();
			});
		},
		renderPlot() {
			this.dotPosData = {};

			let wrapper = document.getElementById("clicked_dot_value");
			wrapper.classList.add("hidden");

			let canvasRenderWidth = !!this.renderConfig.width
				? this.renderConfig.width +
				  this.plotMargin.leftMargin +
				  this.plotMargin.rightMargin
				: document.getElementById("regionPlotWrapper").clientWidth - 30; // -30 for - padding

			let canvasRenderHeight = !!this.renderConfig.height
				? this.renderConfig.height +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin
				: 300 +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin;

			let plotWidth = canvasRenderWidth - this.plotMargin.leftMargin * 2;

			let plotHeight = !!this.renderConfig.height
				? this.renderConfig.height
				: 300;
			/////

			let c = document.getElementById("regionPlot");
			c.setAttribute("width", canvasRenderWidth);
			c.setAttribute("height", canvasRenderHeight);
			let ctx = c.getContext("2d");

			ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

			// render x & y ticker values

			let yMin = null,
				yMax = null,
				xMin = Number(this.searchingRegion.start),
				xMax = Number(this.searchingRegion.end);

			this.renderData.map((d) => {
				let yValue;
				if (!!this.dataComparisonConfig) {
					let highNum = null;
					let lowNum = null;
					this.yAxisFieldItems.map((i) => {
						if (highNum == null) {
							highNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] > highNum) {
								highNum = d[this.renderConfig.yAxisField][i];
							}
						}

						if (lowNum == null) {
							lowNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] < lowNum) {
								lowNum = d[this.renderConfig.yAxisField][i];
							}
						}
					});

					if (yMin == null) {
						yMin = lowNum;
					}
					if (yMax == null) {
						yMax = highNum;
					}

					if (lowNum < yMin) {
						yMin = lowNum;
					}
					if (highNum > yMax) {
						yMax = highNum;
					}
					//}
				} else {
					yValue = d[this.renderConfig.yAxisField];

					if (yMin == null) {
						yMin = yValue;
					}
					if (yMax == null) {
						yMax = yValue;
					}

					if (yValue < yMin) {
						yMin = yValue;
					}
					if (yValue > yMax) {
						yMax = yValue;
					}
				}
			});

			this.renderAxis(
				ctx,
				plotWidth,
				plotHeight,
				xMin,
				xMax,
				yMin,
				yMax,
				"asso"
			);

			this.renderRecombRate(ctx, plotWidth, plotHeight, xMin, xMax);

			let xStart = this.plotMargin.leftMargin + 5;
			let yStart = this.plotMargin.topMargin;
			let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

			let yPosByPixel = plotHeight / (yMax - yMin);

			//Render dots
			let ldConfig = this.renderConfig.ldServer;
			let dotColor;

			this.renderData.map((g) => {
				let xPos =
					xStart +
					xPosByPixel * (g[this.renderConfig.xAxisField] - xMin);

				let yPos;
				if (!!this.dataComparisonConfig) {
					if (this.plotRenderBy == "combined") {
						yPos =
							yStart +
							plotHeight -
							yPosByPixel * (g["combined"] - yMin);

						let values = Object.keys(
							g[this.renderConfig.yAxisField]
						);

						if (
							values.length == 1 &&
							this.yAxisFieldItems.length == 1
						) {
							dotColor = this.getColorIndex(values[0]);
						} else if (
							values.length == 1 &&
							this.yAxisFieldItems.length > 1
						) {
							dotColor = this.getColorIndex(values[0]);
						} else if (
							values.length == this.yAxisFieldItems.length &&
							this.yAxisFieldItems.length > 1
						) {
							dotColor = "#33333340";
						}

						this.renderDot(ctx, xPos, yPos, dotColor);

						let xLoc = xPos.toString().split(".")[0];
						let yLoc = yPos.toString().split(".")[0];
						this.feedHoverContent(
							xLoc,
							yLoc,
							g[this.renderConfig.renderBy],
							g,
							this.dotPosData
						);
					} else if (this.plotRenderBy == "high") {
						let highValue = null;
						let highItem;

						this.yAxisFieldItems.map((i) => {
							if (highValue == null) {
								highValue = g[this.renderConfig.yAxisField][i];
								highItem = i;
							} else {
								if (
									g[this.renderConfig.yAxisField][i] >
									highValue
								) {
									highValue =
										g[this.renderConfig.yAxisField][i];
									highItem = i;
								}
							}
						});
						yPos =
							yStart +
							plotHeight -
							yPosByPixel *
								(g[this.renderConfig.yAxisField][highItem] -
									yMin);

						dotColor =
							dotColor == "#82409970"
								? dotColor
								: this.getColorIndex(highItem);

						this.renderDot(ctx, xPos, yPos, dotColor);
						let xLoc = xPos.toString().split(".")[0];
						let yLoc = yPos.toString().split(".")[0];
						this.feedHoverContent(
							xLoc,
							yLoc,
							g[this.renderConfig.renderBy],
							g,
							this.dotPosData
						);
					} else if (this.plotRenderBy == "all") {
						let yPosArr = [];
						let yPosObj = {};

						this.yAxisFieldItems.map((i) => {
							let yPos =
								yStart +
								plotHeight -
								yPosByPixel *
									(g[this.renderConfig.yAxisField][i] - yMin);

							yPosObj[i] = yPos;
							yPosArr.push(yPos);
						});

						for (const [yKey, y] of Object.entries(yPosObj)) {
							dotColor =
								dotColor == "#82409970"
									? dotColor
									: this.getColorIndex(yKey);
							this.renderDot(ctx, xPos, y, dotColor);

							let xLoc = xPos.toString().split(".")[0];
							let yLoc = y.toString().split(".")[0];
							this.feedHoverContent(
								xLoc,
								yLoc,
								g[this.renderConfig.renderBy],
								g,
								this.dotPosData
							);
						}
						if (yPosArr.length > 1) {
							yPosArr.sort(function (a, b) {
								return a - b;
							});

							ctx.beginPath();
							ctx.lineWidth = 1;
							ctx.strokeStyle = "#00000070";
							ctx.moveTo(xPos, yPosArr[0]);
							ctx.lineTo(xPos, yPosArr[yPosArr.length - 1]);
							ctx.stroke();
						}
					}
				} else {
					yPos =
						yStart +
						plotHeight -
						yPosByPixel * (g[this.renderConfig.yAxisField] - yMin);

					this.renderDot(ctx, xPos, yPos, dotColor);

					let xLoc = xPos.toString().split(".")[0];
					let yLoc = yPos.toString().split(".")[0];
					this.feedHoverContent(
						xLoc,
						yLoc,
						g[this.renderConfig.renderBy],
						g,
						this.dotPosData
					);
				}
			});

			//if (this.yAxisFieldItems.length > 1) {
			this.renderSplitPlots();
			//}

			this.renderLDPlot(canvasRenderHeight, plotHeight);
		},
		renderLDPlot(canvasH, plotH) {
			this.ldDotPosData = {};

			let canvasRenderWidth =
				document.getElementById("ldPlotWrapper").clientWidth - 30; // -30 for - padding

			let canvasRenderHeight = canvasH;

			let plotWidth =
				canvasRenderWidth -
				(this.plotMargin.leftMargin + this.plotMargin.rightMargin);

			let plotHeight = plotH;

			let c = document.getElementById("ldPlot");
			c.setAttribute("width", canvasRenderWidth);
			c.setAttribute("height", canvasRenderHeight);
			let ctx = c.getContext("2d");

			ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

			// render x & y ticker values

			let yMin = null,
				yMax = null,
				xMin = 0,
				xMax = 1;

			this.renderData.map((d) => {
				let yValue;
				if (!!this.dataComparisonConfig) {
					let highNum = null;
					let lowNum = null;
					this.yAxisFieldItems.map((i) => {
						if (highNum == null) {
							highNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] > highNum) {
								highNum = d[this.renderConfig.yAxisField][i];
							}
						}

						if (lowNum == null) {
							lowNum = d[this.renderConfig.yAxisField][i];
						} else {
							if (d[this.renderConfig.yAxisField][i] < lowNum) {
								lowNum = d[this.renderConfig.yAxisField][i];
							}
						}
					});

					if (yMin == null) {
						yMin = lowNum;
					}
					if (yMax == null) {
						yMax = highNum;
					}

					if (lowNum < yMin) {
						yMin = lowNum;
					}
					if (highNum > yMax) {
						yMax = highNum;
					}
					//}
				} else {
					yValue = d[this.renderConfig.yAxisField];
					if (yMin == null) {
						yMin = yValue;
					}
					if (yMax == null) {
						yMax = yValue;
					}

					if (yValue < yMin) {
						yMin = yValue;
					}
					if (yValue > yMax) {
						yMax = yValue;
					}
				}
			});

			let yStep = (yMax - yMin) / 4;

			// X BG
			let xBGDistance = (plotWidth - 5) / 5;

			for (let i = 0; i < 5; i++) {
				let bgXPos = this.plotMargin.leftMargin + i * xBGDistance + 5;
				let adBGXPos = Math.floor(bgXPos) + 0.5;
				ctx.fillStyle = this.ldColor[i];
				ctx.fillRect(
					adBGXPos,
					this.plotMargin.topMargin,
					xBGDistance - 1,
					plotHeight
				);
			}

			this.renderAxis(
				ctx,
				plotWidth,
				plotHeight,
				xMin,
				xMax,
				yMin,
				yMax,
				"LD"
			);

			let xStart = this.plotMargin.leftMargin + 5;
			let yStart = this.plotMargin.topMargin;
			let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

			let yPosByPixel = plotHeight / (yMax - yMin);

			//Render dots
			let ldConfig = this.renderConfig.ldServer;
			let dotColor = "#33333340";

			let ldGroups = Object.keys(this.ldPopulations);
			let posItems = {};
			ldGroups.map((ldG) => {
				let LDData = this.ldPopulations[ldG].ldData;
				let refVariant = this.ldPopulations[ldG].refVariant;
				this.renderData.map((g) => {
					if (
						g[this.renderConfig.yAxisField][ldG] != null &&
						g[this.renderConfig.yAxisField][ldG] != undefined
					) {
						let dotID = g[ldConfig.ref_variant_field];

						let ldScore = !!LDData[dotID]
							? LDData[dotID]
							: dotID == refVariant
							? 1
							: 0;

						dotColor =
							ldScore == 1
								? "#82409970"
								: this.getColorIndex(ldG);

						let xPos = xStart + xPosByPixel * ldScore;
						let yPos =
							yStart +
							plotHeight -
							yPosByPixel *
								(g[this.renderConfig.yAxisField][ldG] - yMin);

						if (
							posItems[dotID] == null &&
							posItems[dotID] == undefined
						) {
							posItems[dotID] = {};
						}

						posItems[dotID][ldG] = {};

						posItems[dotID][ldG]["xPos"] = xPos;
						posItems[dotID][ldG]["yPos"] = yPos;

						this.renderDot(ctx, xPos, yPos, dotColor);

						let xLoc = xPos.toString().split(".")[0];
						let yLoc = yPos.toString().split(".")[0];
						this.feedHoverContent(
							xLoc,
							yLoc,
							g[this.renderConfig.renderBy],
							g,
							this.ldDotPosData
						);
					}
				});
			});

			this.ldPosItems = posItems;

			for (const [id, posItem] of Object.entries(posItems)) {
				if (Object.keys(posItem).length > 1) {
					let posItemArr = [];

					for (const [aKey, aItem] of Object.entries(posItem)) {
						posItemArr.push(aItem);
					}

					posItemArr.map((s, sIndex) => {
						if (sIndex < posItemArr.length - 1) {
							ctx.beginPath();
							ctx.lineWidth = 1;
							ctx.strokeStyle = "#00000070";
							ctx.moveTo(s.xPos, s.yPos);
							ctx.lineTo(
								posItemArr[sIndex + 1]["xPos"],
								posItemArr[sIndex + 1]["yPos"]
							);
							ctx.stroke();
						}
					});
				}
			}

			//if (this.yAxisFieldItems.length > 1) {
			this.renderSplitLDPlots();
			//}
		},
		renderSplitLDPlots() {
			let canvasRenderWidth = document
				.getElementById("ldPlot")
				.getAttribute("width");

			let canvasRenderHeight = !!this.renderConfig.height
				? this.renderConfig.height +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin
				: 300 +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin;

			let plotWidth =
				canvasRenderWidth -
				(this.plotMargin.leftMargin + this.plotMargin.rightMargin);

			let plotHeight = !!this.renderConfig.height
				? this.renderConfig.height
				: 300;

			this.yAxisFieldItems.map((item, itemIndex) => {
				let c = document.getElementById("splitLDPlot" + itemIndex);
				c.setAttribute("width", canvasRenderWidth);
				c.setAttribute("height", canvasRenderHeight);
				let ctx = c.getContext("2d");

				ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

				let yMin = null,
					yMax = null,
					xMin = 0,
					xMax = 1;

				//let chr = this.searchingRegion.chr;

				this.renderData.map((d) => {
					let yValue;
					if (!!this.dataComparisonConfig) {
						let highNum = null;
						let lowNum = null;
						this.yAxisFieldItems.map((i) => {
							if (highNum == null) {
								highNum = d[this.renderConfig.yAxisField][i];
							} else {
								if (
									d[this.renderConfig.yAxisField][i] > highNum
								) {
									highNum =
										d[this.renderConfig.yAxisField][i];
								}
							}

							if (lowNum == null) {
								lowNum = d[this.renderConfig.yAxisField][i];
							} else {
								if (
									d[this.renderConfig.yAxisField][i] < lowNum
								) {
									lowNum = d[this.renderConfig.yAxisField][i];
								}
							}
						});

						if (yMin == null) {
							yMin = lowNum;
						}
						if (yMax == null) {
							yMax = highNum;
						}

						if (lowNum < yMin) {
							yMin = lowNum;
						}
						if (highNum > yMax) {
							yMax = highNum;
						}
						//}
					} else {
						yValue = d[this.renderConfig.yAxisField];
						if (yMin == null) {
							yMin = yValue;
						}
						if (yMax == null) {
							yMax = yValue;
						}

						if (yValue < yMin) {
							yMin = yValue;
						}
						if (yValue > yMax) {
							yMax = yValue;
						}
					}
				});

				let yStep = (yMax - yMin) / 4;

				// X BG
				let xBGDistance = (plotWidth - 5) / 5;

				for (let i = 0; i < 5; i++) {
					let bgXPos =
						this.plotMargin.leftMargin + i * xBGDistance + 5;
					let adBGXPos = Math.floor(bgXPos) + 0.5;
					ctx.fillStyle = this.ldColor[i];
					ctx.fillRect(
						adBGXPos,
						this.plotMargin.topMargin,
						xBGDistance - 1,
						plotHeight
					);
				}

				this.renderAxis(
					ctx,
					plotWidth,
					plotHeight,
					xMin,
					xMax,
					yMin,
					yMax,
					"LD"
				);

				for (const [posItemKey, posItem] of Object.entries(
					this.ldPosItems
				)) {
					if (!!posItem[item]) {
						let xPos = posItem[item].xPos;
						let yPos = posItem[item].yPos;
						let dotColor = "#00000030"; //this.getColorIndex(item);

						this.renderDot(ctx, xPos, yPos, dotColor);
					}
				}
			});
		},
		getColorIndex(SKEY) {
			let colorIndex = "";

			this.yAxisFieldItems.map((sValue, sIndex) => {
				if (SKEY == sValue) {
					colorIndex = this.compareGroupColors[sIndex];
				}
			});

			return colorIndex;
		},
		renderDot(CTX, XPOS, YPOS, DOT_COLOR) {
			CTX.fillStyle = DOT_COLOR;

			CTX.lineWidth = 0;
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);
			CTX.fill();
		},
		feedHoverContent(xLoc, yLoc, ID, CONTENT) {
			let hoverContent;

			if (!!this.renderConfig.hoverContent) {
				hoverContent = this.renderConfig.hoverContent;
			}

			if (!this.dotPosData[xLoc]) {
				this.dotPosData[xLoc] = {};
			}
			this.dotPosData[xLoc][yLoc] = {};
			this.dotPosData[xLoc][yLoc][this.renderConfig.renderBy] = ID;
			if (!!this.renderConfig.hoverContent) {
				hoverContent.map((h) => {
					this.dotPosData[xLoc][yLoc][h] = CONTENT[h];
				});
			}
		},

		feedHoverContent(xLoc, yLoc, ID, CONTENT, POS_DATA) {
			let hoverContent;

			if (!!this.renderConfig.hoverContent) {
				hoverContent = this.renderConfig.hoverContent;
			}
			//this.ldDotPosData
			if (!POS_DATA[xLoc]) {
				POS_DATA[xLoc] = {};
			}
			POS_DATA[xLoc][yLoc] = {};
			POS_DATA[xLoc][yLoc][this.renderConfig.renderBy] = ID;
			if (!!this.renderConfig.hoverContent) {
				hoverContent.map((h) => {
					POS_DATA[xLoc][yLoc][h] = CONTENT[h];
				});
			}
		},
	},
});

$(function () {});
</script>

<style>
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
#regionPlot.hover,
#ldPlot.hover {
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

.clicked-dot-value-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}

.clicked-dot-value-close:hover {
	color: #36c;
}

.dot-value-full-list,
.ld-dot-value-full-list {
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

#dot_value_full_list_content,
#ld_dot_value_full_list_content {
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	overflow-y: auto;
	font-size: 14px;
}

.content-on-clicked-dot-values {
	padding-left: 10px;
}
</style>



