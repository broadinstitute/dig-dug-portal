<template>
	<div class="mbm-plot-content kp-region-viewer-wrapper">
		<div
			class="kp-region-viewer-wrapper"
			v-for="item in plotsList"
			v-if="plotsList != null"
		>
			<h5 v-html="item"></h5>
			<div class="row">
				<div
					class="col-md-9 association-plot-wrapper"
					:id="pkgID + '_' + item + '_associationPlot_wrapper'"
				>
					<canvas
						:id="pkgID + '_' + item + '_associationPlot'"
						width=""
						height=""
					>
					</canvas>
				</div>
				<div
					class="col-md-3 ld-plot-wrapper"
					:id="pkgID + '_' + item + '_ldPlot_wrapper'"
				>
					<canvas
						:id="pkgID + '_' + item + '_ldPlot'"
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
			state: {
				assoData: null,
				ldData: [],
				recombData: null,
			},

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
	},
	beforeDestroy() {
		window.removeEventListener("resize", this.onResize);
	},
	computed: {
		ldDataLoaded() {
			return this.state.ldData;
		},
		recombinationData() {
			return this.state.recombData;
		},
		plotsList() {
			if (this.plotData != null) {
				let plotsKeys = this.plotData.map(
					(p) => p[this.renderConfig.plotsBy]
				);

				plotsKeys = [...new Set(plotsKeys)];

				return plotsKeys;
			} else {
				return null;
			}
		},
		associationData() {
			if (this.plotsList != null) {
				let assoData = {};
				/// add each plotting groups data wrappers to assoData
				this.plotsList.map((p) => {
					assoData[p] = {};
					assoData[p]["association"] = {};
					assoData[p]["associationHi"] = null;
					assoData[p]["associationLow"] = null;

					//set this.gateredData object for LD & recombination rate, or any other features in the future
					if (this.renderConfig.features.length > 0) {
						this.renderConfig.features.map((f) => {
							assoData[p][f] = {};
							if (f == "LD") {
								assoData[p]["ldReference"] = {
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
					let group = p[this.renderConfig.plotsBy];

					let xFieldValue = p[this.renderConfig.xAxisField];
					let yFieldValue = p[this.renderConfig.yAxisField];

					let tempObj = {};
					tempObj[this.renderConfig.xAxisField] = xFieldValue;
					tempObj[this.renderConfig.yAxisField] = yFieldValue;

					this.renderConfig.hoverContent.map((h) => {
						tempObj[h] = p[h];
					});
					assoData[group].association[p[this.renderConfig.renderBy]] =
						tempObj;

					// set high and low values of association data
					// set association high
					let assoHi = assoData[group].associationHi;
					assoData[group].associationHi =
						assoHi == null
							? yFieldValue
							: yFieldValue > assoHi
							? yFieldValue
							: assoHi;
					// set association low
					let assoLow = assoData[group].associationLow;

					assoData[group].associationLow =
						assoLow == null
							? yFieldValue
							: yFieldValue < assoLow
							? yFieldValue
							: assoLow;

					// set ld reference variant
					if (this.renderConfig.features.includes("LD")) {
						assoData[group].ldReference.variant =
							assoHi == null
								? p[this.renderConfig.renderBy]
								: yFieldValue > assoHi
								? p[this.renderConfig.renderBy]
								: assoData[group].ldReference.variant;

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
						if (assoData[p].ldReference.ldPopulation == null) {
							let ldPopulationArr = [
								...new Set(populationsObj[p]),
							];
							assoData[p].ldReference.ldPopulation =
								ldPopulationArr.length == 1
									? ldPopulationArr[0]
									: "ALL";
						}
					});
				}

				return assoData;
			}
		},
	},
	watch: {
		plotsList(DATA) {
			// this one can be removed later
			if (DATA != null) {
			}
		},
		associationData(DATA) {
			this.state.assoData = DATA;
			this.callLD();
		},
		ldDataLoaded(DATA) {
			this.callSignal();
		},
		recombinationData(DATA) {
			if (this.state.ldData.length == this.plotsList.length) {
				this.renderRegionPlots();
			}
		},
	},
	methods: {
		onResize() {},
		renderRegionPlots() {
			console.log("this.renderRegionPlots() called");
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
					this.state.assoData
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

						if (!!this.state.recombData.position) {
							this.renderSignal(
								ctx,
								assoPlotWidth,
								plotHeight,
								this.region.start,
								this.region.end,
								groupKey
							);
						}

						this.renderDots(ctx, groupKey);
					}
				}
			}

			if (ldCanvasWidth != null) {
				for (const [groupKey, groupValue] of Object.entries(
					this.state.assoData
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
			console.log("renderDots called");
			console.log("asso data", this.state.assoData[GROUP].association);
		},
		renderSignal(CTX, PWIDTH, PHEIGHT, START, END, GROUP) {
			console.log("renderSignal called");
			var DATA = this.state.recombData;
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
					this.plotLayout.leftMargin + 5 + x1PosPixel,
					this.plotLayout.topMargin + PHEIGHT - y1PosPixel
				);
				CTX.lineTo(
					this.plotLayout.leftMargin + 5 + x2PosPixel,
					this.plotLayout.topMargin + PHEIGHT - y2PosPixel
				);
				CTX.stroke();
			});
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
			this.state.ldData = [];
			this.plotsList.map((group) => {
				//this.state.ldData[group] = {};
			});

			let index = 0;
			this.plotsList.map((group) => {
				this.getLDData(
					this.state.assoData[group].ldReference.variant,
					this.state.assoData[group].ldReference.ldPopulation,
					group
				);
			});
			/*for (const [key, value] of Object.entries(this.state.assoData)) {
				if (index == 0) {
					this.getLDData(
						value.ldReference.variant,
						value.ldReference.ldPopulation,
						key
					);
					index++;
				}
			}*/
		},
		callSignal() {
			this.getSignalData();
		},
		async getLDData(REF_VARIANT, ANCESTRY, GROUP) {
			//check if ld data exist
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
				let tempObj = {};
				tempObj["group"] = GROUP;
				tempObj["refVariant"] = ldJson.data.variant1[0];
				tempObj["variants"] = {};
				ldJson.data.variant2.map((variant, variantIndex) => {
					tempObj["variants"][variant] =
						ldJson.data.correlation[variantIndex];
				});

				this.state.ldData.push(tempObj);
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
				this.state.recombData = {};
				this.state.recombData["position"] = signalJson.data.position;
				this.state.recombData["recomb_rate"] =
					signalJson.data.recomb_rate;
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

