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
import TranscriptionFactorsTable from "@/components/TranscriptionFactorsTable.vue";
import IntergenicConsequenceTable from "@/components/IntergenicConsequenceTable";
import regulatoryConsequenceTable from "@/components/RegulatoryConsequenceTable";
import { associationsFromVariant, translate, associationsForLZ } from "@/utils/dataMappingUtils";
import LocusZoom from "@/components/LocusZoom";

import keyParams from "@/utils/keyParams";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        TranscriptConsequenceTable,
        TranscriptionFactorsTable,
        IntergenicConsequenceTable,
        regulatoryConsequenceTable,
        LocusZoom,
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

        variantData() {
            let data = this.$store.state.variant.data
            if (data.length > 0) {
                return data[0]
            }
            return {}
        },

        transcriptConsequence() {
            //if consequence does not exit return nothing
            if (!!this.variantData.transcriptConsequence) {
                return [this.variantData.transcriptConsequence]
            }
        },

        transcriptionFactors() {
            if (!!this.variantData.transcriptionFactors) {
                return this.variantData.transcriptionFactors
            }
        },

        intergenicConsequence() {
            if (!!this.variantData.intergenicConsequence) {
                return [this.variantData.intergenicConsequence]
            }
        },

        regulatoryConsequence() {
            if (!!this.variantData.regulatoryConsequence) {
                return [this.variantData.regulatoryConsequence]
            }
        },
    },
    methods: {
        translatedAssociationsFromVariant: translate({ from: associationsFromVariant, to: associationsForLZ }),
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },

        variant() {
            this.$store.dispatch('queryVariant', { q: context.state.newVariantID });
        },

    },

}).$mount("#app");
