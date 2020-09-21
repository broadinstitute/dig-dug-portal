

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
        geneAssociations: bioIndex("gene-associations"),
    },
    state: {
        geneName: keyParams.gene,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        effectorGeneData: [],
        category: "Not in GWAS region",
        stage2Category: null,
        priorVariance: 0.0462,
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
        setStage2Category(state, stage2Category) {
            state.stage2Category = stage2Category;
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
        async getEffectorGeneData(context, geneSymbol) {
            let dataset = 'mccarthy'
            let trait = 't2d'
            let json = fetch(`http://kp4cd.org/egldata/dataset?dataset=${dataset}&trait=${trait}`)
                .then(resp => {
                    if (resp.status === 422) {
                        throw Error("missing parameters");
                    }
                    if (resp.status === 200) {
                        return resp;
                    }
                })
                .then(resp => resp.json())
                .then(json => {
                    if (json.data.length > 0) {
                        let effectorGeneData = {}

                        for (var i = 0; i < json.data.length; ++i) {

                            if (json.data[i].gene.toLowerCase() === geneSymbol.toLowerCase()) {
                                effectorGeneData = json.data[i];
                                let p = effectorGeneData.perturbational.split("")[0] - 1;
                                effectorGeneData.perturbational = p.toString() + "P";

                                break;
                            }
                            else {
                                effectorGeneData = { "perturbational": "3P", "category": "In GWAS but only one line of perturbation evidence" }
                            }
                        }
                        context.commit('setEffectorGeneData', effectorGeneData);
                    } else {
                        throw new Error(
                            "No content returned for given gene "
                        );
                    }
                });
        },
        async get52KGeneAssociationsData(context, gene) {

            //fetch call to gene-associations: 

            context.dispatch('geneAssociations/query', { q: gene });
        },
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            context.commit('setGeneName', name);
            if (!!name) {
                context.dispatch('gene/query', { q: name });
                context.dispatch('getEffectorGeneData', name);
                context.dispatch('get52KGeneAssociationsData', name);
            }
        },

        async updatePriorVariance(context, priorVariance) {

            context.commit('setPriorVariance', priorVariance);

        },


        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch('genes/query', { q });
        },


    },
});
