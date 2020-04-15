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
        chr: keyParams.variant.split(':')[0],
        position: keyParams.variant.split(':')[1],
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
        async onLocusZoomCoords(context, { module, newChr, newStart, newEnd }) {
            const { chr, start, end } = context.state;
            if (newChr !== chr || newStart !== start || newEnd !== end) {
                await context.dispatch(`${module}/query`, { q: `${context.state.phenotype.name},${newChr}:${newStart}-${newEnd}` });
                //context.commit(`setLocus`, { chr: newChr, start: newStart, end: newEnd });
            }
        },

        async queryVariant(context) {
            let varID = variantUtils.parseVariantID(context.state.newVariantID)
            if (!!varID) {
                context.commit('setVariantID');
                await context.dispatch('variant/query', { q: varID });
            }
            else {
                context.commit('setInvalidVariantID', true);
            }
        },
    }

});
