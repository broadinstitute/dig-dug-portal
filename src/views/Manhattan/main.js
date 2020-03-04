import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import DatasetSelectPicker from "@/components/DatasetSelectPicker.vue";
import ManhattanPlot from "@/components/ManhattanPlot.vue";
import MplotVariantsTable from "@/components/MplotVariantsTable.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter,
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        ManhattanPlot,
        MplotVariantsTable
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
        this.$store.dispatch(
            "kp4cd/getDatasetsInfo",
            this.$store.state.diseaseGroup.id
        );
        this.$store.dispatch(
            "kp4cd/getFrontContents",
            this.$store.state.diseaseGroup.id
        );
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        initiallySelected() {
            this.$store.state.selectedPhenotype = phenotypesList[0].phenotype;
            this.$store.state.phenotypeName = phenotypesList[0].name;
        },
        phenotypes() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        }
    }
}).$mount("#app");
