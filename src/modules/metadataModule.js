import jp from "jsonpath"

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            metadata: {},
        };
    },

    // commit methods
    mutations: {
        setMetadata(state, json) {
            state.metadata = json;
        }
    },

    // dispatch methods
    actions: {
        //not used right now
        async getMetadata(context) {
            let json = await fetch("/cache/getMetadata").then(resp => resp.json());
            context.commit("setMetadata", json);
        }
    },

    // getter methods for computed data
    getters: {
        // Return array of datasets for a given phenotype.
        datasetList(state) {
            return function (selectedPhenotype) {
                if (!selectedPhenotype) {
                    return [];
                }
                let experiments = state.metadata.experiments;
                // remove experiments that aren't of the right phenotype
                let filtered = experiments.filter(dataset => {
                    let phenotypes = jp.query(dataset, `$..phenotypes[*].name`);
                    let exists = phenotypes.indexOf(selectedPhenotype.phenotype_id) >= 0;
                    // is the phenotype present?
                    return exists;
                });

                // return just the sample group IDs
                let ids = filtered.flatMap(dataset => {
                    return dataset.sample_groups.map(sg => sg.id)
                });

                return ids;
            }
        },
    },
};
