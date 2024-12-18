import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getResource } from "@/portals/PanKbase/utils/api";
import dataConvert from "@/utils/dataConvert";
import ResearchSingleCellBrowser from "@/components/researchPortal/ResearchSingleCellBrowser.vue"

new Vue({
    components: {
        ResearchSingleCellBrowser
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            //update single cell component so it doesnt require data prop
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
                  "datasetId": "HPAP",
                  "cell type label": "Cell Type",
                  "genes": ["INS", "GCG", "SST", "PPY", "PRSS1", "CFTR", "PLVAP", "PDGFRB", "PTPRC"]
                }
            }
        };
    },
    computed: {
        singleCellInfo(){
            return this.about;
        }
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        this.about = content;
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
