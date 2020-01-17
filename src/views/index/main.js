import Vue from "./node_modules/vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PhenotypeSelectPicker from "./node_modules/@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "./node_modules/@/components/DatasetSelectPicker.vue";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        DatasetSelectPicker,
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
