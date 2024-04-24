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

			let wrapperClass = `.vector-wrapper-${this.canvasId}`;

			let bitmapWrapper = document.querySelector(
				"#heatmapCanvasWrapper" + this.canvasId
			);

			console.log("renderData", this.renderData);

			let marginArrs  = {
				left: [],
				top: []
			}

			let fontSize = this.renderConfig['font size'];

			marginArrs.left = this.renderData.rows.map(r => Math.ceil(getWidth(r,fontSize, 'Arial'))).sort(function (a, b) { return b - a })
			marginArrs.top = this.renderData.columns.map(c => Math.ceil(getWidth(c, fontSize, 'Arial'))).sort(function (a, b) { return b - a })

			console.log("marginArrs", marginArrs);



/*
			let margin = {
				left: this.margin.left/2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}
			
			let width = !!this.renderConfig['width']? this.renderConfig['width']: 
				bitmapWrapper.clientWidth - (margin.left + margin.right);
			let height = !!this.renderConfig['height'] ? this.renderConfig['height']-(margin.top+margin.bottom) : 150;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_heatmap_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			let sumstat = [],
				yField = this.renderConfig['y axis field'],
				groupField = this.renderConfig['group by'],
				renderField = this.renderConfig['render by'];

			let sumstatIndex = 0
			for (const [key, value] of Object.entries(this.renderData)) {

				value.map((v) => {
					let tempObj = { key: sumstatIndex, value: {} }
					tempObj.value['value'] = (this.renderConfig["convert y -log10"] == true || this.renderConfig["convert y -log10"] == "true") ? 
						-Math.log10(v[yField]) : v[yField];
					tempObj.value['name'] = (!!this.renderConfig["phenotype map"] && this.renderConfig["phenotype map"] == "kp phenotype map") ?
						this.phenotypeMap[v[renderField]]["description"] : v[renderField];
					tempObj.value['group'] = key;

					sumstat.push(tempObj);

					sumstatIndex++;
				})
			}

			let yVals = [...new Set(sumstat.map(d => d.value.value))],
				groupVals = [...new Set(sumstat.map(d => d.value.group))],
				colors = this.colors;

			let maxVal = Math.ceil(yVals.reduce((prev, next) => prev > next ? prev : next)),
				minVal = Math.floor(yVals.reduce((prev, next) => prev < next ? prev : next));

			//render axis labels

			svg.append("text")
				.attr("x", (margin.left + (width / 2)))
				.attr("y", (height + margin.top + margin.bottom - 20))
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")
				.text(this.renderConfig['x axis label']);

			svg.append("text")
				.attr("transform", function (d) {
					return "translate(20," + (margin.top+(height/2)) + ")rotate(-90)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")
				.text(this.renderConfig['y axis label']);


			let x = d3.scaleBand()
				.range([margin.left, margin.left+width])
				.domain(sumstat.map(s=>s.key))
				.paddingInner(1)
				.paddingOuter(.5);

			let y = d3.scaleLinear().domain([minVal, maxVal]).range([+margin.top+height, margin.top]);

			svg.attr("transform", "translate(0,0)")
				.append("g")
				.attr("id", "axisGroup")

			svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + ",0)";
				})
				.call(d3.axisLeft(y).ticks(5));

			/// render x axis line
			svg.select("#axisGroup")
				.append("line")
				.attr("x1", (margin.left - margin.bump))
				.attr("x2", (margin.left + width))
				.attr("y1", margin.top + height + margin.bump)
				.attr("y2", margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 1)

			///render group Label
			let groupName = "";

			sumstat.map(d => {
				let keyIndex = groupVals.indexOf(d.value.group) % colors.length,
					fillColor = colors[keyIndex];

				if (d.value.group != groupName) {

					groupName = d.value.group;

					svg.select("#axisGroup")
						.append("line")
						.attr("x1", x(d.key))
						.attr("x2", x(d.key))
						.attr("y1", margin.top + height + margin.bump)
						.attr("y2", margin.top + height + (margin.bump * 2))
						.attr("stroke", "#000000")
						.style("stroke-width", 1)

					svg.select("#axisGroup")
						.append("text")
						.attr("transform", "translate(" + (x(d.key) - 6) + "," + (y(minVal) + 18) + ")rotate(45)")
						.attr("x", 0)
						.attr("y", 0)
						.style("font-family", "Arial").style("font-size", 11)
						.style("fill", fillColor)
						.text(groupName);
				}
			})

			

			let baseline = (minVal < 0)? y(0) : y(minVal);

			//render baseline
			svg.select("#axisGroup")
				.append("line")
				.attr("x1", (margin.left - margin.bump))
				.attr("x2", (margin.left + width))
				.attr("y1", baseline)
				.attr("y2", baseline)
				.attr("stroke", "#999999")
				.style("stroke-width", 1)

			// render bars

			let barWidth = (width / sumstat.length) - 6;
			barWidth = barWidth <= 4 ? 4 : barWidth >= 40 ? 40 : barWidth;

			sumstat.map(d => {
				let keyIndex = groupVals.indexOf(d.value.group) % colors.length,
					fillColor = colors[keyIndex];

				let barHeight = (minVal < 0 )? y(d.value.value) - y(0): y(d.value.value) - y(minVal);
				let labelYPos = (barHeight < 0)? (baseline + barHeight) : baseline;

				if(barHeight < 0) {
					barHeight*=-1;

					svg.select("#axisGroup")
						.append("rect")
						.attr("x", x(d.key) - (barWidth / 2))
						.attr("y", baseline - barHeight)
						.attr("height", barHeight)
						.attr("width", barWidth)
						.style("fill", fillColor);

				} else {

					svg.select("#axisGroup")
						.append("rect")
						.attr("x", x(d.key) - (barWidth / 2))
						.attr("y", baseline)
						.attr("height", barHeight)
						.attr("width", barWidth)
						.style("fill", fillColor);
				}

				svg.select("#axisGroup")
					.append("line")
					.attr("x1", x(d.key))
					.attr("x2", x(d.key))
					.attr("y1", labelYPos - 3)
					.attr("y2", labelYPos - 8)
					.attr("stroke", "#999999")
					.style("stroke-width", 1)

				svg.select("#axisGroup")
					.append("text")
					.attr("transform", "translate(" + (x(d.key) + 3) + "," + (labelYPos - 11) + ")rotate(-90)")
					.attr("x", 0)
					.attr("y", 0)
					.style("font-family", "Arial").style("font-size", 11)
					.text(d.value.name);
			})
			*/
		},
	},
});

$(function () {});
</script>

<style>
</style>



