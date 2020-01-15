import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import getVariantDataModule from "@/modules/getVariantDataModule";

Vue.use(Vuex);

var url = new URL(document.URL);
let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
  keyParam[key] = value;
});
var dPhenotype = keyParam.phenotype;

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        manhattan: getVariantDataModule,
        table: getVariantDataModule,
    },
    state: {
        mPlotInitialPhenotype:dPhenotype,
        mPlotInitialDataset:null,
        selectedPhenotype: null,
        selectedDataset: null,
        phenotypes: null,
        phenotypeName: "Select a phenotype",
        datasetName: "Select a phenotype",
    },
    mutations: {
        setPhenotypeName(state, phenotypeName) {
            state.phenotypeName = phenotypeName;
        },
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
            state.phenotypeName = phenotype.name;
            mdkp.utility.showHideElement('phenotypeSearchHolder');
        },
        setSelectedDataset(state, dataset) {
            state.selectedDataset = dataset;
            state.datasetName = dataset;
            mdkp.utility.showHideElement('datasetSearchHolder');
        },
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        }
    },
    actions: {
        onInitialPhenotypeSet(context, selectedPhenotype) {
            context.commit("setPhenotypeName", selectedPhenotype.name);
            /* It throws error when "setSelectedPhenotype" is called here */
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("table/clearData");
            context.commit("manhattan/clearData");
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
        onDatasetChange(context, selectedDataset) {
            console.log(selectedDataset);

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
    },

});
