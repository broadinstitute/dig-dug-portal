<template>
	<div class="mbm-plot-content row">
		<div class="col-md-12 phewas-plot-wrapper">
			<div
				class="col-md-12"
				id="pheWasPlotWrapper"
				style="display: inline-block"
			>
				<canvas id="pheWasPlot" width="" height=""></canvas>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import dataConvert from "@/utils/dataConvert";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";
import keyParams from "@/utils/keyParams";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-phewas-plot", {
	props: [
		"phenotypeMap",
		"phenotypesData",
		"renderConfig",
		"pkgData",
		"pkgDataSelected",
		"colors",
		"plotMargin",
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
	mounted: function () {
		//window.addEventListener("resize", this.onResize);
		this.renderPheWas();
	},
	beforeDestroy() {
		//window.removeEventListener("resize", this.onResize);
	},
	computed: {
		renderData() {
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

			this.phenotypesData.map((p) => {
				if (!!this.phenotypeMap[p.phenotype]) {
					if (p.phenotype == "HEIGHT") {
						console.log("height");
					}
					let group = this.phenotypeMap[p.phenotype].group;
					phenotypeGroupsObj[group].push(p);
				}
			});

			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) => (a.pValue > b.pValue ? 1 : -1));
			}
			this.trigger--;
			return phenotypeGroupsObj;
		},
	},
	watch: {},
	methods: {
		...uiUtils,
		renderPheWas() {
			let wrapper = document.querySelector("#pheWasPlotWrapper");
			let canvas = document.querySelector("#pheWasPlot");

			if (!!canvas && !!wrapper) {
				let canvasWidth = wrapper.clientWidth;
				let canvasHeight = this.renderConfig["height"];

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
				c = document.querySelector("#pheWasPlot");
				c.setAttribute("width", canvasWidth);
				c.setAttribute("height", canvasHeight);
				ctx = c.getContext("2d");

				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				let minY = null;
				let maxY = null;

				for (const [key, value] of Object.entries(this.renderData)) {
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
					-Math.log10(minY)
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

				let groups = {};

				for (const [key, value] of Object.entries(this.renderData)) {
					groups[key] = value.length;
				}

				this.renderTicksByGroup(
					ctx,
					canvasWidth,
					canvasHeight,
					plotMargin,
					"x",
					groups
				);

				let totalNum = 0;
				for (const [key, value] of Object.entries(groups)) {
					totalNum += value;
				}
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

				for (const [key, value] of Object.entries(this.renderData)) {
					let keyIndex = groupsArr.indexOf(key) % this.colors.length;
					let fillColor = this.colors[keyIndex];
					let strokeColor = "#00000075"; //this.colors[keyIndex];

					let labelIndex = 0;
					let labelOrigin = 0;
					value.map((p) => {
						let xPos = plotMargin.left + xStep * dotIndex;

						let yPos =
							canvasHeight -
							plotMargin.bottom +
							Math.round(-Math.log10(p.pValue)) * yStep;
						this.renderTriangle(
							ctx,
							xPos,
							yPos,
							fillColor,
							strokeColor,
							Math.sign(p.beta),
							this.phenotypeMap[p.phenotype]["description"]
						);
						if (labelIndex == 0) {
							labelOrigin = xPos;
						}

						if (p.pValue <= 2.5e-6) {
							let labelXpos = labelOrigin + 12 * labelIndex;
							let pName =
								this.phenotypeMap[p.phenotype]["description"];
							ctx.font = "11px Arial";
							ctx.fillStyle = "#000000";

							if (labelIndex < 5) {
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
						}
						dotIndex++;
					});
					keyIndex++;
				}
				/// render guide line
				let guidelineYpos =
					canvasHeight -
					plotMargin.bottom +
					Math.round(-Math.log10(2.5e-6)) * yStep;
				ctx.setLineDash([10, 5]);
				ctx.moveTo(plotMargin.left - plotMargin.bump, guidelineYpos);
				ctx.lineTo(
					canvasWidth + plotMargin.bump - plotMargin.right,
					guidelineYpos
				);
				ctx.strokeStyle = "#00000050";
				ctx.stroke();
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
			console.log(LABEL);
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
</style>



