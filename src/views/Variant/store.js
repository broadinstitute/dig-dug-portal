import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

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

        async onVariantIDChange(context, variantID) {
            context.state.newChr = variantID.chr;
            context.state.newPos = variantID.pos;
            context.state.newRef = locus.ref;
            context.state.newAlt = locus.alt;

            // update the variantID
            context.commit('setVariantID');
            context.dispatch('queryVariant');
        },

        async queryVariant(context) {
            // context.commit('setVariantID')
            // find all the transcript Consequences for a given variant
            context.dispatch('variant/query', { q: context.getters.variantID });
        },
    }

});
