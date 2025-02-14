import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        singleBulkZNorm: bioIndex("single-cell-bulk-z-norm"),
    },
    state: {
      limit: 10000, // not using this for now
      singleBulkZNormData: [],
      selectedDataset: 'bulkRNA_Emont2022_Humans_SAT',
      selectedComparison: 'insulin sensitive vs. insulin resistant',
      bulkFileUrl: `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/`
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
        },
        async queryBulkFile(context){
          let datasetFile = `${context.state.bulkFileUrl
            }${context.state.selectedDataset}/dea.tsv.gz`;
          const response = await fetch(datasetFile);
          const bulkDataText = await response.text();
          console.log(bulkDataText);
        }
        
    },
});
