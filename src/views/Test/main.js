import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Formatters from "@/utils/formatters";
import bchtest from "@/components/BCHtest.vue";
import BCHVariantSearch from "@/components/BCHVariantSearch.vue";


Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        //bchtest,
        BCHVariantSearch
    },

    data() {
        return {
            counter: 0
        };
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    
    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        
        genes() {
            return this.$store.genes.data;   
        },

        region() {
            return this.$store.getters.region;
        },
        selectedGene() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "gene";
                })
                .map(v => v.threshold);
        },
        selectedDataset() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "dataset";
                })
                .map(v => v.threshold);
        }
        /*,

        symbolName() {
            return this.$store.getters.canonicalSymbol;
        },

        aliasNames() {
            return this.$store.state.genes.data.filter(
                g => g.source === "alias"
            );
        },

        alternateNames() {
            return this.$store.state.genes.data
                .filter(g => g.source !== "symbol")
                .sort((a, b) => {
                    if (a.source < b.source) return -1;
                    if (a.source > b.source) return 1;
                    return 0;
                });
        },

        dbReference() {
            return this.$store.getters["uniprot/dbReference"];
        },

        accession() {
            return this.$store.getters["uniprot/accession"];
        },

        geneFunction() {
            return this.$store.getters["uniprot/geneFunction"];
        },

        geneNames() {
            return this.$store.getters["uniprot/geneNames"];
        },

        gene() {
            let data = this.$store.state.gene.data;
            if (data.length > 0) {
                return data[0];
            }
            return {};
        },

        regionText() {
            let r = this.region;

            if (!!r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start
                )}-${Formatters.intFormatter(r.end)}`;
            } else {
                return "";
            }
        },

        regionTextExpanded() {
            let r = this.region;

            if (!!r) {
                return `${r.chromosome}:${Formatters.intFormatter(
                    r.start - 50000
                )}-${Formatters.intFormatter(r.end + 50000)}`;
            } else {
                return "";
            }
        },

        associationPhenotypes() {
            return this.$store.state.associations.data.map(a => a.phenotype);
        },

        documentationMap() {
            let symbol = this.symbolName;
            let r = this.region;

            if (!!symbol && !!r) {
                return {
                    gene: symbol,
                    region: `${r.chromosome}:${Formatters.intFormatter(
                        r.start
                    )}-${Formatters.intFormatter(r.end)}`
                };
            
            }
        },

        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        }*/
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        region(region) {
            console.log("watch region"+region);
            //this.hideElement("variangeneSearchHolder");
            this.$store.dispatch("queryGeneRegion", region);
        }
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        }
    }
}).$mount("#app");
