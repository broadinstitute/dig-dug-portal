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
        phenotypesInSession: null,
        diseaseInSession: null,
        ancestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        selectedAncestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        badSearch: false,
        phenotypeCorrelation: null,
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
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        }
    },

    actions: {
        async queryVariant(context, newVarId) {
            context.state.ancestry = context.state.selectedAncestry;
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );

            if (!!newVarId) {
                context.dispatch("variantData/query", { q: newVarId });
                context.state.badSearch = false;
            } else {
                context.state.badSearch = true;
            }
        },
        // Do we need a new function here? Is this it?
        async clumpedVariants(context, phenotype, clump) {
            let query = phenotype + "," + clump;
            context.dispatch("clumpedVariants/query", { q: query });
        },
        // For custom phenotypes
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },

    }
});
