import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    },
    state: {
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
    },
    mutations: {
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        }
    },
    getters: {
    },
    actions: {
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
    }
});
