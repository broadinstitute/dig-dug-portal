<template>
    <div class="plot" :id="`violinChart_${gene}`">
    </div>
</template>
  
<script>
  import * as d3 from 'd3';
import { truncate } from 'lodash';
  import Vue from 'vue';
  
  export default Vue.component('bulk-violin-plot', {
    props: {
      data: {                           
        type: (Array, null),
        required: true,
      },
      xField: {
        type: (String, null),
        required: true
      },
      xLabel: {
        type: (String, null),
        required: true
      },
      gene: {
        type: (String, null),
        required: true
      },
    },
    data() {
        return {
            plotId: "",
            chart: null,
            chartWidth: 0,
            eventElements: [],
            yField: "norm_counts",
            margin: {
                top: 10,
                right: 10,
                bottom: 110,
                left: 70
            },
            svg: null,
            fontSize: "13px",
            plotHeight: 350
        }
    },
    watch: {
        data() {
            this.drawChart();
        },
        xField(){
            this.drawChart();
        },
        highlightKey(key) {
            this.doHighlight(key);
        }
    },
    mounted() {
        this.plotId = `violinChart_${this.gene}`;
        if(this.data){
            this.chart = document.getElementById(this.plotId);
            this.chartWidth = this.chart.clientWidth;
            addEventListener("resize", (event) => {
                this.chartWidth = this.chart.clientWidth;
                this.drawChart();
            });
            this.drawChart();
        }
        //window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy(){
        //window.removeEventListener('resize', this.handleResize);
        if(this.eventElements.length>0) {
            this.removeAllListeners(this.eventElements);
        }
    },
    methods: {
        handleResize(){
            this.drawChart();
        },
        drawChart(){
            if(!this.data) return;
            let plotId = `#${this.plotId}`;

            //Clear existing

            d3.select(plotId)
                .selectAll("svg")
                .remove();
            d3.select(plotId)
                .selectAll("g")
                .remove();

            let xField = this.xField;
            let yField = this.yField;

            let width = this.chartWidth - this.margin.left - this.margin.right;
            let height = this.plotHeight - this.margin.top - this.margin.bottom;

            this.svg = d3.select(plotId)
                .append("svg")
                    .attr("width", width + this.margin.left + this.margin.right)
                    .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g")
                    .attr("transform", 
                        `translate(${this.margin.left},${this.margin.top})`);
            
            let minVal = d3.min(this.data.map(d => d[yField]));
            let maxVal = d3.max(this.data.map(d => d[yField]));
            let y = d3.scaleLinear()
                .domain([minVal, maxVal])
                .range([height, 0]);
            this.svg.append("g").call(d3.axisLeft(y))
                .selectAll("text")
                .style("font-size", this.fontSize);

            let categories = Array.from(new Set(this.data.map(d => d[xField])));

            let x = d3.scaleBand()
                .range([0,width])
                .domain(categories)
                .padding(0.05);
            this.svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
				.style("font-size", this.fontSize)
                .style("text-anchor", "end")
                .attr("transform", "rotate(-35) translate(-5, 0)");
            
            let histogram = d3.histogram()
                .domain(y.domain())
                .thresholds(y.ticks(20))
                .value(d => d);

            let statData = structuredClone(this.data);
            let sumstat = d3.nest()
                .key(d => d[xField])
                .rollup(function(d){
                    let input = d.map(g => g[yField]);
                    let bins = histogram(input);
                    return bins;
                })
                .entries(statData);
            
                        
            let maxNum = 0;
            for (let i = 0; i < sumstat.length; i++){
                let allBins = sumstat[i].value;
                let lengths = allBins.map(a => a.length);
                let longest = d3.max(lengths);
                if (longest > maxNum){
                    maxNum = longest;
                }
            }
            let xNum = d3.scaleLinear()
                .range([0, x.bandwidth()])
                .domain([-maxNum, maxNum]);
            
            this.svg.selectAll("myViolin")
                .data(sumstat)
                .enter()
                .append("g")
                    .attr("transform", d => `translate(${x(d.key)} ,0)`)
                .append("path")
                    .datum(d => d.value)
                    .style("stroke", "none")
                    .style("fill", "#69b3a2")
                    .attr("d", d3.area()
                        .x0(d => xNum(-d.length))
                        .x1(d => xNum(d.length))
                        .y(d => y(d.x0))
                        .curve(d3.curveCatmullRom));

            this.svg.append("g")
				.attr("id", "axisLabelsGroup")
				.attr("transform", "translate(0,0)")
                .style("text-anchor", "middle");

			this.svg.select("#axisLabelsGroup")
				.append("text")
				.attr("x", ((width / 2)))
				.attr("y", (height + this.margin.bottom - 10))
				.text(this.xLabel);

            this.svg.select("#axisLabelsGroup")
				.append("text")
				.attr("transform", "rotate(-90)")
                .attr("y", -35)
                .attr("x", - height / 2)
				.text("Norm counts");
        },
        truncateLabel(label){
            if (!this.xField === "cat__custom__surgery"){
                return label;
            }
            if (label.indexOf(" ") !== -1){
                return label.replaceAll(" ", "");
            }
            return label.length < 8 ? label : `${label.slice(0,7)}.`;
        } 
    },
  });
  </script>
  
  <style scoped>
  svg {
    font-family: sans-serif;
  }
  
  ::v-deep .chart-label{
    font-size:12px;
    opacity:0.5;
  }
  ::v-deep .plot.highlighting .bar{
    opacity: 0.2;
  }
  ::v-deep .plot.highlighting .bar.on{
    opacity: 1;
  }
    .plot{
        margin-left: 15px;
        margin-bottom: 15px;
        background-color: white;
    }
  </style>
  