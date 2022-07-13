<template>
<div>
<p>Hello world</p>
<p>Phenotype:</p>
<input v-model="phenotype"/>
<p>Gene or region:</p>
<input v-model="region"/>
<button @click="getAssociations(phenotype, region)">Get associations</button>
<div class="beta-chart"></div>
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
            let betaVals = assocJSON.data.map(item => item.beta); // from -1 to 1         
            console.log(betaVals);   
            this.renderCharts(betaVals, 100, ".beta-chart");
        },
        
        renderCharts(dataset, nBuckets, chartWrapper){
            let maxVal = dataset.reduce((prev, next) => prev > next ? prev : next);
            let minVal = dataset.reduce((prev, next) => prev < next ? prev : next);
            let interval = (maxVal - minVal) / nBuckets;

            console.log(`Max val: ${maxVal}, min val: ${minVal}`);

            let buckets = [];
            for (let i = minVal; i < maxVal; i = i + interval){
                let bucketCount = dataset.filter(entry => entry >= i && entry < i + interval).length;
                console.log(bucketCount);
                buckets.push({"bucketStart": i, "bucketCount": bucketCount});
            }
            // Max vals get added to the top bucket
            let maxCount = buckets.filter(entry => entry == maxVal).length;
            buckets[buckets.length - 1].bucketCount += maxCount;

            console.log(buckets);

            // Based on EffectorGenesPlotsLine
            var margin = { top: 25, right: 10, bottom: 20, left: 29 },
                    width =
                        $(chartWrapper).width() - margin.left - margin.right, // Use the window's width
                    height = 150 - margin.top - margin.bottom; // Use the window's height

            let maxFreq = buckets.map(bucket => bucket.bucketCount)
                                .reduce((prev, next) => prev > next ? prev : next);

                
            console.log(maxFreq);
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
            
            svg.append("path").datum(buckets)
                    .attr("class", "chart-line")
                    .attr("d", line);

        }

    },
});
</script>
<style>
.beta-chart{
    width: 500px;
    height: 500px;

}
</style>