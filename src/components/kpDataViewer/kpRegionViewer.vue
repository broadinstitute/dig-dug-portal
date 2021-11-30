<template>
	<div class="mbm-plot-content">
		<div
			class="kp-region-viewer-wrapper"
			v-for="(item, itemKey) in gatheredData"
		>
			<h5 v-html="itemKey"></h5>
			<div class="row">
				<div
					class="col-md-9 association-plot-wrapper"
					:id="pkgID + '_' + itemKey + '_associationPlot_wrapper'"
				>
					<canvas
						:id="pkgID + '_' + itemKey + '_associationPlot'"
						width=""
						height=""
					>
					</canvas>
				</div>
				<div
					class="col-md-3 ld-plot-wrapper"
					:id="pkgID + '_' + itemKey + '_ldPlot_wrapper'"
				>
					<canvas
						:id="pkgID + '_' + itemKey + '_ldPlot'"
						width=""
						height=""
					>
					</canvas>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import umLdServer from "@/modules/umLdServer.js";
import Formatters from "@/utils/formatters.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("kp-region-viewer", {
	props: ["plotData", "plotLayout", "renderConfig", "region", "pkgID"],
	data() {
		return {
			gatheredData: {},
			recombData: {},
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
		};
	},
	modules: {
		Formatters,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
		if (this.renderConfig.features.includes("recombination")) {
			this.callSignal();
		}
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		renderingData() {
			return this.gatheredData;
		},
		plotsList() {
			//let plotsKeys = [];
			if (this.plotData != null) {
				let plotsKeys = this.plotData.map(
					(p) => p[this.renderConfig.multiPlotsBy]
				);

				plotsKeys = [...new Set(plotsKeys)];

				return plotsKeys;
			} else {
				return null;
			}
		},
		associationData() {
			if (this.plotsList != null) {
				this.gatheredData = {};
				/// add each plotting groups data wrappers to gatheredData
				this.plotsList.map((p) => {
					this.gatheredData[p] = {};
					this.gatheredData[p]["association"] = {};
					this.gatheredData[p]["associationHi"] = null;
					this.gatheredData[p]["associationLow"] = null;

					//set this.gateredData object for LD & recombination rate, or any other features in the future
					if (this.renderConfig.features.length > 0) {
						this.renderConfig.features.map((f) => {
							this.gatheredData[p][f] = {};
							if (f == "LD") {
								this.gatheredData[p]["ldReference"] = {
									variant: null,
									ldPopulation: !!this.renderConfig
										.ldPopulation.ifStatic
										? this.renderConfig.ldPopulation.value
										: null,
								};
							}
						});
					}
				});
				// gather data for association plot
				var populationsObj = {};
				this.plotData.map((p) => {
					let group = p[this.renderConfig.multiPlotsBy];

					let xFieldValue = p[this.renderConfig.xAxisField];
					let yFieldValue = p[this.renderConfig.yAxisField];

					let tempObj = {};
					tempObj[this.renderConfig.xAxisField] = xFieldValue;
					tempObj[this.renderConfig.yAxisField] = yFieldValue;

					this.renderConfig.hoverContent.map((h) => {
						tempObj[h] = p[h];
					});
					this.gatheredData[group].association[
						p[this.renderConfig.renderBy]
					] = tempObj;

					// set high and low values of association data
					// set association high
					let assoHi = this.gatheredData[group].associationHi;
					this.gatheredData[group].associationHi =
						assoHi == null
							? yFieldValue
							: yFieldValue > assoHi
							? yFieldValue
							: assoHi;
					// set association low
					let assoLow = this.gatheredData[group].associationLow;

					this.gatheredData[group].associationLow =
						assoLow == null
							? yFieldValue
							: yFieldValue < assoLow
							? yFieldValue
							: assoLow;

					// set ld reference variant
					if (this.renderConfig.features.includes("LD")) {
						this.gatheredData[group].ldReference.variant =
							assoHi == null
								? p[this.renderConfig.renderBy]
								: yFieldValue > assoHi
								? p[this.renderConfig.renderBy]
								: this.gatheredData[group].ldReference.variant;

						//gather population IDs for the next step, setting LD population
						populationsObj[group] = !!populationsObj[group]
							? populationsObj[group]
							: [];

						populationsObj[group].push(
							p[this.renderConfig.ldPopulation.value]
						);
					}
				});

				if (this.renderConfig.features.includes("LD")) {
					this.plotsList.map((p) => {
						if (
							this.gatheredData[p].ldReference.ldPopulation ==
							null
						) {
							let ldPopulationArr = [
								...new Set(populationsObj[p]),
							];
							this.gatheredData[p].ldReference.ldPopulation =
								ldPopulationArr.length == 1
									? ldPopulationArr[0]
									: "ALL";
						}
					});
				}

				return this.gatheredData;
			}
		},
	},
	watch: {
		associationData(DATA) {
			if (this.renderConfig.features.includes("LD")) {
				this.callLD();
			}
		},
		renderingData(DATA) {
			this.renderRegionPlots();
		},
	},
	methods: {
		onResize() {},
		renderRegionPlots() {
			console.log("this.gatheredData", this.gatheredData);

			//console.log("plotLayout", this.plotLayout);
			var assoCanvasWidth = !!document.querySelector(
				".association-plot-wrapper"
			)
				? document.querySelector(".association-plot-wrapper")
						.offsetWidth
				: null;

			var ldCanvasWidth = !!document.querySelector(".ld-plot-wrapper")
				? document.querySelector(".ld-plot-wrapper").offsetWidth
				: null;

			var canvasHeight = !!this.renderConfig.height
				? this.renderConfig.height
				: 200;

			var assoPlotWidth =
				assoCanvasWidth - this.plotLayout.leftMargin * 2;

			var ldPlotWidth =
				ldCanvasWidth -
				(this.plotLayout.leftMargin + this.plotLayout.rightMargin);

			var plotHeight =
				canvasHeight -
				(this.plotLayout.topMargin + this.plotLayout.bottomMargin);

			if (assoCanvasWidth != null) {
				for (const [groupKey, groupValue] of Object.entries(
					this.gatheredData
				)) {
					let canvasId =
						this.pkgID + "_" + groupKey + "_associationPlot";

					let c = document.getElementById(canvasId);

					if (!!c) {
						c.setAttribute("width", assoCanvasWidth);
						c.setAttribute("height", canvasHeight);
						let ctx = c.getContext("2d");

						ctx.clearRect(0, 0, assoCanvasWidth, canvasHeight);

						this.renderAxis(
							"association",
							ctx,
							assoPlotWidth,
							plotHeight,
							this.region.start,
							this.region.end,
							0,
							Math.ceil(groupValue.associationHi),
							this.renderConfig.xAxisLabel,
							this.renderConfig.yAxisLabel
						);

						if (!!this.recombData.position) {
							this.renderSignal(
								ctx,
								assoPlotWidth,
								plotHeight,
								this.region.start,
								this.region.end,
								groupKey
							);
						}
					}
				}
			}

			if (ldCanvasWidth != null) {
				for (const [groupKey, groupValue] of Object.entries(
					this.gatheredData
				)) {
					let canvasId = this.pkgID + "_" + groupKey + "_ldPlot";

					let c = document.getElementById(canvasId);

					if (!!c) {
						c.setAttribute("width", ldCanvasWidth);
						c.setAttribute("height", canvasHeight);
						let ctx = c.getContext("2d");

						ctx.clearRect(0, 0, ldCanvasWidth, canvasHeight);

						this.renderAxis(
							"LD",
							ctx,
							ldPlotWidth,
							plotHeight,
							0,
							1,
							0,
							Math.ceil(groupValue.associationHi),
							"LD",
							this.renderConfig.yAxisLabel
						);
					}
				}
			}
		},
		renderDots(CTX, GROUP) {
			console.log("group:", GROUP);
		},
		renderSignal(CTX, PWIDTH, PHEIGHT, START, END, GROUP) {
			var DATA = this.recombData;
			var xPixel = (PWIDTH - 10) / (END - START);
			var yPixel = (PHEIGHT - 5) / 100;
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#0056B3";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			DATA.position.map((xPos, xPosIndex) => {
				let x1PosPixel = (xPos - START) * xPixel;
				let y1PosPixel = DATA.recomb_rate[xPosIndex] * yPixel;
				let x2PosPixel =
					(DATA.position[xPosIndex + 1] - START) * xPixel;
				let y2PosPixel = DATA.recomb_rate[xPosIndex + 1] * yPixel;

				CTX.moveTo(
					this.plotLayout.leftMargin + 5 + x1PosPixel,
					this.plotLayout.topMargin + PHEIGHT - y1PosPixel
				);
				CTX.lineTo(
					this.plotLayout.leftMargin + 5 + x2PosPixel,
					this.plotLayout.topMargin + PHEIGHT - y2PosPixel
				);
				CTX.stroke();
			});

			this.renderDots(CTX, GROUP);
		},
		renderAxis(
			plotType,
			CTX,
			plotWidth,
			plotHeight,
			xMin,
			xMax,
			yMin,
			yMax,
			xLabel,
			yLabel
		) {
			CTX.beginPath();
			CTX.lineWidth = 1;
			CTX.strokeStyle = "#000000";
			CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

			// render y axis
			CTX.moveTo(this.plotLayout.leftMargin, this.plotLayout.topMargin);
			CTX.lineTo(
				this.plotLayout.leftMargin,
				plotHeight + this.plotLayout.topMargin + 5
			);

			CTX.stroke();

			// render recombination Rate y axis
			if (plotType == "association") {
				CTX.moveTo(
					this.plotLayout.leftMargin + plotWidth,
					this.plotLayout.topMargin
				);
				CTX.lineTo(
					this.plotLayout.leftMargin + plotWidth,
					plotHeight + this.plotLayout.topMargin + 5
				);

				CTX.stroke();
			}

			//render x axis
			CTX.moveTo(
				this.plotLayout.leftMargin,
				plotHeight + this.plotLayout.topMargin + 5
			);
			CTX.lineTo(
				plotWidth + this.plotLayout.leftMargin,
				plotHeight + this.plotLayout.topMargin + 5
			);
			CTX.stroke();

			// Y ticks
			let yStep = (yMax - yMin) / 4;
			let yTickDistance = plotHeight / 4;
			for (let i = 0; i < 5; i++) {
				let tickYPos = this.plotLayout.topMargin + i * yTickDistance;
				let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(this.plotLayout.leftMargin - 5, adjTickYPos);
				CTX.lineTo(this.plotLayout.leftMargin, adjTickYPos);
				CTX.stroke();

				CTX.font = "12px Arial";
				CTX.textAlign = "right";
				CTX.fillStyle = "#000000";

				CTX.fillText(
					yMin + i * yStep,
					this.plotLayout.leftMargin - 10,
					this.plotLayout.topMargin +
						plotHeight +
						5 -
						i * yTickDistance
				);
			}

			// render recombination Rate y ticks
			if (plotType == "association") {
				let yStep = 20;
				let yTickDistance = plotHeight / 5;
				for (let i = 0; i < 6; i++) {
					let tickYPos =
						this.plotLayout.topMargin + i * yTickDistance;
					let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
					CTX.moveTo(
						this.plotLayout.leftMargin + plotWidth,
						adjTickYPos
					);
					CTX.lineTo(
						this.plotLayout.leftMargin + plotWidth + 5,
						adjTickYPos
					);
					CTX.stroke();

					CTX.font = "12px Arial";
					CTX.textAlign = "left";
					CTX.fillStyle = "#000000";

					CTX.fillText(
						yMin + i * yStep,
						this.plotLayout.leftMargin + plotWidth + 10,
						this.plotLayout.topMargin +
							plotHeight +
							5 -
							i * yTickDistance
					);
				}
			}

			// X ticks
			let xStep = plotType == "LD" ? 0.2 : Math.ceil((xMax - xMin) / 5);
			let xTickDistance =
				plotType == "association"
					? (plotWidth - 10) / 5
					: (plotWidth - 5) / 5;

			for (let i = 0; i < 6; i++) {
				let tickXPos =
					this.plotLayout.leftMargin + i * xTickDistance + 5;
				let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
				CTX.moveTo(
					adjTickXPos,
					this.plotLayout.topMargin + plotHeight + 5
				);
				CTX.lineTo(
					adjTickXPos,
					this.plotLayout.topMargin + plotHeight + 10
				);
				CTX.stroke();

				CTX.font = "12px Arial";
				CTX.textAlign = "center";
				CTX.fillStyle = "#000000";
				let positionLabel =
					plotType == "LD"
						? i < 5
							? i == 0
								? 0
								: (xMin + i * xStep).toFixed(1)
							: xMax
						: i < 5
						? xMin + i * xStep
						: xMax;

				CTX.fillText(
					positionLabel,
					adjTickXPos,
					this.plotLayout.topMargin + plotHeight + 25
				);

				if (plotType == "LD" && i < 5) {
					CTX.fillStyle = this.ldColor[i];
					CTX.fillRect(
						adjTickXPos + 1,
						this.plotLayout.topMargin,
						xTickDistance - 1,
						plotHeight
					);
					//CTX.fillRect(position, this.topMargin, xStep, plotHeight);
				}
			}

			//Render y axis label
			CTX.font = "14px Arial";
			CTX.textAlign = "center";
			CTX.fillStyle = "#000000";
			CTX.rotate(-(Math.PI * 2) / 4);
			CTX.fillText(
				yLabel,
				-(this.plotLayout.topMargin + plotHeight / 2),
				this.plotLayout.leftMargin - this.plotLayout.leftMargin / 2 - 14
			);

			//Render recombination rate label
			if (plotType == "association") {
				CTX.font = "14px Arial";
				CTX.textAlign = "center";
				CTX.fillStyle = "#000000";
				//CTX.rotate(-(Math.PI * 2) / 4);
				CTX.fillText(
					"Recombination Rate (cM/Mb)",
					-(this.plotLayout.topMargin + plotHeight / 2),
					this.plotLayout.leftMargin + plotWidth + 50
				);
			}

			//Render x axis label
			CTX.rotate((-(Math.PI * 2) / 4) * 3);
			CTX.fillText(
				xLabel,
				this.plotLayout.leftMargin + plotWidth / 2,
				this.plotLayout.topMargin +
					this.plotLayout.bottomMargin +
					plotHeight -
					1
			);
		},
		callLD() {
			//console.log("callLD is called", this.gatheredData);
			for (const [key, value] of Object.entries(this.gatheredData)) {
				this.getLDData(
					value.ldReference.variant,
					value.ldReference.ldPopulation,
					key
				);
			}
		},
		callSignal() {
			this.getSignalData();
		},
		async getLDData(REF_VARIANT, ANCESTRY, GROUP) {
			let ldURL =
				"https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations/" +
				ANCESTRY +
				"/variants?correlation=rsquare&variant=" +
				REF_VARIANT +
				"&chrom=" +
				this.region.chr +
				"&start=" +
				this.region.start +
				"&stop=" +
				this.region.end +
				"&limit=100000";

			let ldJson = await fetch(ldURL).then((resp) => resp.json());

			if (ldJson.error == null) {
				this.gatheredData[GROUP].LD = {};
				ldJson.data.variant2.map((v, vIndex) => {
					this.gatheredData[GROUP].LD[v] =
						ldJson.data.correlation[vIndex];
				});
			}
		},
		async getSignalData() {
			var signalURL =
				"https://portaldev.sph.umich.edu/api/v1/annotation/recomb/results/?filter=id in 15 and chromosome eq '" +
				this.region.chr +
				"' and position gt " +
				this.region.start +
				" and position lt " +
				this.region.end;

			var signalJson = await fetch(signalURL).then((resp) => resp.json());

			if (signalJson.error == null) {
				console.log("feeding recomb_data");
				this.recombData["position"] = signalJson.data.position;
				this.recombData["recomb_rate"] = signalJson.data.recomb_rate;
			}
		},
	},
});
</script>

<style>
.association-plot-wrapper,
.ld-plot-wrapper {
	padding: 0 !important;
}
</style>

