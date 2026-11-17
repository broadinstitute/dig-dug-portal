import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { merge } from "lodash";
import { BIO_INDEX_HOST, BIO_INDEX_HOST_PRIVATE } from '@/utils/bioIndexUtils'

// Override the base module with an extended object that may contain
// additional actions, getters, methods, state, etc.
export default function (index, extend, opts = {}) {
    // Support both { host } and legacy { query_private } patterns in opts.
    // When the second argument (extend) is a plain-options object (i.e. has
    // query_private / host but no Vuex keys), treat it as opts for backward
    // compatibility with Neph portal stores that call:
    //   bioIndex("gene-samples", { query_private: true })
    if (extend && !opts.host && !opts.query_private &&
        (extend.query_private !== undefined || extend.host !== undefined) &&
        extend.state === undefined && extend.actions === undefined) {
        opts = extend;
        extend = undefined;
    }

    let { host, query_private } = opts;
    // Resolve the effective host once so every action closure shares it.
    let effectiveHost = host || (query_private ? BIO_INDEX_HOST_PRIVATE : undefined);
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
                state.data = json.data;
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
        actions: {
            async clear(context) {
                context.commit("clearData");
            },
            // payload: { q, limit, limitWhile, append }
            // Also accepts query_private in the payload for backward-compat with
            // Neph portal dispatches like: dispatch("samples/query", { q, query_private: true })
            async query(context, { q, limit, limitWhile, append, query_private: payloadQP } = {}) {
                if (!append) {
                    context.commit("clearData");
                }

                // Payload-level query_private overrides module-level one.
                let resolvedHost = effectiveHost ||
                    (payloadQP ? BIO_INDEX_HOST_PRIVATE : undefined);

                let profile = {
                    fetch: 0,
                    query: 0
                };

                if (!!q) {
                    let alertID = postAlertNotice(
                        `Loading ${index}; please wait ...`
                    );

                    // if user is querying variant index with rsid, convert to varId
                    if (index === "variant" && q.startsWith("rs")) {
                        await fetch(
                            `${resolvedHost || BIO_INDEX_HOST}/api/bio/varIdLookup/${q}`
                        )
                            .then((res) => res.json())
                            .then((res) => {
                                q = res.data.varid;
                            });
                    }

                    // fetch the data
                    let data = await query(index, q, {
                        limit: limit || context.state.limit,
                        limitWhile: limitWhile,
                        host: resolvedHost,
                        // updates progress
                        onResolve: json => {
                            profile.fetch += json.profile.fetch || 0;
                            profile.query += json.profile.query || 0;

                            // update progress bar
                            context.commit("updateCount", json);
                            context.commit("setProgress", json.progress);
                        },
                        // report errors
                        onError: error => {
                            postAlertError(error.detail);
                            context.commit('setError', error.detail);
                        },
                    }).finally(() => closeAlert(alertID))

                    // data is loaded
                    context.commit("setResponse", { data, profile });
                }
            }
        }
    };

    // override module settings
    // TODO: bind (this) to extend to allow for partial overrides (reference + extend original object)?
    return merge(module, extend || {});
}
