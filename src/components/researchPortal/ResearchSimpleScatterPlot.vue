<template>
	<div class="scatter-plot-content">
		<div
			v-if="colorLegend.length > 0"
			ref="legend"
			class="plot-legend"
		>
			<div
				v-for="entry in colorLegend"
				:key="entry.value"
				class="legend-item"
				@mouseenter="hoveredLegendValue = entry.value"
				@mouseleave="hoveredLegendValue = null"
			>
				<span
					class="legend-dot"
					:style="{ backgroundColor: entry.color }"
				></span>
				<span>{{ entry.value }}</span>
			</div>
		</div>
		<div
			:id="'clicked_dot_value' + sectionId"
			class="clicked-dot-value hidden"
		></div>
		<canvas
			v-if="!!renderConfig"
			:id="'simpleScatterPlot' + sectionId"
			class="scatter-plot"
			@mouseleave="hidePanel"
			@mousemove="checkPosition"
			:width="renderConfig.width * 2 + 240"
			:height="renderConfig.height * 2 + 240"
			:style="
				'width:' +
				(renderConfig.width + 120) +
				'px;height:' +
				(renderConfig.height + 120) +
				'px;'
			"
		>
		</canvas>
		<div class="download-images-setting">
			<span class="btn btn-default options-gear">
				Download <b-icon icon="download"></b-icon>
			</span>
			<ul class="options">
				<li>
					<a
						href="javascript:;"
						@click="
							downloadImage(
								'simpleScatterPlot' + sectionId,
								sectionId + '_simpleScatterPlot',
								'png'
							)
						"
						>Download PNG</a
					>
				</li>
			</ul>
		</div>
		<div
			v-if="!!renderConfig.label"
			class="scatter-plot-label"
			v-html="renderConfig.label"
		></div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import defaultColors from "@/utils/colors";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-simple-scatter-plot", {
	props: ["plotData", "renderConfig", "utils", "sectionId", "colors"],
	data() {
		return {
			posData: {},
			hoveredLegendValue: null,
		};
	},
	computed: {
		adjPlotMargin() {
			let customPlotMargin = !!this.renderConfig["plot margin"]
				? this.renderConfig["plot margin"]
				: null;

			return !!customPlotMargin
				? {
						left: customPlotMargin.left,
						right: customPlotMargin.right,
						top: customPlotMargin.top,
						bottom: customPlotMargin.bottom,
						bump: !!customPlotMargin.bump ? customPlotMargin.bump : 5,
				  }
				: {
						left: 80,
						right: 20,
						top: 20,
						bottom: 60,
						bump: 5,
				  };
		},
		colorByField() {
			const colorBy = this.renderConfig["color by"];
			if (!colorBy) {
				return null;
			}
			if (Array.isArray(colorBy)) {
				const first = colorBy[0];
				return typeof first === "object" ? first.field : first;
			}
			return colorBy;
		},
		palette() {
			return (
				this.colors?.moderate ||
				this.renderConfig.colors ||
				defaultColors
			);
		},
		colorScaleMap() {
			if (!this.colorByField) {
				return {};
			}
			const values = [
				...new Set(
					(this.plotData || [])
						.map((row) => row[this.colorByField])
						.filter((value) => value != null && value !== "")
				),
			].sort();
			const map = {};
			values.forEach((value, index) => {
				map[value] = this.palette[index % this.palette.length];
			});
			return map;
		},
		colorLegend() {
			return Object.entries(this.colorScaleMap).map(([value, color]) => ({
				value,
				color,
			}));
		},
		renderData() {
			let rawData = this.plotData || [];
			let massagedData = [];

			rawData.map((r) => {
				let tempObj = {};
				tempObj[this.renderConfig["render by"]] =
					r[this.renderConfig["render by"]];
				tempObj[this.renderConfig["x axis field"]] =
					r[this.renderConfig["x axis field"]];
				tempObj[this.renderConfig["y axis field"]] =
					r[this.renderConfig["y axis field"]];
				if (this.colorByField) {
					tempObj[this.colorByField] = r[this.colorByField];
				}
				this.renderConfig["on hover"]?.forEach((item) => {
					tempObj[item] = r[item];
				});
				massagedData.push(tempObj);
			});

			return massagedData;
		},
	},
	watch: {
		renderData() {
			this.clearPlot();
			this.renderPlot();
		},
		hoveredLegendValue() {
			this.clearPlot();
			this.renderPlot();
		},
	},
	mounted() {
		this.renderPlot();
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			this.utils.uiUtils.downloadImg(ID, NAME, TYPE);
		},
		hidePanel() {
			this.utils.uiUtils.hideElement("clicked_dot_value" + this.sectionId);
		},
		checkPosition(event) {
			let wrapper = document.getElementById(
				"clicked_dot_value" + this.sectionId
			);
			wrapper.classList.remove("hidden");

			let e = event;
			var rect = document
				.getElementById("simpleScatterPlot" + this.sectionId)
				.getBoundingClientRect();
			var x = Math.floor(e.clientX - rect.left);
			var y = Math.floor(e.clientY - rect.top);

			let canvas = document.getElementById(
				"simpleScatterPlot" + this.sectionId
			);

			wrapper.style.top = y + canvas.offsetTop + "px";
			wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

			let clickedDotValue = "";

			for (let h = -3; h <= 3; h++) {
				if (!!this.posData[x + h]) {
					for (let v = -3; v <= 3; v++) {
						if (!!this.posData[x + h][y + v]) {
							this.posData[x + h][y + v].map((g, i) => {
								const hoverLabel =
									this.renderConfig["on hover"][i];
								const labelHtml = hoverLabel
									? `<b>${hoverLabel}:</b> `
									: "";
								clickedDotValue +=
									`<span class="gene-on-clicked-dot-scatter">
									${labelHtml}
									${g}
									</span><br>`;
							});

							clickedDotValue += this.renderConfig["on hover"]
								? "<hr>"
								: "";
						}
					}
				}
			}

			if (clickedDotValue != "") {
				wrapper.innerHTML = clickedDotValue;
				document
					.getElementById("simpleScatterPlot" + this.sectionId)
					.classList.add("hover");
			} else {
				wrapper.innerHTML = clickedDotValue;
				wrapper.classList.add("hidden");
				document
					.getElementById("simpleScatterPlot" + this.sectionId)
					.classList.remove("hover");
			}
		},
		clearPlot() {
			var c = document.getElementById(
				"simpleScatterPlot" + this.sectionId
			);
			if (!c) {
				return;
			}
			var ctx = c.getContext("2d");
			ctx.clearRect(
				0,
				0,
				this.renderConfig.width * 2 + 240,
				this.renderConfig.height * 2 + 240
			);
			this.posData = {};
		},
		dotFillStyle(row) {
			const defaultColor =
				this.renderConfig["default dot color"] || "#00000080";

			if (!this.colorByField) {
				return defaultColor;
			}

			const category = row[this.colorByField];
			const baseColor =
				this.colorScaleMap[category] || defaultColor;

			if (
				this.hoveredLegendValue != null &&
				category !== this.hoveredLegendValue
			) {
				return "#80808014";
			}

			return this.withAlpha(baseColor);
		},
		withAlpha(color, alphaSuffix = "CC") {
			if (!color) {
				return "#00000080";
			}
			if (String(color).length === 9) {
				return color;
			}
			return `${color}${alphaSuffix}`;
		},
		renderPlot() {
			if (!this.renderData.length || !this.renderConfig) {
				return;
			}

			let xAxisData = [];
			let yAxisData = [];

			let canvasWidth = this.renderConfig.width * 2;
			let canvasHeight = this.renderConfig.height * 2;
			let leftMargin = 74.5 * 2;
			let topMargin = 44.5 * 2;

			let xBump = canvasWidth * 0.04;
			let yBump = canvasHeight * 0.04;

			var c = document.getElementById(
				"simpleScatterPlot" + this.sectionId
			);
			if (!c) {
				return;
			}
			var ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth + 240, canvasHeight + 240);

			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000000";
			ctx.setLineDash([]);

			this.renderData.map((d) => {
				xAxisData.push(d[this.renderConfig["x axis field"]]);
				yAxisData.push(d[this.renderConfig["y axis field"]]);
			});

			let dotSizeMin = 8;

			let xMin = Math.min.apply(Math, xAxisData);
			let xMax = Math.max.apply(Math, xAxisData);
			let yMin = Math.min.apply(Math, yAxisData);
			let yMax = Math.max.apply(Math, yAxisData);

			let xAxisTicks = this.utils.uiUtils.getAxisTicks(xMin, xMax);
			let yAxisTicks = this.utils.uiUtils.getAxisTicks(yMin, yMax);

			ctx.moveTo(leftMargin, canvasHeight + topMargin + yBump);
			ctx.lineTo(
				canvasWidth + leftMargin + xBump,
				canvasHeight + topMargin + yBump
			);
			ctx.stroke();

			let xTickDistance = canvasWidth / 5;
			for (let i = 0; i < 6; i++) {
				ctx.moveTo(
					leftMargin + i * xTickDistance + xBump,
					topMargin + canvasHeight + yBump
				);
				ctx.lineTo(
					leftMargin + i * xTickDistance + xBump,
					canvasHeight + topMargin + 10 + yBump
				);
				ctx.stroke();

				ctx.font = "24px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000000";

				if (xAxisTicks.lo + i * xAxisTicks.step == 0) {
					ctx.fillText(
						0,
						leftMargin + i * xTickDistance + xBump,
						topMargin + canvasHeight + 34 + yBump
					);
				} else {
					ctx.fillText(
						this.utils.Formatters.floatFormatter(
							xAxisTicks.lo + i * xAxisTicks.step
						),
						leftMargin + i * xTickDistance + xBump,
						topMargin + canvasHeight + 34 + yBump
					);
				}
			}

			ctx.font = "28px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			ctx.fillText(
				this.renderConfig["x axis label"],
				leftMargin + canvasWidth / 2,
				topMargin + canvasHeight + 70 + yBump
			);

			ctx.moveTo(leftMargin, topMargin);
			ctx.lineTo(leftMargin, canvasHeight + topMargin + yBump);
			ctx.stroke();
			let yTickDistance = canvasHeight / 5;
			for (let i = 0; i < 6; i++) {
				ctx.moveTo(leftMargin - 5, topMargin + i * yTickDistance);
				ctx.lineTo(leftMargin, topMargin + i * yTickDistance);
				ctx.stroke();

				ctx.font = "24px Arial";
				ctx.textAlign = "right";
				ctx.fillStyle = "#000000";

				if (yAxisTicks.lo + yAxisTicks.step * i == 0) {
					ctx.fillText(
						0,
						leftMargin - 14,
						topMargin + (5 - i) * yTickDistance + 3
					);
				} else {
					ctx.fillText(
						this.utils.Formatters.floatFormatter(
							yAxisTicks.lo + yAxisTicks.step * i
						),
						leftMargin - 14,
						topMargin + (5 - i) * yTickDistance + 3
					);
				}
			}

			ctx.font = "28px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			ctx.rotate(-(90 * Math.PI) / 180);
			ctx.fillText(
				this.renderConfig["y axis label"],
				-(topMargin + canvasHeight / 2),
				leftMargin - 110
			);

			ctx.rotate((90 * Math.PI) / 180);
			let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
			let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;

			this.renderData.map((d) => {
				let xPos =
					leftMargin +
					xBump +
					canvasWidth *
						((d[this.renderConfig["x axis field"]] -
							xAxisTicks.lo) /
							(xPosMax - xAxisTicks.lo));
				let yPos =
					topMargin +
					canvasHeight -
					canvasHeight *
						((d[this.renderConfig["y axis field"]] -
							yAxisTicks.lo) /
							(yPosMax - yAxisTicks.lo));

				if (!this.posData[Math.round(xPos / 2)]) {
					this.posData[Math.round(xPos / 2)] = {};
				}

				this.posData[Math.round(xPos / 2)][Math.round(yPos / 2)] = [];

				if (this.renderConfig["on hover"]) {
					this.renderConfig["on hover"].forEach((item) => {
						this.posData[Math.round(xPos / 2)][
							Math.round(yPos / 2)
						].push(d[item]);
					});
				} else {
					this.posData[Math.round(xPos / 2)][
						Math.round(yPos / 2)
					].push(d[this.renderConfig["render by"]]);
				}

				ctx.fillStyle = this.dotFillStyle(d);
				ctx.lineWidth = 0;
				ctx.beginPath();
				ctx.arc(xPos, yPos, dotSizeMin, 0, 2 * Math.PI);
				ctx.fill();

				if (!!this.renderConfig["dot label score"]) {
					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.fillText(
						d[this.renderConfig["render by"]],
						xPos,
						yPos - 16
					);
				}
			});
		},
	},
});
</script>
<style>
#simpleScatterPlot.hover,
.scatter-plot.hover,
.scatter-plot:hover {
	cursor: pointer;
}

.scatter-plot-content {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.clicked-dot-value {
	position: absolute;
	background-color: #fff;
	border: solid 1px #aaa;
	box-shadow: 0 0 5px #00000075;
	font-size: 14px;
	padding: 8px 20px 8px 10px !important;
	max-width: 300px;
	border-radius: 5px;
	z-index: 10;
	width: auto;
}

.gene-on-clicked-dot-scatter {
	display: block;
	float: left;
	padding: 0 5px;
	text-align: left;
}

.plot-legend {
	margin-bottom: 10px;
	padding: 5px 0;
	line-height: 1;
	text-align: center;
	width: 100%;
}

.plot-legend .legend-item {
	display: inline-block;
	margin-right: 20px;
	margin-bottom: 5px;
	vertical-align: middle;
	cursor: pointer;
	white-space: nowrap;
}

.plot-legend .legend-item:hover {
	opacity: 0.7;
}

.plot-legend .legend-dot {
	display: inline-block;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	margin-right: 5px;
	vertical-align: middle;
}
</style>
