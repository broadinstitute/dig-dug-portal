

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

            //fetch call to gene-associations: 

            let phenotype = "T2D";
            let json = context.dispatch('geneAssociations/query', { q: gene });


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
