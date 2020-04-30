

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
        gene: bioIndex("gene"),
        uniprot,

    },
    state: {
        geneName: keyParams.gene,
        newGeneName: keyParams.gene,
        uniprotDoc: null,
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.newGeneName;
            state.newGeneName = state.geneName
            keyParams.set({ gene: state.newGeneName })
        },
        setUniprotDoc(state, doc) {
            state.uniprotDoc = doc
        },
    },
    actions: {
        async queryGene(context) {
            let geneName = context.state.geneName
            context.commit('setGeneName', context.state.geneName);
            //get the bioportal information for queried gene
            context.dispatch('gene/query', { q: geneName });
            //get the data from uniprot for queried gene
            context.dispatch('uniprot/getUniprotGeneInfo', geneName)

            //do I need to do this if I am commiting the data in uniprot module
            context.commit('setUniprotDoc', context.state.uniprot)
        },
    }

});
