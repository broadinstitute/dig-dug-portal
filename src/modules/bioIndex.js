import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { merge } from "lodash";

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
                count: 0,
                restricted: 0,
                profile: {},
                progress: null,
                error: null,
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
                return Math.min(
                    state.progress.bytes_read / state.progress.bytes_total,
                    1.0
                );
            }
        },

        // commit methods
        mutations: {
            clearData(state) {
                state.data = [];
                state.restricted = 0;
                state.count = 0;
                state.error = null;
            },

            updateCount(state, json) {
                state.count += json.count;
                state.restricted += json.restricted;
            },

            setResponse(state, json) {
                //console.log("set response:"+JSON.stringify(state)+"|"+(state && 'data' in json));
                if ('data' in json){
                    state.data = json.data;
                }
                state.profile = json.profile;
                state.error = null;
            },

            setProgress(state, progress) {
                state.progress = progress;
            },

            setError(state, error) {
                state.error = error;
            }
        },

        // dispatch methods
        // Helen 2021-06-18 add query_private parameter to query function
        actions: {
            async clear(context) {
                context.commit("clearData");
            },
            async query(context, { q, limit, limitWhile, append }) {
                //console.log("BioIndex:"+JSON.stringify(q));
                let query_private = false;
                if (typeof(extend) != "undefined" && typeof(extend.query_private) != "undefined"){
                    query_private = extend.query_private;
                }
                if (!append) {
                    context.commit("clearData");
                }

                let profile = {
                    fetch: 0,
                    query: 0
                };

                if (!!q) {
                    let alertID = postAlertNotice(
                        `Loading ${index}; please wait ...`
                    );

                    // fetch the data
                    let data = await query(index, q, {
                        limit: limit || context.state.limit,
                        limitWhile: limitWhile,
                        // updates progress
                        onResolve: json => {
                            profile.fetch += json.profile.fetch || 0;
                            profile.query += json.profile.query || 0;
                            //console.log("onResolve:"+JSON.stringify(json));
                            // update progress bar
                            context.commit("updateCount", json);
                            context.commit("setProgress", json.progress);
                            //Helen move setResponse
                            //console.log(JSON.stringify(json));
                            context.commit("setResponse", json);
                        },
                        // report errors
                        onError: error => {
                            postAlertError(error.detail);
                            console.log("Error on bioIndex:"+error.detail);
                            context.commit('setError', error.detail);
                        },
                    }, query_private).finally(() => closeAlert(alertID))

                    // data is loaded
                    //Helen move setResponse
                    //console.log("before set response:"+JSON.stringify(data));
                    //context.commit("setResponse", { data, profile });
                }
            }
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
