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
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetToQuery: "",
        genesetSizeToQuery: null,
        aliasName: null,
        sigmaInt: 2
    },

    mutations: {
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
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
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            context.commit("setGeneset", name);
            context.commit("setGenesetSize", genesetSize);

            if (!!name) {
                context.dispatch("pigeanGeneset/query", { q: 
                    `${name},${context.state.sigmaInt},${genesetSize}` });
            }
        },
    },
});
