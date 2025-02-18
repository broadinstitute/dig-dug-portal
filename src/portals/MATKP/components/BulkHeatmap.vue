<template>
  <div>
    <div :id="plotId">
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import * as d3 from 'd3';
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
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
          color2: "red"
        };
    },
    computed: {},
    methods: {
      async drawHeatMap(){
        console.log("drawing heat map");
          let plotId = `#${this.plotId}`;
          // Clear existing
          d3.select(plotId)
              .selectAll("svg")
              .remove();
          d3.select(plotId)
              .selectAll("g")
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
                      .attr('font-size', '12px')
                      .attr("transform", "rotate(-35) translate(-5, 0)");

          // Build Y scales and axis:
          var y = d3.scaleBand()
              .range([ height, 0 ])
              .domain(genesRows)
              .padding(0.01);
          this.svg.append("g")
              .call(d3.axisLeft(y));
          
          // Build color scale
          var colorScale = d3.scaleLinear()
              .range([this.color1, this.color2])
              .domain([-2,7]); //MAKE RESPONSIVE TO OTHER DATASETS
          
          // Building the heatmap
          this.svg.selectAll()
              .data(this.collateData(this.zNormData, samplesColumns), 
                function(d) {return d.sample+':'+d.expression;})
              .enter()
              .append("rect")
                  .attr("x", function(d) { return x(d.sample) })
                  .attr("y", function(d) { return y(d.gene) })
                  .attr("width", x.bandwidth() )
                  .attr("height", y.bandwidth() )
                  .style("fill", function(d) { return colorScale(d.expression)} )
          this.loading = false;
      },
      async getSampleIds(dataset){
        console.log("getting sample IDs");
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
            return outputData;
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
        addEventListener("resize", (event) => {
            this.chartWidth = this.chart.clientWidth;
            this.drawHeatMap();
        });
        this.drawHeatMap();
    }
});
</script>