<template>
  <div>
    <div id="pigean-plot">
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
      };
  },
  mounted(){
    console.log(this.pigeanData.length);
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
      let plotDiv = document.getElementById("pigean-plot");
      let width = plotDiv.clientWidth - margin.left - margin.right;
      let height = 300 - margin.top - margin.bottom;
      let svg = d3.select("#pigean-plot")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
      let xMax = this.extremeVal(this.xField, false);
      let yMax = this.extremeVal(this.yField, false);
      
      // add X-axis
      let x = d3.scaleLinear()
        .domain([0, xMax])
        .range([0, width]);
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
      
      // add Y-axis
      let y = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);
      svg.append("g")
        .call(d3.axisLeft(y));
      
      // add dots
      svg.append("g")
        .selectAll("dot")
        .data(this.pigeanData)
        .enter()
        .append("cicle")
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
