<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 phewas-plot-wrapper">
			<div
				class="col-md-12"
				:id="canvasId + 'pheWasPlotWrapper'"
				style="display: inline-block"
			>
				<div
					:id="canvasId + 'pheWasInfoBox'"
					class="phe-was-info-box hidden"
				>
					<div
						:id="canvasId + 'info_box_close'"
						class="fixed-info-box-close"
						@click="
							removeOnMouseOut(canvasId + 'pheWasInfoBox', 100)
						"
					>
						<b-icon icon="x-circle-fill"></b-icon>
					</div>
					<span :id="canvasId + 'pheWasInfoBoxContent'"></span>
				</div>

				<canvas
					:id="canvasId + 'pheWasPlot'"
					width=""
					height=""
					@mousemove="checkPosition($event, 'hover')"
					@click="checkPosition($event, 'click')"
					@mouseout="
						!isIdFixed('#' + canvasId + 'pheWasInfoBox')
							? removeOnMouseOut(canvasId + 'pheWasInfoBox', 1000)
							: ''
					"
				></canvas>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { cloneDeep } from "lodash";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import dataConvert from "@/utils/dataConvert";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-phewas-plot", {
	props: [
		"canvasId",
		"phenotypeMap",
		"phenotypesData",
		"renderConfig",
		"pkgData",
		"pkgDataSelected",
		"colors",
		"plotMargin",
		"filter",
	],
	data() {
		return {
			pheWasData: null,
			pheWasPosData: {},
			spaceBy: 7,
			trigger: 0,
		};
	},
	modules: {
		uiUtils,
		plotUtils,
		Formatters,
		keyParams,
		dataConvert,
	},
	components: {},
	created: function () {
		this.renderPheWas();
	},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		this.renderPheWas();
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		renderData() {
			let content = {};
			content["data"] = [];

			if (!!this.phenotypesData) {
				let phenotypesData = cloneDeep(this.phenotypesData);
				phenotypesData.map((d) => {
					if (
						!!this.phenotypeMap[d[this.renderConfig["render by"]]]
					) {
						content["data"].push(d);
					}
				});
			}
			if (!!this.filter) {
				content.data = content.data.filter(this.filter);
			}

			//return phenotypeGroupsObj;
			if (!!content.data && content.data.length > 0) {
				return content;
			} else {
				return null;
			}
		},
	},
	watch: {
		renderData(content) {
			this.renderPheWas();
		},
	},
	methods: {
		...uiUtils,
		isIdFixed: uiUtils.isIdFixed,
		removeOnMouseOut: uiUtils.removeOnMouseOut,
		groupData(DATA) {
			let phenotypeGroups = [];
			for (const [key, value] of Object.entries(this.phenotypeMap)) {
				phenotypeGroups.push(value);
			}

			phenotypeGroups = [
				...new Set(phenotypeGroups.map((p) => p.group)),
			].sort();

			let phenotypeGroupsObj = {};

			phenotypeGroups.map((p) => {
				phenotypeGroupsObj[p] = [];
			});

			DATA.data.map((p) => {
				if (!!this.phenotypeMap[p.phenotype]) {
					let group = this.phenotypeMap[p.phenotype].group;
					phenotypeGroupsObj[group].push(p);
				}
			});

			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) => (a.pValue > b.pValue ? 1 : -1));
			}

			return phenotypeGroupsObj;
		},
		onResize() {
			this.renderPheWas();
		},
		checkPosition(event, TYPE) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let rawX = e.clientX - rect.left;
			let rawY = e.clientY - rect.top;

			let plotMargin = {
				left: this.plotMargin.leftMargin,
				right: this.plotMargin.leftMargin * 1.5,
				top: this.plotMargin.bottomMargin * 3.5,
				bottom: this.plotMargin.bottomMargin * 2.5,
				bump: 5,
			};

			let y = Math.ceil(e.clientY - rect.top);
			let x = Math.ceil(e.clientX - rect.left);

			const infoBox = document.querySelector(
				"#" + this.canvasId + "pheWasInfoBox"
			);
			const infoBoxContent = document.querySelector(
				"#" + this.canvasId + "pheWasInfoBoxContent"
			);
			const infoBoxClose = document.querySelector(
				"#" + this.canvasId + "info_box_close"
			);
			let infoContent = "";

			if (x >= plotMargin.left && x <= rect.width - plotMargin.right) {
				for (const [yKey, yValue] of Object.entries(
					this.pheWasPosData
				)) {
					let yLoc = yKey.split("-");

					if (y >= yLoc[0] && y <= yLoc[1]) {
						yValue.map((xPos) => {
							if (x >= xPos.start && x <= xPos.end) {
								infoContent +=
									"<strong>" + xPos.name + "</strong><br />";

								this.renderConfig["hover content"].map((h) => {
									infoContent +=
										h + ":" + xPos.data[h] + "<br />";
								});
							}
						});
					}
				}
			}

			if (TYPE == "hover") {
				if (infoContent == "") {
					if (
						infoBox.getAttribute("class").includes("fixed") == false
					) {
						infoBoxContent.innerHTML = "";
						infoBox.setAttribute("class", "hidden");
						infoBoxClose.setAttribute("class", "hidden");
					}
				} else {
					if (
						infoBox.getAttribute("class").includes("fixed") == false
					) {
						infoBoxContent.innerHTML = infoContent;
						infoBox.setAttribute("class", "phe-was-info-box");
						infoBoxClose.setAttribute("class", "hidden");
						if (x < rect.width - 300) {
							infoBox.style.left = rawX + 25 + "px";
							infoBox.style.top = rawY + this.spaceBy + "px";
						} else {
							infoBox.style.left = rawX - 325 + "px";
							infoBox.style.width = "300px !important";
							infoBox.style.top = rawY + this.spaceBy + "px";
						}
					}
				}
			}

			if (TYPE == "click") {
				infoBoxClose.setAttribute("class", "fixed-info-box-close");
				if (infoContent == "") {
					infoBoxContent.innerHTML = "";
					infoBox.setAttribute("class", "hidden");
				} else {
					infoBoxContent.innerHTML = infoContent;
					infoBox.setAttribute("class", "phe-was-info-box fixed");
					if (x < rect.width - 300) {
						infoBox.style.left = rawX + 25 + "px";
						infoBox.style.top = rawY + this.spaceBy + "px";
					} else {
						infoBox.style.left = rawX - 325 + "px";
						infoBox.style.width = "300px !important";
						infoBox.style.top = rawY + this.spaceBy + "px";
					}
				}
			}
		},
		renderPheWas() {
			let wrapper = document.querySelector(
				"#" + this.canvasId + "pheWasPlotWrapper"
			);
			let canvas = document.querySelector(
				"#" + this.canvasId + "pheWasPlot"
			);

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth;
				let canvasHeight = Number(this.renderConfig["height"]);

				let plotWidth =
					canvasWidth -
					this.plotMargin.leftMargin -
					this.plotMargin.rightMargin;

				let plotHeight =
					this.renderConfig["height"] -
					this.plotMargin.topMargin -
					this.plotMargin.bottomMargin;
				let bump = 5.5;

				let c, ctx;
				c = document.querySelector("#" + this.canvasId + "pheWasPlot");
				c.setAttribute("width", canvasWidth);
				c.setAttribute("height", canvasHeight);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let minY = null;
				let maxY = null;

				this.pheWasPosData = {};

				let renderData = this.groupData(this.renderData);
				let groups = {};
				let totalNum = 0;

				for (const [key, value] of Object.entries(renderData)) {
					groups[key] = value.length;
					totalNum += value.length;
					value.map((p) => {
						let yValue = p[this.renderConfig["y axis field"]];
						minY =
							minY == null
								? yValue
								: yValue < minY
								? yValue
								: minY;
						maxY =
							maxY == null
								? yValue
								: yValue > maxY
								? yValue
								: maxY;
					});
				}

				let plotMargin = {
					left: this.plotMargin.leftMargin,
					right: this.plotMargin.leftMargin * 1.5,
					top: this.plotMargin.bottomMargin * 3.5,
					bottom: this.plotMargin.bottomMargin * 2.5,
					bump: 5,
				};

				plotUtils.renderAxisWBump(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"y",
					5,
					-Math.log10(maxY),
					-Math.log10(minY),
					this.renderConfig["y axis label"]
				);

				plotUtils.renderAxisWBump(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"x",
					null,
					null,
					null
				);

				this.renderTicksByGroup(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"x",
					groups
				);

				let xStep =
					(canvasWidth - plotMargin.left - plotMargin.right) /
					totalNum;
				let yMax = Math.round(-Math.log10(maxY));
				let yMin = Math.round(-Math.log10(minY));

				// render Y ticks
				let yStep =
					(canvasHeight - (plotMargin.top + plotMargin.bottom)) /
					(yMax - yMin);

				let groupsArr = Object.keys(groups).sort();
				let dotIndex = 0;

				if (totalNum > 1) {
					for (const [key, value] of Object.entries(renderData)) {
						let keyIndex =
							groupsArr.indexOf(key) % this.colors.length;
						let fillColor = this.colors[keyIndex];
						let strokeColor = "#00000075"; //this.colors[keyIndex];

						let labelIndex = 0;
						let labelOrigin = 0;
						let maxWidthPerGroup =
							plotMargin.left +
							xStep * dotIndex +
							xStep * value.length -
							12;

						value.map((p) => {
							let xPos = plotMargin.left + xStep * dotIndex;

							let yPos =
								canvasHeight -
								plotMargin.bottom +
								Math.round(-Math.log10(p.pValue)) * yStep;

							if (this.renderConfig["beta field"] != "null") {
								this.renderTriangle(
									ctx,
									xPos,
									yPos,
									fillColor,
									strokeColor,
									Math.sign(
										p[this.renderConfig["beta field"]]
									),
									this.phenotypeMap[p.phenotype][
										"description"
									]
								);
							} else {
								this.renderDot(
									ctx,
									xPos,
									yPos,
									fillColor,
									strokeColor
								);
							}

							let pName =
								this.phenotypeMap[p.phenotype]["description"];

							///organize data by position
							let yRangeStart = Math.round(yPos) - 5;
							let yRangeEnd = Math.round(yPos) + 5;
							let yRange = yRangeStart + "-" + yRangeEnd;
							let tempObj = {};
							this.renderConfig["hover content"].map((c) => {
								tempObj[c] = p[c];
							});
							let xRange = {
								start: Math.round(xPos) - 5,
								end: Math.round(xPos) + 5,
								data: tempObj,
								name: pName,
							};

							if (!this.pheWasPosData[yRange]) {
								this.pheWasPosData[yRange] = [];
							}
							this.pheWasPosData[yRange].push(xRange);

							///add labels if p-value above 2.5e-6
							if (labelIndex == 0) {
								labelOrigin = xPos;
							}

							//if (labelIndex == 0 || p.pValue <= 2.5e-6) {
							let labelXpos = labelOrigin + 12 * labelIndex;

							labelXpos = xPos > labelXpos ? xPos : labelXpos;

							if (
								labelIndex == 0 ||
								labelXpos < maxWidthPerGroup
							) {
								ctx.font = "11px Arial";
								ctx.fillStyle =
									p.pValue <= 2.5e-6
										? "#000000"
										: "#00000050";

								ctx.save();
								ctx.translate(labelXpos + 5, yPos - 12);
								ctx.rotate((90 * -Math.PI) / 180);
								ctx.textAlign = "start";
								ctx.fillText(pName, 0, 0);
								ctx.restore();

								ctx.moveTo(xPos, yPos);
								ctx.lineTo(labelXpos, yPos - 10);
								ctx.strokeStyle = "#00000050";
								ctx.stroke();
							}

							labelIndex++;
							//}
							dotIndex++;
						});
						keyIndex++;
					}
					/// render guide line
					this.renderConfig["thresholds"].map((t) => {
						let guidelineYpos =
							canvasHeight -
							plotMargin.bottom +
							Math.round(-Math.log10(Number(t))) * yStep;
						ctx.setLineDash([10, 5]);
						ctx.moveTo(
							plotMargin.left - plotMargin.bump,
							guidelineYpos
						);
						ctx.lineTo(
							canvasWidth + plotMargin.bump - plotMargin.right,
							guidelineYpos
						);
						ctx.strokeStyle = "#00000050";
						ctx.stroke();
					});
				} else {
					for (const [key, value] of Object.entries(renderData)) {
						let keyIndex =
							groupsArr.indexOf(key) % this.colors.length;
						let fillColor = this.colors[keyIndex];
						let strokeColor = "#00000075"; //this.colors[keyIndex];
						value.map((p) => {
							let xPos = canvasWidth / 2;

							let yPos = canvasHeight / 2;

							console.log(
								"beta field: ",
								this.renderConfig["beta field"]
							);

							if (this.renderConfig["beta field"] != "null") {
								this.renderTriangle(
									ctx,
									xPos,
									yPos,
									fillColor,
									strokeColor,
									Math.sign(
										p[this.renderConfig["beta field"]]
									),
									this.phenotypeMap[p.phenotype][
										"description"
									]
								);
							} else {
								this.renderDot(
									ctx,
									xPos,
									yPos,
									fillColor,
									strokeColor
								);
							}

							let pName =
								this.phenotypeMap[p.phenotype]["description"];

							///organize data by position
							let yRangeStart = Math.round(yPos) - 5;
							let yRangeEnd = Math.round(yPos) + 5;
							let yRange = yRangeStart + "-" + yRangeEnd;
							let tempObj = {};
							this.renderConfig["hover content"].map((c) => {
								tempObj[c] = p[c];
							});
							let xRange = {
								start: Math.round(xPos) - 5,
								end: Math.round(xPos) + 5,
								data: tempObj,
								name: pName,
							};

							if (!this.pheWasPosData[yRange]) {
								this.pheWasPosData[yRange] = [];
							}
							this.pheWasPosData[yRange].push(xRange);

							ctx.font = "13px Arial";
							ctx.fillStyle = "#000000";
							ctx.textAlign = "start";
							ctx.fillText(pName, xPos + 15, yPos);
							let infoIndex = 1;
							this.renderConfig["hover content"].map((h) => {
								ctx.fillText(
									h + ": " + p[h],
									xPos + 15,
									yPos + infoIndex * 20
								);
								infoIndex++;
							});
						});
					}
				}
			}
		},

		renderGiudeLine() {},

		renderDot(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR) {
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);

			CTX.fillStyle = DOT_COLOR;
			CTX.fill();
			CTX.lineWidth = 1;
			CTX.strokeStyle = STROKE_COLOR;
			CTX.stroke();
			//
		},

		renderTriangle(
			CTX,
			XPOS,
			YPOS,
			DOT_COLOR,
			STROKE_COLOR,
			EFFECT,
			LABEL
		) {
			CTX.beginPath();
			if (EFFECT == 1) {
				CTX.moveTo(XPOS - 5, YPOS + 5);
				CTX.lineTo(XPOS + 5, YPOS + 5);
				CTX.lineTo(XPOS, YPOS - 5);
			}
			if (EFFECT == -1) {
				CTX.moveTo(XPOS - 5, YPOS - 5);
				CTX.lineTo(XPOS, YPOS + 5);
				CTX.lineTo(XPOS + 5, YPOS - 5);
			}
			CTX.closePath();

			CTX.fillStyle = DOT_COLOR;
			CTX.fill();
			CTX.lineWidth = 1;
			CTX.strokeStyle = STROKE_COLOR;
			CTX.stroke();
		},

		renderTicksByGroup(CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, GROUPS) {
			let groupsArr = Object.keys(GROUPS).sort();
			let totalNum = 0;
			for (const [key, value] of Object.entries(GROUPS)) {
				totalNum += value;
			}

			CTX.beginPath();
			CTX.lineWidth = 0.5;
			CTX.strokeStyle = "#000000";
			CTX.font = "11px Arial";
			CTX.fillStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			switch (DIRECTION) {
				case "x":
					let xTickDistance =
						(WIDTH - MARGIN.left - MARGIN.right) / totalNum;

					let previousGroup = 0;
					for (const [key, value] of Object.entries(GROUPS)) {
						if (value > 0) {
							let tickXPos =
								MARGIN.left + previousGroup * xTickDistance;
							let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
							CTX.moveTo(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump
							);
							CTX.lineTo(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump * 2
							);
							CTX.stroke();

							let keyIndex =
								groupsArr.indexOf(key) % this.colors.length;
							CTX.fillStyle = this.colors[keyIndex];
							CTX.save();
							CTX.translate(
								adjTickXPos,
								HEIGHT - MARGIN.bottom + MARGIN.bump * 2
							);
							CTX.rotate((45 * Math.PI) / 180);
							CTX.textAlign = "start";
							CTX.fillText(key, 0, 15);
							//CTX.rotate((45 * Math.PI) / 180);
							CTX.restore();

							previousGroup += value;
						}
					}

					break;
				case "y":
					/// leave it empty in case we need it later
					break;
			}
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
	},
});

$(function () {});
</script>

<style>
.fixed-info-box-close {
	position: absolute;
	top: 0;
	right: 3px;
	font-size: 14px;
	color: #69f;
}
.phe-was-info-box {
	position: absolute;
	background-color: #fff;
	border: solid 1px #ddd;
	border-radius: 5px;
	padding: 5px 15px;
	z-index: 11;
	font-size: 13px;
	min-width: 200px !important;
	max-width: 400px !important;
}
</style>



