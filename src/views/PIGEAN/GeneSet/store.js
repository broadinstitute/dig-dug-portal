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
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
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
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
    },

    getters: {
    },

    actions: {
        async queryGeneset(context, symbol) {
            let name = context.state.genesetToQuery || context.state.geneset;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGeneset", name);
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);

            if (!!name) {
                context.dispatch("pigeanGeneset/query", { q: 
                    `${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}` });
            }
        },
    },
});
