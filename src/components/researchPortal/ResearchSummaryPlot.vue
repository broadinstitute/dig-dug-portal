<template>
<div>
<form>
    <label>Phenotype<input v-model="phenotype"/></label>
    <label>Gene or region<input v-model="region"/></label>
    <legend class="radio">Chart type:
        <label>Histogram<input type="radio" name="chart-type" v-model="histogramChart"/></label>
        <label>Line<input type="radio" name="chart-type" v-model="lineChart"/></label>
        <label>Scatterplot<input type="radio" name="chart-type" v-model="scatterChart"/></label>
    </legend>
    <p>Attributes to include:</p>
    <label>Beta<input type="checkbox" v-model="includeBeta"/></label>
    <label>P-value<input type="checkbox" v-model="includePvalue"/></label>
    <label>Standard error<input type="checkbox" v-model="includeStdErr"/></label>
    <label>Z-score<input type="checkbox" v-model="includeZscore"/></label>
    <label>Number of buckets for data processing:<input type="number" v-model="numberOfBuckets"/></label>
</form>

<button @click="getAssociations(phenotype, region)">Get associations</button>
<div class="all-charts">
    <div class="chart beta-chart"></div>
    <div class="chart p-val-chart"></div>
    <div class="chart std-err-chart"></div>
    <div class="chart z-score-chart"></div>
</div>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("research-summary-plot", {
    props: ["dataset", "graphData"],
    data(){
        return {
            phenotype: "t2d",
            region: "slc30a8",
            includeBeta: true,
            includePvalue: true,
            includeStdErr: true,
            includeZscore: true,
            numberOfBuckets: 100,
            histogramChart: true,
            lineChart: false,
            scatterChart: false,
            jsonData: null
        };
    },
    mounted: function () {},
	computed: {},
	watch: {},
    methods: {
        ...uiUtils,
        queryConfig(){
            let attributes = [];
            attributes = attributes.concat(this.includeBeta ? ["beta"] : []);
            attributes = attributes.concat(this.includePvalue ? ["pValue"] : []);
            attributes = attributes.concat(this.includeStdErr ? ["stdErr"] : []);
            attributes = attributes.concat(this.includeZscore ? ["zScore"] : []);

            let type = this.histogramChart ? "histogram" : (this.lineChart ? "line" : "scatterplot")
            
            let config = {
                "type": type,
                "columns": attributes,
                "dataConvert": {"pValue": "minusLog10"},
                "buckets": this.numberOfBuckets
            };
            return config;
        },
        async getAssociations(phenotype, region){
            console.log(this.queryConfig());
            let assocServer = "https://bioindex.hugeamp.org/api/bio"; // will this ever change?
            let queryURL = `${assocServer}/query/associations?q=${phenotype},${region}`
            let assocJSON = await fetch(queryURL).then((response) => response.json());
            this.jsonData = assocJSON.data;
            
            // Beta
            if (this.includeBeta){
                let betaVals = assocJSON.data.map(item => item.beta);
                this.renderCharts(betaVals, 100, ".beta-chart");
            }

            // P-value
            if (this.includePvalue){
                let pVals = assocJSON.data.map(item => (-1 * Math.log10(item.pValue)));
                this.renderCharts(pVals, 100, ".p-val-chart");
            }
            

            // Std error
            if (this.includeStdErr){
                let stdErrVals = assocJSON.data.map(item => Number(item.stdErr));
                this.renderCharts(stdErrVals, 100, ".std-err-chart");
            }

            // Z-score
            if (this.includeZscore){
                let zScoreVals = assocJSON.data.map(item => Number(item.zScore));
                this.renderCharts(zScoreVals, 100, ".z-score-chart");
            }
        },
        
        renderCharts(dataset, nBuckets, chartWrapper){
            let maxVal = dataset.reduce((prev, next) => prev > next ? prev : next);
            let minVal = dataset.reduce((prev, next) => prev < next ? prev : next);

            // Based on EffectorGenesPlotsLine
            var margin = { top: 25, right: 10, bottom: 35, left: 29 },
                    width =
                        $(chartWrapper).width() - margin.left - margin.right, // Use the window's width
                    height = $(chartWrapper).height() - margin.top - margin.bottom; // Use the window's height
                
            var xScale = d3.scaleLinear()
                    .domain([minVal, maxVal]) // input
                    .range([0, width]);
            
            var histogram = d3.histogram()
                            .value(function (d) {return d })
                            .domain(xScale.domain())
                            .thresholds(xScale.ticks(nBuckets));
            
            var bins = histogram(dataset);

            let yScaleTopEnd = d3.max(bins, function(d){return d.length;});
            var yScale = d3.scaleLinear()
                    .domain([0, yScaleTopEnd]) // input
                    .range([height, 0]); // output
            
            // Clear the div before drawing the chart.
            let chartDiv = document.getElementsByClassName(chartWrapper.slice(1))[0]
            chartDiv.innerHTML = "";
            chartDiv.classList.add("shown");

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
            
            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d){return `translate(${xScale(d.x0)},${yScale(d.length)})`;})
                .attr("width", function(d){return xScale(d.x1) - xScale(d.x0);})
                .attr("height", function(d){return height - yScale(d.length);})
                .style("fill", "orange");
            
            svg.append("text")
                .attr("text-anchor", "start")
                .attr("y", yScale(yScaleTopEnd * -0.13)).attr("x", 0.5)
                .text(chartWrapper.slice(1, -6).replace("-", " "));

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
            let randEntry = this.jsonData[randIndex];
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
.chart{
    height: 285px;
    flex: 1;
}

.all-charts{
    display: flex;
}

form label{
    display: block;
}

.radio label{
    display: inline;
    font-size: smaller;
}
</style>