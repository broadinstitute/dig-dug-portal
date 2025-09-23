import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import { cyphers, renderCypher, renderCypherCurl, runCypherQuery } from "../../utils/paragraph.js";
import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

new Vue({
    store,
    components: {
        ResearchSingleSearch,
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            jsonResults: null,
            searchConfig: {
            "search instruction": "Search for a gene",
            "search examples": [
                {
                    parameter: "gene",
                    value: "CFTR",
                }
            ],
            "search parameters": [
                {
                    parameter: "gene",
                    values: "kp genes",
                    "target page": {
                        label: "Search Gene",
                        url: "/cypher.html?",
                    },
                }
            ],
        },
        };
    },
    watch: {},
    async created() {
        this.jsonResults = await this.runAllQueries();
    },
    computed: {
        geneName(){
            return this.$store.state.geneName;
        },
        queryKeys(){
            return Object.keys(cyphers);
        },
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
                regionUtils: regionUtils,
            };
            return utils;
        },
    },
    methods: {
        tissueFormatter: Formatters.tissueFormatter,
        async runAllQueries(){
            let allResults = {};
            for (let i = 0; i < this.queryKeys.length; i++){
                let singleQuery = this.queryKeys[i];
                let results = await runCypherQuery(cyphers[singleQuery], {gene: this.geneName});
                allResults[singleQuery] = results.results;
            }
            return allResults;
        }
        
        
        
        
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
