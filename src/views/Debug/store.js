import Vue from "vue";
import Vuex from "vuex";

import kp4cd from "@/modules/kp4cd";
import bioPortal from "@/modules/bioPortal";

import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        kp4cd,
        bioPortal,
        associations: bioIndex("associations"),
        topAssociations: bioIndex("top-associations"),
        variants: bioIndex("variants"),
    },
    state: {
        // user-entered locus
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        phenotype: keyParams.phenotype,

        // user-entered search fields
        newChr: keyParams.chr,
        newStart: keyParams.start,
        newEnd: keyParams.end,
        gene: null,
    },
    mutations: {
        setLocus(state, region = {}) {
            console.log('set locus')
            state.chr = region.chr || state.newChr || state.chr;
            state.start = region.start || state.newStart || state.start;
            state.end = region.end || state.newEnd || state.end;
            state.newChr = state.chr;
            state.newStart = state.start;
            state.newEnd = state.end;
            state.gene = null;

            keyParams.set({
                chr: state.chr,
                start: state.start,
                end: state.end,
            });
        },
    },
});
