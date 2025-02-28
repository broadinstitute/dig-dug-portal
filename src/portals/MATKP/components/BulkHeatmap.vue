<template>
  <div>
    <div style="display:flex; gap:5px" class="legends">
                                    <div style="display:flex; flex-direction: column;" class="legend">
                                        <div class="label">Expression</div>
                                        <div class="gradient" :style="`background: linear-gradient(to right, ${colorScaleArray});`"></div>
                                        <div style="display:flex" class="marks"><div>0.0</div><div>{{markerGenesMaxMean}}</div></div>
                                    </div>
                                </div>
    <div :id="plotId">
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from 'd3';
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import "../assets/matkp-styles.css";
import mouseTooltip from "../../../components/researchPortal/singleCellBrowser/mouseTooltip.js";
export default Vue.component("bulk-heatmap", {
    components: {
    },
    props: [
        "zNormData",
        "margin",
        "plotHeight"
    ],
    data() {
        return {
          plotId: "bulk_heatmap",
          chart: null,
          chartWidth: 0,
          color1: "blue",
          color2: "red",
          fontSize: "13px",
          minExp: null,
          maxExp: null,
          colorScaleArray: []
        };
    },
    computed: {},
    methods: {
      async drawHeatMap(){
          let plotId = `#${this.plotId}`;
          // Clear existing
          d3.select(plotId)
              .selectAll("svg")
              .remove();
          d3.select(plotId)
              .selectAll("g")
              .remove();
        d3.select(plotId)
              .selectAll("text")
              .remove();
          let width = this.chartWidth - this.margin.left - this.margin.right - this.margin.middleSpacing;
          let height = this.plotHeight;// - this.margin.top - this.margin.bottom;
          this.svg = d3.select(plotId)
              .append("svg")
                  .attr("width", width + this.margin.left + this.margin.right)
                  .attr("height", height + this.margin.top + this.margin.bottom)
              .append("g")
                  .attr("transform",  `translate(${this.margin.left},${this.margin.top})`);

          let genesRows = this.zNormData.map(d => d.gene);
          
          let dataset = this.zNormData[0].dataset;
          let samplesColumns = await this.getSampleIds(dataset);
          let collatedData = this.collateData(this.zNormData, samplesColumns)

          // Build X scales and axis:
          let x = d3.scaleBand()
              .range([ 0, width ])
              .domain(samplesColumns)
              .padding(0.01);
          this.svg.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x)) //Need to rotate axis labels!!
              .selectAll("text")
                      .style("text-anchor", "end")
                      .attr('font-size', this.fontSize)
                      .attr("transform", "rotate(-35) translate(-5, 0)");

          // Build Y scales and axis:
          var y = d3.scaleBand()
              .range([ height, 0 ])
              .domain(genesRows)
              .padding(0.01);
          this.svg.append("g")
              .call(d3.axisLeft(y))
                .selectAll("text")
                  .attr('font-size', this.fontSize);
          
          // Build color scale
          var colorScale = d3.scaleLinear()
              .range([this.color1, this.color2])
              .domain([this.minExp,this.maxExp]);
          let step = 0.01 * (this.maxExp - this.minExp);
          this.colorScaleArray = d3.range(this.minExp, this.maxExp, step).map(t => colorScale(t)).join(', ');
          // Building the heatmap
          this.svg.selectAll()
              .data(collatedData, function(d) {return d.sample+':'+d.expression;})
              .enter()
              .append("rect")
                  .attr("id", d => d.gene)
                  .attr("class", d => this.dataToClass(d))
                  .attr("x", function(d) { return x(d.sample) })
                  .attr("y", function(d) { return y(d.gene) })
                  .attr("width", x.bandwidth() )
                  .attr("height", y.bandwidth() )
                  .style("fill", function(d) { return colorScale(d.expression)} )
                  .on("mouseover", d => this.showTooltip(d))
                  .on("mouseleave", d=> mouseTooltip.hide())
                  .on("click", d => this.clickSquare(d));

            this.svg.append("g")
				.attr("id", "axisLabelsGroup")
				.attr("transform", "translate(0,0)")
                .style("text-anchor", "end");


			this.svg.select("#axisLabelsGroup")
				.append("text")
				.attr("x", ((width / 2)))
				.attr("y", (height + this.margin.bottom - 5))
				.text("Sample ID");

            this.svg.select("#axisLabelsGroup")
				.append("text")
				.attr("transform", 
					`translate(${- 2.5 * this.margin.legendSpacing
                        },${height/2})rotate(-90)`)
				.attr("x", 0)
				.attr("y", 0)
				.text("Gene");

        this.loading = false;
      },
      async getSampleIds(dataset){
        let queryUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/${
            dataset}/fields.json.gz`;
        try {
            const response = await fetch(queryUrl);
            const data = await(response.json());
            return data.sample_id;
        }
        catch(error) {
            console.error("Error: ", error);
            return [];
        }
        },
      collateData(rawData, samplesColumns){
            let outputData = [];
            let minExp = rawData[0]?.expression[0] || null;
            let maxExp = rawData[0]?.expression[0] || null;
            rawData.forEach(item => {
                for (let i = 0; i < item.expression.length; i++){
                    let currentExp = item.expression[i];
                    if (currentExp < minExp){
                        minExp = currentExp;
                    }
                    if (currentExp > maxExp){
                        maxExp = currentExp;
                    }
                    let expressionEntry = {
                        gene: item.gene,
                        sample: samplesColumns[i],
                        expression: item.expression[i]
                    };
                    outputData.push(expressionEntry);
                }
            });
            this.minExp = minExp;
            this.maxExp = maxExp;
            return outputData;
        },
      showTooltip(event){
        let gene = d3.event.target.id;
        let tooltipHtml = `<strong>${gene}</strong>`;
        let classes = d3.event.target.classList;
        tooltipHtml = tooltipHtml.concat(
          `<div>Sample: ${classes[0]}</div>`)
        let expression = classes[1].replace("expr_", "");
        expression = expression.replace("dot", ".");
        tooltipHtml = tooltipHtml.concat(
          `<div>Expression: ${expression}</div>`)
        mouseTooltip.show(tooltipHtml);
      },
      clickSquare(event){
        let gene = d3.event.target.id;
        this.$emit("highlight", gene);
      },
      dataToClass(value){
        let expr = `expr_${value.expression}`.replaceAll(".", "dot");
        return `${value.sample} ${expr}`;
    },
    },
    watch: {
      zNormData:{
            handler(newData, oldData){
                if(newData !== oldData){
                    this.drawHeatMap();
                }
            },
            deep: true
        },
    },
    mounted(){

      this.chart = document.getElementById(this.plotId);
        this.chartWidth = this.chart.clientWidth;
        this.drawHeatMap();
    }
});
</script>
<style scoped>
.legend {
    margin: 0 10px 0 0;
    gap:1px;
}
.legend .label {
    font-size: 11px !important;
    line-height: 11px;
}
.legend .gradient {
    height: 15px;
    width: 100px;
    border-radius: 20px;
}
</style>