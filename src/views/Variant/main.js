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

        transcriptConsequence() {
            let data = this.$store.state.variant.data[0]
            let transcriptConsequenceData = []

            //if consequence does not exit return nothing
            let consequence = data.hasOwnProperty("transcriptConsequence") ? data.transcriptConsequence : undefined;
            //filter on these properties to check if they exist or not
            if (!!consequence) {
                transcriptConsequenceData.push({
                    amino_acids: consequence.hasOwnProperty("amino_acids") ? consequence.amino_acids : '', transcript_id: consequence.transcript_id,
                    biotype: consequence.biotype, cadd_raw: consequence.cadd_raw, cadd_phred: consequence.cadd_phred,
                    consequence_terms: consequence.hasOwnProperty("consequence_terms") ? consequence.consequence_terms[0] : '',
                })
            }

            return transcriptConsequenceData
        },

        transcriptionFactors() {
            let data = this.$store.state.variant.data[0]
            let transcriptionFactors = data.transcriptionFactors
            return transcriptionFactors

        },

        associations() {
            if (this.$store.state.variant.data.length == 0) {
                return []
            }
            let data = this.$store.state.variant.data[0]
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap

            let associations = data.associations.map(assoc => {
                return { ...assoc, phenotype: phenotypeMap[assoc.phenotype] }
            });
            return associations

        },

        intergenicConsequence() {
            let data = this.$store.state.variant.data[0]
            let intergenicConsequence = data.intergenicConsequence
            return [intergenicConsequence]
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
            //this should dispatch this function whenever there is change in variant ID
            this.$store.dispatch('queryVariant', { q: context.state.newVariantID, limit: 20 });
        },

    },

}).$mount("#app");
