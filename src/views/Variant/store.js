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
            keyParams.set({ variant: state.variantID })
        },

    },
    actions: {

        // async onVariantIDChange(context) {
        //     // context.state.newChr = context.state.chr;
        //     // context.state.newPos = context.state.pos;
        //     // context.state.newRef = context.state.ref;
        //     // context.state.newAlt = context.state.alt;

        //     // update the variantID
        //     context.commit('setVariantID', variantID);
        //     context.dispatch('queryVariant');
        // },

        async queryVariant(context) {
            context.commit('setVariantID');

            context.dispatch('variant/query', { q: context.state.variantID });
            // console.log("I am queryVariant")


        },
    }

});
