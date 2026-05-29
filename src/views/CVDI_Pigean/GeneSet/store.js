import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import cvdiBioIndex from "../utils/cvdiBioIndex";
import cvdiBioIndexUtils from "../utils/cvdiBioIndexUtils";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanGeneset: cvdiBioIndex("pigean-gene-set"),
    },
    state: {
        geneset: keyParams.geneset,
        genesetToQuery: "",
        aliasName: null,
        traitGroup: keyParams.traitGroup || cvdiBioIndexUtils.DEFAULT_TRAIT_GROUP,
        traitGroupToQuery: null,
        phewasData: [],
    },

    mutations: {
        setGeneset(state, geneset) {
            state.geneset = geneset || state.geneset;
            keyParams.set({ geneset: state.geneset });
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
            console.log("Querying geneset");
            await context.commit("setPhewasData", []);
            let name = context.state.genesetToQuery || context.state.geneset;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGeneset", name);
            context.commit("setTraitGroup", traitGroup);
            let param3 = cvdiBioIndexUtils.DEFAULT_MODEL;
            if (!traitGroup.startsWith('all')){
                console.log("Are we here?");
                await context.dispatch("pigeanGeneset/query", { q: 
                    `${traitGroup},${name},${param3}`});
                context.commit("setPhewasData", context.state.pigeanGeneset.data);
            } else {
                let traits = Object.keys(cvdiBioIndexUtils.TRAIT_GROUPS)
                for (let i = 0; i < traits.length; i++){
                    let group = traits[i];
                    let traitQuery = `${group},${name},${param3},`;
                    let groupData = await cvdiBioIndexUtils.query("pigean-gene-set", traitQuery);
                    traitsData = traitsData.concat(groupData);
                }
                traitsData = traitsData.sort((a,b) => b.combined - a.combined);
                context.commit("setPhewasData", traitsData.slice(0,1500));
            }
        },
    },
});
