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
        phenotype: null,
        genesetSize: "small",
    },
    mutations: {
        setGenesetSize(state, genesetSize) {
            state.genesetSize = genesetSize || state.genesetSize;
        },
    },
    getters: {
        docDetails(state) {
            return {
                phenotype: state.phenotype,
                genesetSize: state.genesetSize,
            };
        },
    },
});
