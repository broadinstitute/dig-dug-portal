import merge from "lodash.merge";
import querystring from "querystring";
import { iterableQuery, BIO_INDEX_HOST } from "../utils/bioIndexUtils";

// Override the base module with an extended object that may contain
// additional actions, getters, methods, state, etc.


export default function(index, extend) {
    let module = {
        namespaced: true,

        // initial module state
        state() {
            return {
                data: [],
                count: null,
                profile: {},
                aborted: false,
                loading: false,
                tIterableQuery: null,
            };
        },

        getters: {
            data (state) {
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

            setTIterableQuery(state, tc) {
                state.tIterableQuery = tc;
            },
            clearTIterableQuery(state) {
                state.tIterableQuery = null;
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
            async query(context, {q, limit}) {

                // NOTE: using dispatching to encapsulate commits wasn't working well since commits need to be synchronous
                // in hindsight, could have used an `await`?
                // context.dispatch("SETUP");
                context.commit("setAbort", false);
                context.commit("setLoading", true);

                // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
                // then make a new chain of promised queries by calling a "base query" and instantiating *iterateQuery.
                if (!context.state.tIterableQuery || context.state.tIterableQuery.done) {
                    let qs = querystring.encode({q, limit});
                    let response = await fetch(
                        `${BIO_INDEX_HOST}/api/query/${index}?${qs}`
                    ).then(resp => resp.json());

                    // set the initial data
                    context.commit("setResponse", response);
                    context.commit("setTIterableQuery", iterableQuery(response));
                }

                // as long as the query is "in-progress" (i.e. loading and not yet aborted),
                // then continue asking for promised queries from the generator
                while (context.state.loading && !context.state.aborted) {
                    let response = await context.state.tIterableQuery.next();

                    // if we run out of promised queries, then abort/exit the stream and claim it is no longer loading/in-progress
                    // (we have to manually break the loop to prevent lag-time from the commits from producing invalid behavior)
                    if (response.done) {
                        // NOTE: using dispatching to encapsulate commits wasn't working well since commits need to be synchronous
                        // in hindsight, could have used an `await`?
                        // context.dispatch("ABORT");
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
