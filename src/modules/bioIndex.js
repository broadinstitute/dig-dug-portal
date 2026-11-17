import { query } from "@/utils/bioIndexUtils";
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { merge } from "lodash";
import { BIO_INDEX_HOST } from '@/utils/bioIndexUtils'

export default function (index, extend) {
    let module = {
        namespaced: true,
        limit: null,

        state() {
            return {
                id: Object.freeze(index.toLowerCase()),

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

        actions: {
            async clear(context) {
                context.commit("clearData");
            },
            async query(context, { q, limit, limitWhile, append, query_private }) {
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

                    if (index === "variant" && q.startsWith("rs")) {
                        await fetch(
                            `${BIO_INDEX_HOST}/api/bio/varIdLookup/${q}`
                        )
                            .then((res) => res.json())
                            .then((res) => {
                                q = res.data.varid;
                            });
                    }

                    let data = await query(index, q, {
                        limit: limit || context.state.limit,
                        limitWhile: limitWhile,
                        onResolve: json => {
                            profile.fetch += json.profile.fetch || 0;
                            profile.query += json.profile.query || 0;

                            context.commit("updateCount", json);
                            context.commit("setProgress", json.progress);
                        },
                        onError: error => {
                            postAlertError(error.detail);
                            context.commit('setError', error.detail);
                        },
                    }, query_private || module.query_private || false).finally(() => closeAlert(alertID))

                    context.commit("setResponse", { data, profile });
                }
            }
        }
    };

    return merge(module, extend || {});
}
