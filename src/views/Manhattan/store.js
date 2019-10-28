import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import getVariantDataModule from "@/modules/getVariantDataModule";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        manhattan: getVariantDataModule,
        table: getVariantDataModule
    },
    state: {
        selectedPhenotype: null,
        selectedDataset: null
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
        },
        setSelectedDataset(state, dataset) {
            state.selectedDataset = dataset;
        },
        setPhenotypes(state, phenotypes){
            state.phenotypes = phenotypes;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("table/clearData");
            context.commit("manhattan/clearData");
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
        onDatasetChange(context, selectedDataset) {
            context.commit("setSelectedDataset", selectedDataset);
            context.commit("table/clearData");
            context.commit("manhattan/clearData");
            context.dispatch("performGetData");
        },
        performGetData(context) {
            let dataset = context.state.selectedDataset;
            let phenotype = context.state.selectedPhenotype;
            context.dispatch("table/getData", { dataset, phenotype });
            context.dispatch("manhattan/getData", { dataset, phenotype });
        }
    }
});
