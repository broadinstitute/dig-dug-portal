import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";
import getVariantDataModule from "@/modules/getVariantDataModule";
import diseaseGroup from "@/modules/diseaseGroup";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        manhattan: getVariantDataModule,
        table: getVariantDataModule,
        kp4cd,
        diseaseGroup
    },
    state: {
        selectedPhenotype: null,
        selectedDataset: null,
        phenotypes: null,
        phenotypeName: "Select a phenotype",
        datasetName: "Select a dataset",
    },
    mutations: {
        setPhenotypeName(state, phenotypeName) {
            state.phenotypeName = phenotypeName;
        },
        setSelectedPhenotype(state, phenotype) {

            console.log(phenotype);
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
        onPhenotypeChange(context, selectedPhenotype) {
            console.log("change");

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
    },

});
