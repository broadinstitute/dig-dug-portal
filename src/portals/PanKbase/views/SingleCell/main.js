import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import dataConvert from "@/utils/dataConvert";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import keyParams from "@/utils/keyParams";
import EventBus from "@/utils/eventBus";

new Vue({
    components: {
        ResearchSingleCellBrowser
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            //alex, update single cell component so it doesnt require data prop
            //it should just load the 'metadata' data point from its config
            data: [
                {
                    "Name": "An Integrated Map of Cell Type–Specific Gene Expression in Pancreatic Islets",
                    "datasetId": "HPAP",
                    "Species": "Human",
                    "Tissue": "islets of langerhans",
                    "Total Cells": 192203
                }
            ],
            utils: {
                dataConvert: dataConvert
            },
            allMetadata: null,
            tableColumns: [{ key: 'viewDataset', label: 'View' }, "datasetName", "tissue", "method", "totalCells", { key: 'downloadData', label: 'Download' }],
            downloadLinks: {
              "islet_of_Langerhans_scRNA":"https://pankbase-data-v1.s3.us-west-2.amazonaws.com/analysis_resources/single_cell_objects/min.cel[…]ct_min.features5pct_rmDoublets_harmony_data.Rds",
              "islet_of_Langerhans_snATAC":"https://pankbase-data-v1.s3.us-west-2.amazonaws.com/analysis_resources/single_cell_objects/hpap_atac.h5ad",
              "HPAP":"https://islet-hpap.s3.us-west-2.amazonaws.com/hpap_islet_scRNAseq.rds",
            },
            selectedDataset: null,
            scbConfig: {
                "type": "cell browser",
                "label": "Single Cell Browser",
                "parameters":{
                  "datasetId": "PKBdatasetId",
                  "gene": "PKBgene"
                },
                "data points":[ 
                  {
                    "role": "metadata",
                    "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell_metadata/dataset_metadata.json.gz"
                  },{
                    "role": "fields",
                    "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/fields.json.gz"
                  },{
                    "role": "coordinates",
                    "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/coordinates.tsv.gz"
                  },{
                    "role": "expression",
                    "url": "https://skin.hugeampkpnbi.org/api/bio/query/single-cell-lognorm?q=$datasetId,$gene"
                  },{
                    "role": "markers",
                    "url": "https://skin.hugeampkpnbi.org/api/raw/file/single_cell/$datasetId/marker_genes.json.gz"
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
                  "datasetId": "islet_of_Langerhans_snATAC",
                  "cell type label": "Cell Type"
                }
            },
            pageId: "pankbase_cellbrowser",
            info: null,
        };
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        this.info = content;

        if(keyParams[this.scbConfig["parameters"].datasetId]){
          this.selectedDataset = keyParams[this.scbConfig["parameters"].datasetId];
        }else{
          this.selectedDataset = this.scbConfig["presets"]["datasetId"];
        }
        this.allMetadata = await this.fetchMetadata(this.scbConfig["data points"].find(x => x.role === "metadata").url);
        
    },
    render(createElement, context) {
        return createElement(Template);
    },
    methods: {
      async fetchMetadata(url) {
        console.log('getting metadata', url);
        try {
            const response = await fetch(url);
            //returns line json
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const metadata = lines.map(line => JSON.parse(line));
            return metadata;
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
      },
      selectDataset(datasetId){
        this.selectedDataset = datasetId;
        EventBus.$emit('on-select', {id: "scb", value: datasetId});
      }
    }
}).$mount("#app");
