/* Pulls data from U of M LD server */

export default {
    namespaced: true,

    state() {
        return {
            variantCorrelations: "",
        };
    },
    mutations: {
        setVariantCorrelations(state, data) {
            state.variantCorrelations = data;
        }
    },
    actions: {
        // fetch variant correlations data

        async getVariantCorrelations(context, param) {

            let json = await fetch(
                param.ldUrl
            ).then(resp => resp.json());

            context.commit("setVariantCorrelations", json);
        }
    }
};
