import Vue from "vue";
import Vuex from "vuex";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        gene: bioIndex("gene"),
        pigeanGene: bioIndex("pigean-gene"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        geneName: keyParams.gene,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        geneToQuery: "",
        genesetSizeToQuery: null,
        aliasName: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
        phewasData: [],
    },

    mutations: {
        setGeneName(state, geneName) {
            state.geneName = geneName || state.geneName;
            keyParams.set({ gene: state.geneName });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
        setGene(state, { name, chromosome, start, end }) {
            state.geneName = name;
            state.geneRegion = `${chromosome}:${start}-${end}`;
        },
        setAliasName(state, aliasName) {
            state.aliasName = aliasName || state.aliasName;
        },
        setPhewasData(state, phewasData){
            state.phewasData = phewasData;
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
        canonicalSymbol(state) {
            let data = state.gene.data;
            if (data.length > 0) {
                return data[0].symbol;
            }
            return null;
        },
    },

    actions: {
        async queryGeneName(context, symbol) {
            await context.commit("setPhewasData", []);
            let name = context.state.geneToQuery || context.state.geneName;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGeneName", name);
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);
            if (!!name) {
                context.dispatch("gene/query", { q: name });
                if (traitGroup !== 'all'){
                    await context.dispatch("pigeanGene/query", { q: 
                        `${traitGroup},${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`});
                    context.commit("setPhewasData", context.state.pigeanGene.data);
                } else {
                    // If ALL is selected, query all trait groups and get top results across all
                    const TRAIT_GROUPS = ["portal", "gcat_trait", "rare_v2"];
                    let traitsData = [];
                    for (let i = 0; i < TRAIT_GROUPS.length; i++){
                        let group = TRAIT_GROUPS[i];
                        let traitQuery = `${group},${context.state.geneName},${
                            bioIndexUtils.DEFAULT_SIGMA},${context.state.genesetSize}`;
                        let groupData = await bioIndexUtils.query("pigean-gene", traitQuery);
                        traitsData = traitsData.concat(groupData);
                    }
                    traitsData = traitsData.sort((a,b) => b.combined - a.combined);
                    context.commit("setPhewasData", traitsData.slice(0,1500));
                }
            }
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
    },
});
