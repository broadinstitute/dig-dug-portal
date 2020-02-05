import Vue from "vue";
import Vuex from "vuex";

import { defaultGroup } from "@/modules/defaultPortal";
import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";


Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        kp4cd,
    },
    state: {
        selectedPhenotype: null,
        phenotypes: null,
        diseaseGroup: defaultGroup,
        newsItems: kp4cd.newsFeed,
        newsIndex: [],
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
        },
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        },
        setselectedDiseaseGroup(state, selectedDiseaseGroup) {
            state.diseaseGroup = selectedDiseaseGroup;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
        onDiseaseGroupChange(context, selectedDiseaseGroup) {
            context.commit("setselectedDiseaseGroup", selectedDiseaseGroup);
        },
    }
});
