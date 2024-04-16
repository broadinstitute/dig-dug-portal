<template>
	<div>
		<h1>test</h1>
		<div :id="'vector_wrapper_'+sectionId" :class="'vector-wrapper-'+ canvasId">

		</div>
		<div class="vector-wrapper">

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

export default Vue.component("research-box-plot-vector", {
	props: [
		"renderData",
		"renderConfig",
		"colors",
		"margin",
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
		this.renderBoxPlot(this.margin)
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
			this.renderBoxPlot()
		}
	},
	methods: {
		renderBoxPlot() {
			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				"#" + this.sectionId + "boxPlotWrapper"
			);

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
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				
			let localData = [];
			for (const [key, value] of Object.entries(this.renderData)) {
				localData = localData.concat(value);
			}

			let maxField = this.renderConfig['y axis field'].max, 
				minField = this.renderConfig['y axis field'].min,
				medianField = this.renderConfig['y axis field'].median,
				q1Field = this.renderConfig['y axis field'].q1,
				q3Field = this.renderConfig['y axis field'].q3,
				groupField = this.renderConfig['group by'],
				renderField = this.renderConfig['render by'];

			let maxVals = [...new Set(localData.map(d => d[maxField]))],
				minVals = [...new Set(localData.map(d => d[minField]))],
				groupVals = [...new Set(localData.map(d => d[groupField]))],
				colors = this.colors;

			let maxVal = Math.ceil(maxVals.reduce((prev, next) => prev > next ? prev : next)),
				minVal = Math.floor(minVals.reduce((prev, next) => prev < next ? prev : next));

			let sumstat = d3.nest()
				.key(function (d) { return d[renderField] })
				.rollup(function (d) {
					let D= d[0];
					let interQuantileRange = D[q3Field] - D[q1Field];
					return ({ q1: D[q1Field], median: D[medianField], q3: D[q3Field], 
						interQuantileRange: interQuantileRange, min: D[minField], max: D[maxField], name: D[renderField], group: D[groupField] })
				})
				.entries(localData);

			let x = d3.scaleBand()
				.range([0, width])
				.domain(sumstat.map(s=>s.key))
				.paddingInner(1)
				.paddingOuter(.5);

			let y = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
				svg.append("g").call(d3.axisLeft(y));

			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x).tickFormat(() => ""))

			///rener group Label
			let groupName = "";
			svg
				.selectAll("groupText")
				.data(sumstat)
				.enter()
				.append("text")
				.attr("transform", function (d) {
					return "translate(" + (x(d.key)-6) + "," + (y(0) + 12) + ")rotate(45)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 11)
				.style("fill", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.text(function (d) { 
						if(groupName == "") {
							groupName = d.value.group
							return d.value.group
						} else if(d.value.group == groupName) {
							groupName = d.value.group
							return "";
						} else if(d.value.group != groupName) {
							groupName = d.value.group
							return d.value.group;
						}
					}
				);
				
			

				// Show the main vertical line
			svg
				.selectAll("vertLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key)) })
				.attr("x2", function (d) { return (x(d.key)) })
				.attr("y1", function (d) { return (y(d.value.min)) })
				.attr("y2", function (d) { return (y(d.value.max)) })
				.attr("stroke", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("stroke-width", 1)

				//render label lines

			svg
				.selectAll("labelLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key)) })
				.attr("x2", function (d) { return (x(d.key)) })
				.attr("y1", function (d) { return (y(d.value.max)) - 3 })
				.attr("y2", function (d) { return (y(d.value.max) - 8 ) })
				.attr("stroke", function (d) {
					let fillColor = "#999999";
					return fillColor
				})
				.style("stroke-width", 1)

				//render labels

			svg
				.selectAll("labelText")
				.data(sumstat)
				.enter()
				.append("text")
				.attr("transform", function (d) {
					return "translate(" + (x(d.key)+3) + "," + (y(d.value.max) - 11) + ")rotate(-90)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.style("font-family", "Arial").style("font-size", 11)
				.text( function(d) { return d.key});


			let boxWidth = ((width - (margin.left + margin.right)) / sumstat.length) - 20;
			boxWidth = boxWidth <= 10 ? 10 : boxWidth >= 40 ? 40 : boxWidth;

			svg
				.selectAll("boxes")
				.data(sumstat)
				.enter()
				.append("rect")
				.attr("x", function (d) { return (x(d.key) - boxWidth / 2) })
				.attr("y", function (d) { return (y(d.value.q3)) })
				.attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)) })
				.attr("width", boxWidth)
				.attr("stroke", function(d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("fill", "#ffffff")

			svg
				.selectAll("medianLines")
				.data(sumstat)
				.enter()
				.append("line")
				.attr("x1", function (d) { return (x(d.key) - boxWidth / 2) })
				.attr("x2", function (d) { return (x(d.key) + boxWidth / 2) })
				.attr("y1", function (d) { return (y(d.value.median)) })
				.attr("y2", function (d) { return (y(d.value.median)) })
				.attr("stroke", function (d) {
					let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
					let fillColor = colors[keyIndex];
					return fillColor
				})
				.style("stroke-width", 2)

/*
				,
				xScale = d3.scaleBand().range([0, width]).domain([attribute]).padding(0.05);;*/

				
			
		},
	},
});

$(function () {});
</script>

<style>
</style>



