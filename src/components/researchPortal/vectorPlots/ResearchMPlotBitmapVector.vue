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

export default Vue.component("research-m-bitmap-plot-vector", {
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
		//this.renderMPlot()
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
	},
	methods: {
		renderPlot(DATA) {
			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				"#" + this.sectionId + "mPlotWrapper"
			);

			let margin = {
				left: this.margin.left / 2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}
			
			let width = !!this.renderConfig['width']? this.renderConfig['width']: 
				bitmapWrapper.clientWidth - (margin.left + margin.right);
			let height = !!this.renderConfig['height'] ? this.renderConfig['height']
							: 300;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_m_plot_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("style","border:solid 1px #dddddd");		

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

			// render axis

			let yAxisField = this.renderConfig['y axis field'],
				xAxisField = this.renderConfig['x axis field'],
				renderField = this.renderConfig['render by'];

			// for x axis

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
					.attr("x1", x(totalChrsLength - (chr/2)))
					.attr("x2", x(totalChrsLength - (chr / 2)))
					.attr("y1", margin.top + height + margin.bump)
					.attr("y2", margin.top + height + (margin.bump *2))
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

			if(!!this.renderConfig["thresholds"]) {
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
				
				let fillColor = this.colors[colorIndex % this.colors.length]+'75'

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

				colorIndex ++;
				prevChr += this.chrLengths[chr];
			})
		},
	},
});

$(function () {});
</script>

<style>
</style>



