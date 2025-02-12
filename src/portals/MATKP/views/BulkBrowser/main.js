import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import uiUtils from "@/utils/uiUtils";
import * as d3 from 'd3';

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    store,
    components: {
        Scatterplot,
        BulkVolcanoPlot,
        BulkTable,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            loading: true,
            samplesColumns: [],
            heatmapColor: "#ffd10c",
            selectedDataset: 'bulkRNA_Emont2022_Humans_SAT',
            selectedKey: 'insulin sensitive vs. insulin resistant',
            limit: 20,
            utils: {
                uiUtils: uiUtils
            },
            heatmapData: null,
            margin: {
                top: 30,
                bottom: 90,
                left: 90,
                right: 30,
                bump: 10,
            },
            svg: null,
            volcanoConfig: {
                "type":"volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "gene",
                "x axis field": "logFoldChange",
                "x axis label": "log2 Fold Change",
                "y axis field": "log10FDR",
                "y axis label": "-log10(FDR adjusted for p)",
                "width": 600,
                "height": 450,
                "x condition": {"combination":"or","greater than":1,"lower than":-1}, //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": {"combination":"greater than","greater than":1},
                "dot label score": 2 //number of conditions that the value of each dot to meet to have labeled
            },
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "logFoldChange",
                        label: "log2 Fold Change",
                        sortable: true,
                    },
                    {
                        key: "log10FDR",
                        label: "-log10(FDR adj. p)",
                        sortable: true,
                    },
                    { key: "expand", label: "Gene query" },
                ],
                queryParam: "gene",
                subtableEndpoint: "single-cell-bulk-melted",
                subtableFields: [
                    { key: "gene_set", label: "Gene set", sortable: true },
                    { key: "beta", label: "Effect (joint)", sortable: true },
                ],
            },
            scatterplotConfig: {
                xField: "cont__bmi",
                xAxisLabel: "BMI",
                yField: "lognorm_counts",
                yAxisLabel: "lognorm counts",
                dotKey: "sample_id",
                hoverBoxPosition: "both",
                plotHeight: 300,
                hoverFields: [],
            },
                
                
        };
    },
    computed: {
        zNormData(){
            return this.$store.state.singleBulkZNormData;
        },
        heatmapDataReady(){
            return this.heatmapData;
        },
        collateData(){
            let rawData = this.heatmapDataReady;
            let outputData = [];
            let minExp = rawData[0].expression[0];
            let maxExp = rawData[0].expression[0];
            rawData.forEach(item => {
                for (let i = 0; i < item.expression.length; i++){
                    let currentExp = item.expression[i];
                    if (currentExp < minExp){
                        minExp = currentExp;
                    }
                    if (currentExp > maxExp){
                        maxExp = currentExp;
                    }
                    let expressionEntry = {
                        gene: item.gene,
                        sample: this.samplesColumns[i],
                        expression: item.expression[i]
                    };
                    outputData.push(expressionEntry);
                }
            });
            return outputData;
        }
    },
    mounted() {
    },
    created() {
       this.$store.dispatch("queryBulk");
    },
    methods: {
        getTop20(data){
            let processedData = data.sort((a,b) => b.log10FDR - a.log10FDR).slice(0,20);
            return processedData;
        },
        async drawHeatMap(){
            this.samplesColumns = await this.getSampleIds();
            let width = 750 - this.margin.left - this.margin.right;
            let height = 450 - this.margin.top - this.margin.bottom;
            this.svg = d3.select("#bulk_heatmap")
                .append("svg")
                    .attr("width", width + this.margin.left + this.margin.right)
                    .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g")
                    .attr("transform",  `translate(${this.margin.left},${this.margin.top})`);

            let genesRows = this.heatmapDataReady.map(d => d.gene);
            
            // Build X scales and axis:
            let x = d3.scaleBand()
                .range([ 0, width ])
                .domain(this.samplesColumns)
                .padding(0.01);
            this.svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x)) //Need to rotate axis labels!!
                .selectAll("text")
                        .style("text-anchor", "end")
                        .attr('font-size', '12px')
                        .attr("transform", "rotate(-35) translate(-5, 0)");

            // Build Y scales and axis:
            var y = d3.scaleBand()
                .range([ height, 0 ])
                .domain(genesRows)
                .padding(0.01);
            this.svg.append("g")
                .call(d3.axisLeft(y));
            
            // Build color scale
            var colorScale = d3.scaleLinear()
                .range(["white", this.heatmapColor])
                .domain([-2,7]); //MAKE RESPONSIVE TO OTHER DATASETS
            
            // Building the heatmap
            this.svg.selectAll()
                .data(this.collateData, function(d) {return d.sample+':'+d.expression;})
                .enter()
                .append("rect")
                    .attr("x", function(d) { return x(d.sample) })
                    .attr("y", function(d) { return y(d.gene) })
                    .attr("width", x.bandwidth() )
                    .attr("height", y.bandwidth() )
                    .style("fill", function(d) { return colorScale(d.expression)} )
            this.loading = false;
        },
        async getSampleIds(){
            let queryUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/${
                this.selectedDataset}/fields.json.gz`;
            try {
                const response = await fetch(queryUrl);
                const data = await(response.json());

                return data.sample_id;
            }
            catch(error) {
                console.error("Error: ", error);
                return [];
            }
        },
        
    },
    watch:{
        zNormData:{
            handler(newData, oldData){
                console.log(JSON.stringify(newData[0]));
                if(newData !== oldData){
                    this.heatmapData = this.getTop20(newData);
                }
            },
            deep: true
        },
        heatmapDataReady(newData){
            this.drawHeatMap();
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
