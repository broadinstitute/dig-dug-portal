<template>
	<div>
		<h5>Differentially Expressed Genes</h5>
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
import Formatters from "@/utils/formatters";
import mouseTooltip from "../../../components/researchPortal/singleCellBrowser/mouseTooltip.js";

Vue.use(BootstrapVueIcons);

export default Vue.component("bulk-volcano-plot", {
	props: [
		"renderData",
		"renderConfig",
		"margin",
		"sectionId",
	],
	data() {
		return {
      tooltip: null,
			chart: null,
			chartWidth: 0,
		};
	},
	modules: {
	},
	components: {},
	created: function () {
		
	},
	mounted: function () {
		this.chart = document.getElementById(`vector_wrapper_${this.sectionId}`);
		this.chartWidth = this.chart.clientWidth;
		addEventListener("resize", (event) => {
				this.chartWidth = this.chart.clientWidth;
				this.renderPlot();
		});
		this.renderPlot();
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
		tpmFormatter: Formatters.tpmFormatter,
		renderPlot() {
			let wrapperClass = `.vector-wrapper-${this.canvasId}`;
			let wrapperId = `vector_wrapper_${this.sectionId}`;

			//Clear existing
			d3.select(wrapperClass)
				.selectAll("svg")
				.remove();
			d3.select(wrapperClass)
				.selectAll("g")
				.remove();
			d3.select(wrapperClass)
				.selectAll("div")
				.remove();

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

			let margin = this.margin;
			
			let width = this.chartWidth - margin.left - margin.right - margin.middleSpacing;
			let height = this.renderConfig['height'];

      this.tooltip = d3
        .select(wrapperClass)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "2px solid gray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "smaller");

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
				.attr("y", (height + margin.top + margin.bottom - margin.legendSpacing))
				.text(this.renderConfig['x axis label']);

			svg.select("#axisLabelsGroup")
				.append("text")
				.attr("transform", function (d) {
					return "translate("+(margin.bump + margin.legendSpacing)+"," + (margin.top+(height/2)) + ")rotate(-90)";
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
				let xFieldVal;
				if (!!renderConfig["x condition"]) {
					let xCondiCombi =
						renderConfig["x condition"].combination;
					xFieldVal = d.value.x;

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
						fillColor = renderConfig["dot label score"] > 1 ? "#00000050" :"#09910980";
						break;
					case 2:
						fillColor = xFieldVal > 0 ? "blue" : "red";
						break;
				}

				svg.select("#axisGroup")
					.append('circle')
					.attr('cx', x(d.value.x))
					.attr('cy', y(d.value.y))
					.attr('r', 4)
					.style('fill', fillColor)
          .attr("id", (d.key))
          .attr("class", this.dataToClass(d.value));
			});
      svg.selectAll("circle")
        .on("mouseover", g => this.hoverDot(g))
				.on("mouseleave", g =>  mouseTooltip.hide());
					
		},
    hoverDot(dot){
      let gene = d3.event.target.id;
      let data = this.classToData(d3.event.target.classList);
			let xData = this.tpmFormatter(parseFloat(data[0]));
			let yData = this.tpmFormatter(parseFloat(data[1]));
      let hover = `<strong>${gene}</strong>`;
      hover = hover.concat(`<div>${this.renderConfig['x axis label']}: ${xData}</div>`);
      hover = hover.concat(`<div>${this.renderConfig['y axis label']}: ${yData}</div>`);
      mouseTooltip.show(hover);
    },
    dataToClass(value){
      let valX = `valX_${value.x}`.replaceAll(".","dot");
      let valY = `valY_${value.y}`.replaceAll(".", "dot");
      return `${valX} ${valY}`;
    },
    classToData(classList){
      let xVal = classList[0];
      let yVal = classList[1];
      let valueFlag = new RegExp(/val[XY]_/);
      xVal = xVal.replace(valueFlag, "").replace("dot", ".");
      yVal = yVal.replace(valueFlag, "").replace("dot", ".");
      return [xVal, yVal];

    }
	},
});

$(function () {});
</script>

<style>
</style>



