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

export default Vue.component("research-phewas-plot-vector", {
	props: [
		"renderData",
		"renderConfig",
		"phenotypeMap",
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
		this.renderPheWasPlot()
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
		renderPheWasPlot() {
			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			let bitmapWrapper = document.querySelector(
				"#" + this.sectionId + "pheWasPlotWrapper"
			);

			console.log("#" + this.sectionId + "pheWasPlotWrapper");
			console.log(this.renderData);

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
				.attr("id", "vector_pheWas_plot_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);		

			let yAxisField = this.renderConfig['y axis field'],
				betaField = this.renderConfig['beta field'],
				renderField = this.renderConfig['render by'];



			let sumstat = [];

			let sumstatIndex = 0
			for (const [key, value] of Object.entries(this.renderData)) {
				
				value.map((v) => {
					let tempObj = { key: sumstatIndex, value: {} }
					tempObj.value['value'] = (this.renderConfig["convert y -log10"] == true || this.renderConfig["convert y -log10"] == "true")? -Math.log10(v[yAxisField]): v[yAxisField];
					tempObj.value['beta'] = v[betaField];
					tempObj.value['name'] = (!!this.renderConfig["phenotype map"] && this.renderConfig["phenotype map"] == "kp phenotype map")?
						this.phenotypeMap[v[renderField]]["description"]:v[renderField];
					tempObj.value['group'] = key;

					sumstat.push(tempObj);

					sumstatIndex++;
				})
			}
			//render axis labels

			svg.append("g")
				.attr("id", "axisLabelsGroup")
				.attr("transform", "translate(0,0)");

			svg.select("#axisLabelsGroup")
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")

			svg.select("#axisLabelsGroup")
				.append("text")
				.attr("x", (margin.left + (width / 2)))
				.attr("y", (height + margin.top + margin.bottom - 20))
				.text(this.renderConfig['x axis label']);

			svg.select("#axisLabelsGroup")
				.append("text")
				.attr("transform", function (d) {
					return "translate("+(margin.bump+20)+"," + (margin.top+(height/2)) + ")rotate(-90)";
				})
				.attr("x", 0)
				.attr("y", 0)
				.text(this.renderConfig['y axis label']);

			let xDomain = [];
			let indexNum = 0;
			sumstat.map(s => {
				xDomain.push(s.key + indexNum);
				indexNum++
			});

			/// render axis
			let vals = [...new Set(sumstat.map(d => d.value.value))],
				groupVals = [...new Set(sumstat.map(d => d.value.group))],
				colors = this.colors;

			let maxVal = Math.ceil(vals.reduce((prev, next) => prev > next ? prev : next)),
				minVal = Math.floor(vals.reduce((prev, next) => prev < next ? prev : next));

			let x = d3.scaleBand()
				.range([margin.left, width + margin.left])
				.domain(sumstat.map(s => s.key))
				.paddingInner(1)
				.paddingOuter(.5);

			let y = d3.scaleLinear().domain([minVal, maxVal]).range([height + margin.top, margin.top]);

			svg.attr("transform", "translate(0,0)")
				.append("g")
				.attr("id","axisGroup")
			
			svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + "," + "0" + ")";
				})
				.call(d3.axisLeft(y));

			/// render x axis line
			svg.select("#axisGroup")
				.append("line")
				.attr("x1", (margin.left - margin.bump))
				.attr("x2", (margin.left +width))
				.attr("y1", margin.top + height + margin.bump)
				.attr("y2", margin.top + height + margin.bump)
				.attr("stroke", "#000000")
				.style("stroke-width", 1)

			///render group Label
			let groupName = "";

			sumstat.map(d => {
				let keyIndex = groupVals.indexOf(d.value.group) % colors.length,
				fillColor = colors[keyIndex];

				if(d.value.group != groupName) {
					
					groupName = d.value.group;

					svg.select("#axisGroup")
						.append("line")
						.attr("x1", x(d.key))
						.attr("x2", x(d.key))
						.attr("y1", margin.top + height + margin.bump)
						.attr("y2", margin.top + height + (margin.bump *2))
						.attr("stroke", "#000000")
						.style("stroke-width", 1)

					svg.select("#axisGroup")
						.append("text")
						.attr("transform", "translate(" + (x(d.key) - 6) + "," + (y(0) + 18) + ")rotate(45)")
						.attr("x", 0)
						.attr("y", 0)
						.style("font-family", "Arial").style("font-size", 11)
						.style("fill", fillColor)
						.text(groupName);

						
				}
			})
			

				// render circle or triangle
				console.log("this.renderConfig['beta field']", this.renderConfig['beta field'])
			if(!!this.renderConfig['beta field'] && this.renderConfig['beta field'] != null && this.renderConfig['beta field'] != 'null') {
				
				let sym = d3.symbol().type(d3.symbolTriangle).size(50);

				svg.selectAll("triangles")
					.data(sumstat)
					.enter()
					.append("path")
					.attr("d", sym)
					.attr("fill", function (d) {
						let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
						let fillColor = colors[keyIndex];
						return fillColor
					})
					.attr("transform", function (d) {
						let betaAngle = (d.value.beta > 0)? 0:180; 
						let yPos = (d.value.beta > 0) ? y(d.value.value)+2 : y(d.value.value)-2;
						return "translate(" + x(d.key) + "," + yPos + ")rotate("+betaAngle+")";
					})
					.attr("stroke", "#000000")
					.style("stroke-width", 0.5);
					
				
			} else {
				svg
					.selectAll("circle")
					.data(sumstat)
					.enter()
					.append('circle')
					.attr('cx', function (d) {
						return (x(d.key))
					})
					.attr('cy', function (d) {
						return (y(d.value.value))
					})
					.attr('r', 5)
					.style('fill', function (d) {
						let keyIndex = groupVals.indexOf(d.value.group) % colors.length;
						let fillColor = colors[keyIndex];
						return fillColor
					})
					.attr("stroke", "#000000")
					.style("stroke-width", 0.5);;
			}
			
				// render threshold lines
			let threshold;

			this.renderConfig["thresholds"].map(t=>{
				threshold = (typeof t == 'string') ? Number(t) : t;

				if (this.renderConfig["convert y -log10"] == true || this.renderConfig["convert y -log10"] == "true") {
					threshold = -Math.log10(t);
				}

				svg.select("#axisGroup")
					.append('line')
					.attr('style', "stroke-dasharray: 5,2")
					.attr('x1', margin.left)
					.attr('y1',y(threshold) )
					.attr('x2', width+margin.left)
					.attr('y2', y(threshold))
					.attr("stroke", "#FFAA00")
					.style("stroke-width", 1)
				
			})

			// render labels

			let groups = [...new Set( sumstat.map(s=>s.value.group))];
			let xPosGap = width / sumstat.length;

			groups.map(group =>{
				let groupItems = [...new Set(sumstat.filter(s=>s.value.group == group))],
					xLimit = x(groupItems[groupItems.length-1].key) + xPosGap,
					yLimit = y(threshold);
				
				groupItems.map((d,dIndex)=>{

					let xPos = x(d.key),
						nextXPos = xPos + xPosGap,
						dXPos = x(d.key) + (dIndex * 11);

					dXPos = nextXPos > dXPos ? xPos : dXPos;

					if(dIndex == 0 || dXPos < xLimit) {
						let fillColor = (y(d.value.value) < yLimit) ? "#000000" : "#cccccc";
						svg.select("#axisGroup")
							.append("line")
							.attr("x1", xPos)
							.attr("x2", dXPos)
							.attr("y1", y(d.value.value))
							.attr("y2", y(d.value.value) - 10)
							.attr("stroke", "#999999")
							.style("stroke-width", 0.5)

						svg.select("#axisGroup")
							.append("text")
							.attr("transform", "translate(" + (dXPos+3) + "," + (y(d.value.value) - 12) + ")rotate(-90)")
							.attr("x", 0)
							.attr("y", 0)
							.style("font-family", "Arial").style("font-size", 11)
							.style("fill",fillColor)
							.text(d.value.name);
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



