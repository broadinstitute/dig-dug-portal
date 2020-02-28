import merge from "lodash.merge";
import querystring from "querystring";
import { BIO_INDEX_HOST, beginIterableQuery } from "../utils/bioIndexUtils";

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
            }
        },

        // dispatch methods
        actions: {
            async count(context, { q }) {
                let qs = querystring.encode({ q });
                let json = await fetch(
                    `${BIO_INDEX_HOST}/api/count/${index}?${qs}`
                )
                    .then(resp => resp.json())
                    .catch(error => {
                        count: null;
                    });

                context.commit("setCount", json.count);
            },
            async query(context, queryPayload) {

                context.commit("setAbort", false);
                context.commit("setLoading", true);

                // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
                // then make a new chain of promised queries by calling a "base query" and instantiating *iterateQuery.
                if (!context.state.iterableQuery || context.state.iterableQuery.done) {
                    if (queryPayload) {
                        const { q, limit } = queryPayload;
                        context.commit("setIterableQuery",
                            beginIterableQuery({ index, q, limit: limit || context.limit }, (error) => {
                                // errHandler:
                                // if error, print out the error code (and continuation?)
                                // then force a cancel (i.e. aborted and not loading)
                                context.commit('setAbort', true);
                                context.commit("setLoading", false);

                            })
                        );
                        let response = await context.state.iterableQuery.next();
                        // set the initial data
                        context.commit("setResponse", response.value);
                    }
                }

                // as long as the query is "in-progress" (i.e. loading and not yet aborted),
                // then continue asking for promised queries from the generator
                while (context.state.loading && !context.state.aborted) {
                    let response = await context.state.iterableQuery.next();

                    // if we run out of promised queries, then abort/exit the stream and claim it is no longer loading/in-progress
                    // (we have to manually break the loop to prevent lag-time from the commits from producing invalid behavior)
                    if (response.done) {
                        context.commit('setAbort', true);
                        context.commit("setLoading", false);
                        break;
                    } else {
                        // if we were still in the stream of data (loading and not aborted) when we asked for a query from the chain,
                        // then append the values from the response (which we assume will exist in a valid format if the chain isn't done) to our store.
                        context.commit("appendData", response.value);
                    }

                }

            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
