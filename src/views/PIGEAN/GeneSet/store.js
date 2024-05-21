import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanGeneset: bioIndex("pigean-gene-set"),
    },
    state: {
        geneset: keyParams.geneset,
        genesetToQuery: "",
        aliasName: null,
    },

    mutations: {
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
        },
    },

    getters: {
    },

    actions: {
        async queryGeneset(context, symbol) {
            let name = context.state.genesetToQuery || context.state.geneset;
            context.commit("setGeneset", name);

            if (!!name) {
                context.dispatch("pigeanGeneset/query", { q: name });
            }
        },
    },
});
