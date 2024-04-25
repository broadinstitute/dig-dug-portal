<template>
	<div>
		<div :id="'vector_wrapper_'+sectionId" :class="'vector-wrapper-'+ canvasId">

		</div>
	</div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import * as d3 from "d3";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-heatmap-vector", {
	props: [
		"renderData",
		"renderConfig",
		"sectionId",
		"utils"
	],
	data() {
		return {
		};
	},
	modules: {
	},
	components: {},
	created: function () {
	},
	mounted: function () {
		this.renderHeatmap()
	},
	beforeDestroy() {
	},
	computed: {
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_","-").toLowerCase();
			return canvasId;
		}
	},
	watch: {
		canvasId(ID) {
			//this.renderBarPlot()
		}
	},
	methods: {
		renderHeatmap() {
			let canvas = document.createElement('canvas'),
				context = canvas.getContext('2d');

			let getWidth = function (text, fontSize, fontFace) {
				context.font = fontSize + 'px ' + fontFace;
				return context.measureText(text).width;
			}

			let getColor = function (mainValue, valHi, valMid, valLo) {
				let rColor, gColor, bColor;

				rColor =
					mainValue >= valMid
						? 255
						: 255 -
						255 * ((valMid - mainValue) / valMid - valLo);
				gColor =
					mainValue >= valMid
						? 255 -
						255 * ((mainValue - valMid) / (valHi - valMid))
						: 255 -
						255 * ((valMid - mainValue) / valMid - valLo);
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
			}

			let getDotR = function (subType, steps, subDirection, subValue, dotMaxR) {
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
			}

			let wrapperClass = `.vector-wrapper-${this.canvasId}`;

			let bitmapWrapper = document.querySelector(
				"#heatmapCanvasWrapper" + this.canvasId
			);

			console.log("renderData", this.renderData);

			let fontSize = this.renderConfig['font size'];

			let marginArrs  = {
				left: [],
				top: []
			}

			marginArrs.left = this.renderData.rows.map(r => Math.ceil(getWidth(r,fontSize, 'Arial'))).sort(function (a, b) { return b - a })
			marginArrs.top = this.renderData.columns.map(c => Math.ceil(getWidth(c, fontSize, 'Arial'))).sort(function (a, b) { return b - a })

			console.log("marginArrs", marginArrs);

			let margin = {
				top: marginArrs.top[0] + 50,
				bottom: 30,
				left: marginArrs.left[0],
				right: 20,
				bump: 5
			}

			console.log("margin", margin);
			let boxSize = this.renderConfig['font size'] * 1.5;

			let width = (boxSize * this.renderData.columns.length) + margin.left + margin.right + (margin.bump * 4);
			let height = (boxSize * this.renderData.rows.length) + margin.top + margin.bottom + (margin.bump * 4);

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_heatmap_" + this.sectionId)
				.attr("width", width)
				.attr("height", height)
				.attr("style", "border: solid 1px #dddddd")
				.append("g")
				.attr("transform", "translate(0,0)");

			svg.append("g")
				.attr("id", "heatmapGroup")
				.attr("transform", "translate(0,0)");

			// render rows labels

			this.renderData.rows.map((row,rIndex) =>{
				svg.select("#heatmapGroup")
					.append("text")
					.attr("x", margin.left + margin.bump)
					.attr("y", margin.top + margin.bump + (boxSize * (rIndex + 1)))
					.style("font-family", "Arial")
					.style("font-size", fontSize)
					.style("text-anchor", "end")
					.text(row);
			})

			this.renderData.columns.map((column, cIndex) => {
				svg.select("#heatmapGroup")
					.append("text")
					.attr("transform", "translate("+(margin.left + margin.bump + (boxSize * (cIndex + 1)))+"," + (margin.top + margin.bump) + ")rotate(-90)")
					.attr("x", 0)
					.attr("y", 0)
					.style("font-family", "Arial")
					.style("font-size", fontSize)
					.style("text-anchor", "start")
					.text(column);
			})

			// render heatmap label
			svg.select("#heatmapGroup")
				.append("text")
				.attr("x", (width / 2))
				.attr("y", (height - (margin.bump * 2)))
				.style("font-family", "Arial")
				.style("font-weight", 700)
				.style("font-size", fontSize * 1.25)
				.style("text-anchor", "middle")
				.text(this.renderConfig["label"]);

			// render heatmap box

			svg.select("#heatmapGroup")
				.append("rect")
				.attr("x", margin.left + (margin.bump * 2))
				.attr("y", margin.top + (margin.bump*2))
				.attr("height", (this.renderData.rows.length * boxSize))
				.attr("width", (this.renderData.columns.length * boxSize))
				.attr("stroke", "#aaaaaa")
				.style("stroke-width", 0.75)
				.style("fill", "#ffffff");

			// render heatmap

			

			let valHi = this.renderConfig.main.high;
			let valMid = this.renderConfig.main.middle;
			let valLo = this.renderConfig.main.low;

			this.renderData.rows.map((r, rIndex) => {
				this.renderData.columns.map((c, cIndex) => {

					// render boxes
					let mainValue = this.renderData[r][c].main;
					let left = margin.left + (margin.bump * 2) + (boxSize * cIndex);
					let top = margin.top + (margin.bump * 2) + (boxSize * rIndex);

					let fillColor = getColor(mainValue, valHi, valMid, valLo)
					

					svg.select("#heatmapGroup")
						.append("rect")
						.attr("x", left)
						.attr("y", top)
						.attr("height", boxSize)
						.attr("width", boxSize)
						.style("fill", fillColor);

					// render circles
					if (!!this.renderConfig.sub) {
						let subType = this.renderConfig.sub.type;
						let steps = this.renderConfig.sub["value range"];
						let subDirection = this.renderConfig.sub.direction;
						let dotMaxR = (boxSize * 0.75) / 2;
						let subValue = this.renderData[r][c].sub;

					let dotR = getDotR(subType, steps, subDirection, subValue, dotMaxR)

						svg.select("#heatmapGroup")
							.append('circle')
							.attr('cx', left + (boxSize / 2))
							.attr('cy', top + (boxSize / 2))
							.attr('r', dotR)
							.style('fill', "#00000075");
						
					}
				})
			})
		},
	},
});

$(function () {});
</script>

<style>
</style>



