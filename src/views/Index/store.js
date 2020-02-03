import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        kp4cd
    },
    state: {
        selectedPhenotype: null,
        phenotypes: null,
        diseaseGroup: "md",
        newsItems: kp4cd.newsFeed,
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
        },
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("setSelectedPhenotype", selectedPhenotype);
        },
    }
});
