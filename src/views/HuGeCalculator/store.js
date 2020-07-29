

import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import { match } from "@/utils/bioIndexUtils";



Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        uniprot,
        associations: bioIndex("associations"),

    },
    state: {
        geneName: keyParams.gene,
        matchingEffectorGenesPhenotypes: null,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
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
        setMatchingEffectorGenesPhenotypes(state, phenotypes) {
            state.matchingEffectorGenesPhenotypes = phenotypes;
        },
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
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
        // phenotype(state) {
        //     for (let i in state.bioPortal.phenotypes) {
        //         let phenotype = state.bioPortal.phenotypes[i];

        //         // if (phenotype.name === keyParams.phenotype) {
        //         //     return phenotype;
        //         // }
        //     }

        //     // not set or not found
        //     return null;
        // },
    },

    actions: {
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            context.commit('setGeneName', name);

            if (!!name) {
                context.dispatch('gene/query', { q: name });
            }
        },

        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch('genes/query', { q });
        },

        async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch('uniprot/getUniprotGeneInfo', name);
            }
        },



        async onEffectorGenesPhenotypeChange(context, phenotype) {
            context.commit('setSelectedPhenotype', phenotype);
        },
    },
});
