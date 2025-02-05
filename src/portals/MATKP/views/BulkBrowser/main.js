import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import ResearchHeatmap from "@/components/researchPortal/ResearchHeatmap.vue";
import uiUtils from "@/utils/uiUtils";
import * as d3 from 'd3';

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    components: {
        ResearchHeatmap,
        uiUtils
    },
    mixins: [matkpMixin],
    props: [],
    data() {
        return {
            bulkKeysBI: "https://bioindex-dev.hugeamp.org/api/bio/keys/single-cell-bulk-z-norm/2",
            bulkFieldsBI: "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_bulk/$datasetId/fields.json.gz",
                        //"https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_bulk/bulkRNA_Emont2022_Humans_SAT/fields.json.gz"
            bulkQueryBI: "https://bioindex-dev.hugeamp.org/api/bio/query/single-cell-bulk-z-norm",
                       //"https://bioindex-dev.hugeamp.org/api/bio/query/single-cell-bulk-z-norm?q=bulkRNA_Emont2022_Humans_SAT,insulin%20sensitive%20vs.%20insulin%20resistant&limit=20"
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
    computed: {},
    mounted() {
    },
    created() {
       this.init();
    },
    methods: {
        async init(){
            const bulkNames = await this.doFetch(this.bulkFieldsBI, this.selectedDataset);
            console.log({bulkNames});
            const queryURL = this.bulkQueryBI+`?q=${this.selectedDataset},${this.selectedKey}&limit=${this.limit}`
            const bulkData = await this.doFetch(queryURL);
            console.log({bulkData});
            const bulkHeatmapData = [];
            bulkData.data.forEach(item => {
                item.expression.forEach((expr, idx) => {
                    bulkHeatmapData.push({
                        gene: item.gene,
                        sample_id: bulkNames.sample_id[idx],
                        expression: expr,
                        logFoldChange: item.logFoldChange
                    })
                })
            })
            const [minExpr, maxExpr] = d3.extent(bulkHeatmapData, d => d.expression);
            const [minFC, maxFC] = d3.extent(bulkHeatmapData, d => d.logFoldChange);
            console.log({bulkHeatmapData, minExpr, maxExpr, minFC, maxFC});
            this.heatmapData = bulkHeatmapData;
        },
        async doFetch(url, datasetId) {
            const replacedUrl = url.replace('$datasetId', datasetId);
            console.log('fetching', replacedUrl);
            try {
                const response = await fetch(replacedUrl);
                const text = await response.text();
                let markers;
                try{
                    markers = JSON.parse(text);
                }catch{
                    const lines = text.split('\n').filter(line => line.trim() !== '');
                    markers = lines.map(line => JSON.parse(line));
                }
                return markers;
            } catch (error) {
                console.error('Error fetching markers:', error);
                return null;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
