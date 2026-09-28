import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        phenotypesInSession: null,
        diseaseInSession: null,
    },
    mutations: {
        setPhenotypesInSession(state, phenotypes) {
            state.phenotypesInSession = phenotypes;
        },
        setDiseaseInSession(state, disease) {
            state.diseaseInSession = disease;
        },
    },
    actions: {},
});
