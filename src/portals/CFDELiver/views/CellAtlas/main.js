import Vue from "vue";
import Template from "./Template.vue";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getTextContent } from "@/portals/CFDELiver/utils/content";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

new Vue({
    components: {
        ResearchSingleCellBrowser
    },
    mixins: [contentMixin],

    data() {
        return {
            data: [],
            title: null,
            info: null,
            utils: {
                dataConvert: dataConvert
            },
            scbConfig: {
                "type": "cell browser",
                "label": "Single Cell Browser",
                "bioIndex": "https://bioindex-dev.hugeamp.org",
                "parameters":{
                    "datasetId": "dataset",
                    "gene": "gene"
                },
                "presets": {
                    "datasetId": "FNIH_Liver_scRNA_v3"
                },
                "format":{
                    "default":{
                        "groups":{
                            "cellType": ["cell_type__kp"]
                        }
                    }
                }
            },
        };
    },

    mounted() {
    },

    async created() {
        const pageId = 'matkp_singlecellbrowser';
        const content = await getTextContent(pageId, false, true);
        console.log('content', content);
        this.title = content.title;
        this.info = content.body;
        //this.scbConfig = JSON.parse(content.field_data_table_format);
        
        if (keyParams[this.scbConfig["parameters"].datasetId]) {
            this.selectedDataset = keyParams[this.scbConfig["parameters"].datasetId];
        } else {
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