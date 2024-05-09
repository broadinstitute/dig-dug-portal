import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanGeneSet: bioIndex("pigean-gene-set"),
        uniprot,
    },
    state: {
        geneSet: keyParams.geneset,
        geneSetToQuery: "",
        aliasName: null,
    },

    mutations: {
        setGeneSet(state, geneSet) {
            state.geneSet = geneSet || state.geneSet;
            keyParams.set({ geneset: state.geneSet });
        },
    },

    getters: {
    },

    actions: {
        async queryGeneSet(context, symbol) {
            let name = context.state.geneSetToQuery || context.state.geneSet;
            context.commit("setGenSet", name);

            if (!!name) {
                context.dispatch("pigeanGeneSet/query", { q: name });
            }
        },
    },
});
