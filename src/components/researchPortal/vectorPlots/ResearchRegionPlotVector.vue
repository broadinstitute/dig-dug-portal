<template>
	<div>
		<div :id="'vector_wrapper_'+sectionId" :class="'vector-wrapper-'+ sectionId">

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

export default Vue.component("research-region-plot-vector", {
	props: [
		"assoData",
		"ldData",
		"recombData",
		"renderConfig",
		"colors",
		"margin",
		"region",
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
	},
	watch: {
	},
	methods: {
		renderPlot(DATA) {



			let assoData = this.assoData[DATA];
			let margin = {
				left: this.margin.left / 2,
				right: this.margin.right / 2,
				top: this.margin.top / 2,
				bottom: this.margin.bottom / 2,
				bump: this.margin.bump / 2,
			}

			let wrapperClass = `.vector-wrapper-${this.sectionId}`;


			let bitmapWrapper = document.querySelector(
				'#assoPlotsWrapper' + DATA + this.sectionId
			);

			let width = !!this.renderConfig['width'] ? this.renderConfig['width'] : bitmapWrapper.clientWidth - (margin.left + margin.right);

			let height = !!this.renderConfig['height']? this.renderConfig['height'] : 200;


			// set up svg 
			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_asso_plot_" + this.sectionId)
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);
				//.attr("style","border: solid 1px #999999;");

			svg.append("g")
				.attr("id", "plot")
				.attr("transform", "translate(0,0)");

			//render labels

			svg.select("#plot")
				.style("font-family", "Arial")
				.style("font-size", "12px")
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

			svg.select("#plot")
				.append("text")
				.attr("transform", "translate(" + (margin.left + margin.right + width - 20) + "," + ((margin.top + margin.bottom + height) / 2) + ")rotate(-90)")
				.attr("x", 0)
				.attr("y", 0)
				.text("Recombination Rate (cM/Mb)");


			// render axis
			

			let x = d3.scaleLinear().domain([this.region.start, this.region.end]).range([margin.left, width + margin.left]);

			svg.select("#plot")
				.append('line')
				.attr('x1', margin.left - margin.bump)
				.attr('y1', margin.top + height + margin.bump)
				.attr('x2', margin.left + width + margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			let xStep = Math.ceil((this.region.end - this.region.start) / 5);

			for (let i = 0; i < 6; i++) {

				let tickXPos = x(this.region.start + (xStep * i));

				svg.select("#plot")
					.append('line')
					.attr('x1', tickXPos)
					.attr('y1', margin.top + height + margin.bump)
					.attr('x2', tickXPos)
					.attr('y2', margin.top + height + (margin.bump * 2))

				let xMaxMinGap = this.region.end - this.region.start;
				let xDecimal = xMaxMinGap <= 1 ? 2 : xMaxMinGap <= 50 ? 1 : 0;

				let positionLabel = this.utils.Formatters.decimalFormatter(
					this.region.start + i * xStep,
					xDecimal
				);

				positionLabel =
					positionLabel >= 100000
						? Math.round(positionLabel * 0.001) + "k"
						: positionLabel;

				svg.select("#plot")
					.append("text")
					.attr("x", tickXPos)
					.attr("y", margin.top + height + 20)
					.style("text-anchor", "middle")
					.text(positionLabel);
			}

			let assoY = d3.scaleLinear().domain([Math.floor(assoData.yAxLow), Math.ceil(assoData.yAxHigh)]).range([margin.top + height, margin.top]);

			svg.select("#plot")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + "," + "0" + ")";
				})
				.style("font", "12px Arial")
				.call(d3.axisLeft(assoY).ticks(6));

			let recombY = d3.scaleLinear().domain([0,100]).range([margin.top + height, margin.top]);

			svg.select("#plot")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left + width + margin.bump) + "," + "0" + ")";
				})
				.style("font", "12px Arial")
				.call(d3.axisRight(recombY).ticks(5));

			////console.log(this.recombData)

			/// render recomb line

			//console.log("asso", assoData)
			//console.log("ld", this.ldData)
			//console.log("recomb", this.recombData)

			this.recombData.position.map( (p, pIndex) => {
				if(pIndex != 0) {
					let xPos1 = x(this.recombData.position[pIndex-1]),
						xPos2 = x(p),
						yPos1 = recombY(this.recombData.recomb_rate[pIndex - 1]),
						yPos2 = recombY(this.recombData.recomb_rate[pIndex]);

					svg.select("#plot")
						.append('line')
						.attr('x1', xPos1)
						.attr('y1', yPos1)
						.attr('x2', xPos2)
						.attr('y2', yPos2)
						.attr("stroke", "#007BFF")
						.style("stroke-width", 0.75)
					
				}
				
			})

			// render Dots

			let yAxisField = this.renderConfig['y axis field'],
				xAxisField = this.renderConfig['x axis field'],
				renderField = this.renderConfig['render by'];

			let assoVariants = Object.keys(assoData.data);

			assoVariants.map(variant =>{
				let variantPosition = assoData.data[variant][xAxisField]
				if(variantPosition >= this.region.start && variantPosition <= this.region.end) {
					let xPos = x(variantPosition),
						yPos = assoY(assoData.data[variant][yAxisField]) + 2.5,
						fillColor = "#00000030",
						ldVariantField = this.renderConfig['ld server']['ref variant field'],
						ldVariant = assoData.data[variant][ldVariantField];

						//console.log("ldVariant", ldVariant)

					if (!!this.ldData[DATA].data[ldVariant]) {
						let index = Math.floor(this.ldData[DATA].data[ldVariant] * 5);
						fillColor = this.colors[index];
					}

					if (ldVariant == this.ldData[DATA].refVariant) {

						let sym = d3.symbol().type(d3.symbolDiamond).size(50);

						svg.select("#plot")
							.append("path")
							.attr("d", sym)
							.attr("fill", fillColor)
							.attr("transform", "translate(" + xPos + "," + yPos + ")")
							.attr("stroke", "#000000")
							.style("stroke-width", 0.5);

					} else {
						svg.select("#plot")
							.append('circle')
							.attr('cx', xPos)
							.attr('cy', yPos)
							.attr('r', 5)
							.style('fill', fillColor);
					}
				}
				
			})
		},
	},
});

$(function () {});
</script>

<style>
</style>



