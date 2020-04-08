import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import TranscriptConsequenceTable from "@/components/TranscriptConsequenceTable.vue";

import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        TranscriptConsequenceTable,
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
            console.log("I am here")
            // console.log(this.$store.state.variant)
            let data = this.$store.state.variant.data
            let transcriptConsequenceData = []
            for (let i in data) {
                let consequence = data[i].transcriptConsequence
                transcriptConsequenceData.push({
                    amino_acids: consequence.amino_acids, transcript_id: consequence.transcript_id,
                    biotype: consequence.biotype, cadd_raw: consequence.cadd_raw, cadd_phred: consequence.cadd_phred,
                    consequence_terms: consequence.consequence_terms[i]
                })
            }
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
