<template>
  <div class="mbm-plot-content row">
		<div class="col-md-12">
      <download-chart
				filename="PIGEAN_plot"
				:chartId="plotId"
				>
			</download-chart>
      <div :id="plotId">
        <p>Loading...</p>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import DownloadChart from "./DownloadChart.vue";
import plotUtils from "@/utils/plotUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("pigean-plot", {
  components: {
  },
  props: ["pigeanData", "xField", "yField", "dotKey", "hoverFields", 
    "plotHeight", "phenotypeMap", "filter"],
  data() {
      return {
        plotId: `pigean-plot-${Math.floor(Math.random() * 10e9)}`,
        chart: null,
        chartWidth: null,
        chartHeight: !!this.plotHeight ? this.plotHeight : 400,
        svg: null,
        xScale: null,
        yScale: null,
        tooltip: null,
        allHoverFields : !this.hoverFields ? [this.dotKey] :
          this.hoverFields.includes(this.dotKey) ? this.hoverFields
            : [this.dotKey].concat(this.hoverFields),
        colorMap: this.groupColors(),
        dotOutlineColor: "#00000075"
      };
  },
  mounted(){
    this.chart = document.getElementById(this.plotId);
    this.chartWidth = this.chart.clientWidth;
    addEventListener("resize", (event) => {
        this.chartWidth = this.chart.clientWidth;
        this.drawChart();
    });
    this.drawChart();
  },
  computed: {
    chartData(){
      let data = this.pigeanData;
      if (this.filter){
        data = data.filter(this.filter);
      }
      return data;
    }
  },
  methods: {
    drawChart(){
      console.log("Draw the chart");
      let margin = {
        top: 10,
        right: 30,
        bottom: 30,
        left: 60
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = this.chartHeight - margin.top - margin.bottom;
      this.chart.innerHTML = "";

      this.svg = d3.select(`#${this.plotId}`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
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

      // Use unfiltered data so the scales do not change
      let xMin = this.extremeVal(this.xField);
      let yMin = this.extremeVal(this.yField);
      let xMax = this.extremeVal(this.xField, false);
      let yMax = this.extremeVal(this.yField, false);
      xMin = xMin > 0 ? 0 : xMin;
      yMin = yMin > 0 ? 0 : yMin;
      
      // add X-axis
      this.xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);
      this.svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(this.xScale));
      d3.select(`#${this.plotId}`)
        .append("div")
          .style("position", "relative")
          .style("left", `${width / 2 + margin.left}px`)
          .style("font-size", "smaller")
          .html(`${this.xField}`);
      
      // add Y-axis
      this.yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale));
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("font-size", "smaller")
        .attr("y", -margin.left + 20)
        .attr("x", - height / 2 - margin.top)
        .text(this.yField);

      // add dots
      this.svg.append("g")
        .selectAll("dot")
        .data(this.chartData)
        .enter()
        .append("circle")
          .attr("class", d => `${d[this.dotKey]}`)
          .attr("cx", d => 
            d[this.xField] === undefined
              ? this.xScale(0) 
              : this.xScale(d[this.xField]))
          .attr("cy", d => 
            d[this.yField] === undefined 
              ? this.yScale(0) 
              : this.yScale(d[this.yField]))
          .attr("r", 5)
          .attr("fill", d => this.dotColor(d.phenotype))
          .attr("stroke", this.dotOutlineColor)
          .on("mouseover", (g) =>
              this.hoverDot(JSON.stringify(g)));
    },
    extremeVal(field, min=true){
      let filteredData = this.pigeanData.filter(d => 
        d[field] !== undefined && !Number.isNaN(d[field]));
      let val = filteredData[0][field];
      filteredData.forEach(d => {
        if (min && d[field] < val){
          val = d[field];
        } else if (!min && d[field] > val){
            val = d[field];
        }
      });
      return val;
    },
    hoverDot(dotString) {
      this.unHoverDot();
      let dot = JSON.parse(dotString);

      let xcoord = `${d3.event.layerX + 20}px`;
      let ycoord = `${d3.event.layerY}px`;

      // Tooltip content
      let tooltipContent = "";      
      this.allHoverFields.forEach(field =>{
        let newLine = field === "phenotype" ?
          `phenotype: ${this.phDesc(dot.phenotype)}`
          : `${field}: ${dot[field]}`;
        tooltipContent = tooltipContent.concat(
          `<span>${newLine}</span>`);
      });
      
      this.tooltip
        .style("opacity", 1)
        .html(tooltipContent)
        .style("left", xcoord)
        .style("top", ycoord);
    },
    unHoverDot() {
      this.tooltip.style("opacity", 0);
    },
    groupColors(){
      // Based on pigeanData not filtered data. Phenotypes should always match PheWAS
      let groupsInUse = this.pigeanData.map(d => d.phenotype)
        .map(p => !!this.phenotypeMap[p] ? this.phenotypeMap[p]["group"] : "")
        .filter(g => g !== "");
      let uniqueGroups = [];
      groupsInUse.forEach(g => {
        if (!uniqueGroups.includes(g)){
          uniqueGroups.push(g);
        }});
      uniqueGroups.sort();
      let colorMap = {};
      let colors = plotUtils.plotColors();
      for (let i = 0; i < uniqueGroups.length; i++){
        colorMap[uniqueGroups[i]] = colors[i % colors.length];
      }
      return colorMap;
    },
    dotColor(phenotype){
      if (!this.phenotypeMap[phenotype]){
        return this.dotOutlineColor;
      }
      return this.colorMap[this.phenotypeMap[phenotype].group];
    },
    phDesc(phenotype){
      if (!this.phenotypeMap[phenotype]){
        return phenotype;
      }
      return Formatters.phenotypeFormatter(this.phenotypeMap[phenotype])
    },
  },
  watch: {
    chartData(){
      console.log("chart data is changing");
      this.drawChart();
    }
  }
});
</script>
<style>
  @import url("/css/effectorGenes.css");
  .tooltip span {
      display: block;
  }
</style>
