import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
// import getVariantDataModule from "@/modules/getVariantDataModule";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
    },
    state: {
        selectedPhenotype: null,
        selectedDataset: null,
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
        },
        onDatasetChange(context, selectedDataset) {
            context.commit("setSelectedDataset", selectedDataset);
        },
    }
});
