import Vue from "vue";
import Vuex from "vuex";

import keyParams from "@/utils/keyParams";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import ldServer from "@/modules/ldServer";
import myGeneInfo from "@/modules/mygene"

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        lunaris,
        bioPortal,
        kp4cd,
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        geneAssociations52k: bioIndex("gene-associations-52k"),
        myGeneInfo
    },
    state: {
        // only used at the start
        phenotypeParam: keyParams.phenotype,

        // user-entered locus
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        focusedVariant: keyParams.variant,
        phenotype: keyParams.phenotype,

        // user-entered search fields
        newChr: keyParams.chr,
        newStart: keyParams.start,
        newEnd: keyParams.end,
        searchGene: null,
        matchingGenes: null
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.phenotypeParam = phenotype.name;
            state.phenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
        },
        setPhenotypeByName(state, name) {
            state.phenotypeParam = name;
            state.phenotype = state.bioPortal.phenotypeMap[name];
            keyParams.set({ phenotype: name });
        },
        setLocus(state, region = {}) {
            state.chr = region.chr || state.newChr || state.chr;
            state.start = region.start || state.newStart || state.start;
            state.end = region.end || state.newEnd || state.end;
            state.newChr = state.chr;
            state.newStart = state.start;
            state.newEnd = state.end;
            state.searchGene = null;

            keyParams.set({
                chr: state.chr,
                start: state.start,
                end: state.end
            });
        },
        setMatchingGenes(state, genes) {
            state.matchingGenes = genes;
        }
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
        }
    },
    actions: {
        async onPhenotypeChange(context, phenotype) {
            context.commit("setSelectedPhenotype", phenotype);
        },

        async findGene(context) {
            if (context.state.searchGene) {
                let locus = await regionUtils.parseRegion(
                    context.state.searchGene,
                    true,
                    50000
                );

                if (locus) {
                    context.state.newChr = locus.chr;
                    context.state.newStart = locus.start;
                    context.state.newEnd = locus.end;

                    // update the locus
                    context.commit("setLocus");
                    context.dispatch("queryRegion");
                }
            }
        },

        async queryRegion(context, region) {
            const newRegion = region || context.getters.region;
            if (context.state.searchGene) {
                context.dispatch("findGene");
            } else {
                //context.commit("setSelectedPhenotype", null);
                context.commit("genes/clearData");
                context.commit("associations/clearData");
                context.commit("topAssociations/clearData");

                if (
                    context.state.newChr !== context.state.chr ||
                    context.state.newStart !== context.state.start ||
                    context.state.newEnd !== context.state.end
                ) {
                    context.commit("setLocus");
                }

                // find all the top associations and genes in the region
                context.dispatch("topAssociations/query", { q: newRegion });
                context.dispatch("genes/query", { q: newRegion });

                // for variant prioritizer?
                // context.dispatch('regions/query', { q: newRegion });
            }
        },

        async onGeneChange(context, gene) {
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                context.commit("setLocus", locus);
                context.dispatch("queryRegion");
            }
        },

        async resetToDefaultRegion(context) {
            context.commit("setLocus", {
                chr: context.state.initial.chr,
                start: context.state.initial.start,
                end: context.state.initial.end
            });
        }
    }
});
