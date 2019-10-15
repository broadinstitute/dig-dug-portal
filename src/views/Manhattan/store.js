import Vue from "vue";
import Vuex from "vuex";
import phenotypeModule from "@/modules/phenotypeModule";
import datasetModule from "@/modules/datasetModule";
import getVariantDataModule from "@/modules/getVariantDataModule";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    phenotypeModule,
    datasetModule,
    manhattan: getVariantDataModule,
    table: getVariantDataModule
  },
  state: {},
  mutations: {
    setSelectedPhenotype(state, phenotype) {
      state.selectedPhenotype = phenotype;
    },
    setSelectedDataset(state, dataset) {
      state.selectedDataset = dataset;
    }
  },
  actions: {
    onPhenotypeChange(context, selectedPhenotype) {
      context.commit("table/clearData");
      context.commit("manhattan/clearData");
      context.commit("setSelectedPhenotype", selectedPhenotype);
      context.dispatch("datasetModule/getDatasets", selectedPhenotype);
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
