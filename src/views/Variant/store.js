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
        variant: bioIndex("variant")
    },
    state: {
        chr: keyParams.chr,
        pos: keyParams.pos,
        ref: keyParams.ref,
        alt: keyParams.alt,

        newChr: keyParams.chr,
        newPos: keyParams.pos,
        newRef: keyParams.ref,
        newAlt: keyParams.alt,
        variantID: null,
    },
    getters: {
        variantID(state) {
            // console.log("i was here")
            return `${state.chr}:${state.pos}:${state.ref}:${state.alt}`;
        },
    },
    mutations: {

        setVariantID(state, variantID = {}) {
            state.chr = variantID.chr || state.newChr || state.chr;
            state.pos = variantID.pos || state.newPos || state.pos;
            state.ref = variantID.ref || state.newRef || state.ref;
            state.alt = variantID.alt || state.newAlt || state.alt;

            state.newChr = state.chr;
            state.newPos = state.pos;
            state.newRef = state.ref;
            state.newAlt = state.alt;
            state.variant = null;

            keyParams.set({
                chr: state.chr,
                pos: state.pos,
                ref: state.ref,
                alt: state.alt,
            });
        },

    },
    actions: {

        async onVariantIDChange(context) {
            // context.state.newChr = context.state.chr;
            // context.state.newPos = context.state.pos;
            // context.state.newRef = context.state.ref;
            // context.state.newAlt = context.state.alt;

            // update the variantID
            context.commit('setVariantID', variantID);
            context.dispatch('queryVariant');
        },

        async queryVariant(context) {
            // context.commit('setVariantID')
            // find all the transcript Consequences for a given variant

            // context.commit("setVariantID")
            // let varID = variantUtils.parseVariantID(context.state.variantID)

            context.dispatch('variant/query', { q: context.getters.variantID });
            // console.log("I am queryVariant")


        },
    }

});
