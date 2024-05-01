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
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_","-").toLowerCase();
			return canvasId;
		}
	},
	watch: {
		canvasId(ID) {
		}
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

			//console.log(this.recombData)

			/// render recomb line

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

			console.log("asso",assoData)
			console.log("ld", this.ldData)

			let yAxisField = this.renderConfig['y axis field'],
				xAxisField = this.renderConfig['x axis field'],
				renderField = this.renderConfig['render by'];

			let assoVariants = Object.keys(assoData.data);

			assoVariants.map(variant =>{
				let variantPosition = assoData.data[variant][xAxisField]
				if(variantPosition >= this.region.start && variantPosition <= this.region.end) {
					let xPos = x(variantPosition),
						yPos = assoY(assoData.data[variant][yAxisField]) + 2.5,
						fillColor = "#00000030";

					if (!!this.ldData[DATA].data[variant]) {
						let index = Math.floor(this.ldData[DATA].data[variant] * 5);
						fillColor = this.colors[index];
					}

					if (variant == this.ldData[DATA].refVariant) {

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



			
/*
			let trackGroups = Object.keys(this.renderData).sort();
			let colorGroups = [];
			
			Object.values(this.renderData).map(value=>{
				Object.values(value).map(region=>{
					region.map(r => {
						colorGroups.push(r[this.renderConfig['color by']])
					})
				})
			})

			colorGroups = [...new Set(colorGroups)].sort();

			let colorGroupsWidth = 0;
			colorGroups.map(c => colorGroupsWidth += (getWidth(c, 12, "Arial") + 20));
			
			let width = !!this.renderConfig['width']? this.renderConfig['width']: 
				bitmapWrapper.clientWidth - (margin.left + margin.right);

			let legendLines =  Math.ceil(((colorGroups.length * 20)+colorGroupsWidth) /width);
			margin.top = margin.top + (20 * legendLines);

			let height = this.renderConfig['track height'] * trackGroups.length;

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_region_track_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);

			svg.append("g")
				.attr("id", "tracksGroup")
				.attr("transform", "translate(0,0)")
				.style("font-family", "Arial")
				.style("font-size", 12)
				.style("text-anchor", "start");

			// render legends first

			let prevX = margin.bump;
			let yPos = 20;
			colorGroups.map( (text, tIndex) => {
				let colorIndex = !!this.renderConfig["color by"] ? tIndex % this.colors.length : null,
					fillColor = !!colorIndex || colorIndex === 0 ? this.colors[colorIndex] : "#00000066";

				svg.select("#tracksGroup")
					.append("rect")
					.attr("x", prevX)
					.attr("y", yPos - 12)
					.attr("height", 12)
					.attr("width", 12)
					.style("fill", fillColor)

				let txtWidth = getWidth(text, 12, "Arial")

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", prevX + 15)
					.attr("y", yPos)
					.text(text);

				txtWidth = txtWidth + getWidth(colorGroups[tIndex+1], 12, "Arial")

				if((prevX + txtWidth + 20) > (width + margin.left)) {
					prevX = margin.bump;
					yPos += 20;
				} else {
					prevX += getWidth(text, 12, "Arial") + 20;
				}
			})

			let x = d3.scaleLinear().domain([this.region.start, this.region.end]).range([margin.left, width + margin.left]);

			svg.select("#tracksGroup")
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

				svg.select("#tracksGroup")
					.append('line')
					.attr('x1', tickXPos)
					.attr('y1', margin.top + height + margin.bump)
					.attr('x2', tickXPos)
					.attr('y2', margin.top + height + (margin.bump*2))
					.attr("stroke", "#000000")
					.style("stroke-width", 0.75)

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

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", tickXPos)
					.attr("y", margin.top + height + 20)
					.style("text-anchor", "middle")
					.text(positionLabel);
			}


			svg.select("#tracksGroup")
				.append('line')
				.attr('x1', margin.left - margin.bump)
				.attr('y1', margin.top)
				.attr('x2', margin.left - margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			svg.select("#tracksGroup")
				.append('line')
				.attr('x1', margin.left + width + margin.bump)
				.attr('y1', margin.top)
				.attr('x2', margin.left + width + margin.bump)
				.attr('y2', margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 0.75)

			//svg.select("#tracksGroup")

			trackGroups.map((group,gIndex) =>{

				let trackLabel = "";
				let txtWidth = getWidth(group, 12, "Arial")

				if (txtWidth > (margin.left - margin.bump)) {
					for (let i = 0; i < group.length; i++) {
						if (getWidth(trackLabel + group[i], 12, "Arial") < (margin.left - (margin.bump*6))) {
							trackLabel = trackLabel + group[i];
						}
					}
					trackLabel += "..."
				} else {
					trackLabel = group;
				}

				svg.select("#tracksGroup")
					.append("text")
					.attr("x", margin.bump)
					.attr("y", (gIndex * this.renderConfig['track height']) + margin.top + 10)
					.text(trackLabel);

				if(gIndex%2 == 0) {
					svg.select("#tracksGroup")
						.append("rect")
						.attr("x", margin.left)
						.attr("y", (gIndex * this.renderConfig['track height']) + margin.top)
						.attr("height", this.renderConfig['track height'])
						.attr("width", width)
						.style("fill", "#eeeeee")
				}

				Object.keys(this.renderData[group]).map(key=>{
					let region = key.split("-"),
						start = x(region[0]) < x(this.region.start)? x(this.region.start) : x(region[0]),
						end = x(region[1]) > x(this.region.end) ? x(this.region.end) : x(region[1]),
						blockWidth = ((end - start) < 1)? 1 : end - start;

					this.renderData[group][key].map(block=>{
						let colorIndex = !!this.renderConfig["color by"] ? (colorGroups.indexOf(block[this.renderConfig["color by"]]) % this.colors.length) : null,
							fillColor = !!colorIndex || colorIndex === 0 ? this.colors[colorIndex] : "#00000066";


						svg.select("#tracksGroup")
							.append("rect")
							.attr("x", start)
							.attr("y", (gIndex * this.renderConfig['track height']) + margin.top)
							.attr("height", this.renderConfig['track height'])
							.attr("width", blockWidth)
							.style("fill", fillColor)
					})
				})
			})
*/
		
		},
	},
});

$(function () {});
</script>

<style>
</style>



