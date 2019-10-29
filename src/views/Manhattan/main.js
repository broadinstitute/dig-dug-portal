import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.config.productionTip = false;

import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";


new Vue({
    store,

    components: {
        PhenotypeSelect,
        DatasetSelect,
        ManhattanPlot,
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("metadataModule/getPhenotypes");
        this.$store.commit("table/setLimit", 25);
        this.$store.commit("manhattan/setLimit", 500);
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        phenotypes() {
            return this.$store.getters['metadataModule/phenotypes'];
        },
        datasetList() {
            let phenotype = this.$store.state.selectedPhenotype;
            let datasets = this.$store.getters['metadataModule/datasetList'](phenotype);
            return datasets;
        },
    },

    methods: {
        get_pvalue(obj) {
            return obj[this.$store.state.selectedDataset][this.$store.state.selectedPhenotype.phenotype_id];
        }
    },
}).$mount("#app");
