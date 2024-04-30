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
        variantData: bioIndex("variant",{query_private:true}),
        transcriptConsequences: bioIndex("transcript-consequences",{query_private:true}),
        transcriptionFactors: bioIndex("transcription-factors"),
        phewas: bioIndex("phewas-associations"),
        regions: bioIndex("regions"),
        datasetAssociations: bioIndex("variant-dataset-associations"),
        //variantPhenotypeData: bioIndex("variant-phenotype",this.gene,{},true),
        samples: bioIndex("variant-sample",{query_private:true}),
        gqualitymetrics: bioIndex("genotype-quality-metrics", {query_private:true}),
        squalitymetrics: bioIndex("site-quality-metrics", {query_private:true})
    },

    state: {
        variant: null,
        newVariantId: null
    },

    mutations: {
        setVariant(state, variant) {
            if (variant) {
                let varId = variant.varId;

                state.variant = variant;
                state.newVariantId =  varId || variant.dbSNP;

                keyParams.set({ variant: state.newVariantId });
            }
        },
    },

    actions: {
        async queryVariant(context, newVarId) {
            newVarId = await variantUtils.parseVariant(
                newVarId || context.state.newVariantId
            );
            
            //console.log("query variant:"+newVarId);
            if (!!newVarId) {
                context.dispatch("variantData/query", { q: newVarId, query_private:true  });
            }
            
            
        }
    }
});
