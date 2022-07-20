<template>
<div>
<!--form>
    <label>Phenotype<input v-model="phenotype"/></label>
    <label>Gene or region<input v-model="region"/></label>
    <label>Chart type:
        <select v-model="chartType">
            <option>histogram</option>
            <option>line</option>
            <option>scatterplot</option>
        </select>
    </label>
    
    <div class="attributes">
        Attributes to include:
        <label>Beta<input type="checkbox" v-model="includeBeta"/></label>
        <label>P-value<input type="checkbox" v-model="includePvalue"/></label>
        <label>Standard error<input type="checkbox" v-model="includeStdErr"/></label>
        <label>Z-score<input type="checkbox" v-model="includeZscore"/></label>
    </div>
    <label>Convert P-value to -log10 <input type="checkbox" v-model="convertPval"/></label>
    <div>
        <label>Number of buckets for data processing:<input type="number" v-model="numberOfBuckets"/></label>
    </div>
    
</form-->
<div>{{ summaryPlot }}</div>
<button class="assoc-button" @click="displayResults()">Get associations</button>
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
        return {
            loading: false,
            phenotype: "t2d",
            region: "slc30a8",
            includeBeta: true,
            includePvalue: true,
            includeStdErr: true,
            includeZscore: true,
            numberOfBuckets: 100,
            convertPval: true,
            chartType: "histogram",
            jsonData: {}
        };
    },
    mounted: function () {},
	computed: {},
	watch: {},
    methods: {
        ...uiUtils,
        displayResults(){
            if (this.loading){
                return;
            }
            this.loading = true;
            let config = this.queryConfig();
            let allCharts = document.getElementsByClassName("all-charts")[0];
            allCharts.innerHTML = "";
            config.columns.forEach(column => {
                let newChart = document.createElement("div");
                newChart.classList.add("chart");
                newChart.classList.add(`${column}-chart`);
                allCharts.append(newChart);
            });
            this.getAssociationsAndShow(this.phenotype, this.region, config);
        },
        toggleLoading(){
            if (this.loading){
                this.loading = false;
            } else {
                this.loading = true;
            }
        },
        queryConfig(){
            let attributes = [];
            attributes = attributes.concat(this.includeBeta ? ["beta"] : []);
            attributes = attributes.concat(this.includePvalue ? ["pValue"] : []);
            attributes = attributes.concat(this.includeStdErr ? ["stdErr"] : []);
            attributes = attributes.concat(this.includeZscore ? ["zScore"] : []);
            
            let config = {
                "type": this.chartType,
                "columns": attributes,
                "dataConvert": this.convertPval ? {"pValue": "minusLog10"} : {},
                "buckets": this.numberOfBuckets
            };
            return config;
        },
        async getAssociationsAndShow(phenotype, region, configObject){
            let assocServer = "https://bioindex.hugeamp.org/api/bio"; // will this ever change?
            let query = `${phenotype},${region}`;
            let queryURL = `${assocServer}/query/associations?q=${query}`

            // Only fetch it if we don't already have it.
            if (!this.jsonData[query]){
                let assocJSON = await fetch(queryURL).then((response) => response.json());
                this.jsonData[query] = assocJSON.data;
            }

            configObject.columns.forEach(column => {this.renderCharts(query, column, configObject)});
            this.loading = false;
        },
        
        renderCharts(query, attribute, configObject){
            let dataset = this.jsonData[query].map(item => Number(item[attribute]));
            let attributeLabel = attribute;

            if (configObject.dataConvert[attribute] == "minusLog10"){
                dataset = dataset.map(data => -1 * Math.log10(data));
                attributeLabel = `${attribute} (-log10)`;
            }
            let maxVal = dataset.reduce((prev, next) => prev > next ? prev : next);
            let minVal = dataset.reduce((prev, next) => prev < next ? prev : next);

            //TODO remove DOM stuff in favor of jquery? or just remove jquery
            let chartWrapper = `.${attribute}-chart`;

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
                            .thresholds(xScale.ticks(configObject.buckets));
            
            var bins = histogram(dataset);

            let yScaleTopEnd = d3.max(bins, function(d){return d.length;});
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
                .attr("y", yScale(yScaleTopEnd * -0.13)).attr("x", 0.5)
                .text(attributeLabel);
            
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
            } else {
                let interval = (maxVal - minVal) / configObject.buckets;
                
                let bucketsData = [];
                for (let i = minVal; i < maxVal; i = i + interval){
                    let bucketCount = dataset.filter(entry => entry >= i && entry < i + interval).length;
                    bucketsData.push({"bucketStart": i, "bucketCount": bucketCount});
                }
                
                // Max vals get added to the top bucket
                let maxCount = bucketsData.filter(entry => entry == maxVal).length;
                bucketsData[bucketsData.length - 1].bucketCount += maxCount;

                if (configObject.type == "line"){
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
            let randEntry = this.jsonData[query][randIndex];
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

.attributes label{
    display: inline;
    margin: 10px;
}

.radio label{
    display: inline;
    font-size: smaller;
}
</style>