
<template>
	<div class="heatmap-wrapper">
		<div :id="'clicked_cell_value'+sectionId" class="clicked-cell-value hidden">
			<div :id="'clicked_cell_value_content' + sectionId"></div>
		</div>
		<div class="heatmap-content" :id="'heatmapContent' + sectionId">
			<div class="heatmap-scale-legend" :id="'heatmap_scale_legend' + sectionId"></div>
			<div class="heatmap-canvas-wrapper" :id="'heatmapPlotWrapper' + sectionId">
				<div
					class="col-wrapper"
					:id="'colWrapper' + sectionId"
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

export default Vue.component("time-series-heatmap", {
	props: ["heatmapData", "renderConfig","utils","sectionId"],
	data() {
		return {
			squareData: {},
			canvasHover: false,
			margin:{},
			boxAspectRatio: 8
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
				this.extractTime(a) - this.extractTime(b)

				// Sort by time here instead of arbitrary
			);

			rowList.map((r) => {
				massagedData[r] = {};
				columnList.map((c) => {
					massagedData[r][c] = {};
				});
			});

			this.heatmapData.map((d) => {
				let row = this.renderConfig["row field"];
				let column = this.renderConfig["column field"];

				massagedData[d[row]][d[column]]["main"] =
					d[this.renderConfig.main.field];

			});
			return massagedData;
		},
		boxHeight() {
			return this.renderConfig["font size"] * 1.5;
		},
		boxWidth(){
			return this.boxHeight * this.boxAspectRatio * 2;
		}
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
			let x = Math.floor((e.clientX - (rect.left) - (this.margin.left + this.margin.bump * 2)) / (this.boxWidth) * 2);
			let y = Math.floor((e.clientY - (rect.top) - (this.margin.top + this.margin.bump * 2)) / this.boxHeight);

			//let canvasWidth = ((this.boxWidth * this.renderData.columns.length) + margin.left + margin.right + (margin.bump * 4)*2);

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
				document.getElementById("colWrapper" + this.sectionId).offsetWidth;

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


			let canvasWidth = ((this.boxWidth * this.renderData.columns.length) + margin.left + margin.right + (margin.bump * 8));
			let canvasHeight = ((1 * this.renderData.rows.length) + margin.top + margin.bottom + (margin.bump * 8));
			
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
				mainSteps = [mainLabel];

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

			//render plot label

			ctx.font = "Bold 30px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";
			/* ctx.fillText(
				this.renderConfig["label"],
				(canvasWidth / 2),
				(canvasHeight - (margin.bump * 2))
			);  this is superfluous*/


			let renderBoxSize = this.boxHeight * 2;

			// render heatmap box

			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.strokeStyle = "#666666";
			var fillRect = false;
			ctx.rect(margin.left + (margin.bump * 2), margin.top + (margin.bump * 2), (this.renderData.columns.length * this.boxWidth), (this.renderData.rows.length * this.boxHeight));
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
				let left = margin.left + (margin.bump * 2) + (this.boxWidth * cIndex) + this.boxWidth/2;

				ctx.save();
				ctx.translate(left + fontSize, margin.top + margin.bump + 0.5);
				ctx.rotate((45 * -Math.PI) / 180);
				ctx.font = "24px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "start";
				ctx.fillText(this.columnLabel(c), 0, 0);
				ctx.restore();
			})

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (margin.bump * 2) + (renderBoxSize * rIndex);

				this.renderData.columns.map((c, cIndex) => {

					let mainValue = this.renderData[r][c].main;
					let left = margin.left + (margin.bump * 2) + (this.boxWidth * cIndex);

					this.squareData[rIndex][cIndex] = {};
					this.squareData[rIndex][cIndex]["main"] = {
						field: this.renderConfig.main.field,
						value: this.renderData[r][c].main,
					};
					//mainValue *= -1;
					let rColor, gColor, bColor;
					let direction = this.renderConfig.main.direction;
					let valHi = this.renderConfig.main.high;
					let valMid = this.renderConfig.main.middle;
					let valLow = this.renderConfig.main.low;

					let colorString =	this.getColor(mainValue, valHi, valMid, valLow);


					if (X == cIndex && Y == rIndex) {
						ctx.beginPath();
						ctx.rect(left, top, this.boxWidth, renderBoxSize);
						ctx.fillStyle = "black";
						ctx.fill();

						ctx.beginPath();
						ctx.rect(
							left + 2,
							top + 2,
							this.boxWidth - 4,
							renderBoxSize - 4
						);
						ctx.fillStyle = colorString;
						ctx.fill();
					} else {
						ctx.beginPath();
						ctx.rect(left, top, this.boxWidth, renderBoxSize);
						ctx.fillStyle = colorString;
						ctx.fill();
					}

					cIndex++;
				});
				rIndex++;
			});

		},
		extractTime(sourceName){
			let pattern = new RegExp(/day (-?\d+)/);
			let days = sourceName.match(pattern);
			return parseInt(days[1]);
		},
		columnLabel(sourceName){
			return sourceName.slice(sourceName.indexOf("day"))
				.replaceAll("replicate", "rep.");
		}
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

#colWrapper, .col-wrapper {
	transform-origin: left top;
	transform: rotate(-90deg);
	position: absolute;
	/*left: 0;*/
}
#colWrapper div, .col-wrapper div{
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



