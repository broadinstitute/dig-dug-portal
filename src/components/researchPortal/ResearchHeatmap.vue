
<template>
	<div class="heatmap-wrapper">
		<div :id="'clicked_cell_value'+sectionId" class="clicked-cell-value hidden">
			<div :id="'clicked_cell_value_content' + sectionId"></div>
		</div>
		<div class="heatmap-content" :id="'heatmapContent' + sectionId">
			<div class="heatmap-scale-legend" :id="'heatmap_scale_legend' + sectionId"></div>
			<div class="heatmap-canvas-wrapper" :id="'heatmapPlotWrapper' + sectionId">
				<div
					class="heatmap-columns-wrapper"
					:id="'heatmapColumnsWrapper' + sectionId"
				></div>
				<div class="heatmap-rows-wrapper" :id="'heatmapRowsWrapper' + sectionId"></div>
				<div class="heatmap-canvas-wrapper" :id="'heatmapCanvasWrapper' + sectionId">
					<canvas
						v-if="!!renderConfig"
						:id="'heatmap'+ sectionId"
						@mouseleave="hidePanel"
						@mousemove="checkPosition"
						width=""
						height=""
					>
					</canvas>
					<div class="download-images-setting">
						<span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
						<ul class="options" >
							<li>
								<a href="javascript:;"
								@click="downloadImage('vector_wrapper_' + sectionId, sectionId + '_heatmap', 'svg')">Download SVG</a>
							</li>
							<li>
								<a href="javascript:;"
								@click="downloadImage('heatmap' + sectionId, sectionId + '_heatmap', 'png')">Download PNG</a>
							</li>
						</ul>
					</div>
					<research-heatmap-vector
					v-if="!!renderData"
						:renderData="renderData"
						:renderConfig="renderConfig"
						:sectionId="sectionId"
						:utils="utils"
						:ref="sectionId + '_heatmap'"
						@mousemove="checkPosition($event)" 
					>
					</research-heatmap-vector>
				</div>
			</div>
			<!--
			<div
				v-if="!!renderConfig.label"
				class="heatmap-label"
				v-html="renderConfig.label"
			></div>
			-->
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import ResearchHeatmapVector from "@/components/researchPortal/vectorPlots/ResearchHeatmapVector.vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-heatmap", {
	props: ["heatmapData", "renderConfig","utils","sectionId"],
	data() {
		return {
			squareData: {},
			canvasHover: false,
			margin:{},
		};
	},
	modules: {
		//uiUtils,
		//Formatters,
	},
	mounted: function () {
		this.renderHeatmap();
		//this.renderScaleLegend();
	},
	beforeDestroy() {},
	computed: {
		renderData() {
			let massagedData = {};

			let rowList = this.heatmapData
				.map((v) => v[this.renderConfig["row field"]])
				.filter((v, i, arr) => arr.indexOf(v) == i) //unique
				.filter((v, i, arr) => v != ""); //remove blank

			let columnList = this.heatmapData
				.map((v) => v[this.renderConfig["column field"]])
				.filter((v, i, arr) => arr.indexOf(v) == i) //unique
				.filter((v, i, arr) => v != ""); //remove blank

			massagedData["rows"] = rowList.sort((a, b) =>
				a.localeCompare(b, undefined, { sensitivity: "base" })
			);
			massagedData["columns"] = columnList.sort((a, b) =>
				a.localeCompare(b, undefined, { sensitivity: "base" })
			);

			rowList.map((r) => {
				massagedData[r] = {};
				columnList.map((c) => {
					massagedData[r][c] = {};
				});
			});

			this.heatmapData.map((d) => {
				//console.log("d", d);
				let row = this.renderConfig["row field"];
				let column = this.renderConfig["column field"];

				massagedData[d[row]][d[column]]["main"] =
					d[this.renderConfig.main.field];

				if (!!this.renderConfig.sub) {
					massagedData[d[row]][d[column]]["sub"] =
						d[this.renderConfig.sub.field];
				}
			});

			return massagedData;
		},
		boxSize() {
			return this.renderConfig["font size"] * 1.5;
		},
	},
	watch: {
		renderData() {
			this.renderHeatmap();
		},
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'svg') {
				this.$refs[this.sectionId + '_heatmap'].renderPlot();
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE, "vector_heatmap_" + this.sectionId);
			} else if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}

		},
		hidePanel() {
			this.utils.uiUtils.hideElement("clicked_cell_value" + this.sectionId);
			this.renderHeatmap();
		},
		checkPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let xPos = Math.floor(e.clientX - rect.left);
			let yPos = Math.floor(e.clientY - rect.top);
			let x = Math.floor((e.clientX - (rect.left) - (this.margin.left + this.margin.bump * 2)) / this.boxSize);
			let y = Math.floor((e.clientY - (rect.top) - (this.margin.top + this.margin.bump * 2)) / this.boxSize);

			let clickedCellValue = "";
			if (
				x >= 0 &&
				y >= 0 &&
				!!this.squareData[y] &&
				!!this.squareData[y][x]
			) {
				clickedCellValue +=
					'<span class="field-on-clicked-cell">' +
					this.renderData.rows[y] +
					"</sub>";
				clickedCellValue +=
					'<span class="field-on-clicked-cell">' +
					this.renderData.columns[x] +
					"</sub>";
				clickedCellValue +=
					'<span class="content-on-clicked-cell"><b>' +
					this.renderConfig.main.label +
					": </b>" +
					this.squareData[y][x].main.value +
					"</span>";
				if (!!this.squareData[y][x].sub) {
					clickedCellValue +=
						'<span class="content-on-clicked-cell"><b>' +
						this.renderConfig.sub.label +
						": </b>" +
						this.squareData[y][x].sub.value +
						"</span>";
				}
			}

			let wrapper = document.getElementById("clicked_cell_value" + this.sectionId);
			let contentWrapper = document.getElementById(
				"clicked_cell_value_content" + this.sectionId
			);

			let wrapperRect = document
				.getElementById("heatmapCanvasWrapper" + this.sectionId)
				.getBoundingClientRect();
			let wrapperXPos = wrapperRect.left;
			let wrapperYPos =
				document.getElementById("heatmapContent" + this.sectionId).offsetHeight -
				document.getElementById("heatmapPlotWrapper" + this.sectionId).offsetHeight +
				document.getElementById("heatmapColumnsWrapper" + this.sectionId).offsetWidth;

			if (clickedCellValue != "") {
				contentWrapper.innerHTML = clickedCellValue;
				wrapper.classList.remove("hidden");
				wrapper.style.top = wrapperYPos + yPos + "px";
				wrapper.style.left = wrapperXPos - 30 + xPos + "px"; //minus 15 for the padding of the plot wrapper
			} else {
				wrapper.classList.add("hidden");
			}
			this.renderHeatmap(x, y);
		},
		getWidth(ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		getColor(mainValue, valHi, valMid, valLow) {
			let rColor, gColor, bColor;

			rColor =
				mainValue >= valMid
					? 255
					: 255 -
					255 * ((valMid - mainValue) / valMid - valLow);
			gColor =
				mainValue >= valMid
					? 255 -
					255 * ((mainValue - valMid) / (valHi - valMid))
					: 255 -
					255 * ((valMid - mainValue) / valMid - valLow);
			bColor =
				mainValue < valMid
					? 255
					: 255 -
					255 * ((mainValue - valMid) / (valHi - valMid));

			rColor = rColor > 255 ? 255 : rColor < 0 ? 0 : rColor;
			gColor = gColor > 255 ? 255 : gColor < 0 ? 0 : gColor;
			bColor = bColor > 255 ? 255 : bColor < 0 ? 0 : bColor;

			let fillColor =
				"rgba(" +
				Math.floor(rColor) +
				"," +
				Math.floor(gColor) +
				"," +
				Math.floor(bColor) +
				",1)";

			return fillColor;
		},

		getDotR(subType, steps, subDirection, subValue, dotMaxR) {
			let stepVal = 0;
			let dotR;

			if (subType == "steps") {
				let dotRUnit = dotMaxR / steps.length;
				if (subDirection == "positive") {
					for (let i = 0; i <= steps.length - 1; i++) {
						stepVal += subValue >= steps[i] ? 1 : 0;
					}
				} else {
					for (let i = steps.length - 1; i >= 0; i--) {
						stepVal += subValue <= steps[i] ? 1 : 0;
					}
				}
				dotR = dotRUnit * stepVal;
			} else if (subType == "scale") {
				let scaleRange = steps[1] - steps[0];
				if (subDirection == "positive") {
					subValue -= steps[0];
					stepVal =
						subValue <= steps[0]
							? 0
							: subValue >= steps[1]
								? 1
								: subValue / scaleRange;
				} else {
					subValue -= steps[0];
					stepVal =
						subValue >= steps[1]
							? 0
							: subValue <= steps[0]
								? 1
								: (steps[1] - subValue) / scaleRange;
				}

				dotR = dotMaxR * stepVal;
			}

			return dotR;
		},

		renderHeatmap(X, Y) {
			let c = document.getElementById("heatmap" + this.sectionId);
			let ctx = c.getContext("2d");

			

			let fontSize = this.renderConfig['font size'];

			let marginArrs = {
				left: [],
				top: []
			}

			marginArrs.left = this.renderData.rows.map(r => Math.ceil(this.getWidth(ctx,r, fontSize, 'Arial'))).sort(function (a, b) { return b - a })
			marginArrs.top = this.renderData.columns.map(c => Math.ceil(this.getWidth(ctx,c, fontSize, 'Arial'))).sort(function (a, b) { return b - a })

			this.margin = {
				top: marginArrs.top[0]+40,
				bottom: 30,
				left: marginArrs.left[0],
				right: 20,
				bump: 5
			}

			fontSize = this.renderConfig['font size'] * 2;

			let margin = {
				top: (marginArrs.top[0]*2) + 80,
				bottom: 30,
				left: (marginArrs.left[0]*2),
				right: 40,
				bump: 10
			};

			let boxSize = fontSize * 1.5;

			let canvasWidth = ((boxSize * this.renderData.columns.length) + margin.left + margin.right + (margin.bump * 4)*2);
			let canvasHeight = ((boxSize * this.renderData.rows.length) + margin.top + margin.bottom + (margin.bump * 4)*2);
			
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			c.setAttribute(
				"style",
				"width:" +
					canvasWidth / 2 +
					"px;height:" +
					canvasHeight / 2 +
					"px;"
			);

			// render legends
			
			let mainLabel = this.renderConfig.main.label + ": ",
				subLabel = this.renderConfig.sub.label + ": ",
				mainSteps = [mainLabel],
				subSteps = [subLabel];

			let minVal, midVal, maxVal, valStep, valStepLow, valStepHigh;

			if (this.renderConfig.main.low == this.renderConfig.main.middle) {
				minVal = this.renderConfig.main.middle,
					midVal = this.renderConfig.main.middle,
					maxVal = this.renderConfig.main.high,
					valStep = (maxVal - minVal) / 5;

				for (let i = 0; i < 6; i++) {
					let stepVal = Math.round((minVal + (valStep * i)) * 1000) / 1000
					mainSteps.push(stepVal)
				}
			} else {

				minVal = this.renderConfig.main.low,
					midVal = this.renderConfig.main.middle,
					maxVal = this.renderConfig.main.high,
					valStepLow = (midVal - minVal) / 3,
					valStepHigh = (maxVal - midVal) / 3;

				for (let i = 0; i < 6; i++) {
					let stepVal = Math.round((minVal + (valStep * i)) * 1000) / 1000
					mainSteps.push(stepVal)
				}

			}

			let prevWidth = margin.bump;

			// main legend
			mainSteps.map(m => {
				let legendWidth = this.getWidth(ctx,m, fontSize, 'Arial');

				if (typeof m != 'string') {
					legendWidth += margin.bump
					prevWidth += margin.bump / 2;

					let fillColor = this.getColor(m, maxVal, midVal, minVal)

					ctx.beginPath();
					ctx.rect(prevWidth, margin.bump - 4, legendWidth, fontSize + 8);
					ctx.fillStyle = fillColor;
					ctx.fill();
				}

				ctx.font = "24px Arial";
				ctx.textAlign = "start";
				ctx.fillStyle = "#000000";
				ctx.fillText(
					m,
					prevWidth + 4,
					margin.bump + fontSize - 4
				);
				prevWidth += legendWidth + 2;
			})

			//sub legend

			this.renderConfig.sub["value range"].map(r => {
				subSteps.push(r)
			})

			let steps = this.renderConfig.sub["value range"],
				stepDirection = this.renderConfig.sub.direction,
				dotMaxR = (boxSize * 0.75) / 2;

			prevWidth += margin.bump;

			subSteps.map((s, sindex) => {


				let legendString = s.toString()

				if (typeof s != 'string') {

					if (stepDirection == "positive") {
						legendString = " >= " + legendString + ": ";
					} else {
						legendString = " <= " + legendString + ": ";
					}
				}

				let legendWidth = this.getWidth(ctx,legendString, fontSize, 'Arial');

				ctx.font = "24px Arial";
				ctx.textAlign = "start";
				ctx.fillStyle = "#000000";
				ctx.fillText(
					legendString,
					prevWidth + 4,
					margin.bump + fontSize - 4
				);

				prevWidth += legendWidth + 4;

				if (typeof s != 'string') {
					let steps = this.renderConfig.sub["value range"];
					let dotR = this.getDotR(this.renderConfig.sub.type, steps, stepDirection, s, dotMaxR)

					ctx.fillStyle = "#00000075";
					ctx.lineWidth = 0;
					ctx.beginPath();
					ctx.arc(
						prevWidth + dotR,
						margin.bump + (fontSize / 2),
						dotR,
						0,
						2 * Math.PI
					);
					ctx.fill();

					prevWidth += dotR * 2;

				}
			});

			//render plot label

			ctx.font = "Bold 30px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			ctx.fillText(
				this.renderConfig["label"],
				(canvasWidth / 2),
				(canvasHeight - (margin.bump * 2))
			);


			let renderBoxSize = this.boxSize * 2;

			// render heatmap box

			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.strokeStyle = "#666666";
			var fillRect = false;
			ctx.rect(margin.left + (margin.bump * 2), margin.top + (margin.bump * 2), (this.renderData.columns.length * boxSize), (this.renderData.rows.length * boxSize));
			if (fillRect) {
				ctx.fill();
			}
			ctx.stroke();
			ctx.closePath();

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (margin.bump * 2) + (renderBoxSize * rIndex);

				ctx.font = "24px Arial";
				ctx.textAlign = "end";
				ctx.fillStyle = "#000000";
				ctx.fillText(
					r,
					margin.left + margin.bump,
					top + fontSize
				);
			})

			this.renderData.columns.map((c, cIndex) => {
				let left = margin.left + (margin.bump * 2) + (renderBoxSize * cIndex);

				ctx.save();
				ctx.translate(left + fontSize, margin.top + margin.bump + 0.5);
				ctx.rotate((90 * -Math.PI) / 180);
				ctx.font = "24px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "start";
				ctx.fillText(c, 0, 0);
				ctx.restore();
			})

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (margin.bump * 2) + (renderBoxSize * rIndex);

				this.renderData.columns.map((c, cIndex) => {

					let mainValue = this.renderData[r][c].main;
					let left = margin.left + (margin.bump * 2) + (renderBoxSize * cIndex);

					this.squareData[rIndex][cIndex] = {};
					this.squareData[rIndex][cIndex]["main"] = {
						field: this.renderConfig.main.field,
						value: this.renderData[r][c].main,
					};
					if (!!this.renderConfig.sub) {
						this.squareData[rIndex][cIndex]["sub"] = {
							field: this.renderConfig.sub.field,
							value: this.renderData[r][c].sub,
						};
					}
					//mainValue *= -1;
					let rColor, gColor, bColor;
					let direction = this.renderConfig.main.direction;
					let valHi = this.renderConfig.main.high;
					let valMid = this.renderConfig.main.middle;
					let valLow = this.renderConfig.main.low;

					let colorString =	this.getColor(mainValue, valHi, valMid, valLow)

					if (X == cIndex && Y == rIndex) {
						ctx.beginPath();
						ctx.rect(left, top, renderBoxSize, renderBoxSize);
						ctx.fillStyle = "black";
						ctx.fill();

						ctx.beginPath();
						ctx.rect(
							left + 2,
							top + 2,
							renderBoxSize - 4,
							renderBoxSize - 4
						);
						ctx.fillStyle = colorString;
						ctx.fill();
					} else {
						ctx.beginPath();
						ctx.rect(left, top, renderBoxSize, renderBoxSize);
						ctx.fillStyle = colorString;
						ctx.fill();
					}

					if (!!this.renderConfig.sub) {
						let steps = this.renderConfig.sub["value range"];
						let subDirection = this.renderConfig.sub.direction;
						let dotMaxR = (renderBoxSize * 0.75) / 2;
						let subType = this.renderConfig.sub.type;
						let centerPos = renderBoxSize / 2;

						let subValue = this.renderData[r][c].sub;

						let dotR = this.getDotR(subType, steps, subDirection, subValue, dotMaxR)
						ctx.fillStyle = "#00000075";
						ctx.lineWidth = 0;
						ctx.beginPath();
						ctx.arc(
							left + centerPos,
							top + centerPos,
							dotR,
							0,
							2 * Math.PI
						);
						ctx.fill();
					}

					cIndex++;
				});
				rIndex++;
			});

		},
	},
});

