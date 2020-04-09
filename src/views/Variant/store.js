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
        variant: bioIndex("variant"),

    },
    state: {
        variantID: keyParams.variant,
        newVariantID: keyParams.variant,
    },
    getters: {

    },
    mutations: {

        setVariantID(state, variantID) {
            state.variantID = variantID || state.newVariantID;
            state.newVariantID = state.variantID
            keyParams.set({ variant: state.newVariantID })
        },

    },
    actions: {

        async queryVariant(context) {
            let varID = variantUtils.parseVariantID(context.state.newVariantID)
            if (!!varID) {
                context.commit('setVariantID');
                //context.commit('transcriptConsequence/clearData');
                context.dispatch('variant/query', { q: varID });
            }
            else {
                context.commit('setInvalidVariantID', true);
            }
        },
    }

});
