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
        variants: bioIndex("variants"),
        documentation: bioIndex("documentation"),
        regions: bioIndex("regions"),
        credibleSets: bioIndex("credible-sets"),
        globalEnrichment: bioIndex("global-enrichment"),
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
        searchGene: null,

        currentTissue: '',
        currentCredibleSet: '',
        currentAnnotation: null,
        pValue: 1.0,
        beta: 1.0,
    },
    mutations: {
        setPValue(state, pValue) {
            state.pValue = pValue;
        },
        setBeta(state, beta) {
            state.beta = beta;
        },
        setCurrentTissue(state, tissue) {
            state.currentTissue = tissue;
        },
        setCredibleSet(state, credibleSet) {
            state.currentCredibleSet = credibleSet;
        },
        setAnnotationChange(state, annotation) {
            state.currentAnnotation = annotation;
        },
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
            state.searchGene = null;

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
        async onPhenotypeChange(context, phenotype) {
            context.commit('setSelectedPhenotype', phenotype);
        },

        async onTissueChange(context, eventData) {
            context.commit('setCurrentTissue', eventData.tissue)
        },

        async onCredibleSetChange(context, eventData) {
            context.commit('setCredibleSet', eventData.credibleSetId)
        },

        async onAnnotationChange(context, annotation) {
            //console.log(eventData)
            context.commit('setAnnotationChange', annotation)
        },

        async findGene(context) {
            if (context.state.searchGene) {
                let locus = await regionUtils.parseRegion(context.state.searchGene, true, 50000);

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

        async queryRegion(context, region) {
            const newRegion = region || context.getters.region;
            if (context.state.searchGene) {
                context.dispatch('findGene');
            } else {
                context.commit('setSelectedPhenotype', null);
                context.commit('genes/clearData');
                context.commit('associations/clearData');
                context.commit('topAssociations/clearData');

                if (context.state.newChr !== context.state.chr ||
                    context.state.newStart !== context.state.start ||
                    context.state.newEnd !== context.state.end) {
                    context.commit('setLocus');
                }

                // find all the top associations and genes in the region
                context.dispatch('topAssociations/query', { q: newRegion });
                context.dispatch('genes/query', { q: newRegion });

                // for variant prioritizer?
                // context.dispatch('regions/query', { q: newRegion });

            }
        },

        async loadAssociations(context, lzstate) {
            let { chr, start, end, phenotype } = lzstate;

            // construct the query
            let query = {
                q: `${phenotype},${chr}:${start}-${end}`
            };

            // load the association
            context.dispatch('associations/query', query);
        },

        async resetToDefaultRegion(context) {
            context.commit('setLocus', {
                chr: context.state.initial.chr,
                start: context.state.initial.start,
                end: context.state.initial.end,
            });
        }

    },
});
