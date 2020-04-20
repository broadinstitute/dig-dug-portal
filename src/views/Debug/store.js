import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import regionUtils from "@/utils/regionUtils";

import { moduleQueryTemplate, camelKebab } from "@/utils/bioIndexUtils"

Vue.use(Vuex);


export default new Vuex.Store({
    modules: {
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
        setSelectedPhenotype(state, phenotype) {
            state.phenotypeParam = null;
            state.phenotype = phenotype;
        },
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
    getters: {
        region(state) {
            return `${state.chr}:${state.start}-${state.end}`;
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
                await context.dispatch(`${camelKebab(module)}/query`, { q: query });
            }
        },

        // weird 2-way call dispatch between queryRegion and searchGene, dangerous.
        async searchGene(context) {
            if (context.state.gene) {
                let locus = await regionUtils.parseRegion(context.state.gene);

                if (locus) {
                    context.state.newChr = locus.chr;
                    context.state.newStart = locus.start;
                    context.state.newEnd = locus.end;

                    // update the locus
                    context.commit('setLocus');
                    context.dispatch('queryRegion');
                }
            }
        },

        async queryRegion(context) {
            console.log('queryRegion context', context.state.gene);
            if (context.state.gene) {
                context.dispatch('searchGene');
            } else {
                // update the locus
                context.commit('setLocus');

                context.commit('setSelectedPhenotype', null);
                context.commit('topAssociations/clearData');

                // find all the top associations and genes in the region
                context.dispatch('topAssociations/query', { q: context.getters.region });
            }
        },
    },
});
