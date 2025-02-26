import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import dataConvert from "@/utils/dataConvert";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        singleBulkZNorm: bioIndex("single-cell-bulk-z-norm"),
    },
    state: {
      limit: 20,
      singleBulkZNormData: [],
      bulkData19K: [],
      selectedDataset: 'bulkRNA_Emont2022_Humans_SAT',
      selectedComparison: 'insulin sensitive vs. insulin resistant',
      bulkFileUrl: `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/`,
      currentComparisons: {},
    },

    mutations: {
        setSingleBulkZNormData(state, data){
          state.singleBulkZNormData = data || state.singleBulkZNormData;
        },
        setBulkData19K(state, data){
          state.bulkData19K = data || state.bulkData19K;
        },
        setCurrentComparisons(state, data){
          state.currentComparisons = data || state.currentComparisons;
        },
        setSelectedComparison(state, comparison){
          state.selectedComparison = comparison;
        }
        
    },

    getters: {
    },

    actions: {
        async queryBulk(context){
          let compQueryParam = context.state.currentComparisons[context.state.selectedComparison];
          console.log("querying ", compQueryParam);
          await context.dispatch("singleBulkZNorm/query",
            {q: `${context.state.selectedDataset},${compQueryParam}`,
              limit: context.state.limit});
          context.commit("setSingleBulkZNormData", context.state.singleBulkZNorm.data);          
        },
        async queryBulkFile(context){
          let bulkDataObject = [];
          let comparisons = {};
          if (context.state.selectedDataset !== ""){
            let datasetFile = `${context.state.bulkFileUrl
              }${context.state.selectedDataset}/dea.tsv.gz`;
            const response = await fetch(datasetFile);
            const bulkDataText = await response.text();
            bulkDataObject = dataConvert.tsv2Json(bulkDataText);
            let bulkDataComparisons = bulkDataObject
              .filter(item => !!item.comparison)
              .map(item => [item.comparison_id, item.comparison]);
            comparisons = Object.fromEntries(bulkDataComparisons);
          }
          context.commit("setBulkData19K", bulkDataObject);
          context.commit("setCurrentComparisons", comparisons);
        },
        resetComparison(context){
          let defaultComparison = Object.keys(context.state.currentComparisons)[0];
          context.commit("setSelectedComparison", defaultComparison);
        }
        
    },
});
