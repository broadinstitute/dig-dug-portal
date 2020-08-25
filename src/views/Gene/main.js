import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import UniprotReferencesTable from "@/components/UniprotReferencesTable.vue";
import FiftyTwoKTable from "@/components/FiftyTwoKTable";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import Autocomplete from "@/components/Autocomplete.vue";
import Formatters from "@/utils/formatters";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: {},
    components: {
        PageHeader,
        PageFooter,
        Alert,
        UniprotReferencesTable,
        FiftyTwoKTable,
        Documentation,
        Autocomplete
    },

    data() {
        return {
            counter: 0,
            externalResources: {
                ensembl:
                    "https://useast.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=",
                hgnc:
                    "https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/",
                mgd: "http://www.informatics.jax.org/marker/",
                rgd: "https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=",
                ucsc: "http://genome.ucsc.edu/cgi-bin/hgGene?db=hg19&hgg_gene="
            }
        };
    },

    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("queryAssociations");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,

        // go to region page
        exploreRegion(expanded = 0) {
            let r = this.region;

            if (!!r) {
                window.location.href = `./region.html?chr=${
                    r.chromosome
                }&start=${r.start - expanded}&end=${r.end + expanded}`;
            }
        }
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

        region() {
            return this.$store.getters.region;
        },

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
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        // the region for the gene was found
        region(region) {
            this.hideElement("variangeneSearchHolder");
            this.$store.dispatch("queryGeneRegion", region);
        },

        // the canonical symbol was found
        symbolName(symbol) {
            this.$store.dispatch("queryUniprot", symbol);
        }
    }
}).$mount("#app");
