import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
//import EventBus from "@/utils/eventBus";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    components: {
        ResearchSingleCellBrowser
    },
    mixins: [matkpMixin],

    data() {
        return {
            data: [],
            utils: {
                dataConvert: dataConvert
            },
            scbConfig: {
                "type": "cell browser",
                "label": "Single Cell Browser",
                "parameters":{
                    "datasetId": "dataset",
                    "gene": "gene"
                },
                "data points":[ 
                    {
                        "role": "metadata",
                        "url": "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell_metadata/dataset_metadata.json.gz"
                    },{
                        "role": "fields",
                        "url": "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell/$datasetId/fields.json.gz"
                    },{
                        "role": "coordinates",
                        "url": "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz"
                    },{
                        "role": "expression",
                        "url": "https://bioindex-dev.hugeamp.org/api/bio/query/single-cell-lognorm?q=$datasetId,$gene"
                    },{
                        "role": "markers",
                        "url": "https://bioindex-dev.hugeamp.org/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
                    }
                ],
                "components": {
                    "cell info": {
                        "enabled": true
                    },
                    "cell proportion": {
                        "enabled": true
                    },
                    "gene expression": {
                        "enabled": true
                    },
                    "marker genes": {
                        "enabled": true
                    }
                },
                "presets": {
                    "layout": 0,
                    "datasetId": "SingleCell_Emont2022_Humans_SCP1376_SN_SAT",
                    "cell type label": "cell_type__matkp",
                    "genes": ["PPARG", "ADIPOQ"]
                }
            }
        };
    },

    mounted() {
    },

    created() {
        if(keyParams[this.scbConfig["parameters"].datasetId]){
            this.selectedDataset = keyParams[this.scbConfig["parameters"].datasetId];
        }else{
            this.selectedDataset = this.scbConfig["presets"]["datasetId"];
        }
    },

    watch: {
    },

    computed: {
    },

    methods: {
        
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
