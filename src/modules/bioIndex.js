import merge from "lodash.merge";
import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

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
            },
        },

        // commit methods
        mutations: {
            clearData(state) {
                state.data = [];
                state.restricted = 0;
                state.count = 0;
            },

            updateCount(state, json) {
                state.count += json.count;
                state.restricted += json.restricted;
            },

            setResponse(state, json) {
                state.data = json.data;
                state.profile = json.profile;
            },

            setProgress(state, progress) {
                state.progress = progress;
            },

        },

        // dispatch methods
        actions: {
            async clear(context) {
                context.commit("setResponse", { data: [] });
            },
            async query(context, { q, limit }) {
                let profile = {
                    fetch: 0,
                    query: 0
                };

                if (!!q) {
                    let alertID = postAlertNotice(`Loading ${index}; please wait ...`);

                    // fetch the data
                    let data = await query(index, q, {
                        limit: limit || context.state.limit,

                        // updates progress
                        resolveHandler: json => {
                            profile.fetch += json.profile.fetch || 0;
                            profile.query += json.profile.query || 0;

                            // update progress bar
                            context.commit("updateCount", json);
                            context.commit("setProgress", json.progress);
                        },

                        // report errors
                        errHandler: error => {
                            closeAlert(alertID);
                            postAlertError(error.detail);
                        },

                        finishHandler: response => {
                            closeAlert(alertID);
                        }
                    });

                    // data is loaded
                    closeAlert(alertID);
                    context.commit("setResponse", { data, profile });
                }
            }
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
