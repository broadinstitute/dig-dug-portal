<template>
	<div class="heatmap-wrapper" :id="`heatmap-wrapper-${sectionId}`">
		<div :id="'clicked_cell_value'+sectionId" class="clicked-cell-value hidden">
			<div :id="'clicked_cell_value_content' + sectionId" >
			</div>
			<time-series-line-plot
				v-if="filteredData.length > 0"
				:plotData="filteredData"
				:tx="[transcript]"
				:config="linePlotConfig"
				:plotId="`${sectionId}_line`">
			</time-series-line-plot>
		</div>
		<div class="heatmap-content" :id="'heatmapContent' + sectionId">
			<div class="heatmap-scale-legend" :id="'heatmap_scale_legend' + sectionId">
				<div style="display:flex; gap:5px" class="legends">
					<div style="display:inline-block" class="legend">
						<div style="display:flex; margin-top:10px" class="marks">
							<span>MIN</span>
							<div class="gradient" :style="`background: linear-gradient(to right, ${colorScaleArray});`">
							</div>
							<span>MAX</span>
						</div>
					</div>
				</div>
			</div>
			<div class="heatmap-canvas-wrapper" :id="'heatmapPlotWrapper' + sectionId">
				<div
					class="col-wrapper"
					:id="'colWrapper' + sectionId"
				></div>
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
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import { BootstrapVueIcons } from "bootstrap-vue";
import { ACCESSIBLE_PURPLE, ACCESSIBLE_GRAY } from "../utils/content.js";
import { createColorScale } from "../utils/visuals.js";
import * as d3 from 'd3';

Vue.use(BootstrapVueIcons);

