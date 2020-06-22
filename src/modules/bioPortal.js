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
            phenotypeMap: {},
            documentation: {},
            matchedGenes: {},
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
        setMatchedGenes(state, data) {
            state.matchedGenes = data;
            console.log("matched genes")

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

        //autocomplete genes (or variants in future)
        async getMatchedGenes({ state, commit }) {
            //the input q would be whatever yhe user types in
            let qs = queryString.stringify({ q: "slc", limit: 5 }, { skipNull: true });
        //use bioindex utils - match function
            let json = await fetch(`${BIO_INDEX_HOST}/api/bio/match/gene?${qs}`)
                .then(resp => resp.json());

            // set the list of phenotypes
            commit('setMatchedGenes', json.data);
        },


    }
}
