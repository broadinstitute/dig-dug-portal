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

const extend = (index) => ({
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
    // machine: mLoadingBar,
    mutations: {

        setTIterableQuery(state, tc) {
            state.tIterableQuery = tc;
        },
        clearTIterableQuery(state) {
            state.tIterableQuery = null;
        },

        clearData(state) {
            state.data = [];
        },

    },
    actions: {
        async SETUP(context) {
            context.commit("setAbort", false);
            context.commit("setLoading", true);
        },
        async START(context, payloadQuery) {
            context.dispatch("count", payloadQuery);
            context.dispatch("queryGen", payloadQuery);
        },
        async CANCEL(context) {
            context.commit('setAbort', true);
            context.commit("setLoading", false);
            context.commit('clearTIterableQuery');
        },
        async PAUSE(context) {
            context.commit('associations/setLoading', false)
        },
        async CONTINUE(context, payloadQuery) {
            $store.commit('associations/setLoading', true);
            $store.dispatch('associations/queryGen', payloadQuery);
        },
        async RESTART(context, payloadQuery) {
            $store.commit('clearData');
            $store.dispatch('START', payloadQuery);
        },
        async queryGen(context, {q, limit}) {

            context.dispatch("SETUP");

            // if we neither have an existing iterable query, or an existing query has "gone stale" (iterator done),
            // then make a new chain of promised queries by calling a "base query" and instantiating *iterateQuery.
            if (!context.state.tIterableQuery || context.state.tIterableQuery.done) {
                let qs = querystring.encode({q, limit});
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
                // (we have to manually break the loop to prevent lag-time from the commits from producing invalid behavior)
                if (response.done) {
                    context.dispatch("CANCEL");
                    break;
                } else {
                    // if we were still in the stream of data (loading and not aborted) when we asked for a query from the chain,
                    // then append the values from the response (which we assume will exist in a valid format if the chain isn't done) to our store.
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


// TODO: State Machine?
// [show/can]Cancel, wasStarted or wasRestarted: !$store.state.associations.aborted
// [show/can]Restarted, wasCanceled, isDone: $store.state.associations.aborted
// [show/can]Done, isDone: $store.state.associations.aborted
// [show/can]Continue, isPaused: !$store.state.associations.aborted && !$store.state.associations.loading
// [show/can]Pause, wasStarted or wasContinued: $store.state.associations.loading

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

const mLoadingBar = {
    states: {
        type: 'parallel',
        PauseOrContinue: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        [mLBTransitions.START]: {
                            target: mLBStates.canPause,
                            actions: []
                        }
                    }
                },
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
        CancelOrRestart: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        [mLBTransitions.START]: {
                            target: mLBStates.canCancel,
                            actions: []
                        }
                    }
                },
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
