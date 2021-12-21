<template>
	<div
		class="mbm-plot-content row"
		v-if="searchingRegion != null && searchingPhenotype != null"
	>
		<div class="col-md-12 CS-plot-wrapper">
			<div class="col-md-9" id="CSPlotWrapper">
				<div id="CSInfoBox" class="hidden"></div>
				<canvas
					id="CSPlot"
					:class="
						Object.keys(CSData).length > 0
							? 'CS-plot'
							: 'CS-empty-plot'
					"
					width=""
					height=""
				></canvas>
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
				<div style="padding-bottom: 40px !important">
					<template v-for="c in credibleSets">
						<span
							class="CS-bubble"
							v-html="c.credibleSetId + ', ' + c.phenotype"
							:style="
								'background-color:' +
								getColorIndex(
									c.credibleSetId + ', ' + c.phenotype
								) +
								';'
							"
							:key="c.credibleSetId + ', ' + c.phenotype"
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
	],
	data() {
		return { credibleSets: [], CSData: {}, spaceBy: 7 };
	},
	modules: {
		uiUtils,
		Formatters,
		keyParams,
	},
	components: {},
	mounted: function () {
		window.addEventListener("resize", this.onResize);
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
				phenotype = this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig.phenotypeParameter]) {
					phenotype = keyParams[this.renderConfig.phenotypeParameter];
				} else {
					phenotype = null;
				}
			}

			if (phenotype != null) {
				this.getCredibleSetsList(returnObj, phenotype);
			}

			return returnObj;
		},
		searchingPhenotype() {
			let phenotype = null;
			if (this.phenotype != null) {
				phenotype = this.phenotype;
			} else if (this.phenotype == null) {
				if (!!keyParams[this.renderConfig.phenotypeParameter]) {
					phenotype = keyParams[this.renderConfig.phenotypeParameter];
				} else {
					phenotype = null;
				}
			}
			return phenotype;
		},
	},
	watch: {},
	methods: {
		...uiUtils,
		onResize(e) {},
		getColorIndex(CS) {
			let CSArry = this.credibleSets.map(
				(c) => c.credibleSetId + ", " + c.phenotype
			);

			let i = CSArry.indexOf(CS);
			return this.compareGroupColors[i];
		},
		renderCSPlot() {
			console.log("this.CSData", this.CSData);
			let canvas = document.querySelector("#CSPlot");
			let wrapper = document.querySelector("#CSPlotWrapper");

			let perPhenotype = 50;
			let phenotypeTitleH = this.spaceBy * 2;
			let btwnPhenotype = this.spaceBy * 7;
			let bump = this.plotMargin.bump;

			let canvasWidth = wrapper.clientWidth;
			let canvasHeight = this.plotMargin.topMargin;

			let plotWidth = canvasWidth - 30 - this.plotMargin.leftMargin * 2; //-30 for side paddings
			let plotHeight = perPhenotype;
			let xPerPixel =
				plotWidth /
				(this.searchingRegion.end - this.searchingRegion.start);

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

			for (const [phenotype, credibleSets] of Object.entries(
				this.CSData
			)) {
				ctx.font = "14px Arial";
				ctx.textAlign = "left";
				ctx.fillStyle = "#000000";
				ctx.fillText(phenotype, bump, renderHeight + this.spaceBy);

				renderHeight += phenotypeTitleH;

				this.renderAxis(
					ctx,
					plotWidth,
					plotHeight,
					this.searchingRegion.end,
					this.searchingRegion.start,
					renderHeight,
					bump
				);

				for (const [CSID, credibleSet] of Object.entries(
					credibleSets
				)) {
					let inRegion = 0;
					credibleSet.map((v) => {
						if (
							v.position >= this.searchingRegion.start &&
							v.position <= this.searchingRegion.end
						) {
							let xPos =
								(v.position - this.searchingRegion.start) *
									xPerPixel +
								this.plotMargin.leftMargin;
							let yPos =
								renderHeight +
								plotHeight -
								v.posteriorProbability * yPerPixel;
							let colorID = v.credibleSetId + ", " + v.phenotype;
							let dotColor = this.getColorIndex(colorID);

							this.renderDot(ctx, xPos, yPos, dotColor);

							inRegion++;
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
				let positionLabel = i < 5 ? xMin + i * xStep : xMax;
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
			console.log("value", event.target.value);
			let valueArr = event.target.value.split(",");

			let CSID = valueArr[0];
			let phenotype = valueArr[1];

			let CSServer =
				this.renderConfig.credibleSetsServer == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig.credibleSetsServer;

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

				this.CSData[phenotype][CSID] = CSJson.data;

				this.renderCSPlot();
			}
		},
		async getCredibleSetsList(REGION, PHENOTYPE) {
			console.log("CS called");

			let CSServer =
				this.renderConfig.credibleSetsServer == "KP BioIndex"
					? "https://bioindex.hugeamp.org/api/bio"
					: this.renderConfig.credibleSetsServer;

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
				}

				CSJson.data.map((CS) => {
					this.credibleSets.push(CS);
				});
			}

			//console.log("this.credibleSets", this.credibleSets);
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
	display: block;
	font-size: 12px;
	margin-left: 3px;
	margin-right: 3px;
	padding: 0px 3px;
	border-radius: 5px;
	float: left;
	margin-bottom: 3px;
}
</style>



