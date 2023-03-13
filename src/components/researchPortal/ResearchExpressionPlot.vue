<template>
<div class="chart-wrapper">
    <label>
        Scale:
        <select class="form-control form-control-sm" v-model="logScale">
            <option value="no">Linear</option>
            <option value="yes">Logarithmic: log10(TPM+1)</option>
        </select>
    </label>
    <div id="multi-chart">
        <p>Loading...</p>
    </div>
    <b-table id="big-table" v-if="this.tableData.length > 0"
        hover
        small
        responsive="sm"
        :items="tableData"
        :fields="tableConfig['top rows']"
        :per-page="perPage"
        :current-page="currentPage"
    >
        <template #cell(show_datasets)="row">
            <b-button class="btn view-features-btn btn-secondary mr-2"
            size="sm" @click="row.toggleDetails">
                {{ row.detailsShowing ? "Hide": "Show" }} Datasets
            </b-button>
        </template>
        <template #row-details="row">
            <b-table class="dataset-subtable"
                hover
                small
                responsive="sm"
                :items="row.item['Datasets']"
                :fields="tableConfig['Datasets']">
            </b-table>
        </template>
    </b-table>
    <b-pagination
        class="pagination-sm justify-content-center"
        v-model="currentPage"
        :total-rows="rows"
        :per-page="perPage"
    ></b-pagination>
