import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotypes: [],
        newPhenotype: null,

        // filters per phenotype [phenotype]={ pValue, n, beta, ... }
        filters: {},
        newFilters: {},
        applyAll: true,
        allFilters: {
            pValue: null,
            beta: null,
            n: null,
            chr: null,
        },
    },
    mutations: {
        setNewPhenotype(state, phenotype) {
            if (!state.phenotypes.find(p => p.name == phenotype.name)) {
                state.phenotypes.push(phenotype);

                // add a set of filters for this phenotype
                state.filters[phenotype.name] = Object.assign({}, state.allFilters);
                state.newFilters[phenotype.name] = Object.assign({}, state.allFilters);
            }
        },

        removePhenotype(state, phenotypeName) {
            state.phenotypes = state.phenotypes.filter(p => p.name !== phenotypeName);
            state.newPhenotype = null;

            delete state.filters[phenotypeName];
            delete state.newFilters[phenotypeName];
        },

        expandFilters(state) {
            state.applyAll = !state.applyAll;
        },

        updateFilters(state) {
            if (state.applyAll) {
                for (let i in state.phenotypes) {
                    let name = state.phenotypes[i].name;

                    // apply to each phenotype
                    state.newFilters[name] = Object.assign({}, state.allFilters);
                }
            }

            // update all the filters
            state.filters = Object.assign({}, state.newFilters);
        }
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit('setNewPhenotype', phenotype);
        },
    },
    getters: {
        phenotypeFilters(state) {
            let phenotypeFilters = {};
            let stateFilters = state.filters;

            for (let i in state.phenotypes) {
                let phenotype = state.phenotypes[i];
                let filters = stateFilters[phenotype.name];

                // filter for each parameter
                let pFilter = (!!filters.pValue) ? (a => a.pValue < filters.pValue) : (a => true);
                let nFilter = (!!filters.n) ? (a => a.n > filters.n) : (a => true);
                let cFilter = (!!filters.chr) ? (a => a.chromosome === filters.chr) : (a => true);
                let bFilter = (a => true);

                // set the beta filter if a choice is made
                switch (filters.beta) {
                    case "negative":
                        bFilter = (a => a.beta < 0);
                        break;
                    case "positive":
                        bFilter = (a => a.beta > 0);
                        break;
                }

                // combine the filters together
                phenotypeFilters[phenotype.name] = (a) => {
                    return pFilter(a) && nFilter(a) && cFilter(a) && bFilter(a);
                };
            }

            return phenotypeFilters;
        },
    },
});
