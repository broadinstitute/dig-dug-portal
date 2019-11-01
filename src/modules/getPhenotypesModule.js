export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            phenotypes: {}
        };
    },

    // commit methods
    mutations: {
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        }
    },

    // dispatch methods
    actions: {
        async getPhenotypes(context) {
            let json = await fetch("/kb/getPhenotypes").then(resp => resp.json());
            context.commit('setPhenotypes', json)
        }
    },

    // getter methods for computed data
    getters: {
        phenotypes(state) {
            let phenotypes = state.phenotypes;
            // collect all the phenotypes into their respective groups
            return phenotypes.data;
        },
    },
};
