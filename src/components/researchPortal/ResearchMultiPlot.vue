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
export default Vue.component("research-multi-plot", {
    props: ["rawData", "summaryPlot"],
    data(){
        return {};
    },
    mounted: function () {
        if (this.$props.summaryPlot.type != "multi"){
            console.error("Configuration error; multi plot not specified.")
        }
        this.displayResults(this.$props.summaryPlot);
    },
	computed: {},
	watch: {
        rawData: function(){
            this.displayResults(this.$props.summaryPlot);
        }
    },
    methods: {
        ...uiUtils,
        displayResults(configObject){
            let rawData = this.$props.rawData;
            let keyAttribute = configObject["render by"];
            let statFields = !!configObject["stat fields"] 
                ? configObject["stat fields"] : null;
            let chart = document.getElementById("multi-chart");
            chart.innerHTML = "";

            var margin = { top: 10, right: 30, bottom: 65, left: 40 },
                        width = configObject.width - margin.left - margin.right,
                        height = configObject.height - margin.top - margin.bottom;
            
            let svg = d3.select("#multi-chart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var sumstat = d3.nest()
                .key(function(d){return d[keyAttribute];})
                .rollup(function(d){
                    let q1 = d.map(g => g[statFields.q1]);
                    let median = d.map(g => g[statFields.median]);
                    let q3 = d.map(g => g[statFields.q3]);
                    let interQuantileRange = q3-q1;
                    let min = d.map(g => g[statFields.min]);
                    let max = d.map(g => g[statFields.max]);
                    let mean = d.map(g => g[statFields.mean]);
                    return({
                        q1: q1,
                        median: median,
                        q3: q3,
                        interQuantileRange: interQuantileRange,
                        min: min,
                        max: max,
                        mean: mean
                    });
                }).entries(rawData);

            var x = d3.scaleBand()
                .range([0, width])
                .domain(rawData.map(entry => entry[keyAttribute]))
                .paddingInner(1)
                .paddingOuter(.5);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "start")
                .attr("transform", "rotate(45)");
            
            let maxVal = rawData.map(item => item.max_TPM).reduce(
                (prev, next) => prev > next ? prev : next);
            var y = d3.scaleLinear()
                .domain([0,maxVal])
                .range([height,0]);
            svg.append("g").call(d3.axisLeft(y));

            svg.selectAll("vertLines")
                .data(sumstat)
                .enter()
                .append("line")
                    .attr("x1", d => x(d.key))
                    .attr("x2", d => x(d.key))
                    .attr("y1", d => y(d.value.min))
                    .attr("y2", d => y(d.value.max))
                    .attr("stroke", "black")
                    .style("width", 40);
            
            var boxWidth = (width / rawData.length) * 0.75;
            svg.selectAll("boxes")
                .data(sumstat)
                .enter()
                .append("rect")
                    .attr("x", d => x(d.key) - boxWidth/2)
                    .attr("y", d => y(d.value.q3))
                    .attr("height", d => y(d.value.q1) - y(d.value.q3))
                    .attr("width", boxWidth)
                    .attr("stroke", "black")
                    .style("fill", "#69b3a2");
            
            svg.selectAll("medianLines")
                .data(sumstat)
                .enter()
                .append("line")
                    .attr("x1", d => x(d.key) - boxWidth/2)
                    .attr("x2", d => x(d.key) + boxWidth/2)
                    .attr("y1", d => y(d.value.median))
                    .attr("y2", d => y(d.value.median))
                    .attr("stroke", "black")
                    .style("width", 80);

            svg.selectAll("meanLines")
                .data(sumstat)
                .enter()
                .append("line")
                    .attr("x1", d => x(d.key) - boxWidth/2)
                    .attr("x2", d => x(d.key) + boxWidth/2)
                    .attr("y1", d => y(d.value.mean))
                    .attr("y2", d => y(d.value.mean))
                    .attr("stroke", "white")
                    .style("width", 80);
        }        
    },
});
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
</style>