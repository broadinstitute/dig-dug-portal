import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import MplotVariantsTable from "@/components/MplotVariantsTable.vue";

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        ManhattanPlot,
        PageHeader,
        PageFooter,
        ManhattanPlot,
        MplotVariantsTable
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
            return this.$store.getters["graphPhenotype/phenotypes"];
        },
        datasetList() {
            let selectedPhenotype = this.$store.state.selectedPhenotype;
            if (!selectedPhenotype) {
                return [];
            } else {
                let datasets = this.$store.getters['metadataModule/datasetList'](selectedPhenotype);
                return datasets;
            }
        }
    }

}).$mount("#app");
