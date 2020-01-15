import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PhenotypeSelectpicker from "@/components/PhenotypeSelectpicker.vue";
import DatasetSelectpicker from "@/components/DatasetSelectpicker.vue";

new Vue({
    store,

    components: {
        PhenotypeSelectpicker,
        DatasetSelectpicker,
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
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
            let datasets = this.$store.getters['metadataModule/datasetList'](selectedPhenotype);
            return datasets;
        },
    },

    methods: {
        get_pvalue(obj) {
            return obj[this.$store.state.selectedDataset][this.$store.state.selectedPhenotype.phenotype_id];
        }
    },
}).$mount("#app");
