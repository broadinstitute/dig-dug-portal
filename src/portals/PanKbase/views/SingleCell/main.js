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
            tableColumns: [{ key: 'viewDataset', label: 'View' }, "datasetName", "tissue", "method", "totalCells", { key: 'download', label: 'Download' }],
            selectedDataset: null,
            scbConfig: {
                "type": "cell browser",
                "label": "Single Cell Browser",
                "parameters":{
                  "datasetId": "PKBdatasetId",
                  "gene": "PKBgene"
                },
                "bioIndex": "https://bioindex.pankbase.org",
                "bioIndexDev": "https://bioindex-dev.pankbase.org",
                "presets": {
                  "datasetId": "islet_of_Langerhans_scRNA_v1",
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
          if(this.selectedDataset) {
            keyParams.set({[this.scbConfig["parameters"].datasetId] : this.selectedDataset});
          }
        }
        const domain = window.location.hostname;
        const port = window.location.port;
        const isDev = domain === "localhost" || domain.split('.')[0].includes('dev') || port === '8000';
        const metadataEndpoint = "/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz";
        const bioIndex = isDev ? this.scbConfig.bioIndexDev : this.scbConfig.bioIndex;
        this.allMetadata = await this.fetchMetadata(bioIndex+metadataEndpoint);
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
