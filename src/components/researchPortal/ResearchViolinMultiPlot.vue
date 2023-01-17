<template>
<div class="chart-wrapper">
    <div class="v-multi-chart">
        <h4>Pending!</h4>
    </div>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("research-violin-multi-plot", {
    props: ["rawData", "summaryPlot"],
    data(){
        return {};
    },
    mounted: function () {
        if (this.$props.summaryPlot.type != "violin multi"){
            console.error("")
        }
        this.displayResults(this.$props.summaryPlot);
    },
	computed: {},
	watch: {
        rawData: function(){
            console.log("violin plot real soon!");
            this.displayResults(this.$props.summaryPlot);
        }
    },
    methods: {
        ...uiUtils,
        displayResults(configObject){
            let chart = document.getElementsByClassName("v-multi-chart")[0];
            chart.innerHTML = "";

            // We will start at 0 for now
            let maxVal = this.$props.rawData.reduce((prev, next) => 
                prev.max_TPM > next.max_TPM ? prev.max_TPM : next.max_TPM);
            let minVal = 0;
            let numEntries = this.$props.rawData.length;

            var margin = { top: 25, right: 10, bottom: 35, left: 29 },
                        width = configObject.width - margin.left - margin.right,
                        height = configObject.height - margin.top - margin.bottom;
            
            let svg = d3.select("v-multi-chart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            var yViolin = d3.scaleLinear().domain([minVal, maxVal]).range([height, 0]);
            svg.append("g").call(d3.axisLeft(yViolin));
            var xViolin = d3.scaleBand().range([0, width]).domain(["dataset"]).padding(0.05);
            svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xViolin));
            
            let widthPer = width / numEntries;

            for (let i = 0; i < numEntries; i++){
                //let dataset = JSON.stringify(this.$props.rawData[index]);
                let entry = this.$props.rawData[i];
                let dataset = [
                    entry["min_TPM"],
                    entry["FirstQu_TPM"],
                    entry["median_TPM"],
                    entry["ThirdQu_TPM"],
                    entry["max_TPM"]
                ];

                //let nBuckets = configObject.buckets < dataset.length ? configObject.buckets : dataset.length;
                let nBuckets = dataset.length;

                var histViolin = d3.histogram()
                    .domain(yViolin.domain())
                    .thresholds(yViolin.ticks(nBuckets))
                    .value(d => d);
                
                var sumstat = d3.nest()
                    .key(d => "dataset")
                    .rollup(d => histViolin(d))
                    .entries(dataset);
                
                var maxNum = 0;
                for (let i in sumstat){
                    let allBins = sumstat[i].value;
                    let lengths = allBins.map(a => a.length);
                    let longest = d3.max(lengths);
                    if (longest > maxNum){ maxNum = longest; }
                }

                var xNum = d3.scaleLinear().range([0, xViolin.bandwidth()]).domain([-maxNum, maxNum]);

                svg.selectAll("myViolin")
                    .data(sumstat)
                    .enter()
                    .append("g")
                    .attr("transform", d => `translate (${xViolin(d.key)}, 0)`)
                    .append("path")
                    .datum(d => d.value)
                    .style("stroke", "none")
                    .style("fill", "orange")
                    .attr("d", d3.area()
                        .x0(d => xNum(-d.length))
                        .x1(d => xNum(d.length))
                        .y(d => yViolin(d.x0))
                    .curve(d3.curveCatmullRom));
            }
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