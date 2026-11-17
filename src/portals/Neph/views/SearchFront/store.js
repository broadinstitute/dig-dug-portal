import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";
import variantUtils from "@/utils/variantUtils";
import { postAlertError } from "@/components/Alert.vue";
import { match } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    },
    state: {
        matchingGenes: null,
        activeContextHpos: [],
    },
    mutations: {
        setMatchingGenes(state, genes) {
            state.matchingGenes = genes;
        },
        setActiveContextHpos(state, hpos) {
            state.activeContextHpos = hpos;
        }
    },
    actions: {
        async lookupGenes(context, input) {
            let matches = await match("gene", input, { limit: 10 });
            context.commit("setMatchingGenes", matches);
        },
        async saveContext(context, hpos) {
            context.commit("setActiveContextHpos", hpos);
            localStorage.setItem("crdc_active_context_hpo", JSON.stringify(hpos));
        },
        async loadContext(context) {
            const stored = localStorage.getItem("crdc_active_context_hpo");
            if (stored) {
                try {
                    context.commit("setActiveContextHpos", JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse HPO context", e);
                }
            }
        }
    }
});
