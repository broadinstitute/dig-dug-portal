import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        //need components for variant page
    },

    created() {
        this.$store.dispatch('queryVariant');
        // get the disease group and set of phenotypes available
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

        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },

        transcriptConsequence() {
            let transcriptConsequenceData = {
                amino_acids,
                biotype,
                cadd_phred,
                cadd_raw,
                cadd_raw,
                consequence_terms: []
            }
            let data = this.$store.state.variant.data
            data.forEach(v => {
                transcriptConsequenceData.amino_acids.push(v.transcriptConsequence.amino_acids);

            })


            //this is incomplete since you might have to transform the data - create a map for desired tabular format
            return transcriptConsequenceData
        }

    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        variant(variantID) {
            //this should dispatch this function whenever there is change in variant ID
            this.$store.dispatch('queryVariant', { q: variantID, limit: 2000 });
        },
    },

}).$mount("#app");
