import merge from "lodash.merge";
import queryString from "query-string";
import { BIO_INDEX_HOST, fullQueryWithJson } from "@/utils/bioIndexUtils";
import { beginIterableQuery } from "../utils/bioIndexUtils";

// Override the base module with an extended object that may contain
// additional actions, getters, methods, state, etc.
export default function (index, extend) {
    let module = {
        namespaced: true,
        limit: null,

        // initial module state
        state() {
            return {
                // freeze id to make it immutable (like a prop)
                id: Object.freeze(index.toLowerCase()),

                // accumulated information from query responses
                data: [],
                count: null,
                profile: {},

                iterableQuery: null,
            };
        },

        getters: {
            data(state) {
                return state.data;
            },
            percentComplete(state) {
                if (!state.count) {
                    return null;
                }

                return Math.min(state.data.length / state.count, 1.0);
            }
        },

        // commit methods
        mutations: {

            clearData(state) {
                state.data = [];
            },

            setIterableQuery(state, iterableQuery) {
                state.iterableQuery = iterableQuery;
            },
            clearIterableQuery(state) {
                state.iterableQuery = null;
            },

            setResponse(state, json) {
                state.data = json.data;
                state.profile = json.profile;
            },

            setCount(state, n) {
                state.count = n;
            },

            appendData(state, json) {
                state.data = state.data.concat(json.data);

                // if there was a count, and we have more, match
                if (state.count && state.data.length > state.count) {
                    state.count = state.data.length;
                }

                // total time profile
                state.profile.fetch += json.profile.fetch;
            },

        },

        // dispatch methods
        actions: {
            async count(context, { q }) {
                let qs = queryString.stringify({ q });
                let json = await fetch(
                    `${BIO_INDEX_HOST}/api/bio/count/${index}?${qs}`
                )
                    .then(resp => resp.json())
                    .catch(error => {
                        count: null;
                    });

                context.commit("setCount", json.count);
            },
            async query(context, queryPayload) {
                let profile = {
                    fetch: 0
                };

                if (queryPayload) {
                    let query;
                    const { q, limit } = queryPayload;

                    let accumulatedData = [];
                    let json = {};

                    if (!context.state.iterableQuery) {
                        query = await beginIterableQuery({ q, index, limit: limit || context.limit },
                                (json) => {
                                    profile.fetch += json.profile.fetch;
                                },
                                (error) => {
                                    console.log(error.message);
                                });

                        console.log(context.state.iterableQuery);
                        context.commit('setIterableQuery', query);
                        console.log(context.state.iterableQuery);
                    }

                    if (context.state.iterableQuery) {
                        do {
                            json = await context.state.iterableQuery.next();
                            accumulatedData.push(...json.value.data);
                        } while(json.value.continuation && !context.state.pause);
                        context.commit('clearIterableQuery');
                        context.commit('setResponse', { data: accumulatedData, profile });
                    }

                }

            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
