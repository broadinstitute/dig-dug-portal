import Vue from "vue";
import Vuex from "vuex";

import keyParams from "@/utils/keyParams";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import lunaris from "@/modules/lunaris";
import kp4cd from "@/modules/kp4cd";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        lunaris,
        bioPortal,
        kp4cd,
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        ancestryAssoc: bioIndex("ancestry-associations"),
        topAssociations: bioIndex("top-associations"),
        ancestryTopAssoc: bioIndex("ancestry-top-associations"),
        variants: bioIndex("variants"),
        documentation: bioIndex("documentation"),
        regions: bioIndex("regions"),
        credibleSets: bioIndex("credible-sets"),
        globalEnrichment: bioIndex("global-enrichment"),
        variant: bioIndex("variant")
    },
    state: {
        // only used at the start
        phenotypeParam: keyParams.phenotype,

        // user-entered locus
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        focusedVariant: keyParams.variant,
        clearPhenotypeFlag: false,

        // user-entered search fields
        newChr: keyParams.chr,
        newStart: keyParams.start,
        newEnd: keyParams.end,
        searchGene: null,
        matchingGenes: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        geneToQuery: "",
        selectedAncestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        ancestry: !!keyParams.ancestry ? keyParams.ancestry : "",
    },
    mutations: {
        setPhenotypeByName(state, name) {
            state.phenotypeParam = name;
            state.phenotype = state.bioPortal.phenotypeMap[name];
            keyParams.set({ phenotype: name });
        },
        setLocus(state, region = {}) {
            let oldChr = state.chr;
            let oldStart = state.start;
            let oldEnd = state.end;

            // update the state
            state.chr = region.chr || state.newChr || state.chr;
            state.start = region.start || state.newStart || state.start;
            state.end = region.end || state.newEnd || state.end;
            state.newChr = state.chr;
            state.newStart = state.start;
            state.newEnd = state.end;
            state.searchGene = null;

            // did the region change completely?
            if (oldChr !== state.chr || oldEnd < state.start || oldStart > state.end) {
                state.clearPhenotypeFlag = true;
            }

            keyParams.set({
                chr: state.chr,
                start: state.start,
                end: state.end
            });
        },
        phenotypesCleared(state) {
            state.clearPhenotypeFlag = false;
        },
        setMatchingGenes(state, genes) {
            state.matchingGenes = genes;
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        }
    },
    getters: {
        region(state) {
            return `${state.chr}:${state.start}-${state.end}`;
        }
    },
    actions: {
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
            context.state.ancestry = context.state.selectedAncestry;
            if (
                context.state.newChr !== context.state.chr ||
                context.state.newStart !== context.state.start ||
                context.state.newEnd !== context.state.end
            ) {
                context.commit("setLocus", {
                    chr: context.state.newChr,
                    start: context.state.newStart,
                    end: context.state.newEnd
                });
            }


            const newRegion = region || context.getters.region;
            if (context.state.searchGene) {
                context.dispatch("findGene");
            } else {
                context.commit("genes/clearData");
                context.commit("associations/clearData");
                context.commit("topAssociations/clearData");
                context.commit("ancestryAssoc/clearData");
                context.commit("ancestryTopAssoc/clearData")

                if (
                    context.state.newChr !== context.state.chr ||
                    context.state.newStart !== context.state.start ||
                    context.state.newEnd !== context.state.end
                ) {
                    context.commit("setLocus");
                }

                // find all the top associations and genes in the region
                context.dispatch("genes/query", { q: newRegion });
                context.dispatch("topAssociations/query", { q: newRegion });

                // Search by ancestry if applicable
                if (context.state.ancestry != "") {
                    context.dispatch("ancestryTopAssoc/query", { q: `${context.state.ancestry},${newRegion}` });
                }
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
        },

        onAncestryChange(context){
            context.dispatch("queryRegion");
        },

        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
    }
});
