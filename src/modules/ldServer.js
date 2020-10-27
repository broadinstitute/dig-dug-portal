/*
! LD Server specific data
*/

export default {
    namespaced: true,

    state() {
        return {
            phenotypes: []
        };
    },
    mutations: {
        setPhenotypes(state, data) {
            state.phenotypes = data;
        }
    },
    actions: {
        // fetch all the phenotypes available
        async getPhenotypes({ state, commit }) {
            let json = await fetch(
                "https://ld.hugeamp.org/aggregation/metadata"
            ).then(resp => resp.json());

            // phenotypes for dataset
            commit(
                "setPhenotypes",
                json.data[0].phenotypeDatasets[0].phenotypes
            );
        }
    }
};
