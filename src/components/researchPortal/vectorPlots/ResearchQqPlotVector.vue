<template>
	<div>
		<div :id="'vector_wrapper_' + sectionId" :class="'vector-wrapper-' + canvasId">

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

export default Vue.component("research-qq-plot-vector", {
	props: [
		"renderData",
		"renderConfig",
		"colors",
		"margin",
		"chrLengths",
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
		//this.renderPlot('default')
	},
	beforeDestroy() {
	},
	computed: {
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_", "-").toLowerCase();
			return canvasId;
		}
	},
	watch: {
	},
	methods: {
		renderPlot(DATA) {


			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				"#" + this.sectionId + "qqPlotWrapper"
			);

			let margin = {
				left: this.margin.left / 2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}

			let width = !!this.renderConfig['width'] ? this.renderConfig['width'] :
				bitmapWrapper.clientWidth - (margin.left + margin.right);
			let height = !!this.renderConfig['height'] ? this.renderConfig['height']
				: 300;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_qq_plot_" + this.sectionId)
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			svg.append("g")
				.attr("id", "plot")
				.attr("transform", "translate(0,0)");

			// render labels
			svg.select("#plot")
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")

			svg.select("#plot")
				.append("text")
				.attr("x", (margin.left + (width / 2)))
				.attr("y", (height + margin.top + margin.bottom - 10))
				.text(this.renderConfig['x axis label']);

			svg.select("#plot")
				.append("text")
				.attr("transform", "translate(" + (margin.bump + 20) + "," + (margin.top + (height / 2)) + ")rotate(-90)")
				.attr("x", 0)
				.attr("y", 0)
				.text(this.renderConfig['y axis label']);

			let yAxisField = this.renderConfig['y axis field'],
				renderField = this.renderConfig['render by'];

			let qqData = this.utils.sortUtils.sortArrOfObjects(this.renderData[DATA].unsorted, yAxisField, "number", "desc");
			

			let yMax,
				yMin,
				maxXVal = 8,
				minXVal = 0;


			qqData.map((d) => {
				let yValue = d[yAxisField];

				if (yMin == null) {
					yMin = yValue;
				}
				if (yMax == null) {
					yMax = yValue;
				}

				if (yValue < yMin) {
					yMin = yValue;
				}
				if (yValue > yMax) {
					yMax = yValue;
				}
			});


			let expected = [];
			for (let i = 1; i <= qqData.length; i++) {
				expected.push(Math.log10(i + 1 / qqData.length));
			}
			// render axis

			


			let y = d3.scaleLinear().domain([yMin, yMax]).range([height + margin.top, margin.top]);

			svg.select("#plot")
				.append("g")
				.attr("transform",  "translate(" + (margin.left - margin.bump) + ",0)")
				.call(d3.axisLeft(y).ticks(5));

			let x = d3.scaleLinear().domain([minXVal, maxXVal]).range([margin.left, width]);
			let xReverse = d3.scaleLinear().domain([maxXVal, minXVal]).range([margin.left, width]);

			svg.select("#plot")
				.append("g")
				.attr("transform", function (d) {
					return "translate(0, " + (margin.top + height + margin.bump) + ")";
				})
				.call(d3.axisBottom(x));


			let yPosByPixel = height / (yMax - yMin);

			svg.select("#plot")
				.append("line")
				.attr("x1", x(0))
				.attr("x2", x(8))
				.attr("y1", y(yMin))
				.attr("y2", margin.top + height - 8 * yPosByPixel)
				.attr("stroke", "#FF0000")
				.style("stroke-width", 0.75)

			qqData.map((d,yIndex) => {
				let xPos = x(expected[expected.length-1] - expected[yIndex]),
					yPos = y(d[yAxisField])

				svg.select("#plot")
					.append('circle')
					.attr('cx', xPos)
					.attr('cy', yPos)
					.attr('r', 2)
					.style('fill', "#0066FF");
			})

			

			if (!!this.renderData[DATA].lambda) {

				svg.select("#plot")
					.style("font-family", "Arial").style("font-size", 12)
					.style("text-anchor", "end")

				svg.select("#plot")
					.append("text")
					.attr("x", x(8))
					.attr("y", y(yMin))
					.text("lambda(0.95): " + this.renderData[DATA].lambda.toFixed(4));
			}

			

			// for x axis

			/* 

			let totalChrsLength = 0;

			Object.values(this.chrLengths).map(chr => {
				totalChrsLength += chr;
			})


			let x = d3.scaleLinear().domain([0, totalChrsLength]).range([margin.left, margin.left + width]);

			svg.select("#plot")
				.append("line")
				.attr("x1", x(0) - margin.bump)
				.attr("x2", x(totalChrsLength))
				.attr("y1", margin.top + height + margin.bump)
				.attr("y2", margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			// render x ticks
			totalChrsLength = 0;
			Object.keys(this.chrLengths).map(key => {
				let chr = this.chrLengths[key];
				totalChrsLength += chr;

				svg.select("#plot")
					.append("line")
					.attr("x1", x(totalChrsLength - (chr / 2)))
					.attr("x2", x(totalChrsLength - (chr / 2)))
					.attr("y1", margin.top + height + margin.bump)
					.attr("y2", margin.top + height + (margin.bump * 2))
					.attr("stroke", "#000000")
					.style("stroke-width", 0.75)

				svg.select("#plot")
					.append("text")
					.attr("x", x(totalChrsLength - (chr / 2)))
					.attr("y", (margin.top + height + (margin.bump * 2) + 10))
					.text(key);
			})

			// for y axis
			let dataArr = this.renderData[DATA].unsorted.map(d => d[yAxisField]);

			let maxYVal = Math.ceil(dataArr.reduce((prev, next) => prev > next ? prev : next)),
				minYVal = Math.floor(dataArr.reduce((prev, next) => prev < next ? prev : next));

			let y = d3.scaleLinear().domain([minYVal, maxYVal]).range([height + margin.top, margin.top]);

			svg.select("#plot")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + "," + "0" + ")";
				})
				.call(d3.axisLeft(y).ticks(5));

			if (!!this.renderConfig["thresholds"]) {
				this.renderConfig["thresholds"].map(t => {
					let threshold = (typeof t == 'string') ? Number(t) : t;

					if (this.renderConfig["convert y -log10"] == true || this.renderConfig["convert y -log10"] == "true") {
						threshold = -Math.log10(t);
					}

					svg.select("#plot")
						.append('line')
						.attr('style', "stroke-dasharray: 5,2")
						.attr('x1', margin.left)
						.attr('y1', y(threshold))
						.attr('x2', width + margin.left)
						.attr('y2', y(threshold))
						.attr("stroke", "#FFAA00")
						.style("stroke-width", 1)

				})
			}

			/// render dots
			let prevChr = 0;
			let colorIndex = 1
			Object.keys(this.renderData[DATA].sorted).map(chr => {

				let fillColor = this.colors[colorIndex % this.colors.length] + '75'

				this.renderData[DATA].sorted[chr].map(variant => {
					let yPos = y(variant[yAxisField]);
					let xPos = x(variant['locus'] + prevChr);

					svg.select("#plot")
						.append('circle')
						.attr('cx', xPos)
						.attr('cy', yPos)
						.attr('r', 4)
						.style('fill', fillColor);
				})

				colorIndex++;
				prevChr += this.chrLengths[chr];
			})*/
		},
	},
});

$(function () { });
</script>

<style></style>



