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
        this.$store.dispatch("kp4cd/getDatasetsInfo", this.$store.state.diseaseGroup);
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
        },
        datasetList() {
            let selectedPhenotype = this.$store.state.selectedPhenotype;
            let datasets = null

            //console.log(selectedPhenotype);
            if (selectedPhenotype != null) {
                console.log("called with phenotype");
                datasets = this.$store.getters['metadataModule/datasetList'](selectedPhenotype);
                console.log("datasets");

                console.log(datasets);

                return datasets;

            } else {

                console.log("called without phenotype");
                datasets = [];

                console.log("datasets");

                console.log(datasets);

                return datasets;

            }


        }
    }

}).$mount("#app");
