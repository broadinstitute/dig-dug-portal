import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/phewas.css";
import "../../assets/filtering.css";
import "../../assets/atacseq.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import AtacSeq from "../../components/AtacSeq.vue";
import keyParams from "@/utils/keyParams";
const HUGEAMP_GENE_BIOINDEX = "https://bioindex.hugeamp.org/api/bio/query/gene?q=";
new Vue({
    store,
    components: {
        AtacSeq
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            geneData: null,
            byorDocs: "pankbase_genomebrowser",
        };
    },
    async created() {
        // If a gene is specified, that becomes the default region
        if (!!keyParams.gene){
            await this.getGeneRegion(keyParams.gene);
        }
        let docs = await getPankbaseContent(this.byorDocs, true);
        let docDiv = document.getElementById("documentation");
        docDiv.innerHTML = docs;
    },
    computed: {
        navbar() {
            return document.getElementsByClassName("pkb-nav");
        },
        formattedRegion(){
            if (this.geneData === null){
                return "";
            }
            //"chr11:2150341-2238950";
            return `chr${this.geneData.chromosome}:${this.geneData.start}-${this.geneData.end}`;
        }
    },
    methods: {
        async getGeneRegion(geneSymbol){
            let fetchUrl = `${HUGEAMP_GENE_BIOINDEX}${geneSymbol}`;
			let gene = await fetch(fetchUrl).then(resp => resp.json());
            this.geneData = gene.data;
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
