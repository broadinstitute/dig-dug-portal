import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanGeneset: bioIndex("pigean-gene-set"),
    },
    state: {
        geneset: keyParams.geneset,
        sigma: keyParams.sigma || bioIndexUtils.DEFAULT_SIGMA,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetToQuery: "",
        sigmaToQuery: null,
        genesetSizeToQuery: null,
        aliasName: null,
    },

    mutations: {
    },

    getters: {
    },

    actions: {
    },
});
