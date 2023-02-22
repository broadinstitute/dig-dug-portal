<template>
<div class="chart-wrapper">
    <div id="multi-chart">
        <h4 v-if="selectableGenes.length > 0">Make a selection to view the violin plot.</h4>
        <h4 v-else>Pending!</h4>
    </div>
    <select v-if="selectableGenes.length > 0" id="select-gene"
        v-model="selectedGene">
        <option value="">Select gene</option>
        <option v-for="gene in selectableGenes" :value="gene">{{ gene }}</option>
    </select>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import colors from "@/utils/colors";
export default Vue.component("research-multi-plot", {
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

        if (this.$props.summaryPlot.type != "multi"){
            console.error("Configuration error; multi plot not specified.");
        }
        if (!!this.$props.summaryPlot["selectable genes"]){
            this.selectableGenes = this.$props.summaryPlot["selectable genes"];
        }
        this.displayResults();
        addEventListener("resize", (event) => {
                    this.chartWidth = this.chart.clientWidth;
                    this.displayResults();
                });
        
    },
	computed: {},
	watch: {
        rawData: function(){
            this.displayResults();
        },
        selectedGene(){
            this.displayResults();
        }
    },
    methods: {
        ...uiUtils,
        displayResults(){
            if (this.selectedGene != ""){
                this.displayResultsForGene(this.selectedGene);
            } else if (this.selectableGenes.length == 0){
                this.displayResultsNoSelectable()
            }
        },
        displayResultsForGene(selectedGene){
            if(selectedGene == ""){
                console.error("Missing gene selection.");
                return;
            }
            let configObject = this.$props.summaryPlot;
            let rawData = this.$props.rawData;

            // Trimming extra headers which are included for display but not part of data.
            if(!!configObject["extra header rows"]){
                let numExtraHeaders = configObject["extra header rows"];
                if (numExtraHeaders > 0){
                    rawData = rawData.slice(numExtraHeaders);
                }
            }
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
        displayResultsNoSelectable(){
            let configObject = this.$props.summaryPlot;
            let rawData = this.$props.rawData;

            // Trimming extra headers which are included for display but not part of data.
            if(!!configObject["extra header rows"]){
                let numExtraHeaders = configObject["extra header rows"];
                if (numExtraHeaders > 0){
                    rawData = rawData.slice(numExtraHeaders);
                }
            }
            let keyAttribute = configObject["render by"];
            let valueAttribute = "expression";
            if (configObject["orientation"] == "vertical" ){
                rawData = this.collateVertical(rawData, keyAttribute, valueAttribute);
            }
            
            
            let statFields = !!configObject["stat fields"] 
                ? configObject["stat fields"] : null;

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

            let sumstat;
            let histogram;
            // Use hardcoded fields summarizing statistics, if provided.
            let numberViolins = 0;
            if (statFields != null){
                sumstat = d3.nest()
                .key(function(d){return d[keyAttribute];})
                .rollup(function(d){
                    let q1 = d.map(g => g[statFields.q1]);
                    let median = d.map(g => g[statFields.median]);
                    let q3 = d.map(g => g[statFields.q3]);
                    let interQuantileRange = q3-q1;
                    let min = d.map(g => g[statFields.min]);
                    let max = d.map(g => g[statFields.max]);
                    let mean = d.map(g => g[statFields.mean]);
                    numberViolins++;
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
            } else {
                let histogram = d3.histogram()
                    .domain(y.domain())
                    .thresholds(y.ticks(configObject["buckets"]))
                    .value(d => d);
                sumstat = d3.nest()
                    .key(d => d[keyAttribute])
                    .rollup(function(d) {
                        let input = d.map(g => g[valueAttribute]);
                        let bins = histogram(input);
                        return(bins);
                    }).entries(rawData);
            }

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
            
            var boxWidth = (width / numberViolins) * 0.75;
            svg.selectAll("boxes")
                .data(sumstat)
                .enter()
                .append("rect")
                    .attr("x", d => x(d.key) - boxWidth/2)
                    .attr("y", d => {
                        return y(d.value.q3);
                    })
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
        },
        collateVertical(inputData, keyAttribute, outputAttribute="expression"){
            // Aggregates gene expression data by target ID.
            let outputEntryLabels = Object.keys(inputData[0]).filter(name => name != keyAttribute);
            let outputArray = [];
            outputEntryLabels.forEach(label => {
                inputData.forEach(entry => {
                    let outputEntry = {};
                    outputEntry[keyAttribute] = label;
                    outputEntry[outputAttribute] = entry[label];
                    outputArray.push(outputEntry);
                })
            });
            return outputArray;
        },
        getBottomMargin(data, labelField){
            let longestLabel = data.map(item => item[labelField].length).reduce(
                (prev, next) => prev > next ? prev : next);
            let margin = longestLabel < 10 ? 65 : 65 * longestLabel / 10;
            return margin;
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
#select-gene{
    width: 200px;
}
</style>