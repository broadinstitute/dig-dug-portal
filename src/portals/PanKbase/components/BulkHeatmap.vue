<template>
  <div>
    <download-chart
        :chartId="`${plotId}_svg`"
        :filename="`${plotId}_differential_expression`"
    ></download-chart>
    <div style="display:flex; gap:5px" class="legends">
        <div style="display:inline-block; width:35%;" class="legend">
            <strong>Expression</strong>
            <div style="display:flex; margin-top:10px" class="marks">
              <span>{{ this.minExp }}</span>
              <div class="gradient" :style="`background: linear-gradient(to right, ${colorScaleArray});`"></div>
              <span>{{ this.maxExp }}</span>
            </div>
        </div>
        <div style="display:inline-block; width:65%;" class="legend" v-if="sampleGroups.length > 0">
            <strong>Sample groups</strong>
            <div style="display:flex; margin-top:10px">
              <template v-for="(sample, sIndex) in sampleGroups" >
                <span class="group-legend-box" :style="'background-color:'+sampleColors[sample.index]">&nbsp;</span><span class="group-legend-name">{{ (sample.label == "")? 'N/A':sample.label  }}</span>
              </template>
            </div>
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
import sortUtils from "@/utils/sortUtils";
import "../assets/pkb-styles.css";
import mouseTooltip from "../../../components/researchPortal/singleCellBrowser/mouseTooltip.js";
import DownloadChart from "@/components/DownloadChart.vue";

export default Vue.component("bulk-heatmap", {
    components: {
        DownloadChart
    },
    props: [
        "zNormData",
        "comparisonId",
        "margin",
        "plotHeight",
        "sampleColors",
        "selectedGene",
        "filter",
        "samplesColumns",
        "plotId"
    ],
    data() {
        return {
          chart: null,
          chartWidth: 0,
          colorWeak: "rgb(249 249 249)", // colorblind safe gray
          colorStrong: "rgb(116 040 129)", // colorblind safe purple
          fontSize: "13px",
          minExp: null,
          maxExp: null,
          colorScaleArray: [],
          sampleGroups:[],
        };
    },
    computed: {
        plotData(){
            if (!!this.filter){
                return this.zNormData.filter(this.filter);
            }
            return this.zNormData;
        }
    },
    methods: {
        ...sortUtils,
      async drawHeatMap(){
        //empty the wrapper first
        document.getElementById(this.plotId).innerHTML = "";

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
                  .attr("id", `${this.plotId}_svg`)
              .append("g")
                  .attr("transform",  `translate(${this.margin.left},${this.margin.top})`);

          let genesRows = this.plotData.map(d => d.gene);
          
          let dataset = this.plotData[0].dataset;
          let collatedData = this.collateData(this.plotData, this.samplesColumns)
          let sampleColors = this.sampleColors

          // Build X scales and axis:
          let x = d3.scaleBand()
              .range([ 0, width ])
              .domain(this.samplesColumns)
              .padding(0.01);
          this.svg.append("g")
              .attr("transform", "translate(0," + height + ")")
              .call(d3.axisBottom(x)) //Need to rotate axis labels!!
              .selectAll("text")
                      .style("text-anchor", "end")
                      .attr('font-size', this.fontSize)
                      .attr("transform", "rotate(-35) translate(-5, 0)");

          // Build Y scales and axis:
          let selectedGene = this.selectedGene
          var y = d3.scaleBand()
              .range([ height, 0 ])
              .domain(genesRows)
              .padding(0.01);
          this.svg.append("g")
              .call(d3.axisLeft(y))
                .selectAll("text")
                .style('fill',function(d) {
                    return ( d == selectedGene)? "#FF8800":"black"}) //set colors by group
                  .attr('font-size', this.fontSize);
          
          // Build color scale
          let colorScale = d3.scaleLinear(
            [this.minExp, this.maxExp],
            [this.colorWeak, this.colorStrong]);
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
            
            if(!!data) {

                const metaData = data.metadata[this.comparisonId]
                const metaLabel = data.metadata_labels[this.comparisonId]

                let tempDataArr = [];

                data.sample_id.map( (id, idIndex) => {
                    tempDataArr.push({
                        id: id,
                        sampleIndex: idIndex,
                        group: metaLabel[metaData[idIndex]],
                        groupIndex: metaData[idIndex]
                    })
                })

                let sortedArr = sortUtils.sortArrOfObjects(tempDataArr, 'group', 'alphabetical', 'asc')

                //Not the best way to do but required to render legend
                let tempMetaLabel = [];

                metaLabel.map((m,mIndex) => {
                    tempMetaLabel.push({
                        label: m,
                        index: mIndex
                    })
                })

                this.sampleGroups = sortUtils.sortArrOfObjects(tempMetaLabel, 'label', 'alphabetical', 'asc');
                
                let samples = {
                    samples:[],
                    sampleGroups: {}
                }

                sortedArr.map(s => {
                    samples.samples.push(s.id);
                    samples.sampleGroups[s.id] = s
                })

                return samples;//data.sample_id;
            }
            
        }
        catch(error) {
            console.error("Error: ", error);
            return [];
        }
        },
      collateData(rawData, samplesColumns){
            let outputData = [];
            let minExp = null;
            let maxExp = null;

            rawData.forEach(item => {
                ///DK: Modified to add group
                samplesColumns.map(sample =>{

                    //let groupInfo = samplesColumns.sampleGroups[sample]
                    let currentExp = item[sample];
                    minExp = (currentExp < minExp) || minExp === null ? currentExp : minExp;
                    maxExp = (currentExp > maxExp) || maxExp === null ? currentExp : maxExp;

                    let expressionEntry = {
                        gene: item.gene,
                        sample: sample,
                        expression: currentExp,
                        //group: groupInfo.group,
                        //groupIndex: groupInfo.groupIndex
                    };

                    outputData.push(expressionEntry);
                })
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
      plotData:{
            handler(newData, oldData){
                if(newData !== oldData){
                    this.drawHeatMap();
                }
            },
            deep: true
        },
        selectedGene(newGene, oldGene){
            let geneInMap = 
                this.zNormData.map(i => i.gene).includes(newGene) ||
                this.zNormData.map(i => i.gene).includes(oldGene);
            if (newGene !== oldGene && geneInMap){
                this.drawHeatMap();
            }
        }
    },
    mounted(){
        console.log(this.plotId);
        this.chart = document.getElementById(this.plotId);
        this.chartWidth = this.chart.clientWidth;
        this.drawHeatMap();
    }
});
</script>
<style scoped>
.legends {
    gap: 20px;
}

.legend {
    margin: 0 10px 0 0;
    gap:1px;
}
.legend .label {
    font-size: 11px !important;
    line-height: 11px;
}
.legend .gradient {
    height: 20px;
    min-width: 200px !important;
    border-radius: 20px;
}
.legend span {
  padding-left: 15px;
  padding-right: 15px;
}

.group-legend-box {
    display: inline-block;
    width: 15px;
    height: 15px;
    padding: 0 !important;
}

.group-legend-name {
    padding-left: 5px !important;
    padding-right: 15px !important;
    vertical-align: text-bottom;
}
</style>