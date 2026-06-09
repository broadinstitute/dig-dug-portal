import Vue from "vue";
import Template from "./Template.vue";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getTextContent } from "@/portals/CFDELiver/utils/content";
import LigerBrowser from "@/components/researchPortal/LIGER/LigerBrowser.vue";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

new Vue({
    components: {
        LigerBrowser
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
                documentationUrl: "/research.html?pageid=kp_liger_documentation",
                tissues: ["liver"],
                hideTissueCardIfOneOption: true,
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