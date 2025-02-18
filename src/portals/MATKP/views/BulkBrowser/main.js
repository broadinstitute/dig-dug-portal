import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import BulkViolinPlot from "../../components/BulkViolinPlot.vue";
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
        BulkViolinPlot,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            loading: true,
            plotId: "bulk_heatmap",
            samplesColumns: [],
            datasets: [],
            comparisons: [],
            heatmapColor: "#ffd10c",
            endpoint: "single-cell-bulk-z-norm",
            utils: {
                uiUtils: uiUtils
            },
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
                "y axis field": "-log10P",
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
        };
    },
    computed: {
        selectedDataset(){
            return this.$store.state.selectedDataset;
        },
        selectedComparison(){
            return this.$store.state.selectedComparison;
        },
        zNormData(){
            return this.$store.state.singleBulkZNormData;
        },
        bulkData19K(){
            return this.$store.state.bulkData19K.filter(item => item.gene !== undefined);
        },
        collateData(){
            let rawData = this.zNormData;
            let outputData = [];
            let minExp = rawData[0]?.expression[0] || null;
            let maxExp = rawData[0]?.expression[0] || null;
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
        this.$store.dispatch("queryBulkFile");
        this.$store.dispatch("queryBulk");
        this.getParams();
    },
    methods: {
        getTop20(data){
            let processedData = data.sort((a,b) => b.log10FDR - a.log10FDR).slice(0,20);
            return processedData;
        },
        async drawHeatMap(){
            let plotId = `#${this.plotId}`;
            // Clear existing
            d3.select(plotId)
                .selectAll("svg")
                .remove();
            d3.select(plotId)
                .selectAll("g")
                .remove();
            this.samplesColumns = await this.getSampleIds();
            let width = 750 - this.margin.left - this.margin.right;
            let height = 450 - this.margin.top - this.margin.bottom;
            this.svg = d3.select(plotId)
                .append("svg")
                    .attr("width", width + this.margin.left + this.margin.right)
                    .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g")
                    .attr("transform",  `translate(${this.margin.left},${this.margin.top})`);

            let genesRows = this.zNormData.map(d => d.gene);
            
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
            if (this.selectedDataset === ""){
                return [];
            }
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
        async getParams () {
            let url = `${BIO_INDEX_HOST}/api/bio/keys/${this.endpoint}/2`;
            try {
                const response = await fetch(url);
                const data = await(response.json());
                let allKeys = data.keys;
                this.datasets = allKeys.map(item => item[0]);
                this.comparisons = allKeys.map(item => item[1])
            } catch (error){
                console.error("Error: ", error);
            }
        },
        
    },
    watch:{
        zNormData:{
            handler(newData, oldData){
                if(newData !== oldData){
                    this.drawHeatMap();
                }
            },
            deep: true
        },
        selectedDataset(newData, oldData){
            if (newData !== oldData){
                this.$store.dispatch("queryBulkFile");
                this.$store.dispatch("queryBulk");
            }
        },
        selectedComparison(newData, oldData){
            if (newData !== oldData){
                this.$store.dispatch("queryBulk");
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
