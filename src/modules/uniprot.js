/**
 * This is the module that is used to pull the uniprot data for a given gene

 */

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            uniprot: [],
        };
    },

    // commit methods
    mutations: {
        setUniprotGeneInfo(state, uniprotGeneInfo) {
            state.uniprotGeneInfo = uniprotGeneInfo;
        },

    },

    // dispatch methods
    actions: {
        //this returns gene information using exact gene name in tab separated file
        async getUniprotGeneInfo(context, gene, format) {
            let limit = 10;
            let json = await fetch(`https://www.uniprot.org/uniprot/?query=gene_exact` + gene + `format` + format + `include=no&limit` + limit)
                .then(resp => resp.json());
            // set the data
            context.commit('setUniprotGeneInfo', json)
        },
    },
}