$(function () {});
</script>

<style>
.heatmap-content {
	text-align: center;
	/*overflow-x: auto;*/
}

.heatmap-wrapper {
	position: relative;
}

.heatmap-canvas-wrapper {
	text-align: left;
	display: inline-block;
	position: relative;
	white-space: nowrap;
	background-color: #fff;
}

#heatmapColumnsWrapper, .heatmap-columns-wrapper {
	transform-origin: left top;
	transform: rotate(-90deg);
	position: absolute;
	/*left: 0;*/
}
#heatmapColumnsWrapper div, .heatmap-columns-wrapper div{
	/*transform-origin: left center;
    transform: rotate(45deg);*/
	white-space: nowrap;
	padding-left: 10px;
}
#heatmapRowsWrapper, .heatmap-rows-wrapper {
	padding-right: 10px;
	display: inline-block;
	vertical-align: top;
	white-space: nowrap;
	text-align: right;
}
#heatmapCanvasWrapper, .heatmap-canvas-wrapper {
	display: inline-block;
	vertical-align: top;
}

#heatmapCanvasWrapper canvas, .heatmap-canvas-wrapper canvas {
	/*border: solid 1px #aaa;*/
}

#heatmap:hover, .heatmap:hover {
	cursor: pointer;
}

#clicked_cell_value, .clicked-cell-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 12px;
    padding: 0px 10px 5px 10px;
    max-width: 300px;
    border-radius: 5px;
    z-index: 10;
    width: auto;
	text-align: left;
	padding: 8px 20px 8px 10px !important;
}
.field-on-clicked-cell,
.content-on-clicked-cell {
	display: block !important;
}

.clicked-cell-value-close {
	position: absolute;
	top: 2px;
	right: 2px;
	font-size: 12px;
	color: #69f;
}

.clicked-cell-value-close:hover {
	color: #36c;
}

.heatmap-label {
	font-size: 16px;
	font-weight: bold;
	text-align: center;
}

.heatmap-legend {
	font-size: 14px;
	text-align: left;
}

.heatmap-scale-legend {
	font-size: 14px;
	text-align: left;
}

.heatmap-scale-legend div {
	display: inline-block;
}
.heatmap-scale-legend div.scale-color {
	padding: 0 3px;
	font-size: 12px;
	border-left: solid 1px #fff;
}

.scale-legend-main-field .field-label,
.scale-legend-sub-field .field-label {
	font-weight: bold;
}

.scale-legend-main-colors {
	margin-right: 10px;
}

.sub-legend-steps {
	padding-left: 5px;
}
</style>



