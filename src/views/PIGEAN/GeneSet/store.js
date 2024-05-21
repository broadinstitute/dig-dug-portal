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
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
        },
        setSigma(state, sigma){
            state.sigma = sigma || state.sigma
            keyParams.set({ sigma: state.sigma });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
    },

    getters: {
    },

    actions: {
        async queryGeneset(context, symbol) {
            let name = context.state.genesetToQuery || context.state.geneset;
            let sigma = context.state.sigmaToQuery || context.state.sigma;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            context.commit("setGeneset", name);
            context.commit("setSigma", sigma);
            context.commit("setGenesetSize", genesetSize);

            let sigmaInt = parseInt(sigma.slice(-1));
            if (!!name) {
                context.dispatch("pigeanGeneset/query", { q: 
                    `${name},${sigmaInt},${genesetSize}` });
            }
        },
    },
});
