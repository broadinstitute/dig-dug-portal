

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
        geneAssociationsData: null,
        hasLofTee: false,

        tempmasks: [{
            "beta": -0.78322,
            "combinedAF": 0.0011825999999999998,
            "mask": "LofTee",
            "n": 43125,
            "pValue": 0.0072,
            "passingVariants": 13,
            "singleVariants": 4,
            "stdErr": 0.30466
        },
        {
            "beta": -0.74948,
            "combinedAF": 0.0044754,
            "mask": "5/5",
            "n": 43125,
            "pValue": 0.0000014280000000000001,
            "passingVariants": 37,
            "singleVariants": 15,
            "stdErr": 0.16241
        },
        {
            "beta": -0.78322,
            "combinedAF": 0.0011825999999999998,
            "mask": "16/16",
            "n": 43125,
            "pValue": 0.0072,
            "passingVariants": 13,
            "singleVariants": 4,
            "stdErr": 0.30466
        },
        {
            "beta": -0.74948,
            "combinedAF": 0.0044754,
            "mask": "5/5 + LofTee LC",
            "n": 43125,
            "pValue": 0.0000014280000000000001,
            "passingVariants": 37,
            "singleVariants": 15,
            "stdErr": 0.16241
        },
        {
            "beta": -0.47416,
            "combinedAF": 0.013519,
            "mask": "5/5 + 0/5 1%",
            "n": 43125,
            "pValue": 5.4583000000000006e-8,
            "passingVariants": 103,
            "singleVariants": 41,
            "stdErr": 0.088818
        },
        {
            "beta": -0.51407,
            "combinedAF": 0.011641,
            "mask": "5/5 + 1/5 1%",
            "n": 43125,
            "pValue": 4.6983e-8,
            "passingVariants": 86,
            "singleVariants": 36,
            "stdErr": 0.09615399999999999
        },
        {
            "beta": -0.68566,
            "combinedAF": 0.0013217,
            "mask": "11/11",
            "n": 43125,
            "pValue": 0.012681999999999999,
            "passingVariants": 15,
            "singleVariants": 4,
            "stdErr": 0.28485
        }]
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
        setGeneAssociationsData(state, geneAssociationsData) {
            state.geneAssociationsData = geneAssociationsData;
        },
        setHasLofTee(state, hasLofTee) {
            state.hasLofTee = hasLofTee;
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


        async queryGeneRegion(context, region) {
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start}-${end}`;

            context.dispatch('genes/query', { q });
        },


    },
});
