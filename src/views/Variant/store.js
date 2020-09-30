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
        variantData: bioIndex('variant'),
        transcriptConsequences: bioIndex('transcript-consequences'),
        transcriptionFactors: bioIndex('transcription-factors'),
        phewas: bioIndex("phewas-associations"),
        regions: bioIndex("regions"),
    },

    state: {
        variant: null,
        newVariantId: null,
    },

    mutations: {
        setVariant(state, variant) {
            if (variant) {
                let varId = variant.varId;

                state.variant = variant;
                state.newVariantId = variant.dbSNP || varId;

                keyParams.set({ variant: state.newVariantId });
            }
        },
    },

    actions: {
        async queryVariant(context, newVarId) {
            newVarId = await variantUtils.parseVariant(newVarId || context.state.newVariantId);

            if (!!newVarId) {
                context.dispatch('variantData/query', { q: newVarId });
            }
        },
    }
});
