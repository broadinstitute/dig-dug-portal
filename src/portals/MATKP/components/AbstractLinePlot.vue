<template>
    <div>
        <div :id=plotId class="plot">
            <p>Loading...</p>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import DownloadChart from "@/components/DownloadChart.vue";
import plotUtils from "@/utils/plotUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("abstract-line-plot", {
  components: {
  },
  props: ["plotData", "tx", "config", "plotId", "utils"],
  data() {
      return {
        chart: null,
        chartWidth: 150,
        chartHeight: 100,
        svg: null,
        xScale: null,
        yScale: null,
        xMedian: 0,
        dotOutlineColor: "#00000075",
      };
  },
  mounted(){
    this.chart = document.getElementById(this.plotId);
    this.drawChart();
  },
  methods: {
    drawChart(){
      let margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = this.chartHeight - margin.top - margin.bottom;
      this.chart.innerHTML = "";
      this.svg = d3.select(`#${this.plotId}`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .attr("id", `chart_${this.plotId}`)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
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

      // Use chart data to adjust scale on the fly
      let xRange = this.config.xMax - this.config.xMin;
      let yRange = this.config.yMax - this.config.yMin;
      this.xMedian = (this.config.xMin + this.config.xMax) / 2;
      
      // add X-axis
      this.xScale = d3.scaleLinear()
        .domain([this.config.xMin - (0.01 * xRange), this.config.xMax])
        .range([0, width]);
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
      this.yScale = d3.scaleLinear()
        .domain([this.config.yMin - (0.035 * yRange), this.config.yMax]) // wider margin because y-axis is shorter visually
        .range([height, 0]);
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale).tickFormat(t => t/1000))
          .selectAll("text")
            .style("font-size", "13px");
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", - height / 2)
      // add dots
      this.svg.append("g")
        .selectAll("dot")
        .data(this.plotData)
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
          .attr("stroke", this.dotOutlineColor);
    },
  },
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
