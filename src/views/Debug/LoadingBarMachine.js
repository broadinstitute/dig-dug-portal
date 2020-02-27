// TODO: State Machine?
// [show/can]Cancel, wasStarted or wasRestarted: !$store.state.associations.aborted
// [show/can]Restarted, wasCanceled, isDone: $store.state.associations.aborted
// [show/can]Done, isDone: $store.state.associations.aborted
// [show/can]Continue, isPaused: !$store.state.associations.aborted && !$store.state.associations.loading
// [show/can]Pause, wasStarted or wasContinued: $store.state.associations.loading

export const mLBTransitions = Object.freeze({
    "START": "init",
    "PAUSE": "PAUSE",
    "CONTINUE": "CONTINUE",
    "CANCEL": "CANCEL",
    "RESTART": "RESTART",
});

export const mLBStates = Object.freeze({
    "canPause": "canPause",
    "canCancel": "canCancel",
    "canContinue": "canContinue",
    "canRestart": "canRestart",
});

// you can get a sense of how this component works using this tool: https://xstate.js.org/viz/
export const mLoadingBar = {
    id: 'LoadingBarControls',
    type: 'parallel',
    initial: 'init',
    states: {
        done: { on: { TOGGLE: 'init' } },
        // consolidate the state for `start` so that we run "START" *once*,
        // so that we don't double-count queries
        init: {
            on: {
                START: {
                    init: {
                        actions: ["START"]
                    }
                }
            }
        },
        // PauseButton: {
        //     initial: 'init',
        //     states: {
        //         init: {
        //             on: {
        //                 START: 'canPause',
        //                 RESTART: 'canPause'
        //             },
        //         },
        //         canPause: {
        //             on: {
        //                 PAUSE: {
        //                     target: 'canContinue',
        //                     actions: ['PAUSE']
        //                 },
        //             }
        //         },
        //         canContinue: {
        //             on: {
        //                 CONTINUE: {
        //                     target: 'canPause',
        //                     actions: ['CONTINUE']
        //                 },
        //             }
        //         },
        //     },
        //     on: {
        //         CANCEL: 'PauseButton.init'
        //     },
        // },
        // CancelButton: {
        //     initial: 'init',
        //     states: {
        //         init: {
        //             on: {
        //                 START: 'canCancel'
        //             }
        //         },
        //         canCancel: {
        //             on: {
        //                 CANCEL: {
        //                     target: 'canRestart',
        //                     actions: ['CANCEL']
        //                 }
        //             }
        //         },
        //         canRestart: {
        //             on: {
        //                 RESTART: {
        //                     target: 'canCancel',
        //                     actions: ['RESTART']
        //                 },
        //                 START: {
        //                     target: 'canCancel'
        //                 }
        //             }
        //         }
        //     },
        // },
    },
};
this.$vsm.add("associations", mLoadingBar);
this.$vsm.set("associations");
this.$vsm.transition("START", {q: 'slc30a8'});
