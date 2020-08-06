/* This module tracks all portal-specific data, which is determined by the
 * sub-domain of the page.
 *
 * It knows the sub-domain (portal), the description of the portal, what
 * phenotypes are available to it, all the data about those phenotypes, etc.
 *
 * It also has functions for changing the disease group (portal) to another
 * and transfering the location to it.
 */

import queryString from 'query-string';
import host from '@/utils/hostUtils';
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

export default {
    namespaced: true,

    // tracks the *current* portal (from subdomain) and available phenotypes
    state() {
        return {
            host,
            diseaseGroups: [],
            phenotypes: [],
            datasets: [],
            datasetMap: {},
            documentation: {},

            // NOTE: in Vue, if we initialize a reactive variable as an empty object, it becomes a wrapped empty object -> therefore a non-empty object (since Vue equips the object with properties it uses to implement reactivity)
            // thus we can't check if the object is fully initialized based on whether or not it's empty, because once transformed by Vue it will always be non-empty
            // this matters because sometimes there are race conditions where e.g. a component will need some kind of data to initialize, but will not be programmed to change if the variable changes,
            // because the value is not expected to change due to user input (like here, where phenotypeMap is page scoped).
            // HOWEVER: by initializing it as a null, we can check whether or not the object is initialized in all cases where we would otherwise want to check if it's empty (since initialization is weaker than emptiness)
            // This particular refactoring might break other code on the portal but should be easily guarded with a v-if or other conditionals
            // - K y2020-m8-d5 while working with LocusZoom Phewas Plot
            phenotypeMap: null,
        }
    },

    mutations: {
        setDiseaseGroups(state, data) {
            state.diseaseGroups = data;
        },
        setPhenotypes(state, data) {
            state.phenotypes = data;
            state.phenotypeMap = {};

            // create a map of the phenotypes by name for fast lookup
            for (let i in state.phenotypes) {
                state.phenotypeMap[state.phenotypes[i].name] = state.phenotypes[i];
            }
        },
        setDatasets(state, data) {
            state.datasets = data;
            state.datasetMap = {};

            // create a map of the dataset name for fast lookup
            for (let i in state.datasets) {
                state.datasetMap[state.datasets[i].name] = state.datasets[i];
            }
        },
        setDocumentation(state, data) {
            state.documentation = data;
        },
    },

    getters: {
        defaultGroup(state) {
            if (state.diseaseGroups.length > 0) {
                return state.diseaseGroups.filter(g => g.default)[0];
            }
        },

        diseaseGroup(state, getters) {
            for (let i in state.diseaseGroups) {
                let group = state.diseaseGroups[i];

                if (group.name == state.host.subDomain) {
                    return group;
                }
            }

            // find the default
            return getters.defaultGroup;
        },

    },

    actions: {
        // fetch all disease groups from the bio index
        async getDiseaseGroups({ commit }) {
            let json = await fetch(`${BIO_INDEX_HOST}/api/portal/groups`)
                .then(resp => resp.json());

            // set the portal list
            commit('setDiseaseGroups', json.data);
        },

        // fetch all the phenotypes for this portal
        async getPhenotypes({ state, commit }) {
            let qs = queryString.stringify({ q: state.host.subDomain }, { skipNull: true });
            let json = await fetch(`${BIO_INDEX_HOST}/api/portal/phenotypes?${qs}`)
                .then(resp => resp.json());

            // set the list of phenotypes
            commit('setPhenotypes', json.data);
        },

        // fetch all datasets for this portal
        async getDatasets({ state, commit }) {
            let qs = queryString.stringify({ q: state.host.subDomain }, { skipNull: true });
            let json = await fetch(`${BIO_INDEX_HOST}/api/portal/datasets?${qs}`)
                .then(resp => resp.json());

            // set the list of datasets
            commit('setDatasets', json.data);
        }
    }
}
