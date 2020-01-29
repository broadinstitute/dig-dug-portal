import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelect,
        DatasetSelect
    },

    created() {
        this.$store.dispatch("graphPhenotype/list");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        phenotypeMap() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        },
        datasetList() {
            let phenotype = this.$store.state.selectedPhenotype;
            let datasets = this.$store.getters["metadataModule/datasetList"](
                phenotype
            );
            return datasets;
        }
    }
}).$mount("#app");
