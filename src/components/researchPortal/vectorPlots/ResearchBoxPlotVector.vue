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

			let margin = {
				left: this.margin.left/2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}
			let width = !!this.renderConfig['width']? this.renderConfig['width']: 
				document.getElementById(wrapperId).clientWidth - (margin.left + margin.right);
			let height = !!this.renderConfig['height'] ? this.renderConfig['height']/2 : 150;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.attr("style","border: solid 1px #000")
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

			let maxVals = [...new Set(localData.map(d => d[maxField]))]
			let minVals = [...new Set(localData.map(d => d[minField]))]
			let attribute = [...new Set(localData.map(d => d[groupField]))]

			let maxVal = Math.ceil(maxVals.reduce((prev, next) => prev > next ? prev : next)),
				minVal = Math.floor(minVals.reduce((prev, next) => prev < next ? prev : next));

				console.log("maxVal, minVal", maxVal, minVal)

			let sumstat = d3.nest()
				.key(function (d) { return d[renderField] })
				.rollup(function (d) {
					let interQuantileRange = d[q3Field] - d[q1Field];
					return ({ q1: d[q1Field], median: d[medianField], q3: d[q3Field], interQuantileRange: interQuantileRange, min: d[minField], max: d[maxField], name: d[renderField] })
				})
				.entries(localData);

			let x = d3.scaleBand()
				.range([0, width])
				.domain([])
				.paddingInner(1)
				.paddingOuter(.5)
			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x))


				
			let yScale = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
				svg.append("g").call(d3.axisLeft(yScale));
				//svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));

				for (const [key, value] of Object.entries(this.renderData)) {
					value.map(v =>{


					})
				}

				

				console.log("sumstat", sumstat)

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



