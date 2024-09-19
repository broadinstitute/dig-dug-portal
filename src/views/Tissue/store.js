import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        tissue: bioIndex("gene-expression-tissue"),
        geneExpression: bioIndex("gene-expression"),
        geneLinks: bioIndex("gene-links"),
        mouseSummary: bioIndex("diff-exp-summary-tissue"),
        c2ct: bioIndex("c2ct"),
    },
    state: {
        tissueName: keyParams.tissue || "",
        selectedTissue: "",
        geneExpressionTissue: [],
        selectedAncestry: ""
    },

    mutations: {
        setTissueName(state, tissueName) {
            state.tissueName = tissueName || state.tissueName;
            keyParams.set({ tissue: state.tissueName });
        },
    },
    actions: {
        getTissue(context) {
            context.state.tissueName = context.state.selectedTissue || context.state.tissueName;
            context.dispatch("tissue/query", {
                q: context.state.tissueName.replaceAll(" ", "_"), limit: 1000
            });
            let name = context.state.tissueName;
            // TODO FIX BIOINDICES
            if (name === 'adipose_tissue'){
                name = 'adipose';
            }
            context.dispatch("mouseSummary/query", {q: name});
        },
        async getEvidence(context, { q }) {
            //Do we neeed this?
            let evidence = await context.dispatch("geneExpression/query", {
                q,
            });
            return evidence;
        },
        onTissueChange(context, tissue){
            tissue = tissue.replaceAll(" ", "_");
            context.state.selectedTissue = tissue;
            keyParams.set({ tissue: tissue });
        }
    },
    getters: {
        tissueData(state) {
            if (state.tissue.data) {
                //return all data where meanTpm > 1
                return state.tissue.data.filter((d) => d.meanTpm >= 1);
            }
            return [];
        },
    },
});
