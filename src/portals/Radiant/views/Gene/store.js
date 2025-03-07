import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import uniprot from "@/modules/uniprot";
import regionUtils from "@/utils/regionUtils";
import bioIndexUtils from "@/utils/bioIndexUtils";

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
        pigeanGene: bioIndex("pigean-gene"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
        uniprot,
    },
    state: {
        geneName: keyParams.gene,
        geneToQuery: "",
        aliasName: null,
        prior: 0.3696,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        selectedAncestry: "",
        selectedTranscript: "",
        commonVariantsLength: 0,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetSizeToQuery: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
        traitsData: [],
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
        setAliasName(state, aliasName) {
            state.aliasName = aliasName || state.aliasName;
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        },
        setCommonVariantsLength(state, NUM) {
            state.commonVariantsLength = NUM;
        },
        setTraitsData(state, traitsData){
            state.traitsData = traitsData;
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
                };
            }
        },

        // canonicalSymbol(state) {
        //     let data = state.genes.data;
        //     let geneData = state.gene.data;

        //     for (let i in data) {
        //         if (data[i].source === "symbol") {
        //             return data[i].name;
        //         }
        //     }
        // },
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
            
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);

            //console.log("genesetSize");

            if (!!name) {
                context.dispatch("gene/query", { q: name });
                context.dispatch("geneToTranscript/query", { q: name });
                
                //add pigean gene
                console.log("query gene name");
                let traitsData = [];
                for (let i = 0; i < bioIndexUtils.TRAIT_GROUPS.length; i++){
                    let group = bioIndexUtils.TRAIT_GROUPS[i];
                    let traitQuery = `${group},${context.state.geneName},${
                        bioIndexUtils.DEFAULT_SIGMA},${context.state.genesetSize}`;
                    let groupData = await bioIndexUtils.query("pigean-gene", traitQuery);
                    traitsData = traitsData.concat(groupData);
                }
                traitsData = traitsData.sort((a,b) => b.combined - a.combined);
                //console.log(traitsData.length);
                context.commit("setTraitsData", traitsData);
                //console.log(context.state.traitsData.length);
                
            }
        },
        ///

        async queryGeneRegion(context, region) {
            //To match with HuGE cal +- 300000 to the region
            let { chromosome, start, end } = region || context.getters.region;
            let q = `${chromosome}:${start - 300000}-${end + 300000}`;

            context.dispatch("genes/query", { q });
        },

        async queryUniprot(context, symbol) {
            let name = symbol || context.getters.canonicalSymbol;

            if (!!symbol) {
                context.dispatch("uniprot/getUniprotGeneInfo", name);
            }
        },

        async queryAssociations(context) {
            let query = { q: context.state.geneName };
            context.dispatch("associations52k/query", query);
            context.dispatch("geneassociations/query", query);
            context.dispatch("geneExpression/query", query);
        },
        async getVarAssociationsData(context, phenotype) {
            let gene = context.state.geneName;
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                context.state.newChr = locus.chr;
                context.state.newStart = locus.start;
                context.state.newEnd = locus.end;
            }

            const phenoRegionQuery = `${phenotype},${locus.chr}:${
                locus.start - 50000
            }-${locus.end + 50000}`;

            context.dispatch("varassociations/query", { q: phenoRegionQuery });
        },
        async get52KAssociationData(context) {
            let name = context.state.geneName;
            context.dispatch("associations52k/query", { q: name });
        },
        async getHugeScoresData(context) {
            //console.log("getHugeScoresData");
            let name = context.state.geneName;
            context.dispatch("hugeScores/query", { q: name });
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
    },
});
