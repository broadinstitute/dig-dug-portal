<template>
	<div :id="`heatmap-wrapper-${sectionId}`">
		<div>
			<div style="display:flex">
				<span v-if="!rowNorm">Dataset minimum</span>
				<span v-else>Row minimum</span>
				<div class="gradient" :style="`background: linear-gradient(to right, ${colorScaleArray});`">
				</div>
				<span v-if="!rowNorm">Dataset maximum</span>
				<span v-else>Row maximum</span>
			</div>
			<div class="heatmap-canvas-wrapper" :id="'heatmapCanvasWrapper' + sectionId">
					<canvas
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
								@click="downloadImage('heatmap' + sectionId, heatmapImgTitle, 'png')">Download PNG</a>
							</li>
						</ul>
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
	props: ["heatmapData","utils","sectionId", "zoomedIn", "filter", "avgRep", "minScore", "maxScore", "rowNorm"],
	data() {
		return {
			squareData: {},
			canvasHover: false,
			margin:{},
			colorScale: null,
			boxWidth: null,
			fontSize: 12,
			zoomedOutBoxHeight: 6,
			rowField: "gene_tx",
			columnField: "source",
			heatmapField: "score",
			datapointLabel: "score" // need to get a more descriptive label
		};
	},
	mounted: function () {
		this.renderHeatmap();
	},
	beforeDestroy() {},
	computed: {
		filteredData(){
			let data = structuredClone(this.heatmapData);
			if (this.filter) {
                data = data.filter(this.filter);
            }
			data = data.filter(d => this.avgRep ? d.replicate === 'avg' : d.replicate !== 'avg');
			this.$emit("dataFiltered", data);
			return data;
		},
		renderData() {
			let massagedData = {};

			let rowList = this.filteredData
				.map((v) => v[this.rowField])
				.filter((v, i, arr) => arr.indexOf(v) == i) //unique
				.filter((v, i, arr) => v != ""); //remove blank

			let columnList = this.filteredData
				.map((v) => v[this.columnField])
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
				massagedData[d[this.rowField]][d[this.columnField]] =
					d[this.heatmapField];

			});
			return massagedData;
		},
		boxHeight() {
			return !this.zoomedIn ? this.zoomedOutBoxHeight : this.fontSize * 1.5;
		},
		colorScaleArray(){
            if (this.colorScale === null) { return []; }
            let step = 0.01 * (this.maxScore - this.minScore);
            return d3.range(this.minScore, this.maxScore, step).map(t => this.colorScale(t)).join(', ');
        },
		heatmapImgTitle(){
			return "Adipogenesis";
		}
	},
	watch: {
		renderData() {
			this.renderHeatmap();
		},
		zoomedIn(){
			this.renderHeatmap();
		},
		avgRep(){
			this.renderHeatmap();
		},
		rowNorm(){
			this.renderHeatmap();
		}
	},
	methods: {
		downloadImage(ID, NAME, TYPE) {
			if (TYPE == 'png') {
				this.utils.uiUtils.downloadImg(ID, NAME, TYPE)
			}
		},
		hidePanel() {
			this.renderHeatmap();
		},
		checkPosition(event) {
			let e = event;
			let rect = e.target.getBoundingClientRect();

			let x = Math.floor((e.clientX - (rect.left) - this.margin.left) / (this.boxWidth));
			let y = Math.floor((e.clientY - (rect.top) - this.margin.top) / this.boxHeight);

			let validCell = x >= 0 && y >= 0 && !!this.squareData[y] && !!this.squareData[y][x]
			let clickedCellValue = !validCell ? "" : this.hoverContent(x,y);

			
			// show box if hovering over a valid cell
			if (validCell) {
				this.$emit("hover", clickedCellValue);
			}
			this.renderHeatmap(x, y);
		},
		hoverContent(x, y){
			let transcript = this.renderData.rows[y];
			let rowName = this.geneTxFormat(transcript);
			let columnName = this.renderData.columns[x];
			columnName = this.readableColumn(columnName);
			let scoreVal = this.squareData[y][x].value;
			let info = {
				transcript: transcript,
				rowName: rowName,
				columnName: columnName,
				scoreVal: scoreVal
			};
			return info;
		},
		getWidth(ctx, text, fontSize, fontFace) {
			ctx.font = fontSize + 'px ' + fontFace;
			return ctx.measureText(text).width;
		},

		renderHeatmap(X, Y) {
			let c = document.getElementById("heatmap" + this.sectionId);
			let ctx = c.getContext("2d");

			let longestLabel = "";
			this.renderData.rows.forEach(r => longestLabel = r.length > longestLabel.length ? r : longestLabel);

			let margin = {
				top: 150,
				bottom: 50,
				left: !this.zoomedIn ? 20 : longestLabel.length * this.fontSize / 1.5,
				right: 20,
			};
			this.margin = margin;

			let d = document.getElementById(`heatmap-wrapper-${this.sectionId}`);
			let canvasWidth = d.clientWidth;
			let centerWidth = canvasWidth - margin.left - margin.right;
			this.boxWidth = centerWidth / this.renderData.columns.length;

			let canvasHeight = ((this.boxHeight * this.renderData.rows.length) + margin.top + margin.bottom);
			
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
			
			let numExtremes = [this.minScore, this.maxScore];
			let colorExtremes = [ACCESSIBLE_GRAY, ACCESSIBLE_PURPLE];
			this.colorScale = createColorScale(numExtremes, colorExtremes);


			//render plot label

			ctx.font = "Bold 30px Arial";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000000";

			// render heatmap box
			ctx.beginPath();
			ctx.strokeStyle = "#666666";
			ctx.rect(margin.left, margin.top, (this.renderData.columns.length * this.boxWidth), (this.renderData.rows.length * this.boxHeight));
			ctx.stroke();
			ctx.closePath();

			this.renderData.rows.map((r, rIndex) => {
				this.squareData[rIndex] = {};

				let top = margin.top + (this.boxHeight * rIndex);

				ctx.font = `${this.fontSize}px Arial`;
				ctx.textAlign = "end";
				ctx.fillStyle = "#000000";
				if (this.zoomedIn){
					ctx.fillText(this.geneTxFormat(r), margin.left - 5, top + this.fontSize);
				}
			})

			this.renderData.columns.map((c, cIndex) => {
				let left = margin.left + (this.boxWidth * (cIndex + 0.35)); // start in middle of box
				ctx.save();
				ctx.translate(left + this.fontSize, margin.top);
				ctx.rotate((45 * -Math.PI) / 180);
				ctx.font = `${this.fontSize}px Arial`;
				ctx.fillStyle = "#000000";
				ctx.textAlign = "start";
				let readableText = this.readableColumn(c);
				ctx.fillText(`  ${readableText}`, 0, 0);
				ctx.restore();
			})

			this.renderData.rows.map((r, rIndex) => {
				// TODO if row-normalized, do it here;
				let rowScores = Object.values(this.renderData[r]);
				let rowMax = rowScores.reduce((a,b) => a > b ? a : b);
				let rowMin = rowScores.reduce((a,b) => a < b ? a : b);
				let numExtremes = [rowMin, rowMax];
				let colorExtremes = [ACCESSIBLE_GRAY, ACCESSIBLE_PURPLE];
				let rowScale = createColorScale(numExtremes, colorExtremes);
				
				this.squareData[rIndex] = {};

				let top = margin.top + (this.boxHeight * rIndex);

				this.renderData.columns.map((c, cIndex) => {

					let boxValue = this.renderData[r][c];
					let left = margin.left + (this.boxWidth * cIndex);

					this.squareData[rIndex][cIndex] = {};
					this.squareData[rIndex][cIndex] = {
						field: this.heatmapField,
						value: this.renderData[r][c],
					};
					let scaleToUse = this.rowNorm ? rowScale : this.colorScale;
					let colorString = `${scaleToUse(boxValue)}`;

					ctx.beginPath();
					ctx.rect(left, top, this.boxWidth, this.boxHeight);
					ctx.fillStyle = colorString;
					ctx.fill();
					cIndex++;
				});
				rIndex++;
				
			});
			// Draw box around highlighted row
			if (Y >= 0 && Y < this.renderData.rows.length){
				let top = margin.top + (this.boxHeight * Y);
				ctx.beginPath();
				ctx.strokeStyle = "#000000";
				ctx.rect(margin.left, top, (this.renderData.columns.length * this.boxWidth), this.boxHeight);
				ctx.stroke();
			}
		},
		geneTxFormat(str){
      		let splitString = str.split("___");
			if (splitString.length <= 1){
				return str;
			}
      		return `${splitString[0]} (${splitString[1]})`;
    	},
		readableColumn(snakeCase){
			let findDay = /-?\d+/;
			let day = snakeCase.match(findDay)[0];
			let findRep = /rep_(\w+)/;
			let rep = snakeCase.match(findRep)[1];
			let repString = rep === "avg" ? "avg. of all replicates" : `replicate ${rep}`;
			return `Day ${day}, ${repString}`;
		}
	},
});

$(function () {});
</script>

<style>
.heatmap-canvas-wrapper {
	text-align: left;
	display: inline-block;
	position: relative;
	white-space: nowrap;
	background-color: #fff;
	vertical-align: top;
}

.clicked-cell-value {
	position: absolute;
    background-color: #fff;
    border: solid 1px #aaa;
    box-shadow: 0 0 5px #00000075;
    font-size: 13px;
    border-radius: 5px;
    z-index: 10;
	text-align: left;
	padding-top: 5px;
	padding-left: 5px;
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
.gradient {
    height: 20px;
    width: 200px;
    border-radius: 20px;
	margin-left: 15px;
	margin-right: 15px;
}
</style>



