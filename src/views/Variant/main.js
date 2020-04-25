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
import PheWASTable from "@/components/PheWASTable.vue";
import { calcLog } from "@/utils/lz/lzUtils";
import LocusZoom from "@/components/LocusZoom";
import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        PageHeader,
        PageFooter,
        TranscriptConsequenceTable,
        TranscriptionFactorsTable,
        PheWASTable,
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

        lzAssociations() {
            let phenotypes = this.$store.state.bioPortal.phenotypeMap;

            if (!!this.variantData) {
                let associations = this.variantData.associations;
                let chromosome = this.variantData.chromosome;
                let position = this.variantData.position;
                let varId = this.variantData.varId;

                if (!associations) {
                    return [];
                }

                let assocs = associations.map(a => {
                    return {
                        ...a,
                        varId,
                        chromosome,
                        position,
                        phenotype: phenotypes[a.phenotype]
                    };
                });

                // filter associations w/ no phenotype data (not in portal!)
                return assocs.filter(a => !!a.phenotype);
            }
        },

        consequence() {
            if (!!this.variantData) {
                return Formatters.consequenceFormatter(this.variantData.consequence);
            }
        },

        consequenceMeaning() {
            if (!!this.variantData) {
                return Formatters.consequenceMeaning(this.variantData.consequence);
            }
        }
    },
    methods: {
        ...uiUtils,

        lzAssociationsTransform(associations) {
            let assocs = associations.map(a => {
                return {
                    id:  Math.random(),
                    chr: a.chromosome,
                    start: a.position,
                    end: a.position,
                    position: a.position,
                    pvalue: a.pValue,
                    log_pvalue: calcLog(a.pValue),
                    variant: a.varId,
                    ref_allele: a.varId,
                    trait_group: a.phenotype.group,
                    trait_label: a.phenotype.description,
                };
            });

            return assocs;
        },
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
