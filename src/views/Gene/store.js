

import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
// import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        uniprot,

    },
    state: {
        geneName: keyParams.gene,
        newGeneName: keyParams.gene,
    },

    mutations: {
        setGene(state, geneName) {
            state.geneName = geneName || state.newGeneName;
            state.newGeneName = state.geneName
            keyParams.set({ gene: state.newGeneName })
        },

    },
    actions: {
        async queryGene(context) {
            let geneName = context.state.geneName
            console.log(geneName)
            context.commit('setGene', context.state.geneName);
            await context.dispatch('gene/query', { q: geneName });
        },

    }

});
