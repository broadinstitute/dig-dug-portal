/*
 * Module to get data from Brent Richards' effector gene lists
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
                `http://kp4cd.org//modules/kpn/effector_genes/assets/js/richards_data_${trait}.json`
            )
                .then(resp => resp.json())
                .then(resp =>
                    resp.sort((a, b) =>
                        a["all.locus.prob"] < b["all.locus.prob"] ? 1 : -1
                    )
                );
            // set the data
            context.commit("setGeneData", json);
        }
    }
};
