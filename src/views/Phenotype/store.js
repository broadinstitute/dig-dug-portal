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
        datasetList: [],
    },
    mutations: {
        setSelectedPhenotype(state, selectedPhenotype) {
            state.selectedPhenotype = selectedPhenotype;
            state.phenotypeName = selectedPhenotype.name;
            mdkp.utility.showHideElement('phenotypeSearchHolder');
        },
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
    }
});
