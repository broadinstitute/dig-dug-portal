/*
 * Module to get data from Brent Richard's effector gene lists
 */

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            geneData: {}
        };
    },

    // commit methods
    mutations: {
        setGeneData(state, geneData) {
            state.geneData = geneData;
        }
    },

    // dispatch methods
    actions: {
        async getGeneData(context, trait) {
            let json = await fetch(
                `http://kp4cd.org//modules/kpn/effector_genes/assets/js/richards_data_${trait}`
            ).then(resp => resp.json());
            // set the data
            context.commit("setGeneData", json);
        }
    }
};
