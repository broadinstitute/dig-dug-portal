<template>
<div>
<p>Hello world</p>
<p>Phenotype:</p>
<input v-model="phenotype"/>
<p>Gene or region:</p>
<input v-model="region"/>
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
        };
    },
    mounted: function () {},
	computed: {},
	watch: {},
    methods: {
        ...uiUtils,
        async getAssociations(phenotype, region){
            let assocServer = "https://bioindex.hugeamp.org/api/bio"; // will this ever change?
            let queryURL = `${assocServer}/query/associations?q=${phenotype},${region}`
            let assocJSON = await fetch(queryURL).then((response) => response.json());
            
            // Beta
            let betaVals = assocJSON.data.map(item => item.beta);       
            this.renderCharts(betaVals, 100, ".beta-chart");

            // P-value
            let pVals = assocJSON.data.map(item => (-1 * Math.log10(item.pValue)));
            this.renderCharts(pVals, 100, ".p-val-chart");

            // Std error
            let stdErrVals = assocJSON.data.map(item => Number(item.stdErr));
            this.renderCharts(stdErrVals, 100, ".std-err-chart");

            // Z-score
            let zScoreVals = assocJSON.data.map(item => Number(item.zScore));
            this.renderCharts(zScoreVals, 100, ".z-score-chart");

        },
        
        renderCharts(dataset, nBuckets, chartWrapper){
            let maxVal = dataset.reduce((prev, next) => prev > next ? prev : next);
            let minVal = dataset.reduce((prev, next) => prev < next ? prev : next);
            let interval = (maxVal - minVal) / nBuckets;

            let buckets = [];
            for (let i = minVal; i < maxVal; i = i + interval){
                let bucketCount = dataset.filter(entry => entry >= i && entry < i + interval).length;
                buckets.push({"bucketStart": i, "bucketCount": bucketCount});
            }
            // Max vals get added to the top bucket
            let maxCount = buckets.filter(entry => entry == maxVal).length;
            buckets[buckets.length - 1].bucketCount += maxCount;

            // Based on EffectorGenesPlotsLine
            var margin = { top: 25, right: 10, bottom: 20, left: 29 },
                    width =
                        $(chartWrapper).width() - margin.left - margin.right, // Use the window's width
                    height = $(chartWrapper).height() - margin.top - margin.bottom; // Use the window's height

            let maxFreq = buckets.map(bucket => bucket.bucketCount)
                                .reduce((prev, next) => prev > next ? prev : next);

                
            var xScale = d3
                    .scaleLinear()
                    .domain([minVal, maxVal]) // input
                    .range([0, width]);
            var yScale = d3
                    .scaleLinear()
                    .domain([0, maxFreq]) // input
                    .range([height, 0]); // output

            var line = d3
                    .line()
                    .x(function (d) {
                        return xScale(d.bucketStart);
                    }) // set the x values for the line generator
                    .y(function (d) {
                        return yScale(d.bucketCount);
                    }) // set the y values for the line generator
                    .curve(d3.curveMonotoneX); // apply smoothing to the line

            let svg = d3
                    .select(chartWrapper)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr(
                        "transform",
                        "translate(" + margin.left + "," + margin.top + ")"
                    );
            
            svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(d3.axisBottom(xScale).ticks(3));

            svg.append("g")
                    .attr("class", "y axis")
                    .call(d3.axisLeft(yScale).ticks(3))
                    .selectAll("text")
                    .style("text-anchor", "end");
            
            svg.append("path").datum(buckets).attr("class", "chart-line").attr("d", line);

        }

    },
});
</script>
<style>
.chart{
    height: 275px;
    flex: 1;
}

.all-charts{
    display: flex;
}
</style>