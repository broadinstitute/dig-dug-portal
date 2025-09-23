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
            queryText: null,
        };
    },
    watch: {
    },
    async created() {
        keyParams.set({ gene: this.geneName });
        this.queryText = this.populateQueryText();
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
                let entry = results.results;
                if (singleQuery === 'variant_details'){
                    // Flatten
                    entry = entry.map(e => {return {
                        variant_id: e.variant_id,
                        tissue: e.tissue,
                        ...e.eqtl_stats}});
                } else if (singleQuery === 'gene_overview'){
                    entry = entry.map(e => { return {
                        name: e.gene.name,
                        labels: e.gene.labels.join("; "),
                        ...e.gene.properties
                    }});
                }
                allResults[singleQuery] = entry;
            }
            return allResults;
        },
        populateQueryText(){
            let queries = {};
            for (let i = 0; i < this.queryKeys.length; i++){
                let singleQuery = this.queryKeys[i];
                let param = {gene: this.geneName}
                queries[singleQuery] = {
                    cypherQuery: renderCypher(cyphers[singleQuery], param),
                    show: "none"
                }
            }
            return queries;
        },
        toggleQuery(queryKey){
            this.queryText[queryKey].show = "cypherQuery";
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
