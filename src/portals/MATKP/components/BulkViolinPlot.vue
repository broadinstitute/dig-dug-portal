<template>
    <div id="violinChart">
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
  
  export default Vue.component('bulk-violin-plot', {
    props: {
      data: {                           
        type: (Array, null),
        required: true,
      },
    },
    data() {
        return {
            eventElements: [],
            yField: "lognorm_counts",
            xField: "cat__bmi__group",
            margin: {
                top: 10,
                right: 30,
                bottom: 30,
                left: 40
            },
            svg: null
        }
    },
    watch: {
        data() {
            this.drawChart();
        },
        highlightKey(key) {
            this.doHighlight(key);
        }
    },
    mounted() {
        if(this.data){
            this.drawChart();
        }else{
            console.log('no data');
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
            console.log("data", this.data);
            if(!this.data) return;

            let width = 460 - this.margin.left - this.margin.right;
            let height = 400 - this.margin.top - this.margin.bottom;

            this.svg = d3.select("#violinChart")
                .append("svg")
                    .attr("width", width + this.margin.left + this.margin.right)
                    .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g")
                    .attr("transform", 
                        `translate(${this.margin.left},${this.margin.top})`);
            
            let minVal = d3.min(this.data.map(d => d[this.yField]));
            let maxVal = d3.max(this.data.map(d => d[this.yField]));
            let y = d3.scaleLinear()
                .domain(minVal, maxVal)
                .range(height, 0);
            this.svg.append("g").call(d3.axisLeft(y));

            let categories = new Set(this.data.map(d => d[this.xField]));
            let x = d3.scaleBand()
                .range([height,0])
                .domain(categories)
                .padding(0.05);
            this.svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));
            
            let histogram = d3.histogram()
                .domain(y.domain())
                .thresholds(y.ticks(20))
                .value(d => d);

            let sumstat = d3.nest()
                .key(d => d[this.xField])
                .rollup(d => histogram(d.map(g => g[this.yField])))
                .entries(this.data);
            
            console.log(JSON.stringify(sumstat));
            
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
                .range(0, x.bandwidth())
                .domain(-maxNum, maxNum);
            
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
                        .curve(d3.curveCatmullRom))
        },        
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
  </style>
  