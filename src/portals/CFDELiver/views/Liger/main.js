import Vue from "vue";
import Template from "./Template.vue";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getTextContent } from "@/portals/CFDELiver/utils/content";
import CellEvolutionBrowser from "@/components/researchPortal/LIGER/v2/CellEvolutionBrowser.vue";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

new Vue({
    components: {
        CellEvolutionBrowser
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
            ligerConfig: {
                pageTitle: "Liver Cell State & Program Explorer",
                documentationUrl: "https://knowledge-portal-network.gitbook.io/knowledge-portal-network-docs/5lsQ2czOVhDBVTAi0MCc",
                tissues: ["liver"],
                singleCellBrowserUrl: "/single-cell-map.html",
                exampleGenes: ["GCKR", "EPCAM", "HFE"]
            },
        };
    },

    mounted() {
    },

    async created() {
        return;
        const pageId = 'cfde_liver_liger';
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