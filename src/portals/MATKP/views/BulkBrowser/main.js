import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap.vue";
import uiUtils from "@/utils/uiUtils";
import * as d3 from 'd3';

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    store,
    components: {
        ResearchHeatmap,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            selectedDataset: 'bulkRNA_Emont2022_Humans_SAT',
            selectedKey: 'insulin sensitive vs. insulin resistant',
            limit: 20,
            utils: {
                uiUtils: uiUtils
            },
            heatmapData: null,
            margin: {
                top: 30,
                bottom: 30,
                left: 30,
                right: 30
            },
            svg: null,
        };
    },
    computed: {
        zNormData(){
            return this.$store.state.singleBulkZNormData;
        },
        heatmapDataReady(){
            return this.heatmapData;
        }
    },
    mounted() {
    },
    created() {
       this.$store.dispatch("queryBulk");
    },
    methods: {
        processLogs(data){
            // log10FDR in the data is ALREADY minuslog so no need to adjust it
            data.forEach(item => {
                item.absLogFoldChange = Math.abs(item.logFoldChange);
            })
            return data;
        },
        getTop20(data){
            let processedData = this.processLogs(data);
            processedData = processedData.sort((a,b) => b.log10FDR - a.log10FDR).slice(0,20);
            return processedData;
        },
        async drawHeatMap(){
            let width = 450 - this.margin.left - this.margin.right;
            let height = 450 - this.margin.top - this.margin.bottom;
            this.svg = d3.select("#bulk_heatmap")
                .append("svg")
                    .attr("width", width + this.margin.left + this.margin.right)
                    .attr("height", height + this.margin.top + this.margin.bottom)
                .append("g")
                    .attr("transform",  `translate(${this.margin.left},${this.margin.top})`);

            let genesRows = this.heatmapDataReady.map(d => d.gene);
            console.log(genesRows);
            let samplesColumns = await this.getSampleIds();
            console.log(samplesColumns);

            // Build X scales and axis:
            let x = d3.scaleBand()
                .range([ 0, width ])
                .domain(samplesColumns)
                .padding(0.01);
            this.svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x)) //Need to rotate axis labels!!

            // Build Y scales and axis:
            var y = d3.scaleBand()
                .range([ height, 0 ])
                .domain(genesRows)
                .padding(0.01);
            this.svg.append("g")
                .call(d3.axisLeft(y));
            
            let collatedData = this.collateData(samplesColumns);
            
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
        collateData(samples){
            let rawData = this.heatmapDataReady;
            let outputData = [];
            rawData.forEach(item => {
                for (let i = 0; i < item.expression.length; i++){
                    let expressionEntry = {
                        gene: item.gene,
                        sample: samples[i],
                        expression: item.expression[i]
                    };
                    outputData.push(expressionEntry);
                }
            })
            return outputData;
        }
    },
    watch:{
        zNormData:{
            handler(newData, oldData){
                if(newData !== oldData){
                    this.heatmapData = this.getTop20(newData);
                }
            },
            deep: true
        },
        heatmapDataReady(newData){
            console.log("Heatmap data ready!", newData);
            this.drawHeatMap();
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
