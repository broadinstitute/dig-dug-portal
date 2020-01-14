import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelect from "@/components/PhenotypeSelect.vue";
import DatasetSelect from "@/components/DatasetSelect.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelect,
        DatasetSelect,
        ManhattanPlot
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
            let datasets = this.$store.getters["metadataModule/datasetList"](
                selectedPhenotype
            );
            return datasets;
        }
    },

    methods: {
        get_pvalue(obj) {
            return obj[this.$store.state.selectedDataset][
                this.$store.state.selectedPhenotype.phenotype_id
            ];
        }
    }
}).$mount("#app");
