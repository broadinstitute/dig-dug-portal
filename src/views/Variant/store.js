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
        clumpedVariants: bioIndex("clumped-variants"),
        ancestryClumpedVariants: bioIndex("ancestry-clumped-variants")
    },

    state: {
        variant: null,
        newVariantId: null,
        ancestry: ""
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
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );

            if (!!newVarId) {
                context.dispatch("variantData/query", { q: newVarId });
            }
        },
        // Do we need a new function here? Is this it?
        async clumpedVariants(context, phenotype, clump){
            let query = phenotype + "," + clump;
            context.dispatch("clumpedVariants/query", {q: query});
        }
    }
});
