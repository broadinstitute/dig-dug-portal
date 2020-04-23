

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
        gene: keyParams.gene,

    },

    mutations: {
        setGene(state, gene) {
            state.gene = gene || state.newGene;
            state.newGene = state.gene
            keyParams.set({ gene: state.newGene })
        },

    },
    actions: {


    }

});
