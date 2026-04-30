<template>
    <div>
        {{ availableDonors }} donors available meeting criteria
        <div class="donorData">
          <div v-if="donorMetadata !== null">
            <div class="donorLabel"><strong>Highlighted donor:</strong> {{ donorMetadata.Accession }}</div>
            <div>
              <table>
                <tr>
                  <td class="leftTable"><strong>Age:</strong> {{ donorMetadata["Age (years)"] }}</td>
                  <td><strong>Gender:</strong> {{ donorMetadata.Gender }}</td>
                </tr>
                <tr>
                  <td class="leftTable"><strong>BMI:</strong> {{ donorMetadata.BMI }}</td>
                  <td><strong>Derived diabetes status:</strong> {{ donorMetadata["Derived diabetes status"] }}</td>
                </tr>
              </table>
            </div>
          </div>
          <div v-else>
            Mouse over the plot to highlight an individual donor.
          </div>
        </div>
        <div :id=plotId class="plot" ref="time-series-line">
            <p>Loading...</p>
        </div>
        <div class="download-images-setting">
            <button class="btn btn-secondary btn-sm" @click="downloadImage(plotId, `ins_ieq_time_series`, 'svg')">
              Download SVG <b-icon icon="download"></b-icon>
            </button>
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
        chartWidth: 750,
        chartHeight: 300,
        innerHeight: null,
        svg: null,
        xScale: null,
        yScale: null,
        xMedian: 0,
        tooltip: null,
        tooltipElement: null,
        hoverBoxPosition: "left",
        dotOutlineColor: "#00000075",
        dotKey: "donor",
        xField: "time",
        yField: "score",
        xAxisLabel: "time (min)",
        yAxisLabel: null,
        axesDrawn: false,
        highlightedDonor: null,
      };
  },
  mounted(){
    this.chart = document.getElementById(this.plotId);
    this.drawChart();
  },
  computed: {
    chartData(){
      let data = structuredClone(this.plotData);
      if (this.filter){
        data = data.filter(this.filter);
      }
      let output = [];
      this.donors.forEach(d => {
        let donorData = data.filter(e => e.donor === d);
        if (donorData.length > 0){
          output.push(donorData);
        }
      });
      return output;
    },
    availableDonors(){
      let donorsPresent = new Set(this.chartData.flatMap(m => m.map(n => n.donor)));
      return donorsPresent.size;
    },
    allHoverFields(){
      return [this.dotKey, this.xField, this.yField];
    },
    donorMetadata(){
      if (this.highlightedDonor === null){
        return null;
      }
      return this.$store.state.metadata.find(d => d.Accession === this.highlightedDonor);
    }
  },
  methods: {
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
          conditionInfo.y = yScale(this.maxScore);
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
      this.innerHeight = height;

      // Create scales
      this.xMedian = this.maxTime / 2;
      let xPadding = 1.01;
      let yPadding = 1.2;
      this.xScale = d3.scaleLinear()
        .domain([0, this.maxTime * xPadding])
        .range([0, width]);
      this.yScale = d3.scaleLinear()
        .domain([0, this.maxScore * yPadding]) // wider margin because y-axis is shorter visually
        .range([height, 0]);

      this.chart.innerHTML = "";
      this.svg = d3.select(`#${this.plotId}`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .attr("id", `chart_${this.plotId}`)
          .on("mouseleave", () => this.resetTooltip())
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

      //Labels
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("y", height + margin.top + 20)
        .attr("x", width/2)
        .text(this.xAxisLabel || this.xField);
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", - height / 2)
        .text(`${this.yAxisLabel || this.yField}`);
      

      // Access the tooltip as an HTML element
      this.tooltipElement = this.chart.getElementsByClassName("tooltip")[0];
      this.drawLines();
      this.drawAxes();
    },
    drawAxes(){
      // add X-axis
      let xAxis = this.svg.append("g")
        .attr("transform", `translate(0,${this.innerHeight})`)
        .attr("stroke-width", 1)
        .call(d3.axisBottom(this.xScale))
          .selectAll("text")
          .style("font-size", "13px");
      
      this.axesDrawn = true;
      // add Y-axis
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale))
          .selectAll("text")
            .style("font-size", "13px");
    },
    drawLines(){
      this.svg.selectAll("path.line-path").remove();
      const lineGenerator = d3.line()
          .x(d => this.xScale(d[this.xField]))
          .y(d => this.yScale(d[this.yField]))
          .defined(d =>
            d[this.xField] !== undefined &&
            d[this.yField] !== undefined
          );

        let highlightedDonorData = null;
        this.chartData.forEach(c => {
          if (c[0].donor === this.highlightedDonor){
            highlightedDonorData = c;
          } else {
            this.svg.append("path")
            .datum(c)
            .attr("class", "linegraph")
            .attr("fill", "none")
            .attr("stroke", this.highlightedDonor === null ? this.lineColor : "lightgray")
            .attr("stroke-width", 1)
            .attr("class", "line-path")
            .attr("d", lineGenerator)
            .on("mouseover", c => this.showTooltip(c));
          }
        });
        // Put highlighted line on top
        if (highlightedDonorData !== null){
          this.svg.append("path")
            .datum(highlightedDonorData)
            .attr("class", "linegraph")
            .attr("fill", "none")
            .attr("stroke", this.lineColor)
            .attr("stroke-width", 2)
            .attr("class", "line-path")
            .attr("d", lineGenerator)
            .on("mouseover", c => this.showTooltip(c))
        }
    },
    hoverLine(donor) {

      let xcoord = d3.event.layerX;
      let ycoord = d3.event.layerY;

      // Tooltip content
      this.tooltip
        .style("opacity", 1)
        .html(donor);
      
      this.tooltip
        .style("left", `${xcoord}px`)
        .style("top", `${ycoord + 30}px`);
    },
    resetTooltip(){
      this.highlightedDonor = null;
      if (!!this.tooltip){
        this.tooltip.style("opacity", 0);
      }
      this.drawLines();
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
    showTooltip(c){
      let donor = c[0].donor;
      //this.hoverLine(donor);
      if (this.highlightedDonor !== donor){
        this.highlightedDonor = donor;
        this.drawLines();
      }
    }
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
    float: right;
  }
  .donorData{
    height: 100px;
    display: block;
  }
  .leftTable {
    width: 100px;
  }
  .donorLabel {
    padding-top: 2px;
    padding-bottom: 2px;
  }
</style>