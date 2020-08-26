

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
        category: "Not in GWAS region",
        stage2Category: null,
        geneAssociationsData: null,
        stdErr: null,
        oddsRatio: null,
        lofTeeStdErr: null,
        lofTeeOddsRatio: null
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
        setStdErr(state, stdErr) {
            state.stdErr = stdErr;
        },
        setOddsRatio(state, oddsRatio) {
            state.oddsRatio = oddsRatio;
        },
        setLofTeeOddsRatio(state, lofTeeOddsRatio) {
            state.lofTeeOddsRatio = lofTeeOddsRatio;
        },
        setLofTeeStdErr(state, lofTeeStdErr) {
            state.lofTeeStdErr = lofTeeStdErr;
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
            //eventually you will make api call to bioindex to get 52k data
            // let json = [{
            //     "dataset": "52k",
            //     "phenotype": "T2D",
            //     "gene": "MC4R",
            //     "pValue": 2.74,
            //     "oddsRatio": 2.0667968637762106,
            //     "masks": [

            //         {
            //             "mask": "5/5",
            //             "n": 43125,
            //             "pValue": 1.5689e-10,
            //             "combinedAF": 0.0079072,
            //             "passingVariants": 40,
            //             "singleVariants": 19,
            //             "stdErr": 0.11544000000000001,
            //             "oddsRatio": 2.0491396046485235
            //         },
            //         {
            //             "mask": "16/16",
            //             "n": 43125,
            //             "pValue": 0.31708000000000003,
            //             "combinedAF": 0.00032464,
            //             "passingVariants": 4,
            //             "singleVariants": 1,
            //             "stdErr": 0.56563,
            //             "oddsRatio": 1.7221783980987881
            //         },
            //         {
            //             "mask": "5/5 + LofTee LC",
            //             "n": 43125,
            //             "pValue": 8.459799999999999e-11,
            //             "combinedAF": 0.0079536,
            //             "passingVariants": 41,
            //             "singleVariants": 19,
            //             "stdErr": 0.11525999999999999,
            //             "oddsRatio": 2.0674376701238337
            //         },
            //         {
            //             "mask": "5/5 + 0/5 1%",
            //             "n": 43125,
            //             "pValue": 4.1692e-06,
            //             "combinedAF": 0.017345,
            //             "passingVariants": 105,
            //             "singleVariants": 52,
            //             "stdErr": 0.07486,
            //             "oddsRatio": 1.4084361846568465
            //         },
            //         {
            //             "mask": "5/5 + 1/5 1%",
            //             "n": 43125,
            //             "pValue": 2.7276999999999997e-06,
            //             "combinedAF": 0.015606,
            //             "passingVariants": 94,
            //             "singleVariants": 47,
            //             "stdErr": 0.079828,
            //             "oddsRatio": 1.4500673447367525
            //         },
            //         {
            //             "mask": "11/11",
            //             "n": 43125,
            //             "pValue": 0.26282,
            //             "combinedAF": 0.00037101,
            //             "passingVariants": 5,
            //             "singleVariants": 1,
            //             "stdErr": 0.5315,
            //             "oddsRatio": 1.7769705923637789
            //         }
            //     ]

            // }]


            let json = [{
                "dataset": "52k",
                "phenotype": "T2D",
                "gene": "FOXO1",
                "pValue": 0.0376,
                "oddsRatio": 0.7672059499758557,
                "masks": [{
                    "mask": "LofTee",
                    "n": 43125,
                    "pValue": 0.31708000000000003,
                    "combinedAF": 0.00032464,
                    "passingVariants": 4,
                    "singleVariants": 1,
                    "stdErr": 0.56563,
                    "oddsRatio": 1.7221783980987881
                }, {
                    "mask": "5/5",
                    "n": 43125,
                    "pValue": 0.39941,
                    "combinedAF": 0.00055652,
                    "passingVariants": 10,
                    "singleVariants": 5,
                    "stdErr": 0.43023999999999996,
                    "oddsRatio": 0.7033504535050564
                },
                {
                    "mask": "16/16",
                    "n": 43125,
                    "pValue": 0.44172,
                    "combinedAF": 2.3188000000000002e-05,
                    "passingVariants": 1,
                    "singleVariants": 1,
                    "stdErr": 2.3098,
                    "oddsRatio": 0.3117667396854656
                },
                {
                    "mask": "5/5 + LofTee LC",
                    "n": 43125,
                    "pValue": 0.39941,
                    "combinedAF": 0.00055652,
                    "passingVariants": 10,
                    "singleVariants": 5,
                    "stdErr": 0.43023999999999996,
                    "oddsRatio": 0.7033504535050564
                },
                {
                    "mask": "5/5 + 0/5 1%",
                    "n": 43125,
                    "pValue": 0.013756,
                    "combinedAF": 0.008742,
                    "passingVariants": 78,
                    "singleVariants": 31,
                    "stdErr": 0.10826,
                    "oddsRatio": 0.7675589458956816
                },
                {
                    "mask": "5/5 + 1/5 1%",
                    "n": 43125,
                    "pValue": 0.021618000000000002,
                    "combinedAF": 0.007373899999999999,
                    "passingVariants": 62,
                    "singleVariants": 25,
                    "stdErr": 0.11907000000000001,
                    "oddsRatio": 0.7625021125096113
                },
                {
                    "mask": "11/11",
                    "n": 43125,
                    "pValue": 0.50578,
                    "combinedAF": 0.00048696,
                    "passingVariants": 8,
                    "singleVariants": 4,
                    "stdErr": 0.46006,
                    "oddsRatio": 0.7430514428392158
                }
                ]
            }]
            //once 52K data is in bioindex there will be async call to bioindex and then commit
            context.commit('setGeneAssociationsData', json);

            for (var i = 0; i < json.length; ++i) {
                // if (json[i].pValue <= 0.0000025) {
                if (json[i].pValue <= 0.0000025) {
                    //if Exome wide significant
                    context.commit('setStage2Category', "Strong coding evidence-Causal, 1C");
                }
                else {
                    //show the line plot
                    //calculate the PPA using Prior and then using component pass this data as props
                    //find the most significant mask (lowest pvalue and return a map of std err, oddsRatio)

                    json.forEach((row) => {
                        if (!!row.masks) {
                            let d = row.masks.sort((a, b) => a.pValue - b.pValue)
                            console.log(d[0], "most significant mask")
                            let mostSignificantMask = d[0];
                            let stdErr = mostSignificantMask.stdErr;
                            let oddsRatio = mostSignificantMask.oddsRatio;
                            context.commit('setStdErr', stdErr);
                            context.commit('setOddsRatio', oddsRatio);
                            //if it has LofTee mask
                            if (row.masks.mask == "LofTee") {
                                context.commit('setLofTeeOddsRatio', row.masks.oddsRatio);
                                context.commit('setLofTeeStdErr', row.masks.stdErr);
                            }
                        }

                    })
                }

            }

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
