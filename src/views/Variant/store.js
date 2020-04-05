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
        position: keyParams.position,
        ref: keyParams.ref,
        alt: keyParams.alt,

        newChr: keyParams.chr,
        newPosition: keyParams.position,
        newRef: keyParams.ref,
        newAlt: keyParams.alt,
        variantID: null,
    },
    getters: {
        variantID(state) {
            return `${state.chr}:${state.position}:${state.ref}:${state.alt}`;
        },
    },
    mutations: {

        setVariantID(state, variantID = {}) {
            state.chr = variantID.chr || state.newChr || state.chr;
            state.position = variantID.position || state.newPosition || state.position;
            state.ref = variantID.ref || state.newRef || state.ref;
            state.alt = variantID.alt || state.newAlt || state.alt;

            state.newChr = state.chr;
            state.newPosition = state.start;
            state.newRef = state.ref;
            state.newAlt = state.alt;
            state.variant = null;

            keyParams.set({
                chr: state.chr,
                position: state.position,
                ref: state.ref,
                alt: state.alt,
            });
        },

    },
    actions: {

        async onVariantIDChange(context, variantID) {
            context.state.newChr = variantID.chr;
            context.state.newPosition = variantID.position;
            context.state.newRef = locus.ref;
            context.state.newAlt = locus.alt;

            // update the variantID
            context.commit('setVariantID');
            context.dispatch('queryVariant');
        },

        async queryVariant(context) {
            // find all the transcript Consequences for a given variant
            context.dispatch('variant/query', { q: context.getters.variantID });
        },
    }

});
