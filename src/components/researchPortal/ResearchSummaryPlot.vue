<template>
<div class="chart-wrapper">
    <div><h4>Summary Plots</h4></div>
    <div class="all-charts">
    </div>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("research-summary-plot", {
    props: ["rawData", "summaryPlot"],
    data(){
        return {};
    },
    mounted: function () {
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
        displayResults(config){
            let allCharts = document.getElementsByClassName("all-charts")[0];
            allCharts.innerHTML = "";
            config.fields.forEach(column => {
                let newChart = document.createElement("div");
                newChart.classList.add("chart");
                newChart.classList.add(`${column}-chart`);
                allCharts.append(newChart);
            });
            config.fields.forEach(column => {this.renderChart(column, config)});
        },        
        renderChart(attribute, configObject){
            let dataset = this.$props.rawData.map(item => Number(item[attribute]));
            let nBuckets = configObject.buckets < dataset.length ? configObject.buckets : dataset.length;
            
            let attributeLabel = attribute;
            if (configObject['data convert'][attribute] == "-log10"){
                dataset = dataset.map(data => -1 * Math.log10(data));
                attributeLabel = `${attribute} (-log10)`;
            }
            let maxVal = dataset.reduce((prev, next) => prev > next ? prev : next);
            let minVal = dataset.reduce((prev, next) => prev < next ? prev : next);

            //TODO remove DOM stuff in favor of jquery? or just remove jquery
            let chartWrapper = `.${attribute}-chart`;

            // Based on EffectorGenesPlotsLine
            var margin = { top: 25, right: 10, bottom: 35, left: 29 },
                    width = configObject.width - margin.left - margin.right,
                    height = configObject.height - margin.top - margin.bottom;
            var xScale = d3.scaleLinear()
                    .domain([minVal, maxVal]) // input
                    .range([0, width]);

            // Data prep for histogram
            var histogram = d3.histogram()
                            .value(function (d) {return d })
                            .domain(xScale.domain())
                            .thresholds(xScale.ticks(nBuckets));          
            var bins = histogram(dataset);
            let histogramTopEnd = d3.max(bins, function(d){return d.length;});

            // Data prep for line/scatterplot (yes, it does need to be done here)
            let interval = (maxVal - minVal) / nBuckets;

            let bucketsData = [];
            for (let i = minVal; i < maxVal; i = i + interval){
                let bucketCount = dataset.filter(entry => entry >= i && entry < i + interval).length;
                bucketsData.push({"bucketStart": i, "bucketCount": bucketCount});
            }
            // Max vals get added to the top bucket
            let maxCount = bucketsData.filter(entry => entry == maxVal).length;
            bucketsData[bucketsData.length - 1].bucketCount += maxCount;
            let linePlotTopEnd = bucketsData.map(item => item.bucketCount)
                .reduce((prev, next) => prev > next ? prev : next);

            let yScaleTopEnd = configObject.type == "histogram" ? histogramTopEnd : linePlotTopEnd;
            var yScale = d3.scaleLinear()
                    .domain([0, yScaleTopEnd]) // input
                    .range([height, 0]); // output

            let svg = d3.select(chartWrapper)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale).ticks(3))
                    .selectAll("text")
                    .style("text-anchor", "end")

            svg.append("g")
                    .attr("class", "y axis")
                    .call(d3.axisLeft(yScale).ticks(3))
                    .selectAll("text")
                    .style("text-anchor", "end");

            svg.append("text")
                .attr("text-anchor", "start")
                .attr("y", yScale(yScaleTopEnd * -0.2)).attr("x", 0.5)
                .text(attributeLabel)
                .style("font-weight", "bold");
            
            if (configObject.type == "histogram"){
                svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d){return `translate(${xScale(d.x0)},${yScale(d.length)})`;})
                .attr("width", function(d){return xScale(d.x1) - xScale(d.x0);})
                .attr("height", function(d){return height - yScale(d.length);})
                .style("fill", "orange");
            } else if (configObject.type == "line"){
                    var line = d3
                    .line()
                    .x(function (d) {
                        return xScale(d.bucketStart);
                    }) // set the x values for the line generator
                    .y(function (d) {
                        return yScale(d.bucketCount);
                    }) // set the y values for the line generator
                    .curve(d3.curveMonotoneX); // apply smoothing to the line
              
                    svg.append("path")
                        .datum(bucketsData)
                        .attr("class", "chart-line")
                        .attr("d", line)
                        .attr("fill", "none")
                        .attr("stroke", "orange");

            } else if (configObject.type == "scatterplot"){
                svg.append("g")
                    .selectAll("dot")
                    .data(bucketsData.filter(i => i.bucketCount > 0))
                    .enter()
                    .append("circle")
                    .attr("cx", function(d){return xScale(d.bucketStart)})
                    .attr("cy", function(d){return yScale(d.bucketCount)})
                    .attr("r", 1.5)
                    .style("fill", "orange");
            }
                
            
            // Select a random item
            let randIndex = Math.floor(Math.random()* dataset.length);
            let randItem = dataset[randIndex];

            // Draw a line for this item
            svg.append("line")
                .attr("x1", xScale(randItem))
                .attr("x2", xScale(randItem))
                .attr("y1", yScale(0))
                .attr("y2", yScale(dataset.length))
                .attr("stroke", "grey")
                .attr("stroke-dasharray", "4");
            
            // Label the line
            let textAnchor = randItem < (minVal + maxVal / 2) ? "start" : "end"
            let randEntry = this.$props.rawData[randIndex];
            svg.append("text")
                .attr("text-anchor", textAnchor)
                .attr("x", xScale(randItem))
                .attr("y", yScale(yScaleTopEnd * 0.75))
                .text(randEntry.varId)
                .style("font-size", "smaller")
                .style("color", "grey");
            
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