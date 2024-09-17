<template>
  <div>
      <download-chart :hidden="!showPlot"
        chartId="svg-chart"
        :filename="plotName">
      </download-chart>
      <div id="multi-chart" :hidden="!showPlot">
          <p>Loading...</p>
      </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import colors from "@/utils/colors";
import Formatters from "@/utils/formatters";
import DownloadChart from "@/components/DownloadChart.vue";
export default Vue.component("mouse-whisker-plot", {
  props: ["data", "plotName"],
  data() {
      return {
          chart: null,
          chartWidth: null,
          showPlot: true,
          svg: null,
          keyField: "founder_sex",
          keyFieldList: [],
          colorMap: {
            "1291" : "#E69F00",
            "129" : "#E69F00",
            "AJ" : "#F0E442",
            "A/J" : "#F0E442",
            "B6" : "#555555",
            "CAST" : "#009E73",
            "NOD" : "#0072B2",
            "NZO" : "#56B4E9",
            "PWK" : "#D55E00",
            "WSB" : "#CC79A7",
          },
          strainOrder: ["A/J", "AJ", "B6", "129", "1291", "NOD", "NZO", "CAST", "PWK", "WSB"],
          tpmField: "expression",
          offset: 0,
          dotBoxHalfWidth: 6,
          xScale: null,
          yScale: null,
          founderScale: null,
          tooltip: null,
          dividerGray: "#CCCCCC"
      };
  },
  mounted() {
      this.chart = document.getElementById("multi-chart");
      this.chartWidth = this.chart.clientWidth;
      addEventListener("resize", (event) => {
          this.chartWidth = this.chart.clientWidth;
          this.displayResults();
      });
      this.displayResults();
  },
  computed:{
    plotData(){
      return this.$props.data;
    }
  },
  watch: {
      plotData(data) {
          if (data.length === 0) {
              this.showPlot = false;
              return;
          }
          this.showPlot = true;
          this.displayResults();
      },
  },
  methods: {
      displayResults() {
        if (this.plotData.length === 0){
          this.showPlot = false;
          return;
        }
          let margin = {
                  top: 20,
                  right: 30,
                  bottom: 50,
                  left: 40,
            },
            width = this.chartWidth - margin.left - margin.right,
            height = 450 - margin.top - margin.bottom;
          this.chart.innerHTML = "";
          this.tooltip = d3
              .select("#multi-chart")
              .append("div")
              .style("opacity", 0)
              .attr("class", "tooltip")
              .style("background-color", "white")
              .style("border", "2px solid gray")
              .style("padding", "5px")
              .style("border-radius", "5px")
              .style("font-size", "smaller");
          this.svg = d3
              .select("#multi-chart")
              .append("svg")
                .attr("id", "svg-chart")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("font-size", "16px")
              .append("g")
              .attr(
                  "transform",
                  "translate(" + margin.left + "," + margin.top + ")"
              );

          let sumstat = d3
              .nest()
              .key((d) => d[this.keyField])
              .rollup(d => {
                let orderedStats = d.map(g => g[this.tpmField]).sort(d3.ascending);
                let q1 = d3.quantile(orderedStats, .25);
                let median = d3.quantile(orderedStats, .5);
                let q3 = d3.quantile(orderedStats, .75);
                let iQr = q3 - q1;
                let min = orderedStats[0];
                let max = orderedStats[orderedStats.length - 1];
                return {
                  "q1": q1,
                  "median": median,
                  "q3": q3,
                  "interQuantileRange": iQr,
                  "min": min,
                  "max": max
                }
              })
              .entries(this.plotData);
          
          this.xScale = d3
              .scaleBand()
              .range([0, width])
              .domain(this.plotData.map(d => d[this.keyField]).sort((a, b) => this.founderSort(a,b, true)))
              .paddingInner(1)
              .paddingOuter(.5);

          this.founderScale = d3.scaleBand()
              .range([0, width])
              .domain(this.plotData.map(d => d.founder).sort((a, b) => this.founderSort(a,b)))
              .paddingInner(1)
              .paddingOuter(.5);

          this.svg
              .append("g")
              .attr("transform", `translate(0,${2 * margin.top})`)
              .call(d3.axisTop(this.xScale)
                .tickFormat(t => this.axisLabel(t, true))
                .tickSize(0))
              .selectAll("text")
              .style("text-anchor", "middle")
              .style("font-size", "13px");

          this.svg
              .append("g")
              .attr("transform", `translate(0,${margin.top})`)
              .attr("id", "founders")
              .call(d3.axisTop(this.founderScale)
                .tickSize(0))
              .selectAll("text")
                .style("text-anchor", "middle")
                .style("font-size", "16px");
          
          this.svg.selectAll("#founders path")
                .style("stroke", this.dividerGray)
          
          let initialVal = this.plotData[0][this.tpmField];
          let maxVal = this.plotData
              .map((g) => g[this.tpmField])
              .reduce((prev, next) => (prev > next ? prev : next), initialVal);
          let minVal = this.plotData
              .map((g) => g[this.tpmField])
              .reduce((prev, next) => (prev < next ? prev : next), initialVal);
          this.yScale = d3
              .scaleLinear()
              .domain([minVal, maxVal])
              .range([height - 0.5 * margin.top, 0 + 2.5 * margin.top]); // Axes along top

          this.svg.append("g").call(d3.axisLeft(this.yScale)
            .tickSizeOuter(0))
            .selectAll("text")
                .style("font-size", "13px");

          this.svg.selectAll("vertLines")
              .data(sumstat)
              .enter()
              .append("line")
                .attr("x1", d => this.xScale(d.key))
                .attr("x2", d => this.xScale(d.key))
                .attr("y1", d => this.yScale(d.value.min))
                .attr("y2", d => this.yScale(d.value.max))
                .attr("stroke", "black")
                .attr("width", 40);
          
        let boxWidth = 30;
        this.svg.selectAll("boxes")
              .data(sumstat)
              .enter()
              .append("rect")
                .attr("x", d => this.xScale(d.key) - boxWidth/2 )
                .attr("y", d => this.yScale(d.value.q3))
                .attr("height", d => this.yScale(d.value.q1) - this.yScale(d.value.q3))
                .attr("width", boxWidth)
                .attr("stroke", "black")
                .style("fill", "none");
        
        this.svg.selectAll("medianLines")
              .data(sumstat)
              .enter()
              .append("line")
              .attr("x1", d => this.xScale(d.key) - boxWidth/2)
              .attr("x2", d => this.xScale(d.key) + boxWidth/2)
              .attr("y1", d => this.yScale(d.value.median))
              .attr("y2", d => this.yScale(d.value.median))
              .attr("stroke", "black")
              .style("width", 40);
        
        let jitterWidth = 0;
        this.svg.selectAll("indPoints")
              .data(this.plotData)
              .enter()
              .append("circle")
                .attr("cx", d => this.xScale(d[this.keyField]) 
                  - jitterWidth/2 + Math.random()*jitterWidth)
                .attr("cy", d => this.yScale(d[this.tpmField]))
                .attr("r", 4)
                .style("fill", d => this.colorMap[d[this.keyField]])
                .attr("stroke", "black")
                .on("mouseover", g => this.showTooltip(g))
                .on("mouseleave", g => this.hideTooltip());
        let lastItem = this.strainOrder[this.strainOrder.length - 1];
        let spacing = this.xScale(`${lastItem}_male`) - this.xScale(`${lastItem}_female`);

        this.svg.append("line")
              .attr("x1", 0)
              .attr("x2", 0)
              .attr("y1", 0)
              .attr("y2", height)
              .attr("stroke", this.dividerGray);
        this.svg.append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", 0)
              .attr("y2", 0)
              .attr("stroke", this.dividerGray);
        this.svg.append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", height)
              .attr("y2", height)
              .attr("stroke", this.dividerGray);

        this.svg.selectAll("separatorLines")
              .data(sumstat)
              .enter()
              .append("line")
                .attr("x1", d => this.xScale(d.key) + spacing/2)
                .attr("x2", d => this.xScale(d.key) + spacing/2)
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", d => this.getSeparatorStroke(d.key));
      },
      hideTooltip() {
          this.tooltip.style("opacity", 0);
      },
      getSeparatorStroke(founder_sex){
        let sex = founder_sex.split("_")[1];
        if (sex === "female"){
          return "none";
        }
        return this.dividerGray;
      },
      axisLabel(founder_sex, isSexLabel){
        let halves = founder_sex.split("_");
        return !isSexLabel ? halves[0] : halves[1];
      },
      showTooltip(dot) {
        let xcoord = `${d3.event.layerX + 35}px`;
        let ycoord = `${d3.event.layerY}px`;
        let tooltipContent = `<div>${dot.founder} ${dot.sex}</div>`;
        tooltipContent = tooltipContent.concat(`<div>${dot.expression}</div>`)
        this.tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", xcoord)
            .style("top", ycoord);
      },
      founderSort(a,b, includeSex=false){
        let splitA = a.split("_");
        let splitB = b.split("_");
        let founderA = !includeSex ? a : splitA[0];
        let founderB = !includeSex ? b : splitB[0];
        let indexA = this.strainOrder.indexOf(founderA);
        let indexB = this.strainOrder.indexOf(founderB); 
        if (indexA === -1 || indexA > indexB){
          return 1;
        }
        if (indexA < indexB){
          return -1;
        }
        // If same founder, sort female vs male
        if (splitA[1] === "female" && splitB[1] === "male"){
          return -1;
        }
        if (splitA[1] === "male" && splitB[1] === "female"){
          return 1;
        }
        return 0;
      }
  },
});
</script>
<style scoped>
div {
  display: block;
}
.chart-wrapper {
  display: block;
}
.chart-wrapper > label {
  /*font-size: smaller;*/
  padding: 10px;
}
.chart {
  flex: 1;
}
.all-charts {
  display: flex;
  margin: 20px;
}
#select-gene {
  width: 200px;
}
.dataset-subtable {
  font-size: smaller;
}
#big-table > thead > tr > th {
  color: #007bff;
}
.tooltip span {
  display: block;
}
</style>
