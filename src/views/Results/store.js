import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import resultCards from "./modules/resultCards"

import bioIndexUtils from "@/utils/bioIndexUtils";
import { BIOINDEX_SCHEMA, hashQuery } from "./utils/resultsUtils"

Vue.use(Vuex);

const indexes = BIOINDEX_SCHEMA.data.map(schema => schema.index);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        resultCards,
    },
    state: {
        indexes,
        dataCache: {},
        busyBodies: [],
    },
    getters: {
        busy(state) {
            return state.busyBodies.length > 0;
        }
    },
    mutations: {
        moreBusy(state, queryHash) {
            state.busyBodies.push(queryHash)
        },
        lessBusy(state, queryHash) {
            state.busyBodies = state.busyBodies.filter(el => el != queryHash)
        }
    },
    actions: {
        clearEverything(context) {
            context.commit('clearEverything');
        },
        queryBioIndexForResults(context, { id, index, query, parent=-1 }) {
            const card = { id, index, query, parent };
            const queryHash = hashQuery(card);

            if (typeof context.state.dataCache[queryHash] === 'undefined') {
                context.commit('moreBusy', queryHash);
                Promise.resolve(bioIndexUtils.query(card.index, card.query, { limit: null } )).then(data => {
                    context.state.dataCache[queryHash] = data;
                    context.dispatch('addCard', card);
                    context.commit('lessBusy', queryHash);
                });
            } else {
                console.log('using cache in store')
                context.dispatch('addCard', card);
            }

        },
    }
});
