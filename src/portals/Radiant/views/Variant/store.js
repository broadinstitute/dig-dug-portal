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
        variantData: bioIndex("variants",{query_private:true}),
        transcriptConsequences: bioIndex("transcript-consequences"),
        transcriptionFactors: bioIndex("transcription-factors"),
        phewas: bioIndex("phewas-associations"),
        regions: bioIndex("regions"),
        datasetAssociations: bioIndex("variant-dataset-associations"),
        //variantPhenotypeData: bioIndex("variant-phenotype",this.gene,{},true),
    },

    state: {
        pageVariant: null,
        newVariantId: null,
        badSearch: false,
    },

    mutations: {
        setVariant(state, variant) {
            if (variant) {
                state.pageVariant = variant;
                state.newVariantId = variant.varId || variant.dbSNP;

                keyParams.set({ variant: state.newVariantId });
            }
        },
    },

    actions: {
        async queryVariant(context, newVarId) {
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );

            if (newVarId) {
                //if newVarId is a dbSNP, then we need to get the varId
                if (newVarId.startsWith("rs")) {
                    await fetch(
                        BIO_INDEX_HOST + "/api/bio/varIdLookup/" + newVarId
                    )
                        .then((res) => res.json())
                        .then((res) => {
                            //console.log("res is ", res);
                            context.commit("setVariant", {
                                varId: res.data.varid,
                                dbSNP: res.data.rsid,
                            });
                        });
                } else {
                    context.commit("setVariant", { varId: newVarId });
                }

                await context.dispatch("variantData/query", { q: newVarId });
                context.state.badSearch = false;
                context.dispatch("queryAll");
            } else {
                context.state.badSearch = true;
            }
        },
        queryAll(context) {
            let varId = context.state.pageVariant.varId;
            context.dispatch("phewas/query", { q: varId });
            context.dispatch("transcriptConsequences/query", { q: varId });
            context.dispatch("transcriptionFactors/query", { q: varId });
            context.dispatch("datasetAssociations/query", { q: varId });
        },
    },
});
