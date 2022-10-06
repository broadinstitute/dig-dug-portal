import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        variantData: bioIndex("variant"),
        transcriptConsequences: bioIndex("transcript-consequences"),
        transcriptionFactors: bioIndex("transcription-factors"),
        phewas: bioIndex("phewas-associations"),
        ancestryPhewas: bioIndex("ancestry-phewas-associations"),
        regions: bioIndex("regions"),
        datasetAssociations: bioIndex("variant-dataset-associations"),
    },

    state: {
        variant: null,
        newVariantId: null,
        ancestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        selectedAncestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        badSearch: false
    },

    mutations: {
        setVariant(state, variant) {
            if (variant) {
                let varId = variant.varId;

                state.variant = variant;
                state.newVariantId = variant.dbSNP || varId;

                keyParams.set({ variant: state.newVariantId });
            }
        }
    },

    actions: {
        async queryVariant(context, newVarId) {
            context.state.ancestry = context.state.selectedAncestry;
            keyParams.set({ ancestry: context.state.selectedAncestry });
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );

            if (!!newVarId) {
                await context.dispatch("variantData/query", { q: newVarId });
                context.state.badSearch = false;
                context.dispatch("queryAll");
            } else {
                context.state.badSearch = true;
            }

        },
        queryAll(context) {
            let ancestry = context.state.ancestry;
            let varId = context.state.variant.varId;
            let chromosome = varId.split(":")[0];
            let position = parseInt(varId.split(":")[1]);
            // phewas can be with or without ancestry
            if (!!ancestry) {
                context.dispatch("ancestryPhewas/query", { q: `${ancestry},${varId}` });
            } else {
                context.dispatch("phewas/query", { q: varId });
            }
            context.dispatch("transcriptConsequences/query", { q: varId });
            context.dispatch("transcriptionFactors/query", { q: varId });
            context.dispatch("regions/query", { q: `${chromosome}:${position}` });
            context.dispatch("datasetAssociations/query", { q: varId });
        }
    }
});
