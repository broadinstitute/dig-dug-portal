import Vue from "vue";
import Vuex from "vuex";

import phenotypeModule from "@/modules/phenotypeModule";
import datasetModule from "@/modules/datasetModule";
// import getVariantDataModule from "@/modules/getVariantDataModule";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        phenotypeModule,
        datasetModule,
    },
    state: {
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
        },
        setSelectedDataset(state, dataset) {
            state.selectedDataset = dataset;
        },
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("setSelectedPhenotype", selectedPhenotype);
            context.dispatch("datasetModule/getDatasets", selectedPhenotype);
        },
        onDatasetChange(context, selectedDataset) {
            context.commit("setSelectedDataset", selectedDataset);
        },
    }
});
