import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import Scatterplot from "../../../../components/Scatterplot.vue";
import BulkHeatmap from "../../components/BulkHeatmap.vue";
import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import BulkTable from "../../components/BulkTable.vue";
import BulkViolinPlot from "../../components/BulkViolinPlot.vue";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import ResearchSingleCellInfo from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellInfo.vue";
import * as scUtils from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js"
import * as d3 from 'd3';
import keyParams from "@/utils/keyParams";
import { isNull } from "lodash";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    store,
    components: {
        Scatterplot,
        BulkHeatmap,
        BulkVolcanoPlot,
        BulkTable,
        BulkViolinPlot,
        ResearchSingleCellBrowser,
        ResearchSingleCellInfo,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            loading: true,
            dataReady: false,
            allMetadata: null,
            bulkMetadata: null,
            plotId: "bulk_heatmap",
            plotHeight: 300,
            chart: null,
            chartWidth: 0,
            datasets: [],
            endpoint: "single-cell-bulk-z-norm",
            utils: {
                uiUtils: uiUtils
            },
            margin: {
                top: 20,
                bottom: 100,
                left: 100,
                right: 0,
                bump: 0,
                middleSpacing: 0,
                legendSpacing: 35
            },
            svg: null,
            tableConfig: {
                fields: [
                    { key: "gene", label: "Gene", sortable: true },
                    {
                        key: "logFoldChange",
                        label: "log2 Fold Change",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
                    },
                    {
                        key: "-log10P",
                        label: "-log10(FDR adj. p)",
                        sortable: true,
                        formatter: Formatters.tpmFormatter,
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
            return this.$store.state.bulkData19K.filter(
                item => item.gene !== undefined
                && item.comparison_id === this.$store.state.selectedComparison);
        },
        volcanoConfig(){
            let config = {
                "type":"volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "gene",
                "x axis field": "logFoldChange",
                "x axis label": "log2 Fold Change",
                "y axis field": "-log10P",
                "y axis label": "-log10(FDR adj. p)",
                "width": 600,
                "height": this.plotHeight,
                "x condition": {"combination":"or","greater than":1,"lower than":-1}, 
                    //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": {"combination":"greater than","greater than":1},
                "dot label score": 2 
                    //number of conditions that the value of each dot to meet to have labeled
            };
            return config;
        },
        comparisons(){
            let items = Object.keys(this.$store.state.currentComparisons);
            return items;
        },
        kpDataset(){
            return keyParams.dataset;
        },
        kpComparison(){
            return keyParams.comparison;
        },
        kpGene(){
            return keyParams.gene;
        }
    },
    async mounted() {
        this.init();
    },
    created() {
    },
    methods: {
        async init(){
            if (!keyParams.dataset){
                keyParams.set({dataset: this.$store.state.selectedDataset});
            }
            if (!keyParams.gene){
                keyParams.set({gene: this.$store.state.selectedGene});
            }
            this.getParams();
            await this.getBulkMetadata();
            if (!keyParams.comparison){
                this.$store.dispatch("resetComparison");
                keyParams.set({comparison: this.$store.state.selectedComparison});
            }
            await this.$store.dispatch("queryBulkFile");
            await this.$store.dispatch("queryBulk");
            this.dataReady = true;

        },
        async getBulkMetadata(){
          if (!this.allMetadata){
            let metadataUrl = "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz";
            let myMetadata = await scUtils.fetchMetadata(metadataUrl);
            this.allMetadata = myMetadata;
          }
        
         this.bulkMetadata = this.allMetadata.find(x => x.datasetId === this.selectedDataset);
      },
        getTop20(data){
            let processedData = data.sort((a,b) => b.log10FDR - a.log10FDR).slice(0,20);
            return processedData;
        },
        async getParams () {
            let url = `${BIO_INDEX_HOST}/api/bio/keys/${this.endpoint}/2`;
            try {
                const response = await fetch(url);
                const data = await(response.json());
                let allKeys = data.keys;
                this.datasets = Array.from(new Set(allKeys.map(item => item[0])));
            } catch (error){
                console.error("Error: ", error);
            }
        },
        
    },
    watch:{
        async selectedDataset(newData, oldData){
            if (newData !== oldData){
                keyParams.set({dataset: newData});
                await this.$store.dispatch("queryBulkFile");
                await this.$store.dispatch("queryBulk");
                if (newData !== ""){
                    this.getBulkMetadata();
                }
            }
        },
        selectedComparison(newData, oldData){
            if (newData !== oldData){
                keyParams.set({comparison: newData});
                this.$store.dispatch("queryBulk");
            }
        },
        comparisons(newData){
            if(!newData.includes(this.selectedComparison)){
                this.$store.dispatch("resetComparison");
            }
        },
        kpDataset(newData, oldData){
            if (newData !== oldData){
                this.$store.state.selectedDataset = newData;
            }
        },
        kpComparison(newData, oldData){
            if (newData !== oldData){
                this.$store.state.selectedComparison = newData;
            }
        },
        kpGene(newData, oldData){
            if(newData !== oldData){
                this.$store.state.selectedGene = newData;
            }
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
