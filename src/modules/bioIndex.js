import merge from "lodash.merge";
import findIndex from "lodash";
import querystring from "querystring";
import { BIO_INDEX_HOST, beginIterableQuery, dataFilter, majorFormat } from "@/utils/bioIndexUtils";

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
                id: index.toLowerCase(),

                // accumulated information from query responses
                data: null,
                count: null,
                profile: {},
                limit: 5000,

                // column-first: "c", record/row-first: "r"
                format: "r",

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
                // TODO: handle null case (refactor to new portal?) and r/c format cases? (unless standardizing)
                return Math.min(state.data.length / state.count, 1.0);
            }
        },

        methods: {
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

                // TODO: handle null case (refactor to new portal?) and r/c format cases? (unless standardizing)
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

            async query(context, { q, limit, filter }) {

                context.commit("setAbort", false);
                context.commit("setLoading", true);

                // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
                // then make a new chain of promised queries by calling a "base query" and instantiating *iterateQuery.
                if (!context.state.iterableQuery || context.state.iterableQuery.done) {
                    if (q) {
                        context.commit("setIterableQuery",
                            // TODO: refactor error handler out to utils?
                            // TODO: what would be the best error message for debugging?
                            beginIterableQuery({ index, q, limit }, (error) => {
                                // errHandler:
                                // if error, print out the error code (and continuation?)
                                // then force a cancel (i.e. aborted and not loading)
                                context.commit('setAbort', true);
                                context.commit("setLoading", false);

                            })
                        );
                        let response = await context.state.iterableQuery.next();
                        // set the initial data
                        let json = response.value;
                        context.commit("setResponse", json);
                    }
                }

                // as long as the query is "in-progress" (i.e. loading and not yet aborted),
                // then continue asking for promised queries from the generator
                if (context.state.iterableQuery) {
                    while (context.state.loading && !context.state.aborted) {
                        let response = await context.state.iterableQuery.next();
                        // if we run out of promised queries, then abort/exit the stream and claim it is no longer loading/in-progress
                        // (we have to manually break the loop to prevent lag-time from the commits from producing invalid behavior)
                        if (response.done) {
                            context.commit('setAbort', true);
                            context.commit('setLoading', false);
                            context.commit('clearIterableQuery');
                            break;
                        } else {
                            // if we were still in the stream of data (loading and not aborted) when we asked for a query from the chain,
                            // then append the values from the response (which we assume will exist in a valid format if the chain isn't done) to our store.
                            let json = response.value;
                            context.commit('appendData', json);
                        }
                    }
                }

            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
