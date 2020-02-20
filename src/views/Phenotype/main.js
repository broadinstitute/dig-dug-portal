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

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        DatasetSelectPicker,
        PageHeader,
        PageFooter,
    },

    created() {
        this.$store.dispatch("metadataModule/getMetadata");
        this.$store.dispatch("graphPhenotype/list");
        this.$store.dispatch("kp4cd/getDatasetsInfo", this.$store.state.diseaseGroup.id);
    },

    render(createElement, context) {
        return createElement(Template);
    },
    mounted() {
        console.log("mounted");
    },
    computed: {
        phenotypes() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        },
        selectedPhenotype() {
            console.log("computed");
            return this.$store.state.selectedPhenotype;
        },
        datasetList() {
            return this.$store.state.datasetList;
        }
    },
    watch: {
        selectedPhenotype(phenotype) {
            console.log("watch phenotype");
            let datasets = this.$store.getters['metadataModule/datasetList'](phenotype);
            this.$store.state.datasetList == datasets;
            console.log(datasets);
            console.log(this.$store.state.datasetList);
        },
        datasetList(datasets) {
            console.log("watch dataset");
            console.log(datasets);
        }
    }
}).$mount("#app");
