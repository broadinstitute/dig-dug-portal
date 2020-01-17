import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";


new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        ManhattanPlot,
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
        this.$store.commit("table/setLimit", 25);
        this.$store.commit("manhattan/setLimit", 500);
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        phenotypes() {
            return this.$store.getters['graphPhenotype/phenotypes'];
        },
        datasetList() {
            let selectedPhenotype = this.$store.state.selectedPhenotype;
            if (!selectedPhenotype) {
                return [];
            } else {
                let datasets = this.$store.getters['metadataModule/datasetList'](selectedPhenotype);
                return datasets;
            }
        },
    },

    methods: {
        get_pvalue(obj) {
            return obj[this.$store.state.selectedDataset][this.$store.state.selectedPhenotype.phenotype_id];
        }
    },
}).$mount("#app");
