<template>
	<div
		class="mbm-plot-content row"
		
	>
		<div class="col-md-12 CS-plot-wrapper">
			<div class="col-md-12">
				<div id="CSUIWrapper">
					<span>
						<strong
							>Filter associated variants by credible set
							membership to view the set(s) of fine-mapped
							variants most likely to include the causal variant
							for this locus.</strong
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
										margin-right: 8px;
									"
								>
									Select Credible Sets
								</div>
								<select
									class="custom-select"
									@change="getCS($event)"
								>
									<option value="">
										{{ "Select credible set" }}
									</option>
									<option
										v-for="credibleSet in credibleSets"
										:key="
											credibleSet.credibleSetId +
											',' +
											credibleSet.phenotype
										"
										v-html="
											renderConfig[
												'credible sets server'
											] == 'KP BioIndex'
												? credibleSet.credibleSetId +
												  ' (Method:' +
												  credibleSet.method +
												  ', PMID:' +
												  credibleSet.pmid +
												  ')'
												: credibleSet.credibleSetId +
												  '(' +
												  credibleSet.phenotype +
												  ', ' +
												  credibleSet.dataset +
												  ')'
										"
										:value="
											credibleSet.credibleSetId +
											',' +
											credibleSet.phenotype
										"
									></option>
								</select>
							</div>
						</div>
						<div
							class=""
							style="position: absolute; right: 10px; top: 7px"
						>
							<template v-for="c in credibleSets">
								<span
									:id="
										getBubbleId(
											c.credibleSetId,
											c.phenotype
										)
									"
									v-if="
										pkgDataSelected
											.filter(
												(s) => s.type == 'Credible Set'
											)
											.map((s) => s.id)
											.indexOf(c.credibleSetId) > -1
									"
									class="CS-bubble"
									v-html="
										c.credibleSetId +
										', ' +
										c.phenotype +
										' &nbsp;<span class=\'remove\'>X</span>'
									"
									:style="
										'background-color:' +
										getColorIndex(
											c.credibleSetId + ', ' + c.phenotype
										) +
										';'
									"
									:key="c.credibleSetId + ', ' + c.phenotype"
									@click="
										removeCSData(
											c.credibleSetId,
											c.phenotype
										)
									"
								></span>
							</template>
						</div>
					</div>
				</div>
			</div>
			<div
				class="col-md-9"
				id="CSPlotWrapper"
				style="display: inline-block"
			>
				<div id="CSInfoBox" class="hidden">
					<div
						class="fixed-info-box-close"
						@click="showHidePanel('#CSInfoBox', 'closeBtn')"
					>
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<div class="info-box-content" id="CSInfoBoxContent"></div>
				</div>
				<canvas
					id="CSPlot"
					:class="
						Object.keys(CSData).length > 0
							? 'CS-plot'
							: 'CS-empty-plot'
					"
					width=""
					height=""
					@mousemove="checkCSPosition($event)"
					@mouseout="onMouseOut('CSInfoBox')"
					@click="showHidePanel('#CSInfoBox')"
				></canvas>
				<div
					id="CSInitialMessage"
					v-if="
						pkgDataSelected
							.filter((s) => s.type == 'Credible Set')
							.map((s) => s.id).length != 0 &&
						credibleSets.length == 0
					"
					v-html="'There is no available credible set.'"
				></div>
			</div>

			<div class="col-md-3" style="display: inline-block"></div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import queryString from "query-string";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("giant-credible-sets-plot", {
	props: [
		"region",
		"phenotype",
		"renderConfig",
		"compareGroupColors",
		"plotMargin",
		"dataComparison",
		"pkgData",
		"pkgDataSelected",
		"regionZoom",
		"regionViewArea",
		"utils"
	],
	data() {
		return {
			credibleSets: [],
			CSData: {},
			CSPosData: {},
			spaceBy: 14,
			test: null,
            searchingAncestry: null,
            searchingPhenotype: null,
            searchingRegion: null,
			urlSearch: window.location.search,
		};
	},
	modules: {
		//uiUtils,
		//plotUtils,

		//Formatters,
		//keyParams,
		//dataConvert,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		
		// Initial update of searching properties from URL
		this.checkAllPropertiesReady();
		
		// Listen for URL changes (popstate for back/forward navigation)
		window.addEventListener('popstate', this.updateUrlSearch);
		
		// Intercept history.pushState and history.replaceState to detect URL changes immediately
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;
		const self = this;
		
		history.pushState = function(...args) {
			originalPushState.apply(history, args);
			// Use Promise.resolve().then() to ensure we're in the next microtask queue
			// This ensures keyParams.set() has fully completed updating the params object
			// before we read from it
			Promise.resolve().then(() => {
				self.updateUrlSearch();
			});
		};
		
		history.replaceState = function(...args) {
			originalReplaceState.apply(history, args);
			// Use Promise.resolve().then() to ensure we're in the next microtask queue
			Promise.resolve().then(() => {
				self.updateUrlSearch();
			});
		};
		
		// Store references for cleanup
		this.originalPushState = originalPushState;
		this.originalReplaceState = originalReplaceState;
		
		// Also watch for changes via keyParams.set() by checking periodically as a fallback
		// This catches any edge cases where pushState might not be intercepted
		this.urlCheckInterval = setInterval(() => {
			const currentSearch = window.location.search;
			if (currentSearch !== this.urlSearch) {
				this.urlSearch = currentSearch;
			}
		}, 100);
		
		this.renderCSPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
		window.removeEventListener('popstate', this.updateUrlSearch);
		
		// Restore original history methods
		if (this.originalPushState) {
			history.pushState = this.originalPushState;
		}
		if (this.originalReplaceState) {
			history.replaceState = this.originalReplaceState;
		}
		
		if (this.urlCheckInterval) {
			clearInterval(this.urlCheckInterval);
		}
	},
	computed: {
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
		/*searchingPhenotype() {
			let phenotype = null;
			if (this.phenotype != null) {
				//phenotype = this.phenotype;
				phenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;
			} else if (this.phenotype == null) {
				if (!!this.utils.keyParams[this.renderConfig["phenotype parameter"]]) {
					phenotype =
						this.utils.keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					phenotype = null;
				}
			}

			return phenotype;
		},*/
	},
	watch: {
		/*"this.phenotype"(phenotype) {
			console.log("this.phenotype", this.phenotype);
			this.renderCSPlot();
		},
		"this.region"(region) {
			console.log("this.region", this.region);
			this.renderCSPlot();
		},*/
		urlSearch() {
			// When URL changes, use Promise.resolve().then() to ensure keyParams is fully updated
			// This ensures we read the updated values after keyParams.set() has completed
			// and the params object has been updated
			Promise.resolve().then(() => {
				this.checkAllPropertiesReady();
			});
		},
		pkgDataSelected: {
			handler: function (DATA) {
				if (DATA.length == 0) {
					this.resetAll();
				} else {
					this.renderCSPlot();
				}
			},
			deep: true,
			immediate: true,
		},
		viewingRegion: {
			handler: function (n, o) {
				this.renderCSPlot();
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		//...uiUtils,
		updateUrlSearch() {
			this.urlSearch = window.location.search;
		},
        getSearchingRegion() {
            if(this.region != null) {
                let returnObj = {};
                let regionArr = this.region.split(":");
                returnObj["chr"] = regionArr[0];
                returnObj["start"] = regionArr[1].split("-")[0];
                returnObj["end"] = regionArr[1].split("-")[1];

                return returnObj;
            }

            // Read directly from URL to get the most up-to-date value
            const urlParams = queryString.parse(window.location.search, {
                parseNumbers: true,
                parseBooleans: true,
            });
            const regionParamName = this.renderConfig && this.renderConfig["region parameter"] ? this.renderConfig["region parameter"] : "region";
            let region = urlParams[regionParamName] || null;
            
            // Fallback to keyParams if not in URL
            if (!region && this.utils && this.utils.keyParams && this.renderConfig && this.renderConfig["region parameter"]) {
                region = this.utils.keyParams[this.renderConfig["region parameter"]] || null;
            }

            if(this.phenotype != null && region) {
                let returnObj = {};
                let regionArr = region.split(":");
                returnObj["chr"] = regionArr[0];
                returnObj["start"] = regionArr[1].split("-")[0];
                returnObj["end"] = regionArr[1].split("-")[1];

                return returnObj;
            } else {
                return null;
            }

        },

        getSearchingPhenotype() {

            let returnPhenotype = null;

            if(this.phenotype != null) {
                returnPhenotype = this.phenotype;
            }

            // Read directly from URL to get the most up-to-date value
            if (this.phenotype == null) {
                const urlParams = queryString.parse(window.location.search, {
                    parseNumbers: true,
                    parseBooleans: true,
                });
                const phenotypeParamName = this.renderConfig && this.renderConfig["phenotype parameter"] ? this.renderConfig["phenotype parameter"] : "phenotype";
                returnPhenotype = urlParams[phenotypeParamName] || null;
                
                // Fallback to keyParams if not in URL
                if (!returnPhenotype && this.utils && this.utils.keyParams && this.renderConfig && this.renderConfig["phenotype parameter"]) {
                    returnPhenotype = this.utils.keyParams[this.renderConfig["phenotype parameter"]] || null;
                }
            }

            if(returnPhenotype != null && this.renderConfig && this.renderConfig["phenotype match"] && this.renderConfig["phenotype match"][returnPhenotype]) {
                returnPhenotype = this.renderConfig["phenotype match"][returnPhenotype];
            }

            return returnPhenotype;
        },
        getSearchingAncestry() {
            let returnAncestry = null;

            // Read directly from URL to get the most up-to-date value
            const urlParams = queryString.parse(window.location.search, {
                parseNumbers: true,
                parseBooleans: true,
            });
            const ancestryParamName = this.renderConfig && this.renderConfig["ancestry parameter"] ? this.renderConfig["ancestry parameter"] : "ancestry";
            returnAncestry = urlParams[ancestryParamName] || null;
            
            // Fallback to keyParams if not in URL
            if (!returnAncestry && this.utils && this.utils.keyParams && this.renderConfig && this.renderConfig["ancestry parameter"]) {
                returnAncestry = this.utils.keyParams[this.renderConfig["ancestry parameter"]] || null;
            }

            if(returnAncestry != null && this.renderConfig && this.renderConfig["ancestry match"] && this.renderConfig["ancestry match"][returnAncestry]) {
                returnAncestry = this.renderConfig["ancestry match"][returnAncestry];
            }

            return returnAncestry;
        },
		checkAllPropertiesReady() {
			// Check if all three properties have values (not null)
            let searchingRegion = this.getSearchingRegion();
            let searchingPhenotype = this.getSearchingPhenotype();
            let searchingAncestry = this.getSearchingAncestry();

            //console.log('checking all properties ready',searchingRegion, searchingPhenotype, searchingAncestry);
            const ancestryParameter = this.renderConfig["ancestry parameter"];
            const regionParameter = this.renderConfig["region parameter"];
            const phenotypeParameter = this.renderConfig["phenotype parameter"];
			if (
				ancestryParameter !== null && searchingRegion !== null &&
				searchingPhenotype !== null &&
				searchingAncestry !== null
			) {
				// All three properties have values, call getCredibleSetsList
				this.getCredibleSetsList(searchingRegion, searchingPhenotype, searchingAncestry);
			}

            if (
				ancestryParameter == null && searchingRegion !== null &&
				searchingPhenotype !== null
			) {
				// All three properties have values, call getCredibleSetsList
				this.getCredibleSetsList(searchingRegion, searchingPhenotype, null);
			}
		},
		resetAll() {
			//this.credibleSets = [];
			this.CSData = {};
			this.CSPosData = {};
			this.test = null;
			this.renderCSPlot();
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
		showHidePanel(PANEL, CLOSEBTN) {
			let wrapper = document.querySelector(PANEL);
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			let isData = null;

			for (let v = -5; v <= 5; v++) {
				for (let h = -5; h <= 5; h++) {
					if (this.CSPosData[y + v] != undefined) {
						if (this.CSPosData[y + v][x + h] != undefined) {
							isData = true;
						}
					}
				}
			}

			if (isData == true || CLOSEBTN == "closeBtn") {
				if (wrapper.classList.contains("fixed")) {
					wrapper.classList.remove("fixed");
				} else {
					wrapper.classList.add("fixed");
				}
			}
		},
		onMouseOut(BOXID) {
			this.utils.uiUtils.removeOnMouseOut(BOXID, 1000);
		},
		onResize(e) {
			this.renderCSPlot();
		},
		getColorIndex(CS) {
			let CSArry = this.credibleSets.map(
				(c) => c.credibleSetId + ", " + c.phenotype
			);

			let i = CSArry.indexOf(CS);
			return this.compareGroupColors[i];
		},
		getBubbleId(CSID, PTYPE) {
			let idString = CSID + PTYPE;
			idString = idString.replace(/[^a-zA-Z0-9 ]/g, "");

			return idString;
		},
		removeCSData(CSID, PTYPE) {
			let idString = CSID + PTYPE;
			idString = idString.replace(/[^a-zA-Z0-9 ]/g, "");

			let bubble = document.getElementById(idString);

			bubble.classList.add("hidden");

			delete this.CSData[PTYPE][CSID];

			if (Object.keys(this.CSData[PTYPE]).length == 0) {
				delete this.CSData[PTYPE];
			}

			if (this.pkgData != null) {
				delete this.pkgData.CSData[PTYPE][CSID];

				if (Object.keys(this.pkgData.CSData[PTYPE]).length == 0) {
					delete this.pkgData.CSData[PTYPE];
				}
			}

			this.$store.dispatch("pkgDataSelected", {
				type: "Credible Set",
				id: CSID,
				action: "remove",
			});
		},

		checkCSPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();
			let x = Math.floor(e.clientX - rect.left);
			let y = Math.floor(e.clientY - rect.top);

			const infoBox = document.querySelector("#CSInfoBox");
			const infoBoxContentDiv =
				document.querySelector("#CSInfoBoxContent");

			if (!infoBox.classList.contains("fixed")) {
				let infoBoxContent = "";
				for (let v = -5; v <= 5; v++) {
					for (let h = -5; h <= 5; h++) {
						if (this.CSPosData[y + v] != undefined) {
							if (this.CSPosData[y + v][x + h] != undefined) {
								for (const [key, value] of Object.entries(
									this.CSPosData[y + v][x + h]
								)) {
									infoBoxContent +=
										"<strong>" + key + "</strong>";
									if (!!this.renderConfig["star key"]) {
										infoBoxContent +=
											this.checkStared(value) == true
												? "&nbsp;<span style='color:#ffcc00'>&#9733;</span>"
												: "&nbsp;<span style='color:#ffcc00'>&#9734;</span>";
									}

									infoBoxContent += "<br />";
									this.renderConfig["hover content"].map(
										(h) => {
											infoBoxContent +=
												"<span>" +
												h +
												": <span>" +
												value[h] +
												"<br />";
										}
									);

									/// add annotations per selected tissues
									if (
										this.pkgData != null &&
										!!this.pkgData.selectedTissues &&
										this.pkgData.selectedTissues.length > 0
									) {
										this.pkgData.selectedTissues.map(
											(t) => {
												let isTissue = 0;
												let annoContent = "";
												let ovelappingRegion = {
													start: null,
													end: null,
												};
												for (const [
													annoKey,
													annoValue,
												] of Object.entries(
													this.pkgData.tissuesData[t]
												)) {
													annoValue.region.map(
														(r) => {
															if (
																value.position >=
																	r.start &&
																value.position <=
																	r.end
															) {
																ovelappingRegion.start =
																	ovelappingRegion.start ==
																	null
																		? r.start
																		: ovelappingRegion.start <
																		  r.start
																		? r.start
																		: ovelappingRegion.start;

																ovelappingRegion.end =
																	ovelappingRegion.end ==
																	null
																		? r.end
																		: ovelappingRegion.end >
																		  r.end
																		? r.end
																		: ovelappingRegion.end;
																isTissue = 1;
																annoContent +=
																	"<span class='spacer-1'></span>" +
																	annoKey +
																	"<br /><span class='spacer-2'></span>Region: " +
																	r.start +
																	"-" +
																	r.end +
																	this.getGregor(
																		t,
																		annoKey,
																		value.phenotype
																	) +
																	"<br />";
															}
														}
													);
												}

												if (isTissue == 1) {
													annoContent =
														annoContent.substring(
															0,
															annoContent.length -
																2
														);
													annoContent =
														"<span><strong>" +
														t +
														":</strong> <br />" +
														annoContent +
														"</span><span class='spacer-1'></span>Overlapping Region <br />" +
														"<span class='spacer-2'></span>Start: " +
														ovelappingRegion.start +
														"<br /><span class='spacer-2'></span>End: " +
														ovelappingRegion.end +
														"<br />";

													infoBoxContent +=
														annoContent;
												}
											}
										);
									}
									infoBoxContent += "<br />";
								}
							}
						}
					}
				}

				if (infoBoxContent != "") {
					let closeBtn = "";
					infoBoxContent =
						closeBtn +
						"<strong>Click to fix info panel</strong><br /><br />" +
						infoBoxContent;
					infoBoxContentDiv.innerHTML = infoBoxContent;
					infoBox.classList.remove("hidden");
					if (x < rect.width * 0.75) {
						infoBox.style.width = "auto";
						infoBox.style.left = x + 25 + "px";
						infoBox.style.top = y + this.spaceBy + "px";
					} else {
						infoBox.style.width = "200px";
						infoBox.style.left = x - (200 + 15) + "px";
						infoBox.style.top = y + this.spaceBy + "px";
					}
				} else {
					infoBox.classList.add("hidden");
				}
			}
		},
		getGregor(TISSUE, ANNO, PHENOTYPE) {
			let pValue = this.utils.Formatters.pValueFormatter(
				this.pkgData.GEByTissueData[PHENOTYPE][TISSUE][ANNO].pValue
			);
			let fold = this.utils.Formatters.pValueFormatter(
				this.pkgData.GEByTissueData[PHENOTYPE][TISSUE][ANNO].fold
			);

			let content =
				"<br /><span class='spacer-2'></span>Fold: " +
				fold +
				"<br /><span class='spacer-2'></span>P-Value: " +
				pValue;
			return content;
		},
		renderCSPlot() {
			let selectedCS = this.pkgDataSelected
				.filter((s) => s.type == "Credible Set")
				.map((s) => s.id);

			this.CSPosData = {};
			let regionStart = this.viewingRegion.start;
			let regionEnd = this.viewingRegion.end;

			let canvas = document.querySelector("#CSPlot");
			let wrapper = document.querySelector("#CSPlotWrapper");
			if (!!canvas && !!wrapper) {
				let perPhenotype = 100;
				let phenotypeTitleH = this.spaceBy * 2;
				let btwnPhenotype = this.spaceBy * 7;
				let bump = this.plotMargin.bump;

				let canvasWidth = wrapper.clientWidth * 2;
				let canvasHeight = this.plotMargin.topMargin;

				let plotWidth =
					canvasWidth - 30 - this.plotMargin.leftMargin * 2; //-30 for side paddings
				let plotHeight = perPhenotype;
				let xPerPixel = plotWidth / (regionEnd - regionStart);

				let yPerPixel = plotHeight / 1;

				let numOfP = Object.keys(this.CSData).length;

				canvasHeight +=
					phenotypeTitleH * numOfP +
					perPhenotype * numOfP +
					btwnPhenotype * numOfP;

				canvas.setAttribute("width", canvasWidth);
				canvas.setAttribute("height", canvasHeight);
				canvas.setAttribute(
					"style",
					"margin-left: -15px; width:" +
						canvasWidth / 2 +
						"px;height:" +
						canvasHeight / 2 +
						"px;"
				);

				let c, ctx;
				c = canvas;
				ctx = c.getContext("2d");
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);


				if (selectedCS.length > 0) {
					let renderHeight = this.plotMargin.topMargin;
					if (Object.keys(this.CSData).length > 0) {
						for (const [phenotype, credibleSets] of Object.entries(
							this.CSData
						)) {
							ctx.font = "24px Arial";
							ctx.textAlign = "left";
							ctx.fillStyle = "#000000";
							ctx.fillText(
								phenotype,
								bump,
								renderHeight + this.spaceBy
							);

							renderHeight += phenotypeTitleH;

							this.renderAxis(
								ctx,
								plotWidth,
								plotHeight,
								regionEnd,
								regionStart,
								renderHeight,
								bump
							);

                            //console.log('credibleSets',credibleSets);

							for (const [CSID, credibleSet] of Object.entries(
								credibleSets
							)) {
								let inRegion = 0;
								credibleSet.map((v) => {

									if (
										v.position >= regionStart &&
										v.position <= regionEnd
									) {
										/*let ifInRegion = this.checkIfInRegion(
										v.position
									);
									if (ifInRegion == true) {*/
										let xPos =
											(v[
												this.renderConfig[
													"x axis field"
												]
											] -
												regionStart) *
												xPerPixel +
											this.plotMargin.leftMargin;
										let yPos =
											renderHeight +
											plotHeight -
											v[
												[
													this.renderConfig[
														"y axis field"
													],
												]
											] *
												yPerPixel;
										let colorID =
											v.credibleSetId +
											", " +
											v.phenotype;
										let dotColor =
											this.getColorIndex(colorID);

										if (
											this.checkStared(
												v[this.renderConfig["star key"]]
											) == true
										) {
											this.utils.plotUtils.renderStar(
												ctx,
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
												ctx,
												xPos,
												yPos,
												dotColor
											);
										}

										if (
											!this.CSPosData[
												Math.round(yPos / 2)
											]
										) {
											this.CSPosData[
												Math.round(yPos / 2)
											] = {};
										}
										if (
											!this.CSPosData[
												Math.round(yPos / 2)
											][Math.round(xPos / 2)]
										) {
											this.CSPosData[
												Math.round(yPos / 2)
											][Math.round(xPos / 2)] = {};
										}

										let tempObj = {};

										tempObj["phenotype"] = phenotype;
										tempObj["position"] =
											v[
												this.renderConfig[
													"x axis field"
												]
											];

										this.renderConfig["hover content"].map(
											(c) => {
												tempObj[c] = v[c];
											}
										);

										this.CSPosData[Math.round(yPos / 2)][
											Math.round(xPos / 2)
										][v[this.renderConfig["render by"]]] =
											tempObj;

										inRegion++;
										//}
									}
								});

								if (inRegion == 0) {
									ctx.font = "28px Arial";
									ctx.textAlign = "center";
									ctx.fillStyle = "#000000";
									ctx.fillText(
										"No credible variant in the region for " +
											phenotype,
										this.plotMargin.leftMargin +
											plotWidth / 2,
										renderHeight + plotHeight / 2
									);
								}
							}

							renderHeight += perPhenotype + btwnPhenotype;
						}
					}
				}
			}
		},
		checkIfInRegion(POSITION) {
			let ifInTissue = false;
			if (
				!!this.pkgData.selectedTissues &&
				this.pkgData.selectedTissues.length > 0
			) {
				let ifInTissueNum = 0;
				let selectedTissuesNum = this.pkgData.selectedTissues.length;

				this.pkgData.selectedTissues.map((t) => {
					let ifInAnnoNum = 0;
					this.pkgData.selectedAnnos.map((a) => {
						if (
							!!this.pkgData.tissuesData[t] &&
							!!this.pkgData.tissuesData[t][a]
						) {
							this.pkgData.tissuesData[t][a].region.map((r) => {
								if (POSITION >= r.start && POSITION <= r.end) {
									ifInAnnoNum++;
								}
							});
						}
					});
					if (ifInAnnoNum > 0) {
						ifInTissueNum++;
					}
				});

				if (ifInTissueNum == selectedTissuesNum) {
					ifInTissue = true;
				}
			} else {
				ifInTissue = true;
			}

			return ifInTissue;
		},
		renderDot(CTX, XPOS, YPOS, DOT_COLOR) {
			CTX.fillStyle = DOT_COLOR;
			CTX.lineWidth = 0;
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 8, 0, 2 * Math.PI);
			CTX.fill();
		},
		renderAxis(CTX, WIDTH, HEIGHT, xMax, xMin, yPos, bump) {
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

			// Y ticks
			CTX.moveTo(this.plotMargin.leftMargin - bump * 2, yPos);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos);
			CTX.stroke();

			CTX.moveTo(this.plotMargin.leftMargin - bump * 2, yPos + HEIGHT);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT);
			CTX.stroke();

			CTX.textAlign = "right";
			CTX.font = "24px Arial";
			CTX.fillStyle = "#000000";
			CTX.fillText(
				"1",
				this.plotMargin.leftMargin - bump * 3,
				yPos + bump
			);
			CTX.fillText(
				"0",
				this.plotMargin.leftMargin - bump * 3,
				yPos + HEIGHT + bump
			);

			//render x axis
			CTX.moveTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + bump);
			CTX.lineTo(recomXpos, yPos + HEIGHT + bump);
			CTX.stroke();

			// X ticks

			let xStep = Math.ceil((xMax - xMin) / 5);
			let xTickDistance = WIDTH / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos = this.plotMargin.leftMargin + i * xTickDistance;
				let adjTickXPos = Math.floor(tickXPos); // .5 is needed to render crisp line
				CTX.moveTo(adjTickXPos, yPos + HEIGHT + bump);
				CTX.lineTo(adjTickXPos, yPos + HEIGHT + bump * 2);
				CTX.stroke();

				CTX.textAlign = "center";

				let positionLabel = i < 5 ? Number(xMin) + i * xStep : xMax;

				positionLabel =
					positionLabel >= 100000
						? Math.round(positionLabel * 0.001) + "k"
						: positionLabel;

				CTX.font = "24px Arial";
				CTX.fillStyle = "#000000";
				CTX.fillText(
					positionLabel,
					adjTickXPos,
					yPos + HEIGHT + bump * 4
				);
			}

			//Render y axis label
			CTX.textAlign = "center";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				"PPA",
				-(yPos + HEIGHT / 2),
				this.plotMargin.leftMargin - bump * 5
			);

			//Rotate ctx back normal
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
		},
		async getCS(event) {
			if (event.target.value != "") {
				let valueArr = event.target.value.split(",");

				let CSID = valueArr[0];
				let phenotype = valueArr[1];

				let CSServer =
					this.renderConfig["credible sets server"] == "KP BioIndex"
						? this.utils.uiUtils.biDomain() + "/api/bio"
						: this.renderConfig["credible sets server"];

				let CSIndex = !!this.renderConfig["credible variants index"]
					? this.renderConfig["credible variants index"]
					: "credible-variants";

                let searchingAncestry = this.getSearchingAncestry();

                let queryString = (this.renderConfig["ancestry parameter"] && searchingAncestry != '*')? phenotype + "," + searchingAncestry + "," + CSID : phenotype + "," + CSID;

				let CSURL = 
					CSServer +
					"/query/" +
					CSIndex +
					"?q=" +
					queryString;

				let CSJson = await fetch(CSURL).then((resp) => resp.json());

				if (CSJson.error == null) {
					
					if (!this.CSData[phenotype]) {
						this.CSData[phenotype] = {};
					}

					this.CSData[phenotype][CSID] = !!this.renderConfig[
						"data convert"
					]
						? this.utils.dataConvert.convertData(
								this.renderConfig["data convert"],
								CSJson.data
						  )
						: CSJson.data;

					if (!!this.pkgData && !!this.pkgData.CSData) {
						if (!this.pkgData.CSData[phenotype]) {
							this.pkgData.CSData[phenotype] = {};
						}

						this.pkgData.CSData[phenotype][CSID] = CSJson.data;

						this.$store.dispatch("pkgDataSelected", {
							type: "Credible Set",
							id: CSID,
							action: "add",
						});
					}

					let bubbleId = event.target.value.replace(
						/[^a-zA-Z0-9 ]/g,
						""
					);
				}
			}
		},
        async getCredibleSetsList(REGION, PHENOTYPE, ANCESTRY) {

            let CSServer = "https://giant.hugeampkpnbi.org/api/bio/query/credible-sets?q=";
            let queryString = (ANCESTRY != null && ANCESTRY != '*')? PHENOTYPE + "," + ANCESTRY + "," + REGION.chr + ":" + REGION.start + "-" + REGION.end : PHENOTYPE + "," + REGION.chr + ":" + REGION.start + "-" + REGION.end;

            let CSURL = CSServer + queryString;

            let CSJson = await fetch(CSURL).then((resp) => resp.json());

            //console.log('CSJson',CSJson);

            if (CSJson.error == null) {
				if (this.dataComparison == "newSearch") {
					this.credibleSets = [];
					this.CSData = {};
					if (this.pkgData != null && !this.pkgData.CSData) {
						this.pkgData["CSData"] = {};
					}
				}

				CSJson.data.map((CS) => {
                    if(!CS.credibleSetId.includes('bottom-line')) {
                        this.credibleSets.push(CS);
                    }
				});
			}
        },
	},
});

$(function () {});
</script>

<style>
#CSPlotWrapper {
	vertical-align: top;
	width: calc(100% - 30px);
}

#CSUIWrapper {
	vertical-align: top;
	width: 100%;
}

#CSTracksWrapper {
	padding: 0;
}
.CS-plot-wrapper {
	padding: 0;
}

.CS-bubble {
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

.CS-bubble:hover {
	cursor: pointer;
}

#CSInitialMessage {
	width: 300px;
	border: solid 1px #ddd;
	color: #666;
	margin: 0 auto;
	border-radius: 25px;
	text-align: center;
	font-size: 13px;
}

#CSInfoBox {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 0px 5px 15px;
	z-index: 11;
	font-size: 14px;
	min-width: 200px;
	max-height: 500px;
}

#CSInfoBoxContent {
	max-height: 485px;
	overflow-y: auto;
}

#CSInfoBox.fixed.hidden,
#CSInfoBox.fixed {
	display: block;
}

#CSInfoBox .fixed-info-box-close {
	display: none;
}

#CSInfoBox.fixed .fixed-info-box-close {
	background-color: #fff;
	display: block;
}
</style>



