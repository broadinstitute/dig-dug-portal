import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        tissue: bioIndex("gene-expression-tissue"),
        geneExpression: bioIndex("gene-expression"),
        geneLinks: bioIndex("gene-links"),
    },
    state: {
        tissueName: keyParams.tissue || "",
        geneExpressionTissue: [],
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.tissueName = tissueName || state.tissueName;
            keyParams.set({ tissue: state.tissueName });
        },
    },
    actions: {
        getTissue(context) {
            context.dispatch("tissue/query", { q: context.state.tissueName });
        },
    },
    getters: {
        tissueData(state) {
            return state.tissue.data || [];
        },
    },
});
