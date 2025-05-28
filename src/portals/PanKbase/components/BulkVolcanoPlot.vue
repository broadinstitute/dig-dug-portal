<template>
	<div>
		<download-chart
        :chartId="`vector_volcano_plot_${sectionId}`"
        :filename="`${plotId}_expression_regulation`"
    ></download-chart>
		<div style="display:flex; gap:5px" class="legends">
			<div style="display:inline-block;" class="legend">
				<strong>Regulation of gene expression</strong>
				<div style="display:flex; margin-top:10px">
				
					<span class="group-legend-box" :style="`background-color:${red}`">&nbsp;</span><span class="group-legend-name">up-regulated genes</span>

					<span class="group-legend-box" :style="`background-color:${blue}`">&nbsp;</span><span class="group-legend-name">down-regulated genes</span>

					<span class="group-legend-box" style="background-color:#FF9900">&nbsp;</span><span class="group-legend-name">highlighted gene</span>
				</div>
        	</div>
		</div>
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
		"selectedGene",
		"filter",
		"plotId"
	],
	data() {
		return {
      tooltip: null,
			chart: null,
			chartWidth: 0,
			fontSize: "13px",
			svg: null,
			x: null,
			y: null,
			yAxisField: null,
			xAxisField: null,
			red: "rgb(191 044 035)", // colorblind safe red
			blue: "rgb(047 103 177)" // colorblind safe blue
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
		this.renderPlot();
		if (this.selectedGene){
			this.highlightDot(this.selectedGene);
			//this.$emit("highlight", this.selectedGene);
		}
	},
	computed: {
		canvasId() {
			let canvasId = this.sectionId.replaceAll("_","-").toLowerCase();
			return canvasId;
		},
		plotData(){
			if (this.filter){
				return this.renderData.filter(this.filter);
			}
			return this.renderData;
		},
	},
	watch: {
		plotData(newData, oldData) {
			if(newData !== oldData){
				this.renderPlot();
			}
		},
		selectedGene(newData, oldData){
			this.highlightDot(newData);
		},
		renderConfig(newData, oldData){
			if(newData !== oldData){
				this.renderPlot();
			}
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
					renderConfig[condition[0]][condition[1]] = calculateCondition(expression, this.plotData.length)
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

			this.svg = d3.select(wrapperClass)
				.append("svg")
				.attr("id", "vector_volcano_plot_"+this.sectionId )
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom);		

			this.yAxisField = this.renderConfig['y axis field'];
			this.xAxisField = this.renderConfig['x axis field'];
			let renderField = this.renderConfig['render by'];
			let sumstat = [];
			let plotDataBackup = structuredClone(this.plotData);
			for (let i = 0; i < plotDataBackup.length; i++){
				let v = plotDataBackup[i];
				let tempObj = { 
					key: v[renderField], 
					value: {
						x: v[this.xAxisField],
						y: v[this.yAxisField]
					}
				};
				sumstat.push(tempObj);
			}
			
			//render axis labels

			this.svg.append("g")
				.attr("id", "axisLabelsGroup")
				.attr("transform", "translate(0,0)");

			this.svg.select("#axisLabelsGroup")
				.style("font-family", "Arial").style("font-size", 12)
				.style("text-anchor", "middle")

			this.svg.select("#axisLabelsGroup")
				.append("text")
				.attr("x", (margin.left + (width / 2)))
				.attr("y", (height + margin.bottom - margin.legendSpacing))
				.text(this.renderConfig['x axis label']);

			this.svg.select("#axisLabelsGroup")
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

				

			this.x = d3.scaleLinear().domain([(xMinVal-(xMaxVal*.05)), xMaxVal + (xMaxVal * .05)]).range([margin.left, width + margin.left]);
			this.y = d3.scaleLinear().domain([(yMinVal - (yMaxVal * .05)), yMaxVal + (yMaxVal * .05)]).range([height + margin.top, margin.top]);

			this.svg.attr("transform", "translate(0,0)")
				.append("g")
				.attr("id","axisGroup")

			this.svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + (margin.left - margin.bump) + "," + "0" + ")";
				})
				.call(d3.axisLeft(this.y))
				.selectAll("text")
				.style("font-size", this.fontSize);
			
			this.svg.select("#axisGroup")
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + "0" + "," + (height+margin.top+margin.bump) + ")";
				})
				.call(d3.axisBottom(this.x))
				.selectAll("text")
				.style("font-size", this.fontSize);

			if (!!renderConfig["x condition"]) {
				if(!!renderConfig["x condition"]["greater than"]) {
					this.svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', this.x(renderConfig["x condition"]["greater than"]))
						.attr('y1', margin.top)
						.attr('x2', this.x(renderConfig["x condition"]["greater than"]))
						.attr('y2', margin.top + height)
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}

				if(!!renderConfig["x condition"]["lower than"]) {
					this.svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', this.x(renderConfig["x condition"]["lower than"]))
						.attr('y1', margin.top)
						.attr('x2', this.x(renderConfig["x condition"]["lower than"]))
						.attr('y2', margin.top + height)
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}
			}

			if (!!renderConfig["y condition"]) {
				if (!!renderConfig["y condition"]["greater than"]) {

					this.svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', margin.left)
						.attr('y1', this.y(renderConfig["y condition"]["greater than"]))
						.attr('x2', margin.left + width)
						.attr('y2', this.y(renderConfig["y condition"]["greater than"]))
						.attr("stroke", "#cccccc")
						.style("stroke-width", 1)
				}

				if (!!renderConfig["y condition"]["lower than"]) {
					this.svg.select("#axisGroup")
						.append('line')
						.attr('style', "stroke-dasharray: 3,3")
						.attr('x1', margin.left)
						.attr('y1', this.y(renderConfig["y condition"]["lower than"]))
						.attr('x2', margin.left + width)
						.attr('y2', this.y(renderConfig["y condition"]["lower than"]))
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
						fillColor = xFieldVal > 0 ? this.red: this.blue;
						break;
				}
				this.svg.select("#axisGroup")
					.append('circle')
					.attr('cx', this.x(d.value.x))
					.attr('cy', this.y(d.value.y))
					.attr('r', 4)
					.style('fill', fillColor)
          .attr("id", (d.key))
          .attr("class", this.dataToClass(d.value));
			});
      this.svg.selectAll("circle.dataCircle")
        .on("mouseover", g => this.hoverDot(g))
				.on("mouseleave", g =>  mouseTooltip.hide())
				.on("click", g => this.clickDot(g));
					
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
		clickDot(dot){
			let gene = d3.event.target.id;
			this.$emit("highlight", gene);
		},
		highlightDot(gene){
			this.svg.select("#axisGroup")
				.selectAll(".highlightCircle")
				.remove();
			let dataItem = this.plotData.find(d => d.gene === gene);
			let geneVal = {
				x: dataItem[this.xAxisField],
				y: dataItem[this.yAxisField]
			}
			let classes = `${this.dataToClass(geneVal)} highlightCircle`;
			this.svg.select("#axisGroup")
				.append('circle')
					.attr('cx', this.x(geneVal.x))
					.attr('cy', this.y(geneVal.y))
					.attr('r', 6)
					.style('fill', "#FF9900")
					.attr("id", gene)
          .attr("class", classes)
					.on("mouseover", g => this.hoverDot(g))
					.on("mouseleave", g =>  mouseTooltip.hide())
					.on("click", g => this.clickDot(g));
		},
    dataToClass(value){
      let valX = `valX_${value.x}`.replaceAll(".","dot");
      let valY = `valY_${value.y}`.replaceAll(".", "dot");
      return `${valX} ${valY} dataCircle`;
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

<style scoped>
.legends {
    gap: 20px;
}

.legend {
    margin: 0 10px 0 0;
    gap:1px;
}
.legend .label {
    font-size: 11px !important;
    line-height: 11px;
}
.legend .gradient {
    height: 20px;
    width: 200px;
    border-radius: 20px;
}
.legend span {
  padding-left: 15px;
  padding-right: 15px;
}

.group-legend-box {
    display: inline-block;
    width: 15px;
    height: 15px;
    padding: 0 !important;
}

.group-legend-name {
    padding-left: 5px !important;
    padding-right: 15px !important;
    vertical-align: text-bottom;
}
</style>



