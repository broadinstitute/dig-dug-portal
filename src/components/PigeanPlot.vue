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
        left: 60
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = 300 - margin.top - margin.bottom;
      this.chart.innerHTML = "";
      let svg = d3.select("#pigean-plot")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
      let xMin = this.extremeVal(this.xField);
      let yMin = this.extremeVal(this.yField);
      let xMax = this.extremeVal(this.xField, false);
      let yMax = this.extremeVal(this.yField, false);
      
      // add X-axis
      let x = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
      
      // add Y-axis
      let y = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);
      svg.append("g")
        .call(d3.axisLeft(y));
      // add dots
      svg.append("g")
        .selectAll("dot")
        .data(this.pigeanData)
        .enter()
        .append("circle")
          .attr("cx", d => x(d[this.xField]))
          .attr("cy", d => y(d[this.yField]))
          .attr("r", 1.5)
          .style("fill", "#69b3a2");
    },
    extremeVal(field, min=true){
      let sorted = this.pigeanData.sort((a,b) => {
        return a[field] < b[field] ? -1 : 
          a[field] > b[field] ? 1 : 0;
      });
      let index = min ? 0 : sorted.length - 1;
      return sorted[index][field]
    }
  },
});
</script>
<style>
@import url("/css/effectorGenes.css");
</style>
