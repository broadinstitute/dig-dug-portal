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
        singleBulkZNorm: bioIndex("single-cell-bulk-z-norm"),
    },
    state: {
      singleBulkZNormData: [],
      selectedDataset: 'bulkRNA_Emont2022_Humans_SAT',
      selectedComparison: 'insulin sensitive vs. insulin resistant',
    },

    mutations: {
        setSingleBulkZNormData(state, data){
          state.singleBulkZNormData = data || state.singleBulkZNormData;
        }
        
    },

    getters: {
    },

    actions: {
        async queryBulk(context){
          await context.dispatch("singleBulkZNorm/query", 
            {q: `${context.state.selectedDataset},${context.state.selectedComparison}`});
          context.commit("setSingleBulkZNormData", context.state.singleBulkZNorm.data);
        }
        
    },
});
