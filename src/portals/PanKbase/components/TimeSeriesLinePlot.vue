<template>
    <div>
        {{ availableDonors }} donors available
        <div :id=plotId class="plot" ref="time-series-line">
            <p>Loading...</p>
        </div>
        <div class="download-images-setting">
            <span class="btn btn-default options-gear" >Download <b-icon icon="download"></b-icon></span>
            <ul class="options" >
              <li>
                    <a href="javascript:;"
                    @click="downloadImage(plotId, `ins_ieq_time_series`, 'svg')">Download SVG</a>
                </li>
            </ul>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import DownloadChart from "@/components/DownloadChart.vue";
import plotUtils from "@/utils/plotUtils";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("time-series-line-plot", {
  components: {
  },
  props: ["plotData", "filter", "maxTime", "maxScore", "donors", "plotId", "utils", "timepoints", "lineColor"],
  data() {
      return {
        chart: null,
        chartWidth: 900,
        chartHeight: 300,
        svg: null,
        xScale: null,
        yScale: null,
        xMedian: 0,
        tooltip: null,
        tooltipElement: null,
        hoverBoxPosition: "left",
        dotOutlineColor: "#00000075",
        config: null,
      };
  },
  mounted(){
    this.chart = document.getElementById(this.plotId);
    this.config = this.getConfig();
    this.drawChart();
  },
  computed: {
    chartData(){
      let data = structuredClone(this.plotData);
      if (this.filter){
        data = data.filter(this.filter);
      }
      if (this.donors.length > 0){
        data = data.filter(d => this.donors.includes(d.donor));
      }
      return data;
    },
    availableDonors(){
      let donorsPresent = new Set(this.chartData.map(m => m.donor));
      return donorsPresent.size;
    },
    allHoverFields(){
      let fields = [];
      fields.push(this.config.dotKey);
      fields.push(this.config.xField);
      fields.push(this.config.yField);
      if (this.config.hoverFields){
        this.config.hoverFields.forEach(field => {
          if (!fields.includes(field)){
            fields.push(field);
          }
        });
      }
      return fields;
    },
  },
  methods: {
    getConfig(){
      let config = {
        yField: "score",
        xMax: this.maxTime,
        xMin: 0,
        yMax: this.maxScore,
        yMin: 0,
        xField: "time",
        xAxisLabel: "time (min)",
        yAxisLabel: null,
        dotKey: "donor",
      };
      return config;
    },
    extractTimepoints(data, xScale, yScale){
      // This assumes all timepoints have a condition listed i.e. none are skipped.

      let points = data.sort((a,b) => a.time - b.time).filter(t => !!t.Condition);
      let output = [];
      let conditionStart = 0;
      let textBuffer = 3;
      for (let i = 1; i < points.length; i++){
        let currentEntry = points[i];
        let conditionStartEntry = points[conditionStart];
        if (currentEntry.Condition !== conditionStartEntry.Condition || i === points.length - 1) {
          let duration = currentEntry.time - conditionStartEntry.time;
          let middleTime = conditionStartEntry.time + (0.5 * duration);
          let conditionInfo = {};
          conditionInfo.condition = conditionStartEntry.Condition;
          conditionInfo.x = xScale(conditionStartEntry.time);
          conditionInfo.y = yScale(this.config.yMax);
          conditionInfo.width = xScale(duration);
          conditionInfo.height = yScale(0);
          conditionInfo.textPosition = xScale(middleTime);
          output.push(conditionInfo);
          conditionStart = i;
        } else {
          continue;
        }
      }
      return output;
    },
    drawChart(){
      let margin = {
        top: 10,
        right: 10,
        bottom: 40,
        left: 40
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = this.chartHeight - margin.top - margin.bottom;

      // Create scales
      let xRange = this.config.xMax - this.config.xMin;
      let yRange = this.config.yMax - this.config.yMin;
      this.xMedian = (this.config.xMin + this.config.xMax) / 2;
      let xPadding = 0.01 * xRange;
      let yPadding = 0.2 * yRange;
      this.xScale = d3.scaleLinear()
        .domain([0, this.config.xMax + xPadding])
        .range([0, width]);
      this.yScale = d3.scaleLinear()
        .domain([0, this.config.yMax + yPadding]) // wider margin because y-axis is shorter visually
        .range([height, 0]);

      this.chart.innerHTML = "";
      this.svg = d3.select(`#${this.plotId}`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .attr("id", `chart_${this.plotId}`)
          .on("mouseleave", () => this.hideTooltip())
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
        //let timepointBars = this.extractTimepoints(this.timepoints, this.xScale, this.yScale);
        let timepointBars = [];

      let even = true;
      timepointBars.forEach(t => {
        let darkgold = "#F5D627";
        let gold = "#F8E163";
        let lightgold = "#FAEA8F"
        let palegold = "#FCF2BB"
        let color = even ? palegold : gold;
        this.svg.append("rect")
          .attr("x", t.x)
          .attr("y", t.y)
          .attr("width", t.width)
          .attr("height", t.height)
          .attr("fill", color);
        even = !even;
      });
      // Separate loop to put text on top of bg
      even = true;
      timepointBars.forEach(t => {
        this.svg.append("text")
          .attr("text-anchor", "middle")
          .attr("y", t.height * 0.1)
          .attr("x", t.textPosition)
          .text(t.condition);
        even = !even;
      });
      this.tooltip = d3
        .select(`#${this.plotId}`)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "2px solid gray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "smaller");

      // Access the tooltip as an HTML element
      this.tooltipElement = this.chart.getElementsByClassName("tooltip")[0];
      let yFieldScaled = this.config.yField;
      
      // add X-axis
      this.svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(this.xScale))
          .selectAll("text")
            .style("font-size", "13px");
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", height + margin.top + 20)
        .attr("x", width/2)
        .text(this.config.xAxisLabel || this.config.xField);
      
      // add Y-axis
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale))
          .selectAll("text")
            .style("font-size", "13px");
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", - height / 2)
        .text(`${this.config.yAxisLabel || this.config.yField}`);

        const sortedData = [...this.chartData].sort(
          (a, b) => a[this.config.xField] - b[this.config.xField]
        );

        // TODO MAKE SURE ALL LINES SHOWING UP
        console.log("Sorted data length", sortedData.length);
        const lineGenerator = d3.line()
          .x(d => this.xScale(d[this.config.xField]))
          .y(d => this.yScale(d[this.config.yField]))
          .defined(d =>
            d[this.config.xField] !== undefined &&
            d[this.config.yField] !== undefined
          );

        this.svg.append("path")
          .datum(sortedData)
          .attr("fill", "none")
          .attr("stroke", this.lineColor)
          .attr("stroke-width", 1)
          .attr("class", "line-path")
          .attr("d", lineGenerator);  

      // add dots
/*       this.svg.append("g")
        .selectAll("dot")
        .data(this.chartData)
        .enter()
        .append("circle")
          .attr("class", d => `${d[this.config.dotKey]}`)
          .attr("cx", d => 
            d[this.config.xField] === undefined
              ? this.xScale(0) 
              : this.xScale(d[this.config.xField]))
          .attr("cy", d => 
            d[yFieldScaled] === undefined 
              ? this.yScale(0) // Is this an issue for log scale? 
              : this.yScale(d[yFieldScaled]))
          .attr("r", 3)
          .attr("fill", "red")
          .attr("stroke", this.dotOutlineColor)
          .on("mouseover", (g) =>
              this.hoverDot(JSON.stringify(g)));    */        
    },
    hoverDot(dotString) {
      this.unHoverDot();

      let xcoord = d3.event.layerX;
      let ycoord = d3.event.layerY;

      // Tooltip content
      this.tooltip
        .style("opacity", 1)
        .html(this.getTooltipContent(dotString));

      let leftOffset = this.tooltipElement.clientWidth;
      let hoverLeft = this.dotHoverLeft(dotString);

      if (hoverLeft){
        xcoord = xcoord - leftOffset - 20;
      } else {
        xcoord = xcoord + 20;
      }
      this.tooltip
        .style("left", `${xcoord}px`)
        .style("top", `${ycoord}px`);
    },
    dotHoverLeft(dotString){
      let dot = JSON.parse(dotString);
      return this.hoverBoxPosition === "both"
        ? dot[this.config.xField] > this.xMedian 
        : this.hoverBoxPosition === "left";
    },
    getTooltipContent(dotString){
      let dot = JSON.parse(dotString);
      let tooltipText = "";
      if (this.config.hoverFields){
        this.config.hoverFields.forEach(field => {
          tooltipText = tooltipText.concat(
            `<div>${field.label}: ${
              field.formatter === undefined
                ? dot[field.key] 
                : field.formatter(dot[field.key])
            }</div>`
          );
        });
      }
      return tooltipText;
    },
    unHoverDot() {
      this.hideTooltip();
    },
    hideTooltip(){
      if (!!this.tooltip){
        this.tooltip.style("opacity", 0);
      }
    },
    downloadImage(ID, NAME, TYPE) {
      if (TYPE == "svg") {
        let svgId = `chart_${this.plotId}`;
        uiUtils.downloadImg(
            ID,
            NAME,
            TYPE,
            svgId
        );
      }
			if (TYPE == 'png') {
				uiUtils.downloadImg(ID, NAME, TYPE)
			}
      this.drawChart();
		},
  },
  watch: {
    chartData(){
      this.drawChart();
    },
    donors(){
        this.drawChart();
    },
  }
});
</script>
<style scoped>
  @import url("/css/effectorGenes.css");
  .plot {
    margin-right: 15px;
    margin-bottom: 15px;
    background-color: white;
  }

  .download-images-setting {
    margin-top: -25px;
  }
</style>