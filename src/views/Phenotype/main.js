import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import VariantFinder from "@/components/VariantFinder.vue";
import EnrichmentTable from "@/components/EnrichmentTable.vue";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        VariantFinder,
        EnrichmentTable
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
            let data = [];
            let phenotypes = this.$store.state.phenotypes;

            for (let i in phenotypes) {
                let phenotype = phenotypes[i];
                let name = phenotype.name;
                let moduleName = `__assocs__${name}`;
                let moduleData = this.$store.state[moduleName].data;

                data = data.concat(moduleData);
            }

            return data;
        },

        annotations() {
            let data = [];
            let phenotypes = this.$store.state.phenotypes;

            // get all the data from all phenotypes
            for (let i in phenotypes) {
                let phenotype = phenotypes[i];
                let name = phenotype.name;
                let moduleName = `__enrichment__${name}`;
                let moduleData = this.$store.state[moduleName].data;

                data = data.concat(moduleData);
            }

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
            keyParams.set({ phenotype: phenotypes.map(p => p.name).join(',') });

            // create modules for each phenotype
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

            // cause the associations to be updated
            this.$store.commit('updateFilters');
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },

}).$mount("#app");
