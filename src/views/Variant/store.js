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
        regions: bioIndex("regions"),
    },

    state: {
        variantID: keyParams.variant,
        newVariantID: null,
    },

    mutations: {
        setVariantID(state, variantID) {
            state.variantID = variantID || state.newVariantID;
            state.newVariantID = state.variantID
            keyParams.set({ variant: state.newVariantID });
        },
    },

    actions: {
        async queryVariant(context, newVarId) {
            let varID = variantUtils.parseVariant(newVarId || context.state.variantID);

            if (!!varID) {
                context.commit('setVariantID', varID);
                context.dispatch('variant/query', { q: varID });
            }
        },

        async queryRegions(context, { chromosome, position }) {
            let q = `${chromosome}:${position}`;

            context.dispatch('regions/query', { q });
        }
    }
});
