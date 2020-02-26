import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";

Vue.use(Vuex);

const bioIndexHost = "http://18.215.38.136:5000";

async function *iterateQuery (response) {
    // NOTE: an existing response has to be passed in to *iterateQuery on initialization
    // if the continuation from the previous response isn't null, we can move the generator forward
    while (response.continuation) {
        let qs = querystring.encode({ token: response.continuation });
        response = await fetch(`${bioIndexHost}/api/cont?${qs}`)
            .then(resp => resp.json())
            .catch(error => {
                // TODO: handling web errors
                new Error(error);
                    // .then(err => console.log(`iterateQuery response has failed with ${err} on continuation ${response.continuation}`));continuation
                return null;
            });
        // note that generators are implicitly recursive:
        // they pass in their previous yields
        // into their args the next time they are called
        yield response;
    }
}

const mLBTransitions = Object.freeze({
    "START": "START",
    "PAUSE": "PAUSE",
    "CONTINUE": "CONTINUE",
    "CANCEL": "CANCEL",
    "RESTART": "RESTART",
});

const mLBStates = Object.freeze({
    "canPause": "canPause",
    "canCancel": "canCancel",
    "canContinue": "canContinue",
    "canRestart": "canRestart",
});

const mLoadingBarPC = {
    states: {
        type: 'parallel',
        pauseContinue: {
            initial: 'idle',
            states: {
                [mLBStates.canPause]: {
                    on: {
                        [mLBTransitions.PAUSE]: {
                            target: mLBStates.canCancel,
                            actions: [],
                        }
                    }
                },
                [mLBStates.canContinue]: {
                    on: {
                        [mLBTransitions.CONTINUE]: {
                            target: mLBStates.canPause,
                            actions: [],
                        }
                    }
                },
            },
        },
        cancelRestart: {
            initial: 'idle',
            states: {
                [mLBStates.canCancel]: {
                    on: {
                        [mLBTransitions.CANCEL]: {
                            target: mLBStates.canRestart,
                            actions: [],
                        }
                    },
                },
                [mLBStates.canRestart]: {
                    on: {
                        [mLBTransitions.RESTART]: {
                            target: mLBStates.canContinue,
                            actions: [],
                        }
                    }
                },
            },
        },
    },
};

const extend = (index) => ({
    // initial module state
    state() {
        return {
            data: [],
            count: null,
            profile: {},
            aborted: false,
            loading: false,
            tContinuation: null,
            tIterableQuery: null,
        };
    },
    // machine: MachineLoadingBar,
    mutations: {

        setTIterableQuery(state, tc) {
            state.tIterableQuery = tc;
        },
        clearTIterableQuery(state) {
            state.tIterableQuery = null;
        },

        setTContinuation(state, tc) {
            state.tContinuation = tc;
        },
        clearTContinuation(state) {
            state.tContinuation = null;
        },

        clearData(state) {
            state.data = [];
        },

    },
    actions: {
        async queryGen(context, {q, limit}) {
            let qs = querystring.encode({ q, limit });

            // clear the abort flag, set loading
            context.commit("setAbort", false);
            // if we enter here due to continuing from a pause it's idempotent anyway
            context.commit("setLoading", true);

            // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
            // then make a new chain of promised queries.
            if (!context.state.tIterableQuery || context.state.tIterableQuery.done) {
                let json = await fetch(
                    `${bioIndexHost}/api/query/${index}?${qs}`
                ).then(resp => resp.json());

                // set the initial data
                context.commit("setResponse", json);
                context.commit("setTIterableQuery", iterateQuery(json));
            }

            // as long as the query is "in-progress" (i.e. loading and not yet aborted),
            // then continue asking for promised queries
            while (context.state.loading && !context.state.aborted) {
                let response = await context.state.tIterableQuery.next();
                // if we run out of promised queries, then abort/exit the stream and claim it is no longer loading/in-progress
                // (we have to manually break the loop to prevent lag from the commits from producing invalid behavior)
                if (response.done) {
                    context.commit("setAbort", true);
                    context.commit("setLoading", false);
                    break;
                } else {
                    // if we were still in the stream of data (loading and not aborted) when we asked for a query from the chain,
                    // then append the values from the response (which we assume will exist in a valid format) to our store.
                    context.commit("appendData", response.value);
                }
            }

        },
    },
});

export default new Vuex.Store({
    modules: {
        associations: bioIndex("Associations", extend("Associations")),
        topAssociations: bioIndex("TopAssociations", extend("TopAssociations")),
        variants: bioIndex("Variants", extend("Variants"))
    },
    state: {},
    mutations: {},
    actions: {}
});
