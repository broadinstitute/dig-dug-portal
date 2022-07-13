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
            phenotype: "",
            region: "",
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
            let betaBuckets = [];
            for (let i = -1; i < 1; i += 0.02){
                let bucketCount = betaVals.filter(beta => beta >= i && beta < i + 0.02).length;
                betaBuckets.push({"bucketStart": i, "bucketCount": bucketCount});
            }
            console.log(betaBuckets);
            this.renderCharts(betaBuckets);
        },
        renderCharts(dataset){
            // Based on EffectorGenesPlotsLine
            var chartWrapper = ".beta-chart";
            var margin = { top: 25, right: 10, bottom: 20, left: 29 },
                    width =
                        $(chartWrapper).width() - margin.left - margin.right, // Use the window's width
                    height = 150 - margin.top - margin.bottom; // Use the window's height
            var n = dataset.length;
            var maxFreq = 100;
            var xScale = d3
                    .scaleLinear()
                    .domain(-1, 1) // input
                    .range([0, width]);
            var yScale = d3
                    .scaleLinear()
                    .domain([0, maxFreq]) // input
                    .range([height, 0]); // output

            var line = d3
                    .line()
                    .x(function (d) {
                        console.log(d);
                        return d.bucketStart;
                    }) // set the x values for the line generator
                    .y(function (d) {
                        console.log(d);
                        return d.bucketCount;
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
            
            svg.append("path").datum(dataset)
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