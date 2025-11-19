import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        geneassociations: bioIndex("gene-associations"),
        varassociations: bioIndex("associations"),
        ancestryAssoc: bioIndex("ancestry-associations"),
        associations52k: bioIndex("gene-associations-52k"),
        geneToTranscript: bioIndex("gene-to-transcript"),
        transcriptAssoc: bioIndex("transcript-associations"),
        hugeScores: bioIndex("huge"),
        geneExpression: bioIndex("gene-expression"),
        mouseSummary: bioIndex("diff-exp-summary-gene"),
        uniprot,
    },
    state: {
        geneName: keyParams.gene || "CFTR",
        geneToQuery: "",
        phenotypes: null,
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
        setCommonVariantsLength(state, NUM) {
            state.commonVariantsLength = NUM;
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
                };
            }
        },

        canonicalSymbol(state) {
            let data = state.gene.data;
            if (data.length > 0) {
                return data[0].symbol;
            }
            return null;
        },

        geneSymbol(state) {
            let data = state.genes.data;
            let geneData = state.gene.data;

            for (let i in data) {
                if (
                    data[i].chromosome == geneData[0].chromosome &&
                    data[i].start == geneData[0].start &&
                    data[i].end == geneData[0].end
                ) {
                    if (data[i].source === "symbol") {
                        return data[i].name;
                    }
                }
            }
        },
    },

    actions: {
        // For custom phenotypes
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        commonVariantsLength(context, NUM) {
            context.commit("setCommonVariantsLength", NUM);
        },

        async queryGeneName(context, symbol) {
            let name = context.state.geneToQuery || context.state.geneName;
            context.commit("setGeneName", name);

            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("geneToTranscript/query", { q: name });
            }
        },
        async queryGeneRegion(context, region) {
            //To match with HuGE cal +- 300000 to the region
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start - 300000}-${end + 300000}`;

            context.dispatch("genes/query", { q });
        },
        async queryAssociations(context) {
            let query = { q: context.state.geneName };
            context.dispatch("associations52k/query", query);
            context.dispatch("geneassociations/query", query);
            context.dispatch("geneExpression/query", query);
        },
        async getHugeScoresData(context) {
            let name = context.state.geneName;
            context.dispatch("hugeScores/query", { q: name });
        },
        async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
            }
        },
        
    },
});
