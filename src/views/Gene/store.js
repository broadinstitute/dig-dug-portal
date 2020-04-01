import Vue from "vue";
import Vuex from "vuex";

import keyParams from "@/utils/keyParams";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        topAssociations: bioIndex("top-associations"),
    },
    state: {
        // only used at the start
        phenotypeParam: keyParams.phenotype,

        // user-entered locus
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        phenotype: null,

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
        setPhenotypeByName(state, name) {
            state.phenotypeParam = null;
            state.phenotype = state.bioPortal.phenotypeMap[name];
        },
        setLocus(state, region = {}) {
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
        // The phenotype is a getter because it depends on the bioPortal
        // having loaded all the phenotype objects from the database.
        phenotype(state) {
            for (let i in state.bioPortal.phenotypes) {
                let phenotype = state.bioPortal.phenotypes[i];

                if (phenotype.name === keyParams.phenotype) {
                    return phenotype;
                }
            }

            // not set or not found
            return null;
        },
        region(state) {
            return `${state.chr}:${state.start}-${state.end}`;
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

        async onPhenotypeChange(context, phenotype) {
            context.commit('setSelectedPhenotype', phenotype);
        },

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
            if (context.state.gene) {
                context.dispatch('searchGene');
            } else {
                context.commit('setSelectedPhenotype', null);
                context.commit('genes/clearData');
                context.commit('associations/clearData');
                context.commit('topAssociations/clearData');

                // find all the top associations and genes in the region
                context.dispatch('topAssociations/query', { q: context.getters.region });
                context.dispatch('genes/query', { q: context.getters.region });
                context.dispatch('getAssociations');
            }
        },

        // fetches all the associations for the selected phenotype
        async getAssociations(context, phenotype) {
            if (phenotype) {
                let q = `${phenotype.name},${context.getters.region}`;

                // update the url with the new phenotype
                keyParams.set({ phenotype: phenotype.name });
                //mdkp.utility.showHideElement("phenotypeSearchHolder");

                // get the associations for this phenotype in the region
                context.commit("setSelectedPhenotype", phenotype);
                context.dispatch('associations/query', { q });
            }
        },

    }
});
