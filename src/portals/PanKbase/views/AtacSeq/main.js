import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import "../../assets/atacseq.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";
import AtacSeq from "../../components/AtacSeq.vue";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";
const HUGEAMP_GENE_BIOINDEX = "https://bioindex.hugeamp.org/api/bio/query/gene?q=";
new Vue({
    components: {
        AtacSeq,
        ResearchSingleSearch
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            geneReady: false,
            geneName: null,
            byorDocs: "pankbase_genomebrowser",
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
                            label: "View in Genome Browser",
                            url: "/atacseq.html?",
                        },
                    }
                ],
            },
        };
    },
    async created() {
        // If a gene is specified, that becomes the default region
        if (!!keyParams.gene){
            this.geneName = keyParams.gene;
        }
        this.geneReady = true;
        let docs = await getPankbaseContent(this.byorDocs, true);
        let docDiv = document.getElementById("documentation");
        docDiv.innerHTML = docs;
    },
    computed: {
        utilsBox() {
            let utils = {
                regionUtils: regionUtils,
            };
            return utils;
        },
        navbar() {
            return document.getElementsByClassName("pkb-nav");
        },
    },
    methods: {
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
