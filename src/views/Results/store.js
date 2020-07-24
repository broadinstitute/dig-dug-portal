import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import resultCards from "./modules/resultCards"

import bioIndexUtils from "@/utils/bioIndexUtils";
import { BIOINDEX_SCHEMA, provenanceHash, contentHash, decodeHistory } from "./utils/resultsUtils"

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
        decodeAndLoad(context, historyString) {
            const decodedHistory = decodeHistory(historyString);
            // console.log('decodedHistory', decodedHistory);
            // NOTE: Doesn't delete the cache. Feature and not bug?
            context.dispatch('clearEverything');
            Promise.all(decodedHistory.cards.map(card => {
                context.dispatch('queryBioIndexForResults', { ...card })
            }))
        },
        queryBioIndexForResults(context, { id, index, query, parent=-1 }) {
            const card = { id, index, query, parent };

            // if the id doesn't exist it will be assigned when the card is created
            // but for the sake of representing loading accurately we need to assign the provenanceHash with
            // some noise to disitnguish it from other hashes which may be identical at the time of loading
            // this should be revisited if we are making any decisions using the query being passed in before it's fully loaded
            const queryPageId = provenanceHash(card) + (id || '_tmp'+Math.floor(Math.random()*100));
            const queryContentId = contentHash(card);

            if (typeof context.state.dataCache[queryContentId] === 'undefined') {
                context.commit('moreBusy', queryPageId);
                Promise.resolve(bioIndexUtils.query(card.index, card.query, { limit: null } ))
                    .then(data => {
                        context.state.dataCache[queryContentId] = data;
                        context.dispatch('addCard', card);
                    })
                    .finally(() => {
                        context.commit('lessBusy', queryPageId);
                    });
            } else {
                console.log('will be using cache in store')
                console.warn('TODO: need to guarantee that cache is /content addressed/, not addressed by ID')
                context.dispatch('addCard', card);
            }

        },
    }
});
