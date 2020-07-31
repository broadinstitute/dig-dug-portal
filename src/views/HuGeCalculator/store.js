

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

    },
    state: {
        geneName: keyParams.gene,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        effectorGeneData: [],
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
            state.effectorGeneData = effectorGeneData
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
                                console.log(effectorGeneData);
                                break;
                            }
                            else {
                                effectorGeneData = { "category": "This gene is in a GWAS region, but there are no common coding variants associated with T2D" }
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
        async queryGeneName(context, symbol) {
            let name = symbol || context.state.geneName;
            context.commit('setGeneName', name);
            if (!!name) {
                context.dispatch('gene/query', { q: name });
                context.dispatch('getEffectorGeneData', name);
            }

        },


        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch('genes/query', { q });
        },


    },
});
