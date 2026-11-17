import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

const ANALYZE_URL = "/phenotype-analyzer-api/analyze";

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    },
    state: {
        terms: keyParams.terms || "",
        loading: false,
        result: null,
        error: null
    },
    getters: {
        normalizedTerms(state) {
            return state.terms
                .split(",")
                .map(term => term.trim())
                .filter(term => term.length > 0)
                .join(",");
        }
    },
    mutations: {
        setTerms(state, terms) {
            state.terms = terms;
            keyParams.set({ terms });
        },
        setLoading(state, loading) {
            state.loading = loading;
        },
        setResult(state, result) {
            state.result = result;
        },
        setError(state, error) {
            state.error = error;
        }
    },
    actions: {
        async analyzePhenotypes(context) {
            let terms = context.getters.normalizedTerms;
            context.commit("setTerms", terms);
            context.commit("setLoading", true);
            context.commit("setError", null);

            try {
                let response = await fetch(ANALYZE_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({ terms }).toString()
                });
                let contentType = response.headers.get("content-type") || "";
                let result = contentType.includes("application/json")
                    ? await response.json()
                    : await response.text();

                if (!response.ok) {
                    throw new Error(
                        typeof result === "string"
                            ? result
                            : `Analyze request failed with status ${response.status}`
                    );
                }

                context.commit("setResult", result);
            } catch (error) {
                context.commit(
                    "setError",
                    error.message || "Analyze request failed"
                );
            } finally {
                context.commit("setLoading", false);
            }
        }
    }
});
