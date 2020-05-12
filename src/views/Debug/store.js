import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

import Formatters from "@/utils/formatters"

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
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
    actions: {
        async onIGVCoords(context, { module, newChr, newStart, newEnd }) {
            console.log('on igv coords')
            const { chr, start, end } = context.state;
            if (newChr !== chr || newStart !== start || newEnd !== end) {
                const query = moduleQueryTemplate(module, {
                    phenotype: context.state.phenotype.name,
                    // varId?
                    chromosome: newChr,
                    start: newStart,
                    end: newEnd,
                });
                await context.dispatch(`${Formatters.capitalizedFormatter(module)}/query`, { q: query });
            }
        },
    },
});
