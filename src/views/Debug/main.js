import Vue from "vue";
import CompositionApi from "@vue/composition-api"
import { useBioPortal, useKp4cd, usePageSetup } from "@/utils/setups";
import { useActions } from "vuex-composition-helpers/dist";  // without importing from dist this doesn't work

import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import LocusZoom from "@/components/LocusZoom";
import VariantsTable from "@/components/VariantsTable";

Vue.config.productionTip = false;

Vue.use(CompositionApi);
new Vue({
    store,

    setup(props, context) {

        const { queryRegion } = useActions(context.root.$store, ['queryRegion']);
        queryRegion();

        return {
            ...usePageSetup(context),
        }

    },

    components: {
        PhenotypeSelectPicker,
        VariantsTable,
        LocusZoom,
        PageHeader,
        PageFooter,
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {

        selectedPhenotype() {
            return this.$store.state.phenotype;
        },

        genes() {
            return this.$store.state.genes.data.filter(function (gene) {
                return gene.type == 'protein_coding'
            });
        },

        associations() {
            return this.$store.state.associations.data.sort((a, b) => a.pValue - b.pValue);
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        // TODO: bioportal?
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                let assoc = data[i];

                // skip associations not part of the disease group
                if (!this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                let curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },

    },

    // TODO: COMPOSITION API AND WATCHING?
    watch: {
        phenotypes(phenotypes) {
            let param = this.$store.state.phenotypeParam;

            // if there's a phenotypeParam, then pick that phenotype
            if (param) {
                let phenotype = this.$store.state.bioPortal.phenotypeMap[param];

                if (phenotype) {
                    this.$store.dispatch('getAssociations', phenotype);
                }
            }

        },

        async selectedPhenotype(phenotype) {
            await this.$store.dispatch('getAssociations', phenotype);
            this.$children[0].$refs.lz.plot();
        },

        // TODO: bioportal
        topAssociations(top) {
            if (!this.selectedPhenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[topAssoc.phenotype];

                this.$store.dispatch('getAssociations', topPhenotype);
            }
        },

    }
}).$mount("#app");
