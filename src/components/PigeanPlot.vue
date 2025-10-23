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
import bioIndexUtils from "@/utils/bioIndexUtils";
import Formatters from "@/utils/formatters";
import { BootstrapVueIcons } from "bootstrap-vue";
Vue.use(BootstrapVueIcons);
export default Vue.component("pigean-plot", {
  components: {
  },
  props: [
    "pigeanData", "config", "phenotypeMap", "filter", 
    "genesetSize", "traitGroup", "matchingHoverDots", "pigeanColors"
  ],
  data() {
      return {
        plotId: `pigean-plot-${Math.floor(Math.random() * 10e9)}`,
        chart: null,
        chartWidth: null,
        chartHeight: !!this.config.plotHeight ? this.config.plotHeight : 400,
        svg: null,
        xScale: null,
        yScale: null,
        xMedian: 0,
        tooltip: null,
        tooltipElement: null,
        tooltipPinned: false,
        colorMap: this.groupColors(),
        allHoverFields: this.getHoverFields(),
        hoverBoxPosition: this.config.hoverBoxPosition || "left",
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
    },
    linkSuffix(){
      return `&genesetSize=${this.$store.state.genesetSize 
          || bioIndexUtils.DEFAULT_GENESET_SIZE
        }&traitGroup=${this.$store.state.traitGroup
          || bioIndexUtils.DEFAULT_TRAIT_GROUP}`;
    }
  },
  methods: {
    drawChart(){
      this.tooltipPinned = false;
      let margin = {
        top: 10,
        right: 30,
        bottom: 35,
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

      // Access the tooltip as an HTML element
      this.tooltipElement = this.chart.getElementsByClassName("tooltip")[0];

      // Use unfiltered data so the scales do not change
      let xMin = this.extremeVal(this.config.xField);
      let yMin = this.extremeVal(this.config.yField);
      let xMax = this.extremeVal(this.config.xField, false);
      let yMax = this.extremeVal(this.config.yField, false);
      let xRange = xMax - xMin;
      let yRange = yMax - yMin;
      xMin = xMin > 0 ? 0 : xMin;
      yMin = yMin > 0 ? 0 : yMin;
      this.xMedian = (xMin + xMax) / 2;
      
      // add X-axis
      this.xScale = d3.scaleLinear()
        .domain([xMin - (0.01 * xRange), xMax])
        .range([0, width]);
      this.svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(this.xScale));
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "smaller")
        .attr("y", height + margin.top + 22)
        .attr("x", width/2)
        .text(this.config.xAxisLabel || this.config.xField);
      
      // add Y-axis
      this.yScale = d3.scaleLinear()
        .domain([yMin - (0.05 * yRange), yMax])
        .range([height, 0]);
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale));
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("font-size", "smaller")
        .attr("y", -margin.left + 20)
        .attr("x", - height / 2 - margin.top)
        .text(this.config.yAxisLabel || this.config.yField);

      // add dots
      this.svg.append("g")
        .selectAll("dot")
        .data(this.chartData)
        .enter()
        .append("circle")
          .attr("class", d => `dot_${d[this.config.dotKey]}`)
          .attr("cx", d => 
            d[this.config.xField] === undefined
              ? this.xScale(0) 
              : this.xScale(d[this.config.xField]))
          .attr("cy", d => 
            d[this.config.yField] === undefined 
              ? this.yScale(0) 
              : this.yScale(d[this.config.yField]))
          .attr("r", 5)
          .attr("fill", d => `${this.dotColor(d.phenotype)}aa`)
          .attr("stroke", this.dotOutlineColor)
          .on("mouseover", (g) =>
              this.hoverDot(JSON.stringify(g)));
      
      // Click behavior for dots
      this.svg.selectAll("circle")
        .on("click", d => {
          if (!this.tooltipPinned){
            this.tooltipPinned = true;
          }
        });
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
      if (this.tooltipPinned){
        return;
      }
      this.unHoverDot();
      this.$emit("dotsHovered", dotString)
      let xcoord = d3.event.layerX;
      let ycoord = d3.event.layerY;

      // Tooltip content
      this.tooltip
        .style("opacity", 1)
        .html(this.getTooltipContent(dotString));
      this.tooltip.selectAll("a")
        .on("click", () => {
          this.tooltipPinned = false;
          this.hideTooltip();
        });

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
      let dKey = this.config.dotKey;
      let dKeyContent = dot[dKey]; // Get raw content before formatting
      dot.phenotype = this.phDesc(dot.phenotype);
      let linkAddress = `/pigean/${dKey}.html?${dKey}=${dKeyContent}${this.linkSuffix}`;
      let tooltipText = '<p class="close-tooltip"><a>';
      tooltipText = tooltipText.concat('x</a><p>')
      tooltipText=tooltipText.concat(`${
        Formatters.tissueFormatter(dKey)}: <a href="${linkAddress}">${dot[dKey]}</a>`);
      tooltipText = tooltipText.concat(
        `<span>${this.config.xAxisLabel}: ${
          dot[this.config.xField]}</span>`);
      tooltipText = tooltipText.concat(
        `<span>${this.config.yAxisLabel}: ${
          dot[this.config.yField]}</span>`);
      if (this.config.hoverFields){
        this.config.hoverFields.forEach(field => {
          tooltipText = tooltipText.concat(
            `<span>${Formatters.tissueFormatter(field)}: ${
              dot[field]}</span>`
          );
        });
      }
      return tooltipText;
    },
    unHoverDot() {
      this.hideTooltip;
    },
    hideTooltip(){
      if (!!this.tooltip){
        this.tooltip.style("opacity", 0);
      }
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
    },
    highlightDot(phenotype){
      let dot = this.svg.select(`circle.dot_${phenotype}`);
      dot.attr("r", 7)
          .attr("stroke", "black")
    },
    unHighlightDots(){
      this.svg.selectAll("circle")
          .attr("r", 5)
          .attr("stroke", this.dotOutlineColor)
    }
  },
  watch: {
    chartData(){
      this.drawChart();
    },
    matchingHoverDots(newDots){
      this.unHighlightDots();
      let phenotypes = Object.keys(JSON.parse(newDots));
      phenotypes.forEach(phenotype => this.highlightDot(phenotype));
    },
    pigeanColors(newColors){
      console.log("new colors are", JSON.stringify(newColors));
    }
  }
});
</script>
<style>
  @import url("/css/effectorGenes.css");
  .tooltip span {
      display: block;
  }
  p.close-tooltip{
    text-align: right;
    margin: 0px;
    padding: 0px;
  }
</style>
