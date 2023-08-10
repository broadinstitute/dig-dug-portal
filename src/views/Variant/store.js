import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
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
        //regions: bioIndex("regions"),
        datasetAssociations: bioIndex("variant-dataset-associations"),
        varIDLookup: bioIndex("varIdLookup"),
    },

    state: {
        variant: null,
        newVariantId: null,
        ancestry: keyParams.ancestry ? keyParams.ancestry : "",
        selectedAncestry: keyParams.ancestry ? keyParams.ancestry : "",
        badSearch: false,
        phenotypesInSession: null,
        diseaseInSession: null,
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
        },
    },

    actions: {
        async queryVariant(context, newVarId) {
            context.state.ancestry = context.state.selectedAncestry;
            keyParams.set({ ancestry: context.state.selectedAncestry });
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );

            if (newVarId) {
                //if newVarId is a dbSNP, then we need to get the varId
                if (newVarId.startsWith("rs")) {
                    let varId = await fetch(
                        BIO_INDEX_HOST + "/api/bio/varIdLookup/" + newVarId
                    )
                        .then((res) => res.json())
                        .then((res) => res.data.varid);
                    console.log("json varId", varId);
                    varId ? (newVarId = varId) : null;
                }

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
                context.dispatch("ancestryPhewas/query", {
                    q: `${ancestry},${varId}`,
                });
            } else {
                context.dispatch("phewas/query", { q: varId });
            }
            context.dispatch("transcriptConsequences/query", { q: varId });
            context.dispatch("transcriptionFactors/query", { q: varId });
            //context.dispatch("regions/query", { q: `${chromosome}:${position}` });
            context.dispatch("datasetAssociations/query", { q: varId });
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
    },
});
