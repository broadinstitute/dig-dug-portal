import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        page: keyParams.page,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        searchKey: null,
        searchedKey: null,
    },
    mutations: {
        setPage(state, page) {
            state.page = page || state.page;
            keyParams.set({ page: state.page });
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        },

        setSearchedKey(state, KEY) {
            state.searchedKey = KEY;
        },
    },
    getters: {
    },
    actions: {
        page(context, PAGE) {
            context.commit("setPage", PAGE);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
        searchedKey(context, KEY) {
            context.commit("setSearchedKey", KEY);
        }
    }
});
