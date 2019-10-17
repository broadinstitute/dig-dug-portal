import jp from "jsonpath"

/* The Metadata Module is responsible for asynchronously downloading and
 * storing the portal MDV metadata and then providing getter methods for
 * parsing it.
 *
 * The metadata layout is basically:
 *
 * {
 *  "experiments": [ ]
 * }
 *
 * Where each experiment is:
 *
 * {
 *  "name"
 *  "version"
 *  "technology"
 *  "institution"
 *  "sample_groups": [ ]
 * }
 *
 * And each sample_group is:
 *
 * {
 *  "name"
 *  "id"
 *  "ancestry"
 *  "cases"
 *  "controls"
 *  "subjects"
 *  "sort_order"
 *  "properties": [ ]
 *  "phenotypes": [ ]
 * }
 *
 * Each property:
 *
 * {
 *  "name"
 *  "type"
 *  "meaning"
 *  "displayable"
 *  "sort_order"
 * }
 *
 * Each phenotype:
 *
 * {
 *  "name"
 *  "group"
 *  "sort_order"
 *  "properties": [ ]
 * }
 *
 * And each phenotype property:
 *
 * {
 *  "name"
 *  "type"
 *  "meaning"
 *  "displayable"
 *  "searchable"
 *  "sort_order"
 * }
 */

export default {
    namespaced: true,

    // initial module state
    state() {
        return { metadata: {} };
    },

    // commit methods
    mutations: {
        setMetadata(state, json) {
            state.metadata = json;
        }
    },

    // dispatch methods
    actions: {
        async getMetadata(context) {
            let json = await fetch("/kb/getMetadata").then(resp => resp.json());
            context.commit("setMetadata", json);
        }
    },

    // getter methods for computed data
    getters: {

        // Returns a map of { phenotypeGroup: [phenotypes] }.
        phenotypes(state) {
            let phenotypeMap = {};
            let query = '$.experiments[*]..phenotypes[*]';
            let phenotypes = jp.query(state.metadata, query);

            // collect all the phenotypes into their respective groups
            for (let key in phenotypes) {
                let phenotype = phenotypes[key];
                let group = phenotype.group;

                if (!phenotypeMap[group]) {
                    phenotypeMap[group] = {
                        [phenotype.name]: phenotype,
                    };
                } else {
                    phenotypeMap[group][phenotype.name] = phenotype;
                }
            }

            // sort all the groups
            for (let group in phenotypeMap) {
                let phenotypes = Object.keys(phenotypeMap[group]);

                // sort the phenotypes by their sort_order
                phenotypes.sort((a, b) => {
                    return phenotypeMap[group][a].sort_order - phenotypeMap[group][b].sort_order;
                });

                // update the group to the list of sorted phenotypes
                phenotypeMap[group] = phenotypes;
            };

            return phenotypeMap;
        },

        // Return array of datasets for a given phenotype.
        datasetList(state) {
            return function (phenotype) {
                if (!phenotype) {
                    return [];
                }

                let experiments = state.metadata.experiments;

                // remove experiments that aren't of the right phenotype
                let filtered = experiments.filter(dataset => {
                    let phenotypes = jp.query(dataset, `$..phenotypes[*].name`);
                    let exists = phenotypes.indexOf(phenotype) >= 0;

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
