import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";
import { getTextContent } from "@/portals/MATKP/utils/content";
import ResearchSingleCellBrowser from "@/components/researchPortal/singleCellBrowser/ResearchSingleCellBrowser.vue"
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

new Vue({
    components: {
        ResearchSingleCellBrowser
    },
    mixins: [matkpMixin],

    data() {
        return {
            data: [],
            title: null,
            info: null,
            utils: {
                dataConvert: dataConvert
            },
            scbConfig: null,
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
        this.scbConfig = JSON.parse(content.field_data_table_format);
        
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
