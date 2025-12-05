<template>
  <div class="mbm-plot-content row">
		<div class="col-md-12">
        <div id="time-series-line" class="plot" ref="time-series-line">
            <p>Loading...</p>
        </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from "d3";
import DownloadChart from "@/components/DownloadChart.vue";
import plotUtils from "@/utils/plotUtils";
import Formatters from "@/utils/formatters";
export default Vue.component("time-series-line-plot", {
  components: {
  },
  props: ["plotData", "filter", "tightenLeft", "tx", "config"],
  data() {
      return {
        plotId: "time-series-line",
        chart: null,
        chartWidth: null,
        chartHeight: 400,
        svg: null,
        xScale: null,
        yScale: null,
        xMedian: 0,
        tooltip: null,
        tooltipElement: null,
        allHoverFields: this.getHoverFields(),
        hoverBoxPosition: this.config.hoverBoxPosition || "left",
        dotOutlineColor: "#00000075",
      };
  },
  mounted(){
    this.chart = this.$refs["time-series-line"];
    this.chartWidth = this.chart.clientWidth;
    addEventListener("resize", (event) => {
        this.chartWidth = this.chart.clientWidth;
        this.drawChart();
    });
    this.drawChart();
  },
  computed: {
    chartData(){
      let data = structuredClone(this.plotData);
      if (this.filter){
        data = data.filter(this.filter);
      }
      if (this.tx.length > 0){
        data = data.filter(d => this.tx.includes(d.gene));
      }
      return data;
    },
  },
  methods: {
    drawChart(){
        // TODO make it so that each replicate is its own array, and the lines are drawn from point to point within the array.
      let margin = {
        top: 10,
        right: 30,
        bottom: 110,
        left: !this.tightenLeft ? 90 : 55
      };
      let width = this.chartWidth - margin.left - margin.right;
      let height = this.chartHeight - margin.top - margin.bottom;
      this.chart.innerHTML = "";

      this.svg = d3.select(`#${this.plotId}`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .attr("id", `chart-${this.plotId}`)
          .on("mouseleave", () => this.hideTooltip())
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
      let xMin = this.extremeVal(this.chartData, this.config.xField);
      let yMin = this.extremeVal(this.chartData, yFieldScaled);
      let xMax = this.extremeVal(this.chartData, this.config.xField, false);
      let yMax = this.extremeVal(this.chartData, yFieldScaled, false);
      let xRange = xMax - xMin;
      let yRange = yMax - yMin;
      //xMin = xMin > 0 ? 0 : xMin;
      //yMin = yMin > 0 ? 0 : yMin;
      this.xMedian = (xMin + xMax) / 2;
      
      // add X-axis
      this.xScale = d3.scaleLinear()
        .domain([xMin - (0.01 * xRange), xMax])
        .range([0, width]);
      this.svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(this.xScale))
          .selectAll("text")
            .style("font-size", "13px");
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", height + margin.top + 40)
        .attr("x", width/2)
        .text(this.config.xAxisLabel || this.config.xField);
      
      // add Y-axis
      this.yScale = d3.scaleLinear()
        .domain([yMin - (0.035 * yRange), yMax]) // wider margin because y-axis is shorter visually
        .range([height, 0]);
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale))
          .selectAll("text")
            .style("font-size", "13px");;
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", - height / 2)
        .text(this.config.yAxisLabel || this.config.yField);

      // add dots
      this.svg.append("g")
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
          .attr("r", 5)
          .attr("fill", d => d.replicate === 1 ? "blue" : "red")
          .attr("stroke", this.dotOutlineColor)
          .on("mouseover", (g) =>
              this.hoverDot(JSON.stringify(g)));
    },
    extremeVal(data, field, min=true){
      let filteredData = data.filter(d => 
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
        console.log("We are hovering this dot");
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
            `<span>${field.label}: ${
              field.formatter === undefined
                ? dot[field.key] 
                : field.formatter(dot[field.key])
            }</span>`
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
    getHoverFields(){
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
    }
  },
  watch: {
    chartData(){
      this.drawChart();
    },
  }
});
</script>
<style scoped>
  @import url("/css/effectorGenes.css");
  .tooltip span {
      display: block;
  }
  .plot {
    margin-right: 15px;
    margin-bottom: 15px;
    background-color: white;
  }
</style>