export default Vue.component("time-series-heatmap", {
	props: ["heatmapData","utils","sectionId", "zoomedIn", "activeTab", "filter", "avgRep", "minScore", "maxScore"],
	data() {
		return {
			squareData: {},
			canvasHover: false,
			margin:{},
			boxAspectRatio: 8,
			transcript: "1415687_a_at",
			colorScale: null,
			boxWidth: null
		};
	},
	mounted: function () {
		this.renderHeatmap();
		//this.renderScaleLegend();
	},
	beforeDestroy() {},
	computed: {
		renderConfig(){
			return {
                "type": "heat map",
                "label": "Adipogenesis Datasets",
                "main": {
                    "field": "score",
                    "label": "score",
                    "type": "scale",
                    "direction": "positive",
                    "low": this.minScore,
                    "middle": (this.minScore + this.maxScore) / 2,
                    "high": this.maxScore
                },
                "column field": "source",
                "column label": "source",
                "row field": "gene_tx",
                "row label": "Gene / transcript",
                "font size": 13,
            }
		},
		linePlotConfig(){
            return {
                xField: "days",
                xAxisLabel: "Time (days)",
                xMin: -2, // TODO calculate this dynamically rather than hardcoding it
                xMax: 7,
                yField: "score",
                yAxisLabel: "",
                yMin: this.minScore,
                yMax: this.maxScore,
                dotKey: "identifier",
                hoverBoxPosition: "both",
                hoverFields: [
                    {key: "transcript_id", label: "Transcript"},
                    {key: "days", label: "Day"},
                ],
            }
        },
		filteredData(){
			let data = structuredClone(this.heatmapData);
			if (this.filter) {
                data = data.filter(this.filter);
            }
			data = data.filter(d => this.avgRep ? d.replicate === 'avg' : d.replicate !== 'avg');
			return data;
		},
		renderData() {
			let massagedData = {};

			let rowList = this.filteredData
				.map((v) => v[this.renderConfig["row field"]])
				.filter((v, i, arr) => arr.indexOf(v) == i) //unique
				.filter((v, i, arr) => v != ""); //remove blank

			let columnList = this.filteredData
				.map((v) => v[this.renderConfig["column field"]])
				.filter((v, i, arr) => arr.indexOf(v) == i) //unique
				.filter((v, i, arr) => v != ""); //remove blank

			massagedData["rows"] = rowList.sort((a, b) =>
				a.order - b.order
			);
			massagedData["columns"] = columnList.sort((a, b) => 
				a.days - b.days
			);

			rowList.map((r) => {
				massagedData[r] = {};
				columnList.map((c) => {
					massagedData[r][c] = {};
				});
			});

			this.filteredData.map((d) => {
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
		colorScaleArray(){
            if (this.colorScale === null) { return []; }
            let step = 0.01 * (this.maxScore - this.minScore);
            return d3.range(this.minScore, this.maxScore, step).map(t => this.colorScale(t)).join(', ');
        },
	},
	watch: {
		renderData() {
			this.renderHeatmap();
		},
		zoomedIn(){
			this.renderHeatmap();
		},
		activeTab(){
			this.renderHeatmap();
		},
		avgRep(){
			this.renderHeatmap();
		}
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
			this.renderHeatmap();
		},
		checkPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let xPos = Math.floor(e.clientX - rect.left);
			let yPos = Math.floor(e.clientY - rect.top);
			let x = Math.floor((e.clientX - (rect.left) - this.margin.left) / (this.boxWidth));
			let zoomFactor = this.zoomedIn ? this.boxHeight : 3;
			let y = Math.floor((e.clientY - (rect.top) - this.margin.top) / zoomFactor);

			let clickedCellValue = "";
			if (
				x >= 0 &&
				y >= 0 &&
				!!this.squareData[y] &&
				!!this.squareData[y][x]
			) {
				clickedCellValue +=
					'<span class="field-on-clicked-cell hover-title">' +
					this.geneTxFormat(this.renderData.rows[y]) +
					"</span>";
				clickedCellValue +=
					'<span class="field-on-clicked-cell">' +
					this.renderData.columns[x] +
					"</span>";
				clickedCellValue +=
					'<span class="content-on-clicked-cell"><b>' +
					this.renderConfig.main.label +
					": </b>" +
					this.squareData[y][x].main.value +
					"</span>";
			}
			this.transcript = this.renderData.rows[y];
			this.$emit("hover", this.renderData.rows[y]);

			let wrapper = document.getElementById("clicked_cell_value" + this.sectionId);
			let contentWrapper = document.getElementById(
				"clicked_cell_value_content" + this.sectionId
			);

			let canvasRect = document
				.getElementById("heatmapCanvasWrapper" + this.sectionId)
				.getBoundingClientRect();
			let canvasXPos = canvasRect.left;

			let canvasYPos =
				document.getElementById("heatmapContent" + this.sectionId).offsetHeight -
				document.getElementById("heatmapPlotWrapper" + this.sectionId).offsetHeight +
				document.getElementById("colWrapper" + this.sectionId).offsetWidth;

			let hoverTop = canvasYPos + yPos;
			let hoverLeft = canvasXPos + xPos - 30;

			let canvasBottom = canvasRect.bottom + this.margin.bottom;
			let canvasRight = canvasRect.right + this.margin.right;

			let bottomOverhang = hoverTop + wrapper.clientHeight - canvasBottom;
			let rightOverhang = hoverLeft + wrapper.clientWidth - canvasRight;
			if (bottomOverhang > 0){
				hoverTop = hoverTop - bottomOverhang;
			}
			if (rightOverhang > 0){
				hoverLeft = xPos - wrapper.clientWidth; // switch the hover box to the left
			}
			
			// test to see if hover box goes off canvas
			if (clickedCellValue != "") {
				contentWrapper.innerHTML = clickedCellValue;
				wrapper.classList.remove("hidden");
				wrapper.style.top =`${hoverTop}px`;
				wrapper.style.left = `${hoverLeft}px`;
			} else {
				wrapper.classList.add("hidden");
			}
			this.renderHeatmap(x, y);
		},
		getWidth(ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderHeatmap(X, Y) {
			let c = document.getElementById("heatmap" + this.sectionId);
			let ctx = c.getContext("2d");
			

			let fontSize = this.renderConfig['font size'];

			let margin = {
				top: 250,
				bottom: 100,
				left: 350,
				right: 40,
			};
			this.margin = margin;

			let d = document.getElementById(`heatmap-wrapper-${this.sectionId}`);
			let canvasWidth = d.clientWidth;
			let remainingWidth = canvasWidth - margin.left - margin.right;
			this.boxWidth = remainingWidth / this.renderData.columns.length;

			let renderBoxSize = !this.zoomedIn ? 6 : this.boxHeight;
			let canvasHeight = ((renderBoxSize * this.renderData.rows.length) + margin.top + margin.bottom);
			
			c.setAttribute("width", canvasWidth);
			c.setAttribute("height", canvasHeight);
			c.setAttribute(
				"style",
				"width:" +
					canvasWidth +
					"px;height:" +
					canvasHeight +
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
			let numExtremes = [minVal, maxVal];
			let colorExtremes = [ACCESSIBLE_GRAY, ACCESSIBLE_PURPLE];
			this.colorScale = createColorScale(numExtremes, colorExtremes);


			//render plot label

			ctx.font = "Bold 30px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";

			// render heatmap box

			ctx.beginPath();
			ctx.fillStyle = "#ffffff";
			ctx.strokeStyle = "#666666";
			var fillRect = false;
			ctx.rect(margin.left, margin.top, (this.renderData.columns.length * this.boxWidth), (this.renderData.rows.length * this.boxHeight));
			if (fillRect) {
				ctx.fill();
			}
			ctx.stroke();
			ctx.closePath();

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (renderBoxSize * rIndex);

				ctx.font = "13px Arial";
				ctx.textAlign = "end";
				ctx.fillStyle = "#000000";
				if (this.zoomedIn){
					ctx.fillText(this.geneTxFormat(r), margin.left, top + fontSize);
				}
			})

			this.renderData.columns.map((c, cIndex) => {
				let left = margin.left + (this.boxWidth * cIndex) + this.boxWidth;

				ctx.save();
				ctx.translate(left + fontSize, margin.top + 0.5);
				ctx.rotate((45 * -Math.PI) / 180);
				ctx.font = "13px Arial";
				ctx.fillStyle = "#000000";
				ctx.textAlign = "start";
				ctx.fillText(c, 0, 0);
				ctx.restore();
			})

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (renderBoxSize * rIndex);

				this.renderData.columns.map((c, cIndex) => {

					let mainValue = this.renderData[r][c].main;
					let left = margin.left + (this.boxWidth * cIndex);

					this.squareData[rIndex][cIndex] = {};
					this.squareData[rIndex][cIndex]["main"] = {
						field: this.renderConfig.main.field,
						value: this.renderData[r][c].main,
					};

					let colorString = `${this.colorScale(mainValue)}`;


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
		geneTxFormat(str){
      		let splitString = str.split("___");
			if (splitString.length <= 1){
				return str;
			}
      		return `${splitString[0]} (${splitString[1]})`;
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
	/*position: relative;*/
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
    font-size: 13px;
    border-radius: 5px;
    z-index: 10;
    /*min-width: 300px;*/
	text-align: left;
	padding-top: 5px;
	padding-left: 5px;
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
.hover-title {
	font-weight: bold;
}
.legends {
    gap: 20px;
}

.legend {
    margin: 0 10px 0 0;
    gap:1px;
}
.legend .label {
    font-size: 11px !important;
    line-height: 11px;
}
.legend .gradient {
    height: 20px;
    width: 200px;
    border-radius: 20px;
}
.legend span {
  padding-left: 15px;
  padding-right: 15px;
}
</style>



