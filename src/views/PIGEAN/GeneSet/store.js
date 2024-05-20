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
        sigma: keyParams.sigma || "sigma2",
        genesetToQuery: "",
        sigmaToQuery: null,
        aliasName: null,
    },

    mutations: {
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
        },
        setSigma(state, sigma){
            state.sigma = sigma || state.sigma
            keyParams.set({ sigma: state.sigma });
        },
    },

    getters: {
    },

    actions: {
        async queryGeneset(context, symbol) {
            let name = context.state.genesetToQuery || context.state.geneset;
            let sigma = context.state.sigmaToQuery || context.state.sigma;
            context.commit("setGeneset", name);
            context.commit("setSigma", sigma);

            let sigmaInt = parseInt(sigma.slice(-1));
            if (!!name) {
                context.dispatch("pigeanGeneset/query", { q: `${name},${sigmaInt}` });
            }
        },
    },
});
