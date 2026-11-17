
export default {
    namespaced: true,

    state() {
        return {
            variantCorrelations: "",
            recombRate: "",
        };
    },
    mutations: {
        setVariantCorrelations(state, data) {
            state.variantCorrelations = data;
        },
        setRecombRate(state, data) {
            state.recombRate = data;
        }
    },
    actions: {

        async getVariantCorrelations(context, param) {

            let json = await fetch(
                param.ldUrl
            ).then(resp => resp.json());

            context.commit("setVariantCorrelations", json);
        },
        async getRecombRate(context, param) {

            let json = await fetch(
                param.url
            ).then(resp => resp.json());

            context.commit("setRecombRate", json);
        }
    }
};
