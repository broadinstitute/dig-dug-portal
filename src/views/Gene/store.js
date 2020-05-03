

import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";




Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        genes: bioIndex("genes"),
        uniprot,

    },
    state: {
        geneName: keyParams.gene,
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
    },

    actions: {
        async queryGene(context) {
            let geneName = context.state.geneName;

            context.commit('setGeneName', context.state.geneName);

            // get the bioindex information for queried gene
            context.dispatch('genes/query', { q: geneName });
            context.dispatch('uniprot/getUniprotGeneInfo', geneName);
        },
    }

});
