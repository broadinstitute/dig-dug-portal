/**
 * This is the module to get data fro effector genes list page
 */

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            datasets: [],
            effectorGenes: [],
        };
    },

    // commit methods
    mutations: {
        setDatasets(state, data) {
            state.datasets = data;
        },
        setEffectorGenes(state, data) {
            state.effectorGenes = data;
        },
    },

    // dispatch methods
    actions: {
        async getDatasets(context, trait) {

            let json = await fetch('http://18.215.38.136:5000/api/bio/match/effector-genes?q=' + trait + ',_')
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasets', json)
        },

        async getEffectorGenes(context, query) {
            let trait = (query.trait != "" && query.trait != null) ? query.trait : '_';
            let dataFrom = (query.dataset != "" && query.dataset != null) ? query.dataset : '_';

            let json = await fetch('http://18.215.38.136:5000/api/bio/query/effector-genes?q=' + trait + ',' + dataFrom)
                .then(resp => resp.json());
            // set the data
            context.commit('setEffectorGenes', json)
        },
    },
}
