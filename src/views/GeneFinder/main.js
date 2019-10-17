import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";

new Vue({
    store,

    components: {
        PhenotypeSelect,
        DatasetSelect,
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        phenotypeMap() {
            return this.$store.getters['metadataModule/phenotypes'];
        },
        datasetList() {
            let phenotype = this.$store.state.selectedPhenotype;
            let datasets = this.$store.getters['metadataModule/datasetList'](phenotype);

            return datasets;
        },
    },
}).$mount("#app");
