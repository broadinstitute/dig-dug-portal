import merge from "lodash.merge";
import queryString from "query-string";
import { BIO_INDEX_HOST, fullQuery } from "@/utils/bioIndexUtils";

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

                // bioIndex query chain state
                // semantics of aborted and loading:
                // aborted => completed chain of queries, or cancelled them
                // loading => there exists a chain of queries that has been called, but might not yet be loading next one yet
                // can't be both aborted and loading at the same time ( loading |- !aborted )
                aborted: false,
                loading: false,
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

            setIterableQuery(state, tc) {
                state.iterableQuery = tc;
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

            setAbort(state, flag) {
                state.aborted = flag;
            },

            setLoading(state, flag) {
                state.loading = flag;
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

            resetModule(state) {
                state.data = [];
                state.iterableQuery = null;
                state.aborted = true;
                state.loading = false;
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
                let completedQuery;
                let profile = {
                    fetch: 0
                };

                context.commit("setAbort", false);
                context.commit("setLoading", true);

                if (queryPayload) {

                    const { q, limit } = queryPayload;
                    completedQuery = await fullQuery({ q, index, limit: limit || context.limit },
                        (json) => {
                            profile.fetch += json.profile.fetch;
                        },
                        (error) => {
                            console.log(error.message);
                            context.commit('setAbort', true);
                            context.commit("setLoading", false);
                        });

                    context.commit('setResponse', { data: completedQuery, profile });

                }
                context.commit('setAbort', true);
                context.commit("setLoading", false);
            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
