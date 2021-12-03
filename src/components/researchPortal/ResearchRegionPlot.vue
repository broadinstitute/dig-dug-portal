<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12" v-for="(item, itemIndex) in plotsList">
			<div id="assoPlotsWrapper" class="col-md-9">
				<h6 v-html="item" :class="'text color-' + itemIndex"></h6>
				<canvas :id="'asso_plot_' + item" width="" height=""></canvas>
			</div>
			<div id="ldPlotsWrapper" class="col-md-3">
				<h6 v-html="item" :class="'text color-' + itemIndex"></h6>
				<canvas :id="'ld_plot_' + item" width="" height=""></canvas>
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

import Chi from "chi-squared";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-plot", {
	props: [
		"plotData",
		"renderConfig",
		"dataComparisonConfig",
		"region",
		"plotMargin",
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
			//rebuilding start
			assoData: {},
			ldData: {},
			recombData: "",
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
		plotsList() {
			//used rebuild
			if (this.plotData != null) {
				var plotsKeys = [];
				var field = this.dataComparisonConfig.fieldsToCompare[0];
				// get list of data groups
				for (const [pKey, pValue] of Object.entries(this.plotData)) {
					for (const [key, value] of Object.entries(pValue[field])) {
						plotsKeys.push(key);
					}
				}
				plotsKeys = [...new Set(plotsKeys)];

				if (plotsKeys.length > 1) {
					plotsKeys.push("Combined");
				}

				this.assoData = {}; // reset assoData
				this.ldData = {}; // reset ldData
				this.recombData = ""; // reset recombData

				//feed assoData + set initial reference variant
				var yXField = this.renderConfig.yAxisField;
				var populationsType =
					this.renderConfig.ldServer.populations_type;

				plotsKeys.map((group) => {
					this.assoData[group] = {
						yXHigh: null,
						yXLow: null,
						data: {},
					};
					this.ldData[group] = {
						refVariant: null,
						population: [],
						data: null,
					};

					for (const [dKey, dValue] of Object.entries(
						this.plotData
					)) {
						if (group != "Combined") {
							let yXValue = dValue[yXField][group];
							if (!!yXValue) {
								// set population for calling LD API

								if (populationsType == "fixed") {
									this.ldData[group].population =
										this.renderConfig.ldServer.fixed_population;
								} else if (populationsType == "dynamic") {
									this.ldData[group].population.push(
										dValue[
											this.renderConfig.ldServer
												.populations_field
										][group]
									);
								}

								// set initial refVarint
								this.ldData[group].refVariant =
									this.assoData[group].yXHigh == null
										? dKey
										: yXValue > this.assoData[group].yXHigh
										? dKey
										: this.ldData[group].refVariant;

								// set high / low values of the group
								this.assoData[group].yXHigh =
									this.assoData[group].yXHigh == null
										? yXValue
										: yXValue > this.assoData[group].yXHigh
										? yXValue
										: this.assoData[group].yXHigh;

								this.assoData[group].yXLow =
									this.assoData[group].yXLow == null
										? yXValue
										: yXValue < this.assoData[group].yXLow
										? yXValue
										: this.assoData[group].yXLow;
								// add data to asso data
								this.assoData[group].data[dKey] = {};

								for (const [fKey, fValue] of Object.entries(
									dValue
								)) {
									this.assoData[group].data[dKey][fKey] =
										this.dataComparisonConfig.fieldsToCompare.includes(
											fKey
										) == true
											? fValue[group]
											: fValue;
								}
							}
						}
					}

					// set LD population
					let uniqPopulations = [
						...new Set(this.ldData[group].population),
					];
					this.ldData[group].population =
						uniqPopulations.length > 1
							? "ALL"
							: this.renderConfig.ldServer.populations[
									uniqPopulations[0]
							  ];
				});

				if (plotsKeys.includes("Combined") == true) {
					plotsKeys.map((p) => {
						let yXHighValue = this.assoData[p].yXHigh;
						let yXLowValue = this.assoData[p].yXLow;

						this.assoData.Combined.yXHigh =
							this.assoData.Combined.yXHigh == null
								? yXHighValue
								: yXHighValue > this.assoData.Combined.yXHigh
								? yXHighValue
								: this.assoData.Combined.yXHigh;

						this.assoData.Combined.yXLow =
							this.assoData.Combined.yXLow == null
								? yXLowValue
								: yXLowValue < this.assoData.Combined.yXLow
								? yXLowValue
								: this.assoData.Combined.yXLow;
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
				returnObj["start"] = parseInt(regionArr[0], 10);
				returnObj["end"] = parseInt(regionArr[1], 10);

				return returnObj;
			}
		},
	},
	watch: {},
	methods: {
		...uiUtils,
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
				this.renderPlots();
			}
		},
		renderPlots() {
			// findout width and height of canvas and actual plots
			let assoCanvasWidth =
				document.getElementById("assoPlotsWrapper").clientWidth - 30;
			let ldCanvasWidth =
				document.getElementById("ldPlotsWrapper").clientWidth - 30;

			let canvasHeight = !!this.renderConfig.height
				? this.renderConfig.height +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin
				: 300 +
				  this.plotMargin.topMargin +
				  this.plotMargin.bottomMargin;

			let assoPlotWidth =
				assoCanvasWidth - this.plotMargin.leftMargin * 2;
			let ldPlotWidth =
				ldCanvasWidth -
				this.plotMargin.leftMargin -
				this.plotMargin.rightMargin;

			let plotHeight = !!this.renderConfig.height
				? this.renderConfig.height
				: 300;

			let bump = 5.5;

			console.log("this.assoData", this.assoData);
			console.log("this.ldData", this.ldData);

			this.plotsList.map((p) => {
				// first asso plot
				let c, ctx;

				c = document.getElementById("asso_plot_" + p);
				c.setAttribute("width", assoCanvasWidth);
				c.setAttribute("height", canvasHeight);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, assoCanvasWidth, canvasHeight);

				this.renderAxis(
					ctx,
					assoPlotWidth,
					plotHeight,
					this.assoData[p].yXHigh,
					this.assoData[p].yXLow,
					this.searchingRegion.end,
					this.searchingRegion.start,
					bump,
					"asso"
				);

				this.renderRecombLine(
					ctx,
					assoPlotWidth,
					plotHeight,
					this.searchingRegion.end,
					this.searchingRegion.start
				);

				this.renderDots(
					ctx,
					ldPlotWidth,
					plotHeight,
					this.assoData[p].yXHigh,
					this.assoData[p].yXLow,
					this.searchingRegion.end,
					this.searchingRegion.start,
					bump,
					"asso",
					p
				);

				// second LD plot
				c = document.getElementById("ld_plot_" + p);
				c.setAttribute("width", ldCanvasWidth);
				c.setAttribute("height", canvasHeight);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, ldCanvasWidth, canvasHeight);

				this.renderAxis(
					ctx,
					ldPlotWidth,
					plotHeight,
					this.assoData[p].yXHigh,
					this.assoData[p].yXLow,
					1,
					0,
					bump,
					"LD"
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
			var assoData = this.assoData[GROUP].data;
			var ldData = this.ldData[GROUP];

			console.log("assoData", assoData);
			console.log("ldData", ldData);

			var xStep = WIDTH / (xMax - xMin);
			var yStep = HEIGHT / (yMax - yMin);
			var xField = this.renderConfig.xAxisField;
			var yField = this.renderConfig.yAxisField;

			for (const [key, value] of Object.entries(assoData)) {
				//temp save here
			}
		},
		renderDot(CTX, XPOS, YPOS, DOT_COLOR) {
			CTX.fillStyle = DOT_COLOR;

			CTX.lineWidth = 0;
			CTX.beginPath();
			CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);
			CTX.fill();
		},
		renderDiamond(CTX, XPOS, YPOS, DOT_COLOR) {
			let WIDTH = 10;
			let HEIGHT = 14;
			let xpos = XPOS - WIDTH / 2;
			let ypos = YPOS - HEIGHT / 2;
			CTX.save();
			CTX.fillStyle = DOT_COLOR;
			CTX.lineWidth = 0;

			CTX.beginPath();
			CTX.moveTo(xpos, ypos);

			// top left edge
			CTX.lineTo(xpos - WIDTH / 2, ypos + HEIGHT / 2);

			// bottom left edge
			CTX.lineTo(xpos, ypos + HEIGHT);

			// bottom right edge
			CTX.lineTo(xpos + WIDTH / 2, ypos + HEIGHT / 2);

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
		},
		renderAxis(CTX, WIDTH, HEIGHT, yMax, yMin, xMax, xMin, bump, TYPE) {
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
				HEIGHT + this.plotMargin.topMargin + bump
			);
			CTX.stroke();

			// render recombination Rate y axis
			if (TYPE == "asso") {
				CTX.moveTo(
					this.plotMargin.leftMargin + WIDTH + bump,
					this.plotMargin.topMargin
				);
				CTX.lineTo(
					this.plotMargin.leftMargin + WIDTH + bump,
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
					let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
					CTX.moveTo(
						this.plotMargin.leftMargin + WIDTH + bump,
						adjTickYPos
					);
					CTX.lineTo(
						this.plotMargin.leftMargin + WIDTH + bump * 2,
						adjTickYPos
					);
					CTX.stroke();

					CTX.font = "12px Arial";
					CTX.textAlign = "left";
					CTX.fillStyle = "#000000";

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
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(
					adjTickXPos,
					this.plotMargin.topMargin + HEIGHT + bump
				);
				CTX.lineTo(
					adjTickXPos,
					this.plotMargin.topMargin + HEIGHT + bump * 2
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
					this.plotMargin.topMargin + HEIGHT + bump * 4
				);
			}

			//render LD plots background
			if (TYPE == "LD") {
				let xBGDistance = WIDTH / 5;

				for (let i = 0; i < 5; i++) {
					let bgXPos = this.plotMargin.leftMargin + i * xBGDistance;
					let adBGXPos = Math.floor(bgXPos) + 0.5;
					CTX.fillStyle = this.ldColor[i];
					CTX.fillRect(
						adBGXPos,
						this.plotMargin.topMargin,
						xBGDistance - 1,
						HEIGHT
					);
				}
			}

			//Render y axis label
			CTX.font = "12px Arial";
			CTX.textAlign = "center";
			CTX.fillStyle = "#000000";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				this.renderConfig.yAxisLabel,
				-(this.plotMargin.topMargin + HEIGHT / 2),
				bump + 12
			);

			//Render recombination rate y axis label
			if (TYPE == "asso") {
				CTX.fillText(
					"Recombination Rate (cM/Mb)",
					-(this.plotMargin.topMargin + HEIGHT / 2),
					this.plotMargin.leftMargin * 2 + WIDTH - (bump + 12)
				);
			}

			//Render x axis label
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.fillText(
				TYPE == "LD" ? "LD(r2)" : this.renderConfig.xAxisLabel,
				WIDTH / 2 + this.plotMargin.leftMargin,
				this.plotMargin.topMargin +
					this.plotMargin.bottomMargin +
					HEIGHT -
					12
			);
		},
	},
});

$(function () {});
</script>

<style>
#assoPlotsWrapper,
#ldPlotsWrapper {
	display: inline-block;
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



