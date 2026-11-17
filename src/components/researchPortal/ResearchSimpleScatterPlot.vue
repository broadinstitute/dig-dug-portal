<template>
	<div class="scatter-plot-content">
		<div v-if="colorLegend.length > 0" class="plot-legend">
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
		<div class="scatter-plots-row">
			<div
				v-for="(plot, plotIndex) in resolvedPlots"
				:key="plotPanelKey(plot, plotIndex)"
				class="scatter-plot-panel"
			>
				<canvas
					v-if="!!plot.renderConfig"
					:id="canvasId(plotIndex)"
					class="scatter-plot"
					@mouseleave="onCanvasMouseLeave"
					@mousemove="checkPosition($event, plotIndex)"
					:width="plot.renderConfig.width * 2 + 240"
					:height="plot.renderConfig.height * 2 + 240"
					:style="canvasStyle(plot.renderConfig)"
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
										canvasId(plotIndex),
										downloadName(plotIndex),
										'png'
									)
								"
								>Download PNG</a
							>
						</li>
					</ul>
				</div>
				<div
					v-if="plot.title"
					class="scatter-plot-title"
				>
					{{ plot.title }}
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import defaultColors from "@/utils/colors";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-simple-scatter-plot", {
	props: {
		plotData: {
			type: Array,
			default: () => [],
		},
		data: {
			type: Array,
			default: null,
		},
		renderConfig: {
			type: Object,
			default: null,
		},
		plots: {
			type: Array,
			default: null,
		},
		utils: {
			type: Object,
			required: true,
		},
		sectionId: {
			type: String,
			required: true,
		},
		colors: {
			type: Object,
			default: null,
		},
		rowKeyField: {
			type: String,
			default: null,
		},
		linkedHoverKey: {
			type: String,
			default: null,
		},
	},
	data() {
		return {
			posDataByPlot: {},
			rowKeyToCanvasPos: {},
			hoveredLegendValue: null,
			localHoverActive: false,
			highlightedRowKey: null,
			activePlotIndex: null,
		};
	},
	computed: {
		sourcePlotData() {
			return this.plotData?.length ? this.plotData : this.data || [];
		},
		resolvedPlots() {
			if (Array.isArray(this.plots) && this.plots.length > 0) {
				return this.plots;
			}
			if (this.renderConfig) {
				return [
					{
						title:
							this.renderConfig.title ||
							this.renderConfig.label ||
							"",
						renderConfig: this.renderConfig,
					},
				];
			}
			return [];
		},
		adjPlotMargin() {
			const baseConfig = this.resolvedPlots[0]?.renderConfig;
			if (!baseConfig) {
				return {
					left: 80,
					right: 20,
					top: 20,
					bottom: 60,
					bump: 5,
				};
			}
			return this.plotMarginFor(baseConfig);
		},
		colorByField() {
			const explicit = this.renderConfig?.["color by"];
			const fromPlots = this.resolvedPlots[0]?.renderConfig?.["color by"];
			return this.colorByFieldFrom(explicit || fromPlots);
		},
		palette() {
			const baseConfig = this.resolvedPlots[0]?.renderConfig;
			return (
				this.colors?.moderate ||
				baseConfig?.colors ||
				defaultColors
			);
		},
		colorScaleMap() {
			if (!this.colorByField) {
				return {};
			}
			const values = [
				...new Set(
					(this.sourcePlotData || [])
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
	},
	watch: {
		plotData: {
			handler() {
				this.highlightedRowKey = null;
				this.scheduleRenderPlot();
			},
			deep: true,
		},
		plots: {
			handler() {
				this.scheduleRenderPlot();
			},
			deep: true,
		},
		renderConfig: {
			handler() {
				this.scheduleRenderPlot();
			},
			deep: true,
		},
		hoveredLegendValue() {
			this.highlightedRowKey = null;
			this.scheduleRenderPlot();
		},
		linkedHoverKey(rowKey) {
			if (this.localHoverActive) {
				return;
			}
			if (rowKey && this.rowKeyToCanvasPos[rowKey]) {
				this.setHighlightedRowKey(rowKey);
				this.showTooltipForRowKey(rowKey, false);
			} else if (!this.localHoverActive) {
				this.setHighlightedRowKey(null);
				this.hidePanel();
			}
		},
	},
	mounted() {
		this.scheduleRenderPlot();
	},
	methods: {
		plotPanelKey(plot, plotIndex) {
			return [
				this.sectionId,
				plotIndex,
				plot.title,
				plot.renderConfig?.["x axis field"],
			].join("-");
		},
		canvasId(plotIndex) {
			return `simpleScatterPlot${this.sectionId}_${plotIndex}`;
		},
		downloadName(plotIndex) {
			return `${this.sectionId}_simpleScatterPlot_${plotIndex}`;
		},
		canvasStyle(renderConfig) {
			return (
				"width:" +
				(renderConfig.width + 120) +
				"px;height:" +
				(renderConfig.height + 120) +
				"px;"
			);
		},
		plotMarginFor(renderConfig) {
			let customPlotMargin = !!renderConfig["plot margin"]
				? renderConfig["plot margin"]
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
		colorByFieldFrom(colorBy) {
			if (!colorBy) {
				return null;
			}
			if (Array.isArray(colorBy)) {
				const first = colorBy[0];
				return typeof first === "object" ? first.field : first;
			}
			return colorBy;
		},
		renderDataFor(renderConfig) {
			let rawData = this.sourcePlotData || [];
			let massagedData = [];

			rawData.map((r) => {
				let tempObj = {};
				tempObj[renderConfig["render by"]] =
					r[renderConfig["render by"]];
				tempObj[renderConfig["x axis field"]] =
					r[renderConfig["x axis field"]];
				tempObj[renderConfig["y axis field"]] =
					r[renderConfig["y axis field"]];
				if (this.colorByField) {
					tempObj[this.colorByField] = r[this.colorByField];
				}
				renderConfig["on hover"]?.forEach((item) => {
					tempObj[item] = r[item];
				});
				if (this.rowKeyField) {
					tempObj[this.rowKeyField] = r[this.rowKeyField];
				}
				massagedData.push(tempObj);
			});

			return massagedData;
		},
		scheduleRenderPlot() {
			this.$nextTick(() => {
				requestAnimationFrame(() => {
					this.clearPlot();
					this.renderAllPlots();
				});
			});
		},
		downloadImage(ID, NAME, TYPE) {
			this.utils.uiUtils.downloadImg(ID, NAME, TYPE);
		},
		hidePanel() {
			this.utils.uiUtils.hideElement("clicked_dot_value" + this.sectionId);
			this.resolvedPlots.forEach((_, plotIndex) => {
				const canvas = document.getElementById(this.canvasId(plotIndex));
				if (canvas) {
					canvas.classList.remove("hover");
				}
			});
		},
		onCanvasMouseLeave() {
			this.localHoverActive = false;
			this.activePlotIndex = null;
			this.setHighlightedRowKey(null);
			this.hidePanel();
			if (this.rowKeyField) {
				this.$emit("hover-key-change", null);
			}
		},
		setHighlightedRowKey(rowKey) {
			const nextKey = rowKey || null;
			if (nextKey === this.highlightedRowKey) {
				return;
			}
			this.highlightedRowKey = nextKey;
			this.scheduleRenderPlot();
		},
		drawHighlightRing(ctx, xPos, yPos, dotRadius) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(xPos, yPos, dotRadius + 6, 0, 2 * Math.PI);
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 5;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(xPos, yPos, dotRadius + 6, 0, 2 * Math.PI);
			ctx.strokeStyle = "#e07b39";
			ctx.lineWidth = 3;
			ctx.stroke();
			ctx.restore();
		},
		rowKeyForDatum(datum) {
			if (!this.rowKeyField || !datum) {
				return null;
			}
			const key = datum[this.rowKeyField];
			return key == null || key === "" ? null : String(key);
		},
		buildHoverHtml(datum, renderConfig) {
			if (!datum) {
				return "";
			}
			let clickedDotValue = "";
			if (renderConfig["on hover"]) {
				renderConfig["on hover"].forEach((item, i) => {
					const hoverLabel = item;
					const labelHtml = hoverLabel ? `<b>${hoverLabel}:</b> ` : "";
					clickedDotValue += `<span class="gene-on-clicked-dot-scatter">
					${labelHtml}
					${datum[item] ?? ""}
					</span><br>`;
					if (i < renderConfig["on hover"].length - 1) {
						clickedDotValue += "<hr>";
					}
				});
			} else {
				clickedDotValue = `<span class="gene-on-clicked-dot-scatter">${
					datum[renderConfig["render by"]] ?? ""
				}</span>`;
			}
			return clickedDotValue;
		},
		primaryEntryForRowKey(rowKey) {
			const entries = this.rowKeyToCanvasPos[rowKey];
			if (!entries || !entries.length) {
				return null;
			}
			if (this.activePlotIndex != null) {
				return (
					entries.find((e) => e.plotIndex === this.activePlotIndex) ||
					entries[0]
				);
			}
			return entries[0];
		},
		tooltipContainerRect() {
			const container = this.$el;
			return container ? container.getBoundingClientRect() : null;
		},
		positionTooltipAtClient(wrapper, clientX, clientY) {
			const containerRect = this.tooltipContainerRect();
			if (!wrapper || !containerRect) {
				return;
			}
			wrapper.style.top = `${clientY - containerRect.top}px`;
			wrapper.style.left = `${clientX - containerRect.left + 15}px`;
		},
		positionTooltipAtEntry(wrapper, entry) {
			const canvas = document.getElementById(
				this.canvasId(entry.plotIndex)
			);
			if (!wrapper || !canvas || !entry) {
				return;
			}
			const canvasRect = canvas.getBoundingClientRect();
			const dotClientX =
				canvasRect.left +
				(entry.xPos / canvas.width) * canvasRect.width;
			const dotClientY =
				canvasRect.top +
				(entry.yPos / canvas.height) * canvasRect.height;
			this.positionTooltipAtClient(wrapper, dotClientX, dotClientY);
		},
		showTooltipForRowKey(rowKey, emitChange = true) {
			const entry = this.primaryEntryForRowKey(rowKey);
			if (!entry) {
				return;
			}
			const wrapper = document.getElementById(
				"clicked_dot_value" + this.sectionId
			);
			const canvas = document.getElementById(this.canvasId(entry.plotIndex));
			if (!wrapper || !canvas) {
				return;
			}
			wrapper.classList.remove("hidden");
			this.positionTooltipAtEntry(wrapper, entry);
			wrapper.innerHTML = this.buildHoverHtml(
				entry.row,
				this.resolvedPlots[entry.plotIndex].renderConfig
			);
			canvas.classList.add("hover");
			if (emitChange && this.rowKeyField) {
				this.$emit("hover-key-change", rowKey);
			}
		},
		checkPosition(event, plotIndex) {
			this.activePlotIndex = plotIndex;
			const renderConfig = this.resolvedPlots[plotIndex]?.renderConfig;
			if (!renderConfig) {
				return;
			}

			let wrapper = document.getElementById(
				"clicked_dot_value" + this.sectionId
			);
			wrapper.classList.remove("hidden");

			let e = event;
			var rect = document
				.getElementById(this.canvasId(plotIndex))
				.getBoundingClientRect();
			let canvas = document.getElementById(this.canvasId(plotIndex));
			const scaleX = canvas ? canvas.width / rect.width : 1;
			const scaleY = canvas ? canvas.height / rect.height : 1;
			var x = Math.floor((e.clientX - rect.left) * scaleX / 2);
			var y = Math.floor((e.clientY - rect.top) * scaleY / 2);

			this.positionTooltipAtClient(wrapper, e.clientX, e.clientY);

			const posData = this.posDataByPlot[plotIndex] || {};
			let clickedDotValue = "";

			for (let h = -3; h <= 3; h++) {
				if (!!posData[x + h]) {
					for (let v = -3; v <= 3; v++) {
						if (!!posData[x + h][y + v]) {
							posData[x + h][y + v].map((g, i) => {
								const hoverLabel =
									renderConfig["on hover"][i];
								const labelHtml = hoverLabel
									? `<b>${hoverLabel}:</b> `
									: "";
								clickedDotValue +=
									`<span class="gene-on-clicked-dot-scatter">
									${labelHtml}
									${g}
									</span><br>`;
							});

							clickedDotValue += renderConfig["on hover"]
								? "<hr>"
								: "";
						}
					}
				}
			}

			if (clickedDotValue != "") {
				wrapper.innerHTML = clickedDotValue;
				canvas.classList.add("hover");
				this.localHoverActive = true;
				if (this.rowKeyField) {
					const hoveredRowKey = this.findRowKeyNearCanvasPoint(
						x,
						y,
						plotIndex
					);
					this.setHighlightedRowKey(hoveredRowKey);
					this.$emit("hover-key-change", hoveredRowKey);
				}
			} else {
				wrapper.innerHTML = clickedDotValue;
				wrapper.classList.add("hidden");
				canvas.classList.remove("hover");
				this.localHoverActive = false;
				this.setHighlightedRowKey(null);
				if (this.rowKeyField) {
					this.$emit("hover-key-change", null);
				}
			}
		},
		findRowKeyNearCanvasPoint(x, y, plotIndex) {
			let closestKey = null;
			let closestDistance = Infinity;
			for (const [rowKey, entries] of Object.entries(
				this.rowKeyToCanvasPos
			)) {
				for (const entry of entries) {
					if (entry.plotIndex !== plotIndex) {
						continue;
					}
					const distance = Math.hypot(entry.x - x, entry.y - y);
					if (distance <= 8 && distance < closestDistance) {
						closestDistance = distance;
						closestKey = rowKey;
					}
				}
			}
			return closestKey;
		},
		clearPlot() {
			this.posDataByPlot = {};
			this.rowKeyToCanvasPos = {};
			this.resolvedPlots.forEach((plot, plotIndex) => {
				const renderConfig = plot.renderConfig;
				if (!renderConfig) {
					return;
				}
				var c = document.getElementById(this.canvasId(plotIndex));
				if (!c) {
					return;
				}
				var ctx = c.getContext("2d");
				ctx.clearRect(
					0,
					0,
					renderConfig.width * 2 + 240,
					renderConfig.height * 2 + 240
				);
			});
		},
		dotFillStyle(row) {
			const defaultColor = "#00000080";

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
		registerRowPosition(plotIndex, rowKey, canvasX, canvasY, xPos, yPos, row) {
			if (!rowKey) {
				return;
			}
			if (!this.rowKeyToCanvasPos[rowKey]) {
				this.rowKeyToCanvasPos[rowKey] = [];
			}
			const existing = this.rowKeyToCanvasPos[rowKey].find(
				(e) => e.plotIndex === plotIndex
			);
			const entry = {
				plotIndex,
				x: canvasX,
				y: canvasY,
				xPos,
				yPos,
				row,
			};
			if (existing) {
				Object.assign(existing, entry);
			} else {
				this.rowKeyToCanvasPos[rowKey].push(entry);
			}
		},
		renderSinglePlot(plotIndex, renderConfig) {
			const renderData = this.renderDataFor(renderConfig);
			if (!renderData.length) {
				return;
			}

			let xAxisData = [];
			let yAxisData = [];

			let canvasWidth = renderConfig.width * 2;
			let canvasHeight = renderConfig.height * 2;
			let leftMargin = 74.5 * 2;
			let topMargin = 44.5 * 2;

			let xBump = canvasWidth * 0.04;
			let yBump = canvasHeight * 0.04;

			var c = document.getElementById(this.canvasId(plotIndex));
			if (!c) {
				return;
			}
			var ctx = c.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth + 240, canvasHeight + 240);

			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#000000";
			ctx.setLineDash([]);

			renderData.map((d) => {
				xAxisData.push(d[renderConfig["x axis field"]]);
				yAxisData.push(d[renderConfig["y axis field"]]);
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
				renderConfig["x axis label"],
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
				renderConfig["y axis label"],
				-(topMargin + canvasHeight / 2),
				leftMargin - 110
			);

			ctx.rotate((90 * Math.PI) / 180);
			let xPosMax = xAxisTicks.lo + xAxisTicks.step * 5;
			let yPosMax = yAxisTicks.lo + yAxisTicks.step * 5;

			const posData = {};
			this.posDataByPlot[plotIndex] = posData;

			renderData.map((d) => {
				let xPos =
					leftMargin +
					xBump +
					canvasWidth *
						((d[renderConfig["x axis field"]] - xAxisTicks.lo) /
							(xPosMax - xAxisTicks.lo));
				let yPos =
					topMargin +
					canvasHeight -
					canvasHeight *
						((d[renderConfig["y axis field"]] - yAxisTicks.lo) /
							(yPosMax - yAxisTicks.lo));

				const canvasX = Math.round(xPos / 2);
				const canvasY = Math.round(yPos / 2);
				const rowKey = this.rowKeyForDatum(d);

				this.registerRowPosition(
					plotIndex,
					rowKey,
					canvasX,
					canvasY,
					xPos,
					yPos,
					d
				);

				if (!posData[canvasX]) {
					posData[canvasX] = {};
				}

				posData[canvasX][canvasY] = [];

				if (renderConfig["on hover"]) {
					renderConfig["on hover"].forEach((item) => {
						posData[canvasX][canvasY].push(d[item]);
					});
				} else {
					posData[canvasX][canvasY].push(
						d[renderConfig["render by"]]
					);
				}

				ctx.fillStyle = this.dotFillStyle(d);
				ctx.lineWidth = 0;
				ctx.beginPath();
				ctx.arc(xPos, yPos, dotSizeMin, 0, 2 * Math.PI);
				ctx.fill();

				if (!!renderConfig["dot label score"]) {
					ctx.font = "24px Arial";
					ctx.textAlign = "center";
					ctx.fillStyle = "#000000";
					ctx.fillText(
						d[renderConfig["render by"]],
						xPos,
						yPos - 16
					);
				}
			});

			if (this.highlightedRowKey) {
				const entries =
					this.rowKeyToCanvasPos[this.highlightedRowKey] || [];
				entries
					.filter((entry) => entry.plotIndex === plotIndex)
					.forEach((entry) => {
						this.drawHighlightRing(
							ctx,
							entry.xPos,
							entry.yPos,
							dotSizeMin
						);
					});
			}
		},
		renderAllPlots() {
			if (!this.resolvedPlots.length) {
				return;
			}
			this.rowKeyToCanvasPos = {};
			this.resolvedPlots.forEach((plot, plotIndex) => {
				if (plot.renderConfig) {
					this.renderSinglePlot(plotIndex, plot.renderConfig);
				}
			});
			if (
				this.highlightedRowKey &&
				!this.localHoverActive &&
				this.rowKeyToCanvasPos[this.highlightedRowKey]
			) {
				this.showTooltipForRowKey(this.highlightedRowKey, false);
			}
		},
	},
});
</script>
<style>
.scatter-plot.hover,
.scatter-plot:hover {
	cursor: pointer;
}

.scatter-plot-content {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

.scatter-plots-row {
	display: flex;
	flex-wrap: wrap;
	gap: 20px;
	justify-content: center;
	align-items: flex-start;
	width: 100%;
}

.scatter-plot-panel {
	flex: 1 1 420px;
	max-width: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
}

.scatter-plot-title {
	font-size: 13px;
	font-weight: 600;
	text-align: center;
	margin-top: -25px;
	color: #33363d;
	z-index: 10;
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
