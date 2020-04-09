import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import MplotVariantsTable from "@/components/MplotVariantsTable.vue";
import TissueEnrichment from "@/components/TissueEnrichment.vue";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        ManhattanPlot,
        MplotVariantsTable,
        TissueEnrichment
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
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
            return this.$store.getters['bioPortal/diseaseGroup'];
        },

        associations() {
            let assocs = {};
            let filters = this.$store.getters.phenotypeFilters;

            for (let i in this.$store.state.phenotypes) {
                let phenotype = this.$store.state.phenotypes[i];
                let name = phenotype.name;
                let moduleName = `__assocs__${name}`;
                let filter = filters[name];

                assocs[name] = this.$store.state[moduleName].data.filter(filter);
            };

            return assocs;
        },

        colors() {
            let colors = {};
            let phenotypes = this.$store.state.phenotypes;

            for (let i in phenotypes) {
                colors[phenotypes[i].name] = colorIndex[i];
            }

            return colors;
        },

        topVariants() {
            let assocs = this.associations;
            let variants = [];

            for (let phenotype in assocs) {
                variants = variants.concat(assocs[phenotype]);
            }

            // sort all the variants by pValue
            variants.sort((a, b) => a.pValue - b.pValue);

            // return the top 20
            return variants.slice(0, 10);
        },

        tissues() {
            let data = [];
            let tuples = {};

            // get all the data from all phenotypes
            for (let i in this.$store.state.phenotypes) {
                let phenotype = this.$store.state.phenotypes[i];
                let name = phenotype.name;
                let moduleName = `__enrichment__${name}`;
                let moduleData = this.$store.state[moduleName].data;

                for (let k in moduleData) {
                    let r = moduleData[k];
                    let tuple = `${r.tissue}_${r.method}`; //_${r.annotation}`;
                    let dataIndex = tuples[tuple];

                    if (!dataIndex) {
                        tuples[tuple] = data.length;
                        dataIndex = data.length;

                        data.push({
                            tissue: r.tissue,
                            method: r.method,
                            annotation: r.annotation,
                            minP: 1.0,
                        });
                    }

                    // add the columns for each phenotype
                    data[dataIndex][`${name}_expectedSNPs`] = r.expectedSNPs;
                    data[dataIndex][`${name}_SNPs`] = r.SNPs;
                    data[dataIndex][`${name}_pValue`] = r.pValue;

                    // lowest p-value across all phenotypes
                    if (!!r.pValue) {
                        data[dataIndex].minP = Math.min(data[dataIndex].minP, r.pValue);
                    }
                }
            }

            // sort all the records by phenotype p-value
            data.sort((a, b) => a.minP - b.minP);

            return data;
        },

        phenotypeToAdd() {
            return this.$store.state.newPhenotype;
        }
    },

    watch: {
        '$store.state.bioPortal.phenotypeMap': function (phenotypeMap) {
            let phenotypeNames = (keyParams.phenotype || '').split(',');

            // add all the keyParam phenotype modules
            for (let i in phenotypeNames) {
                let name = phenotypeNames[i];
                let phenotype = phenotypeMap[name];

                if (!!phenotype) {
                    this.$store.commit('setNewPhenotype', phenotype);
                }
            };
        },

        // register modules for new phenotypes
        '$store.state.phenotypes': function (phenotypes) {
            for (let i in phenotypes) {
                let phenotype = phenotypes[i];
                let name = phenotype.name;
                let assocModule = `__assocs__${name}`;
                let enrichmentModule = `__enrichment__${name}`;

                // register a new associations module for this phenotype
                if (!this.$store.state[assocModule]) {
                    this.$store.registerModule(assocModule, bioIndex('phenotype-associations'));
                    this.$store.dispatch(`${assocModule}/query`, { q: name, limit: 2500 });
                }

                // register a new enrichment module for this phenotype
                if (!this.$store.state[enrichmentModule]) {
                    this.$store.registerModule(enrichmentModule, bioIndex('global-enrichment'));
                    this.$store.dispatch(`${enrichmentModule}/query`, { q: name });
                }
            }

            // update browser
            keyParams.set({ phenotype: phenotypes.map(p => p.name).join(',') });
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

}).$mount("#app");

// hard-coded array of colors to match colors.css
let colorIndex = [
    "#048845",
    "#9ACA3C",
    "#6FC7B6",
    "#8490C8",
    "#9F78AC",
    "#BF61A5",
    "#F88084",
    "#EE3124",
    "#fAA553",
    "#FCD700",
    "#F5A4C7",
    "#CEE6C1",
    "#FFF9B8",
    "#D4D4D4",
    "#5555FF",
    "#FACACC",
    "#D5A768",
    "#FFFF00",
];
