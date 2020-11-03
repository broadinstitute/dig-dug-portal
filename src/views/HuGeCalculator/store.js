

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
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        geneAssociations52k: bioIndex("gene-associations-52k"),
    },
    state: {
        geneName: keyParams.gene,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes", "isDichotomous": true },
        phenotypes: [{ "name": "T2D", "description": "Type 2 Diabetes" }],
        effectorGeneData: [],
        priorVariance: 0.3696,
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setGene(state, { name, chromosome, start, end }) {
            state.geneName = name;
            state.geneRegion = `${chromosome}:${start}-${end}`;
        },
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setEffectorGeneData(state, effectorGeneData) {
            state.effectorGeneData = effectorGeneData;
        },

        setPriorVariance(state, priorVariance) {
            state.priorVariance = priorVariance;
        }
    },

    getters: {
        region(state) {
            let data = state.gene.data;

            if (data.length > 0) {
                let gene = data[0];

                return {
                    chromosome: gene.chromosome,
                    start: gene.start,
                    end: gene.end,
                }
            }
        },

        canonicalSymbol(state) {
            let data = state.genes.data;
            for (let i in data) {
                if (data[i].source === 'symbol') {
                    return data[i].name;
                }
            }
        },
    },

    actions: {


        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            let phenotype = this.state.phenotype.name;
            context.commit('setGeneName', name);
            let query = {
                q: `${phenotype},${name}`
            };

            if (!!name) {
                context.dispatch('gene/query', { q: name });
                context.dispatch("kp4cd/getEglData", { dataset, phenotype });
                context.dispatch('associations/query', query);
                context.dispatch('geneAssociations52k/query', { q: name });

            }
        },

        async query52kGeneAssociations(context, symbol) {
            context.dispatch('geneAssociations52k/query', { q: symbol });
        },

        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;
            context.dispatch('genes/query', { q });
        },
    },
});
