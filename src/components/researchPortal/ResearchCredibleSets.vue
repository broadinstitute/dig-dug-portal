<template>
	<div
		class="mbm-plot-content row"
		v-if="searchingRegion != null && searchingPhenotype != null"
	>
		<div class="col-md-12 CS-plot-wrapper">
			<div class="col-md-9" id="CSPlotWrapper">
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
					v-model="pkgData"
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
					class="hidden"
					v-html="
						credibleSets.length == 0
							? 'There is no available credible sets.'
							: 'Please select a credible set to render.'
					"
				></div>
			</div>
			<div class="col-md-3" id="CSUIWrapper">
				<h6>Add Credible Sets Track</h6>
				<div class="filtering-ui-wrapper add-content">
					<div class="filtering-ui-content">
						<div class="col">
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
										credibleSet.credibleSetId +
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
				</div>

				<div>
					<template v-for="c in credibleSets">
						<span
							:id="getBubbleId(c.credibleSetId, c.phenotype)"
							class="CS-bubble hidden"
							v-html="
								c.credibleSetId +
								', ' +
								c.phenotype +
								' &#10006;'
							"
							:style="
								'background-color:' +
								getColorIndex(
									c.credibleSetId + ', ' + c.phenotype
								) +
								';'
							"
							:key="c.credibleSetId + ', ' + c.phenotype"
							@click="removeCSData(c.credibleSetId, c.phenotype)"
						></span>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import dataConvert from "@/utils/dataConvert";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-credible-sets-plot", {
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
	],
	data() {
		return {
			credibleSets: [],
			CSData: {},
			CSPosData: {},
			spaceBy: 7,
			test: null,
		};
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
		dataConvert,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.renderCSPlot();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		searchingRegion() {
			let returnObj = {};
			let regionArr = this.region.split(":");
			returnObj["chr"] = regionArr[0];
			returnObj["start"] = regionArr[1].split("-")[0];
			returnObj["end"] = regionArr[1].split("-")[1];

			let phenotype = null;
			if (this.phenotype != null) {
				//phenotype = this.phenotype;
				phenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					phenotype =
						keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					phenotype = null;
				}
			}

			if (phenotype != null) {
				this.getCredibleSetsList(returnObj, phenotype);
			}

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
			let phenotype = null;
			if (this.phenotype != null) {
				//phenotype = this.phenotype;
				phenotype = !!this.renderConfig["phenotype match"]
					? this.renderConfig["phenotype match"][this.phenotype]
					: this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig["phenotype parameter"]]) {
					phenotype =
						keyParams[this.renderConfig["phenotype parameter"]];
				} else {
					phenotype = null;
				}
			}

			return phenotype;
		},
	},
	watch: {
		pkgDataSelected: {
			handler: function (n, o) {
				//if (n.length > 0) {
				this.renderCSPlot();
				//}
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
		...uiUtils,
		showHidePanel(PANEL, CLOSEBTN) {
			let wrapper = document.querySelector(PANEL);
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			var isData = null;

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
			uiUtils.removeOnMouseOut(BOXID);
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
			var idString = CSID + PTYPE;
			idString = idString.replace(/[^a-zA-Z0-9 ]/g, "");

			return idString;
		},
		removeCSData(CSID, PTYPE) {
			var idString = CSID + PTYPE;
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

			//this.renderCSPlot();
		},

		checkCSPosition(event) {
			var e = event;
			var rect = e.target.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			const infoBox = document.querySelector("#CSInfoBox");
			const infoBoxContentDiv =
				document.querySelector("#CSInfoBoxContent");

			if (!infoBox.classList.contains("fixed")) {
				var infoBoxContent = "";
				for (let v = -5; v <= 5; v++) {
					for (let h = -5; h <= 5; h++) {
						if (this.CSPosData[y + v] != undefined) {
							if (this.CSPosData[y + v][x + h] != undefined) {
								for (const [key, value] of Object.entries(
									this.CSPosData[y + v][x + h]
								)) {
									infoBoxContent +=
										"<strong>" + key + "</strong><br />";
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
						infoBox.style.left = x + 15 + "px";
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
			let pValue = Formatters.pValueFormatter(
				this.pkgData.GEByTissueData[PHENOTYPE][TISSUE][ANNO].pValue
			);
			let fold = Formatters.pValueFormatter(
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
			this.CSPosData = {};
			let regionStart = this.viewingRegion.start;
			let regionEnd = this.viewingRegion.end;

			if (Object.keys(this.CSData).length == 0) {
				if (!!document.getElementById("CSInitialMessage")) {
					document
						.getElementById("CSInitialMessage")
						.classList.remove("hidden");
				}
			} else {
				document
					.getElementById("CSInitialMessage")
					.classList.add("hidden");
			}

			let canvas = document.querySelector("#CSPlot");
			let wrapper = document.querySelector("#CSPlotWrapper");
			if (!!canvas && !!wrapper) {
				let perPhenotype = 50;
				let phenotypeTitleH = this.spaceBy * 2;
				let btwnPhenotype = this.spaceBy * 7;
				let bump = this.plotMargin.bump;

				let canvasWidth = wrapper.clientWidth;
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

				let c, ctx;
				c = canvas;
				ctx = c.getContext("2d");
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let renderHeight = this.plotMargin.topMargin;
				if (Object.keys(this.CSData).length > 0) {
					for (const [phenotype, credibleSets] of Object.entries(
						this.CSData
					)) {
						ctx.font = "14px Arial";
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

						for (const [CSID, credibleSet] of Object.entries(
							credibleSets
						)) {
							let inRegion = 0;
							credibleSet.map((v) => {
								if (
									v.position >= regionStart &&
									v.position <= regionEnd
								) {
									let ifInRegion = this.checkIfInRegion(
										v.position
									);
									if (ifInRegion == true) {
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

										this.renderDot(
											ctx,
											xPos,
											yPos,
											dotColor
										);

										if (!this.CSPosData[Math.round(yPos)]) {
											this.CSPosData[Math.round(yPos)] =
												{};
										}
										if (
											!this.CSPosData[Math.round(yPos)][
												Math.round(xPos)
											]
										) {
											this.CSPosData[Math.round(yPos)][
												Math.round(xPos)
											] = {};
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

										this.CSPosData[Math.round(yPos)][
											Math.round(xPos)
										][v[this.renderConfig["render by"]]] =
											tempObj;

										inRegion++;
									}
								}
							});

							if (inRegion == 0) {
								ctx.font = "14px Arial";
								ctx.textAlign = "center";
								ctx.fillStyle = "#000000";
								ctx.fillText(
									"No credible variant in the region for " +
										phenotype,
									this.plotMargin.leftMargin + plotWidth / 2,
									renderHeight + plotHeight / 2
								);
							}
						}

						renderHeight += perPhenotype + btwnPhenotype;
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
			CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);
			CTX.fill();
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

			// Y ticks
			CTX.moveTo(this.plotMargin.leftMargin - bump * 2, yPos + 0.5);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + 0.5);
			CTX.stroke();

			CTX.moveTo(
				this.plotMargin.leftMargin - bump * 2,
				yPos + HEIGHT + 0.5
			);
			CTX.lineTo(this.plotMargin.leftMargin - bump, yPos + HEIGHT + 0.5);
			CTX.stroke();

			CTX.textAlign = "right";
			CTX.font = "12px Arial";
			CTX.fillStyle = "#999999";
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
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(adjTickXPos, yPos + HEIGHT + bump);
				CTX.lineTo(adjTickXPos, yPos + HEIGHT + bump * 2);
				CTX.stroke();

				CTX.textAlign = "center";
				let positionLabel = i < 5 ? Number(xMin) + i * xStep : xMax;
				CTX.font = "12px Arial";
				CTX.fillStyle = "#999999";
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
						? "https://bioindex.hugeamp.org/api/bio"
						: this.renderConfig["credible sets server"];

				var CSURL =
					CSServer +
					"/query/credible-variants?q=" +
					phenotype +
					"," +
					CSID;

				var CSJson = await fetch(CSURL).then((resp) => resp.json());

				if (CSJson.error == null) {
					if (!this.CSData[phenotype]) {
						this.CSData[phenotype] = {};
					}

					this.CSData[phenotype][CSID] = !!this.renderConfig[
						"data convert"
					]
						? dataConvert.convertData(
								this.renderConfig["data convert"],
								CSJson.data
						  )
						: CSJson.data;

					if (this.pkgData != null) {
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
					let bubble = document.getElementById(bubbleId);

					bubble.classList.remove("hidden");

					//this.renderCSPlot();
				}
			}
		},
		async getCredibleSetsList(REGION, PHENOTYPE) {
			let CSServer =
				this.renderConfig["credible sets server"] == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig["credible sets server"];

			var CSURL =
				CSServer +
				"/query/credible-sets?q=" +
				PHENOTYPE +
				"," +
				REGION.chr +
				":" +
				REGION.start +
				"-" +
				REGION.end;

			var CSJson = await fetch(CSURL).then((resp) => resp.json());

			if (CSJson.error == null) {
				if (this.dataComparison == "newSearch") {
					this.credibleSets = [];
					this.CSData = {};
					if (this.pkgData != null && !this.pkgData.CSData) {
						this.pkgData["CSData"] = {};
					}
				}

				CSJson.data.map((CS) => {
					this.credibleSets.push(CS);
				});
			}
		},
	},
});

$(function () {});
</script>

<style>
#CSPlotWrapper,
#CSUIWrapper {
	display: inline-block;
	vertical-align: top;
}

#CSTracksWrapper {
	padding: 0;
}
.CS-plot-wrapper {
	padding: 0;
}

.CS-bubble {
	font-size: 12px;
	margin-left: 3px;
	margin-right: 3px;
	padding: 0px 3px;
	border-radius: 5px;
	float: left;
	margin-bottom: 3px;
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



