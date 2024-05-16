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
export default Vue.component("pigean-plot", {
  components: {
  },
  props: ["pigeanData", "xField", "yField", "dotKey", "hoverFields", 
    "plotHeight", "phenotypeMap"],
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
        colorMap: null
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
  },
  methods: {
    drawChart(){
      this.groupColors();
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

      let xMin = this.extremeVal(this.xField);
      let yMin = this.extremeVal(this.yField);
      let xMax = this.extremeVal(this.xField, false);
      let yMax = this.extremeVal(this.yField, false);
      
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
        .data(this.pigeanData)
        .enter()
        .append("circle")
          .attr("class", d => `${d[this.dotKey]}`)
          .attr("cx", d => this.xScale(d[this.xField]))
          .attr("cy", d => this.yScale(d[this.yField]))
          .attr("r", 2)
          .attr("fill", "none")
          .attr("stroke", "gray")
          .on("mouseover", (g) =>
              this.hoverDot(JSON.stringify(g)));
    },
    extremeVal(field, min=true){
      let sorted = this.pigeanData.sort((a,b) => {
        return a[field] < b[field] ? -1 : 
          a[field] > b[field] ? 1 : 0;
      });
      let index = min ? 0 : sorted.length - 1;
      return sorted[index][field]
    },
    hoverDot(dotString) {
      this.unHoverDot();
      let dotObject = JSON.parse(dotString);
      this.svg.selectAll("circle")
        .style("stroke", "gray")
        .style("fill", "none");
      this.svg.selectAll(`circle.${dotObject[this.dotKey]}`)
        .style("stroke", "#69b3a2")
        .style("fill", "#69b3a2");

      let xcoord = `${d3.event.layerX + 20}px`;
      let ycoord = `${d3.event.layerY}px`;

      // Tooltip content
      let tooltipContent = `${this.dotKey}: ${dotObject[this.dotKey]}`;
      if (!!this.hoverFields){
        this.hoverFields.forEach(field =>
          tooltipContent = tooltipContent.concat(
            `<span>${field}: ${dotObject[field]}</span>`)
        );
      }
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
      let groupsInUse = this.pigeanData.map(d => d.phenotype)
        .map(p => !!this.phenotypeMap[p] ? this.phenotypeMap[p]["group"] : "")
        .filter(g => g !== "")
        .sort();
      console.log(JSON.stringify(groupsInUse));
      let uniqueGroups = new Set();
      groupsInUse.forEach(g => uniqueGroups.add(g));
      for (const item of uniqueGroups){
        console.log(item);
      }
    }
  },
});
</script>
<style>
  @import url("/css/effectorGenes.css");
  .tooltip span {
      display: block;
  }
</style>
