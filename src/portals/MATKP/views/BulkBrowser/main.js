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
            heatmapConfig: {
                type: "heat map",
                label: "Top 20 DEGs across all samples (z-score normalized)",
                main: {
                    field: "expression",
                    label: "Expression",
                    type: "scale",
                    direction: "positive",
                    low: -1.936,
                    middle: 0,
                    high: 5.501,
                },
                sub: {
                    field: "logFoldChange",
                    label: "log Fold Change",
                    type: "steps",
                    direction: "negative",
                    valueRange: [0, 4],
                    "value range": [0.811, 3.649],
                },
                "column field": "sample_id",
                "column label": "Sample",
                "row field": "gene",
                "row label": "Gene",
                "font size": 12,
            },
        };
    },
    computed: {
        zNormData(){
            return this.$store.state.singleBulkZNormData;
        },
    },
    mounted() {
    },
    created() {
       this.$store.dispatch("queryBulk");
    },
    methods: {
        processLogs(data){
            data.forEach(item => {
                item.absLogFoldChange = Math.abs(item.logFoldChange);
            })
            return data;
        }
    },
    watch:{
        zNormData(newData){
            console.log("Z Norm Data received", JSON.stringify(newData));
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
