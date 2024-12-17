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
        pigeanGeneset: bioIndex("pigean-gene-set"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        geneset: keyParams.geneset,
        genesetSize: keyParams.genesetSize || bioIndexUtils.DEFAULT_GENESET_SIZE,
        genesetToQuery: "",
        genesetSizeToQuery: null,
        aliasName: null,
        traitGroup: keyParams.traitGroup || bioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
        phewasData: [],
    },

    mutations: {
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
        },
        setGenesetSize(state, genesetSize){
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
        setPhewasData(state, phewasData){
            state.phewasData = phewasData;
        }
    },

    getters: {
    },

    actions: {
        async queryGeneset(context, symbol) {
            await context.commit("setPhewasData", []);
            let name = context.state.genesetToQuery || context.state.geneset;
            let genesetSize = context.state.genesetSizeToQuery || context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGeneset", name);
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);

            if (traitGroup !== 'all'){
                await context.dispatch("pigeanGeneset/query", { q: 
                    `${traitGroup},${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`});
                context.commit("setPhewasData", context.state.pigeanGeneset.data);
            } else {
                // If ALL is selected, query all trait groups and get top results across all
                let traitsData = [];
                for (let i = 0; i < bioIndexUtils.TRAIT_GROUPS.length; i++){
                    let group = bioIndexUtils.TRAIT_GROUPS[i];
                    let traitQuery = `${group},${name},${
                        bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`;
                    let groupData = await bioIndexUtils.query("pigean-gene-set", traitQuery);
                    traitsData = traitsData.concat(groupData);
                }
                traitsData = traitsData.sort((a,b) => b.combined - a.combined);
                context.commit("setPhewasData", traitsData.slice(0,1500));
            }
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
        
    },
});
