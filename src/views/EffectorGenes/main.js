import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import egInfo from "@/utils/effectorGenes.js";

import $ from "jquery";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";

new Vue({
    store,

    components: {
        PageHeader,
        PageFooter
    },
    data: {
        listPheno: egInfo.phenotypes,
        listChrom: egInfo.chromosomes,
        listCol: egInfo.dataColumns,
        selectedPhenotype: null
    },
    render(createElement, context) {
        return createElement(Template);
    },
    created() {
        this.$store.dispatch("effectorGenes/getGeneData", "t2d");
        this.selectedPhenotype = "t2d";
        this.$store.commit("setSelectedPhenotype", "t2d");
    },
    computed: {
        geneData() {
            return this.$store.state.effectorGenes.geneData;
        }
    },
    methods: {
        toggleCol(column) {
            return !column.checked;
        }
    },
    watch: {
        selectedPhenotype(value) {
            this.$store.dispatch("onPhenotypeChange", value);
        }
    }
}).$mount("#app");
