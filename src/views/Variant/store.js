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
        start: keyParams.position,
        ref: keyParams.ref,
        alt: keyParams.alt,

        newChr: keyParams.chr,
        newStart: keyParams.position,
        newRef: keyParams.ref,
        newAlt: keyParams.alt,
    },
    mutations: {
        // setPhenotypeName(state, name) {
        //     state.phenotypeName = name;
        // },
        setVariantID(state, variantID = {}) {
            state.chr = variantID.chr || state.newChr || state.chr;
            state.position = variantID.position || state.newPosition || state.position;
            state.ref = variantID.ref || state.newRef || state.ref;
            state.alt = variantID.alt || state.newAlt || state.alt;

            state.newChr = state.chr;
            state.newPosition = state.start;
            state.newRef = state.ref;
            state.newAlt = state.alt;

            keyParams.set({
                chr: state.chr,
                position: state.position,
                ref: state.ref,
                alt: state.alt,
            });
        },

    },
    actions: {
        // onPhenotypeChange(context, phenotype) {
        //     keyParams.set({ phenotype: phenotype.name });
        //     context.commit("setPhenotypeName", phenotype.name);
        // },
        onVariantIDChange(context, variantID) {
            keyParams.set({ variantID: context.state.variantID });
            context.commit("setVariantID", variantID);
        },
    }

});
