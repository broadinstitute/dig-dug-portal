<template>
  <div>
    <div id="pigean-plot">
      <p>Loading...</p>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
export default Vue.component("pigean-plot", {
  components: {
  },
  props: ["pigeanData", "xField", "yField"],
  data() {
      return {
        chart: null,
        chartWidth: null,
        svg: null,
        xScale: null,
        yScale: null,
        tooltip: null,
      };
  },
  mounted(){
    this.chart = document.getElementById("pigean-plot");
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
      let margin = {
        top: 10,
        right: 30,
        bottom: 30,
        left: 90
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = 300 - margin.top - margin.bottom;
      this.chart.innerHTML = "";

      this.svg = d3.select("#pigean-plot")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
      
      this.tooltip = d3
            .select("#pigean-plot")
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
      let xAxisLabel = d3.select("#pigean-plot")
        .append("div")
        .style("position", "relative")
        .style("left", `${width / 2 + margin.left}px`)
        .style("font-size", "smaller")
        .style("font-weight", "bold")
        .html(`${this.xField}`);
      
      // add Y-axis
      this.yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale));
      let yAxisLabel = d3.select("#pigean-plot")
        .append("div")
        .style("position", "relative")
        .style("top", `${-height/2 - margin.bottom - margin.top}px`)
        .style("font-size", "smaller")
        .style("font-weight", "bold")
        .html(`${this.yField}`);

      // add dots
      this.svg.append("g")
        .selectAll("dot")
        .data(this.pigeanData)
        .enter()
        .append("circle")
          .attr("class", d => d.phenotype)
          .attr("cx", d => this.xScale(d[this.xField]))
          .attr("cy", d => this.yScale(d[this.yField]))
          .attr("r", 2)
          .attr("fill", "none")
          .attr("stroke", "lightgray")
          .on("mouseover", (g) =>
              this.hoverDot(g.gene, g.phenotype, g.combined));
    },
    extremeVal(field, min=true){
      let sorted = this.pigeanData.sort((a,b) => {
        return a[field] < b[field] ? -1 : 
          a[field] > b[field] ? 1 : 0;
      });
      let index = min ? 0 : sorted.length - 1;
      return sorted[index][field]
    },
    hoverDot(gene, phenotype, combined) {
      this.unHoverDot();
      this.svg.selectAll("circle")
        .style("stroke", "lightgray")
        .style("fill", "none");
      this.svg.selectAll(`circle.${phenotype}`)
        .style("stroke", "#69b3a2")
        .style("fill", "#69b3a2");

      let xcoord = `${d3.event.layerX + 20}px`;
      let ycoord = `${d3.event.layerY}px`;

      // Tooltip content
      let tooltipContent = `Gene: ${gene}`;
      tooltipContent = tooltipContent.concat(
          `<span>Phenotype: ${phenotype}</span>`
      );
      tooltipContent = tooltipContent.concat(
          `<span>Combined: ${combined}</span>`
      );
      this.tooltip
        .style("opacity", 1)
        .html(tooltipContent)
        .style("left", xcoord)
        .style("top", ycoord);
    },
    unHoverDot() {
      this.tooltip.style("opacity", 0);
    },
  },
});
</script>
<style>
  @import url("/css/effectorGenes.css");
  .tooltip span {
      display: block;
  }
</style>