</div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";
import uiUtils from "@/utils/uiUtils";
import colors from "@/utils/colors";
export default Vue.component("research-expression-plot", {
    props: ["rawData", "filter"],
    data(){
        return {
            chart: null,
            chartWidth: null,
            logScale: "no",
            processedData: null,
            flatLinear: null,
            flatLog: null,
            keyAttribute: "tissue",
            colorMap: {},
            currentPage: 1,
            perPage: 10,
            collatedData: [],
            tableConfig: {
                "top rows": [
                    {key: "Tissue", sortable: true},
                    {key: "Min TPM", sortable: true},
                    {key: "Q1 TPM", sortable: true},
                    {key: "Median TPM", sortable: true},
                    {key: "Q3 TPM", sortable: true},
                    {key: "Max TPM", sortable: true},
                    {key: "Total samples", sortable: true},
                    {key: "show_datasets", sortable: false}
                ],
                "features": [
                    "Datasets"
                ],
                "Datasets": [
                    "Biosample",
                    "Dataset",
                    "Min TPM",
                    "Q1 TPM",
                    "Median TPM",
                    "Q3 TPM",
                    "Max TPM"
                ]
            },
        };
    },
    mounted() {
        this.chart = document.getElementById("multi-chart");
        this.chartWidth = this.chart.clientWidth;       
        addEventListener("resize", (event) => {
                    this.chartWidth = this.chart.clientWidth;
                    this.displayResults();
                });
        this.processData();
        this.displayResults();
        this.logScale = "yes";
        this.displayResults();
    },
	computed: {
        tableData(){
            let dataRows = this.collatedData;
            if (!!this.filter) {
                dataRows = dataRows.filter((dataset) => {
                    return this.filter(dataset);
                });
            }
            return dataRows;
        },
        rows(){
            return this.tableData.length;
        }
    },
	watch: {
        rawData(){
            this.processData();
            this.displayResults();
        },
        logScale(){
            this.displayResults();
        },
    },
    methods: {
        ...uiUtils,
        processData(){
            this.collatedData = [];
            let processedData = this.$props.rawData;
            processedData.forEach(entry => { 
                let tpms = entry.tpmForAllSamples.split(",")
                    .map(i => parseFloat(i));
                entry["tpmForAllSamples"] = tpms;
                entry[this.keyAttribute] = entry[this.keyAttribute].replaceAll("_", " ");
                entry["Biosample"] = entry.biosample;
                entry["Dataset"] = entry.dataset;
                entry["Min TPM"] = parseFloat(entry.minTpm);
                entry["Q1 TPM"] = parseFloat(entry.firstQuTpm);
                entry["Median TPM"] = parseFloat(entry.medianTpm);
                entry["Q3 TPM"] = parseFloat(entry.thirdQuTpm);
                entry["Max TPM"] = parseFloat(entry.maxTpm);
            });
            let flatLinear = [];
            let flatLog = [];
            for (let item of processedData){
                for (let tpmVal of item.tpmForAllSamples){
                    let flatLinearEntry = {};
                    flatLinearEntry[this.keyAttribute] = item[this.keyAttribute];
                    flatLinearEntry["tpm"] = tpmVal;
                    flatLinear.push(flatLinearEntry);

                    let flatLogEntry = {};
                    flatLogEntry[this.keyAttribute] = item[this.keyAttribute];
                    flatLogEntry["tpm"] = Math.log10(tpmVal + 1);
                    flatLog.push(flatLogEntry);
                }
            }
            this.processedData = processedData;
            this.flatLinear = flatLinear;
            this.flatLog = flatLog;
            this.mapColors();
        },
        displayResults(){
            let keyAttribute = this.keyAttribute;
            let colorMap = this.colorMap;

            let flatData = this.logScale == "yes" ? this.flatLog : this.flatLinear;
            let margin = { 
                top: 10, 
                right: 30, 
                bottom: this.getBottomMargin(flatData, keyAttribute),
                left: 40 
            },
                width = this.chartWidth - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;
            this.chart.innerHTML = "";
            let svg = d3.select("#multi-chart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            let x = d3.scaleBand()
                .range([0, width])
                .domain(flatData.map(entry => entry[keyAttribute]))
                .padding(0.05);
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "start")
                .style("font-size", "13px")
                .attr("transform", "rotate(45)");

            let maxVal = flatData.map(g => g.tpm).reduce(
                    (prev, next) => prev > next ? prev : next, 0
                );
            let y = d3.scaleLinear()
                .domain([0,maxVal])
                .range([height,0]);
            svg.append("g").call(d3.axisLeft(y));

            let histogram = d3.histogram()
                    .domain(y.domain())
                    .thresholds(y.ticks(100))
                    .value(d => d);
            let sumstat = d3.nest()
                    .key(d => d[keyAttribute])
                    .rollup(d => {
                        let input = d.map(g => g.tpm);
                        let bins = histogram(input);
                        return(bins);
                    }).entries(flatData);

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
            let xNum = d3.scaleLinear()
                .range([0, x.bandwidth()])
                .domain([-maxNum, maxNum]);
            
            let colorIndex = 0;
            let mouseover = (d) => {
                let boxHalfWidth = 6;
                svg.selectAll("indPoints")
                    .data(flatData.filter(entry => entry[keyAttribute] == d.key))
                    .enter()
                    .append("circle")
                        .attr("cx", g => {
                            let noise = Math.random();
                            let dx = offset - (2*boxHalfWidth) + (noise * boxHalfWidth * 4)
                            return x(d.key) + dx;
                        })
                        .attr("cy", g => y(g.tpm))
                        .attr("r", 2)
                        .style("fill", `${colorMap[d.key]}33`)
                        .attr("stroke", `${colorMap[d.key]}`);
            };
            let mouseleave = (d) => {
                svg.selectAll("circle").remove();
            }
            svg.selectAll("myViolin")
                .data(sumstat)
                .enter()
                .append("g")
                    .attr("transform", d => `translate(${x(d.key)},0)`)
                .append("path")
                    .datum(d => d.value)
                    .style("stroke", "none")
                    .style("fill", d => {
                        // I don't like reinventing the wheel, but I cannot
                        // figure out how to access the key attribute as text
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
                        .curve(d3.curveCatmullRom));
            let numberViolins = 0;
            let sumstatBox = d3.nest()
                    .key(d => d[keyAttribute])
                    .rollup(d => {
                        numberViolins++;
                        let sortedData = d.map(g => g.tpm).sort(d3.ascending);
                        let q1 = d3.quantile(sortedData, .25);
                        let median = d3.quantile(sortedData, .5);
                        let q3 = d3.quantile(sortedData, .75);
                        let interQuantileRange = q3 - q1;
                        let min = sortedData[0];
                        let max = sortedData[sortedData.length - 1];
                        let boxplotEntry = {
                            "Q1 TPM": q1,
                            "Median TPM": median,
                            "Q3 TPM": q3,
                            "interQuantileRange": interQuantileRange,
                            "Min TPM": min,
                            "Max TPM": max,
                            "Total samples": sortedData.length
                        };
                        return boxplotEntry;
                    }).entries(flatData);
            let offset = width / (2 * numberViolins);
            // Boxplots top quartile
            svg.selectAll("vertLines")
                    .data(sumstatBox)
                    .enter()
                    .append("line")
                        .attr("x1", x(0))
                        .attr("x2", x(0))
                        .attr("y1", d => y(d.value["Q3 TPM"]))
                        .attr("y2", d => y(d.value["Max TPM"]))
                        .attr("stroke", "black")
                        .style("opacity", 0.5)
                        .style("width", 30)
                        .attr("transform", d => `translate(${x(d.key) + offset},0)`);
            // Boxplots bottom quartile
            svg.selectAll("vertLines")
                    .data(sumstatBox)
                    .enter()
                    .append("line")
                        .attr("x1", x(0))
                        .attr("x2", x(0))
                        .attr("y1", d => y(d.value["Min TPM"]))
                        .attr("y2", d => y(d.value["Q1 TPM"]))
                        .attr("stroke", "black")
                        .style("opacity", 0.5)
                        .style("width", 30)
                        .attr("transform", d => `translate(${x(d.key) + offset},0)`);
            let boxHalfWidth = 3;
            svg.selectAll("boxes")
                    .data(sumstatBox)
                    .enter()
                    .append("rect")
                        .attr("x", d => x(d.key) + offset - boxHalfWidth)
                        .attr("y", d => y(d.value["Q3 TPM"]))
                        .attr("height", d=> y(d.value["Q1 TPM"]) - y(d.value["Q3 TPM"]))
                        .attr("width", boxHalfWidth * 2)
                        .attr("stroke", "black")
                        .style("fill", "white")
                        .style("opacity", 0.5);
            
            // Packaging data for export at the same time.
            let collateData = this.collatedData.length == 0;
            svg.selectAll("zoneBoxes")
                    .data(sumstatBox)
                    .enter()
                    .append("rect")
                    .attr("x", d => {
                            if (collateData){
                                // Deep copy
                                let tableEntry = JSON.parse(JSON.stringify(d.value));
                                tableEntry["Tissue"] = d.key;
                                tableEntry["Datasets"] = this.processedData.filter(
                                    item => item[keyAttribute] == d.key
                                );
                                this.collatedData.push(tableEntry);
                            }
                            return x(d.key);
                        })
                    .attr("y", d => y(maxVal))
                    .attr("height", d=> y(-maxVal) - y(0))
                    .attr("width", offset * 2)
                    .attr("stroke", "none")
                    .style("fill", "white")
                    .style("opacity", 0)
                    .on("mouseover", mouseover)
                    .on("mouseleave", mouseleave);
            svg.selectAll("medianLines")
                    .data(sumstatBox)
                    .enter()
                    .append("line")
                        .attr("x1", d => x(d.key) + offset - boxHalfWidth)
                        .attr("x2", d => x(d.key) + offset + boxHalfWidth)
                        .attr("y1", d => y(d.value["Median TPM"]))
                        .attr("y2", d => y(d.value["Median TPM"]))
                        .attr("stroke", "#99999999")
                        .style("width", 50);

        },
        mapColors(){
            let colorMap = {};
            let colorIndex = 0;
            this.processedData.forEach(entry => {
                if (!colorMap[entry[this.keyAttribute]]){
                    colorMap[entry[this.keyAttribute]] = colors[colorIndex];
                    colorIndex++;
                    if (colorIndex >= colors.length){
                            colorIndex = 0;
                    }
                }
            });
            this.colorMap = colorMap;
        },
        getBottomMargin(data, labelField){
            let longestLabel = data.map(item => item[labelField].length).reduce(
                (prev, next) => prev > next ? prev : next);
            let margin = longestLabel < 10 ? 65 : 65 * longestLabel / 10;
            return margin;
        },
    }
});
</script>
<style>
div{
    display: block;
}
.chart-wrapper{
    display: block;
}
.chart-wrapper > label {
    font-size: smaller;
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
.dataset-subtable{
    font-size: smaller;
}
#big-table > thead > tr >th {
    color: #007bff;;
}
</style>