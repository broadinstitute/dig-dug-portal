<template>
<div class="chart-wrapper">
    <div id="multi-chart">
        <h4>Pending!</h4>
    </div>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import colors from "@/utils/colors";
export default Vue.component("research-expression-plot", {
    props: ["rawData", "summaryPlot"],
    data(){
        return {
            selectableGenes: [],
            selectedGene: "",
            chart: null,
            chartWidth: null
        };
    },
    mounted: function () {
        this.chart = document.getElementById("multi-chart");
        this.chartWidth = this.chart.clientWidth;

        //this.displayResults();
        //addEventListener("resize", (event) => {
                    //this.chartWidth = this.chart.clientWidth;
                    //this.displayResults();
                //});
        
    },
	computed: {},
	watch: {
        rawData: function(){
            this.displayResults();
        },
        selectedGene(){
            this.displayResults(selectedGene);
        }
    },
    methods: {
        ...uiUtils,
        },
        displayResults(gene){
            if(gene == ""){
                console.error("Missing gene selection.");
                return;
            }
            let configObject = this.$props.summaryPlot;
            let rawData = this.$props.rawData;


            let keyAttribute = configObject["render by"];

            var margin = { 
                top: 10, 
                right: 30, 
                bottom: this.getBottomMargin(rawData, keyAttribute),
                left: 40 
            },
                width = this.chartWidth - margin.left - margin.right,
                height = configObject.height - margin.top - margin.bottom;
            this.chart.innerHTML = "";
            let svg = d3.select("#multi-chart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var x = d3.scaleBand()
                .range([0, width])
                .domain(rawData.map(entry => entry[keyAttribute]))
                .padding(0.05);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("transform", "rotate(45)");
            
            let maxVal = rawData.map(item => item[selectedGene]).reduce(
                (prev, next) => prev > next ? prev : next);
            var y = d3.scaleLinear()
                .domain([0,maxVal])
                .range([height,0]);
            svg.append("g").call(d3.axisLeft(y));

            let histogram = d3.histogram()
                    .domain(y.domain())
                    .thresholds(y.ticks(configObject["buckets"]))
                    .value(d => d);
            let sumstat = d3.nest()
                    .key(d => d[keyAttribute])
                    .rollup(function(d) {
                        let input = d.map(g => g[selectedGene]);
                        let bins = histogram(input);
                        return(bins);
                    }).entries(rawData);

            //Maximum number of entries in a bin.
            let maxNum = 0;
            for(let i in sumstat){
                let allBins = sumstat[i].value;
                let lengths = allBins.map(a => a.length);
                let longest = d3.max(lengths);
                if(longest > maxNum){
                    maxNum = longest;
                }
            }
            var xNum = d3.scaleLinear()
                .range([0, x.bandwidth()])
                .domain([-maxNum, maxNum]);
            
            let colorIndex = 0;
            svg.selectAll("myViolin")
                .data(sumstat)
                .enter()
                .append("g")
                    .attr("transform", d => `translate(${x(d.key)},0)`)
                .append("path")
                    .datum(d => d.value)
                    .style("stroke", "none")
                    .style("fill", d => {
                        let color = colors[colorIndex];
                        colorIndex++;
                        if (colorIndex >= colors.length){
                            colorIndex = 0;
                        }
                        return color;
                    })
                    .attr("d", d3.area()
                        .x0(d => xNum(-d.length))
                        .x1(d => xNum(d.length))
                        .y(d => y(d.x0))
                        .curve(d3.curveCatmullRom)
                    );

        },

        getBottomMargin(data, labelField){
            let longestLabel = data.map(item => item[labelField].length).reduce(
                (prev, next) => prev > next ? prev : next);
            let margin = longestLabel < 10 ? 65 : 65 * longestLabel / 10;
            return margin;
        }
    }
);
</script>
<style>
div{
    display: block;
}
.chart-wrapper{
    display: block;
}
.chart{
    flex: 1;
}
.all-charts{
    display: flex;
    margin: 20px;
}
#select-gene{
    width: 200px;
}
</style>