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

export default Vue.component("research-volcano-plot-vector", {
	props: [
		"renderData",
		"renderConfig",
		"margin",
		"sectionId",
		"utils",
		"renderOnMount"
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
		//this.renderVolcanoPlot()
		if (this.renderOnMount) {this.renderPlot()};
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
		renderPlot() {

			let renderConfig = this.renderConfig;

			let calculateCondition = function (EXP, LENGTH) {
				let calcString = "";

				EXP.map(e => {
					let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e :
						(typeof e === 'number') ? e :
							(typeof e === 'string') ? (e == "data length") ? LENGTH : e : null;

					calcString += eValue;
				});

				let threshold = eval(calcString);

				return threshold;
			}

			let conditions = [["x condition", "lower than"], ["x condition", "greater than"],
			["y condition", "lower than"], ["y condition", "greater than"]]

			conditions.map(condition => {
				if (renderConfig[condition[0]][condition[1]] && renderConfig[condition[0]][condition[1]] == "calculate") {
					let expression = renderConfig[condition[0]]["condition calculate"][condition[1]];
					renderConfig[condition[0]][condition[1]] = calculateCondition(expression, this.renderData.length)
				}
			})

			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			let margin = this.margin;
			
			let width = this.renderConfig['width'],
				height = this.renderConfig['height'];

			let svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_volcano_plot_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);		

			let yAxisField = this.renderConfig['y axis field'],
				xAxisField = this.renderConfig['x axis field'],
				renderField = this.renderConfig['render by'];



			let sumstat = [];
			this.renderData.map((v) => {
					let tempObj = { key: v[renderField], value: {} };

					tempObj.value['x'] = v[xAxisField];
					tempObj.value['y'] = v[yAxisField];

					sumstat.push(tempObj);
				})
			
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

			/// render axis
			let xVals = [...new Set(sumstat.map(s => s.value.x))],
				yVals = [...new Set(sumstat.map(s => s.value.y))];

			let xMaxVal = xVals.reduce((prev, next) => prev > next ? prev : next),
				xMinVal = xVals.reduce((prev, next) => prev < next ? prev : next),
				yMaxVal = yVals.reduce((prev, next) => prev > next ? prev : next),
				yMinVal = yVals.reduce((prev, next) => prev < next ? prev : next),
				vals = [xMaxVal, xMinVal, yMaxVal, yMinVal];

				vals.map(v=>{
					v = Math.round(v*100)/100;
				})

				

			let x = d3.scaleLinear().domain([(xMinVal-(xMaxVal*.05)), xMaxVal + (xMaxVal * .05)]).range([margin.left, width + margin.left]);
			let y = d3.scaleLinear().domain([(yMinVal - (yMaxVal * .05)), yMaxVal + (yMaxVal * .05)]).range([height + margin.top, margin.top]);

			svg.attr("transform", "translate(0,0)")
				.append("g")
				.attr("id","axisGroup")

			svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + "," + "0" + ")";
				})
				.call(d3.axisLeft(y));
			
			svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + "0" + "," + (height+margin.top+margin.bump) + ")";
				})
				.call(d3.axisBottom(x));

			if (!!renderConfig["x condition"]) {
				if(!!renderConfig["x condition"]["greater than"]) {
					svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', x(renderConfig["x condition"]["greater than"]))
						.attr('y1', margin.top)
						.attr('x2', x(renderConfig["x condition"]["greater than"]))
						.attr('y2', margin.top + height)
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}

				if(!!renderConfig["x condition"]["lower than"]) {
					svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', x(renderConfig["x condition"]["lower than"]))
						.attr('y1', margin.top)
						.attr('x2', x(renderConfig["x condition"]["lower than"]))
						.attr('y2', margin.top + height)
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}
			}

			if (!!renderConfig["y condition"]) {
				if (!!renderConfig["y condition"]["greater than"]) {

					svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', margin.left)
						.attr('y1', y(renderConfig["y condition"]["greater than"]))
						.attr('x2', margin.left + width)
						.attr('y2', y(renderConfig["y condition"]["greater than"]))
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}

				if (!!renderConfig["y condition"]["lower than"]) {
					svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', margin.left)
						.attr('y1', y(renderConfig["y condition"]["lower than"]))
						.attr('x2', margin.left + width)
						.attr('y2', y(renderConfig["y condition"]["lower than"]))
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}
			}


			
			// render circle or triangle
			sumstat.map(d=>{
				let fillScore = 0;

				if (!!renderConfig["x condition"]) {
					let xCondiCombi =
						renderConfig["x condition"].combination;
					let xFieldVal = d.value.x;

					if (
						xCondiCombi == "greater than" &&
						xFieldVal >
						renderConfig["x condition"]["greater than"]
					) {
						fillScore++;
					}
					if (
						xCondiCombi == "lower than" &&
						xFieldVal <
						renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						xCondiCombi == "and" &&
						xFieldVal >
						renderConfig["x condition"]["greater than"] &&
						xFieldVal <
						renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						(xCondiCombi == "or" &&
							xFieldVal >
							renderConfig["x condition"][
							"greater than"
							]) ||
						xFieldVal <
						renderConfig["x condition"]["lower than"]
					) {
						fillScore++;
					}
				}

				if (!!renderConfig["y condition"]) {
					let yCondiCombi =
						renderConfig["y condition"].combination;
					let yFieldVal = d.value.y;

					if (
						yCondiCombi == "greater than" &&
						yFieldVal >
						renderConfig["y condition"]["greater than"]
					) {
						fillScore++;
					}
					if (
						yCondiCombi == "lower than" &&
						yFieldVal <
						renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						yCondiCombi == "and" &&
						yFieldVal >
						renderConfig["y condition"]["greater than"] &&
						yFieldVal <
						renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
					if (
						(yCondiCombi == "or" &&
							yFieldVal >
							renderConfig["y condition"][
							"greater than"
							]) ||
						yFieldVal <
						renderConfig["y condition"]["lower than"]
					) {
						fillScore++;
					}
				}

				let fillColor;
				switch (fillScore) {
					case 0:
						fillColor = "#00000050";
						break;
					case 1:
						fillColor = "#09910980";
						break;
					case 2:
						fillColor = "#ff003780";
						break;
				}

				if(fillScore >= 2){
					svg.select("#axisGroup")
						.append("text")
						.attr("x", x(d.value.x))
						.attr("y", y(d.value.y) - (margin.bump *2))
						.style("text-anchor", "middle")
						.style("font-family", "Arial").style("font-size", 11)
						.style("fill", "#000000")
						.text(d.key);
				}

				svg.select("#axisGroup")
					.append('circle')
					.attr('cx', x(d.value.x))
					.attr('cy', y(d.value.y))
					.attr('r', 4)
					.style('fill', fillColor);
				
			})
					
		},
	},
});

$(function () {});
</script>

<style>
</style>



