import merge from "lodash.merge";
import get from "lodash";
import querystring from "querystring";
import { BIO_INDEX_HOST, iterableQuery } from "@/utils/bioIndexUtils";

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
            data(state, filter) {
                let data = state.data;
                const localDataFilter = this.dataFilter(this.format, data, filter);
                if (filter) {
                    for (let filterProp in Object.keys(filter)) {
                        data = localDataFilter(data, filterProp);
                    }
                }
                return state.data;
            },
            percentComplete(state) {
                if (!state.count) {
                    return null;
                }

                return Math.min(state.data.length / state.count, 1.0);
            }
        },

        methods: {

            dataFilter(format, filter) {
                return function (data, property) {
                    if (format === "r") {
                        return data.filter(datum => datum[property] === filter[property]);
                    } else if (format === "c") {
                        console.log("column")
                        // column first filtering
                        // get only elements of array with positions in array
                        // find indecies of elements satisfying property
                        const columnFilterSeed =
                            data[property]
                                .map(datum => (datum === filter[property]))
                                .map((datum, index) => { if (datum) { return index } })
                                .filter(x => typeof x !== "undefined");

                        // initialize a tempData object
                        let tempData = {};
                        Object.keys(data).forEach(property => {
                            tempData[property] = [];
                        });

                        // fill tempData object with data that's matched the filter
                        columnFilterSeed.forEach(index => {
                            console.log(index)
                            // TODO can be paralellized
                            // https://medium.com/@ian.mundy/async-map-in-javascript-b19439f0099
                            Object.keys(data).forEach(property => {
                                tempData[property][index] = data[property][index];
                            });
                        });
                        return tempData;
                    }
                }
            },

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

                // NOTE: using dispatching to encapsulate commits wasn't working well since commits need to be synchronous
                // in hindsight, could have used an `await`?
                // context.dispatch("SETUP");
                context.commit("setAbort", false);
                context.commit("setLoading", true);

                // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
                // then make a new chain of promised queries by calling a "base query" and instantiating *iterateQuery.
                if (!context.state.iterableQuery || context.state.iterableQuery.done) {
                    if (queryPayload) {
                        const { q, limit } = queryPayload;
                        context.commit("setIterableQuery",
                            // TODO: refactor error handler out to utils?
                            // TODO: what would be the best error message for debugging?
                            iterableQuery(index, { q, limit: limit || context.limit }, (error) => {
                                // errHandler:
                                // if error, print out the error code (and continuation?)
                                // then force a cancel (i.e. aborted and not loading)
                                console.log(error.message);
                                context.commit('setAbort', true);
                                context.commit("setLoading", false);

                                // TODO: could force an illegal state as our error state so that other components know to fail?
                                //  hack!

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
                        // NOTE: using dispatching to encapsulate commits wasn't working well since commits need to be synchronous
                        // in hindsight, could have used an `await`?
                        // context.dispatch("ABORT");
                        context.commit('setAbort', true);
                        context.commit('setLoading', false);
                        context.commit('clearIterableQuery');
                        break;
                    } else {
                        // if we were still in the stream of data (loading and not aborted) when we asked for a query from the chain,
                        // then append the values from the response (which we assume will exist in a valid format if the chain isn't done) to our store.
                        context.commit('appendData', response.value);
                    }

                }

            },
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
