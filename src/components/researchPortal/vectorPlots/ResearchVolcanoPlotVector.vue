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
		this.renderVolcanoPlot()
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
		renderVolcanoPlot() {

			let renderConfig = this.renderConfig;

			let calculateCondition = function (EXP, LENGTH) {
				let calcString = "";

				EXP.map(e => {
					let eValue = !!["+", "-", "*", "/", "(", ")"].includes(e) ? e :
						(typeof e === 'number') ? e :
							(typeof e === 'string') ? (e == "data length") ? LENGTH : e : null;

					calcString += eValue;
				});

				console.log("calcString", calcString);

				let threshold = eval(calcString);

				console.log("threshold", threshold);

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

			console.log("renderConfig", renderConfig);


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
			
				console.log("sumstat",sumstat);

			
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

			console.log("renderConfig", renderConfig)

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

					console.log('renderConfig["y condition"]["greater than"]', y(renderConfig["y condition"]["greater than"]));
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
			svg
				.selectAll("circle")
				.data(sumstat)
				.enter()
				.append('circle')
				.attr('cx', function (d) {
					return (x(d.value.x))
				})
				.attr('cy', function (d) {
					return (y(d.value.y))
				})
				.attr('r', 4)
				.style('fill', function (d) {

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
					return fillColor;
				});
			

			/*
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
			if(!!this.renderConfig['beta field']) {
				
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
					});
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
			})	*/		
		},
	},
});

$(function () {});
</script>

<style>
</style>



