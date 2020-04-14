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
                progress: null,

                paused: false,
                iterableQuery: null,
            };
        },

        getters: {
            data(state) {
                return state.data;
            },
            percentComplete(state) {
                if (!state.progress) {
                    return null;
                }
                return Math.min(state.progress.bytes_read / state.progress.bytes_total, 1.0);
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

            setProgress(state, progress) {
                state.progress = progress;
            }

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
                    fetch: 0,
                    query: 0,
                };

                if (queryPayload) {
                    const { q, limit } = queryPayload;
                    let data = await fullQuery(
                        { q, index, limit: limit || context.state.limit },
                        {
                            continueCondition: !context.state.paused,
                            resolveHandler: (json) => {
                                profile.fetch += json.profile.fetch;
                                profile.query += json.profile.query;
                                context.commit("setProgress", json.progress);
                            },
                            errHandler: (error) => {
                                console.log(error.message);
                            },
                        })
                    context.commit('setResponse', { data: data, profile });
                }

            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
