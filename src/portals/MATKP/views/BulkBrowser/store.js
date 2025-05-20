import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import dataConvert from "@/utils/dataConvert";

Vue.use(Vuex);

const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

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
    selectedDataset: keyParams.dataset || 'bulkRNA_Emont2022_Humans_SAT',
    defaultComparison: "",
    selectedComparison: keyParams.comparison || "",
    selectedGene: keyParams.gene || "",
    bulkFileUrl: `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/`,
    singleBulkZNormUrl: `${BIO_INDEX_HOST}/api/bio/query/single-cell-bulk-z-norm?q=`,
    currentComparisons: {},
  },

  mutations: {
    setSingleBulkZNormData(state, data) {
      state.singleBulkZNormData = data || state.singleBulkZNormData;
    },
    setBulkData19K(state, data) {
      state.bulkData19K = data || state.bulkData19K;
    },
    setCurrentComparisons(state, data) {
      state.currentComparisons = data || state.currentComparisons;
      state.defaultComparison = Object.keys(state.currentComparisons)[0];
    },
    setSelectedComparison(state, comparison) {
      state.selectedComparison = comparison;
    }

  },

  getters: {
  },

  actions: {
    async queryBulk(context) {
      let compQueryParam = context.state.currentComparisons[context.state.selectedComparison];
      let singleBulkZNormObject = {};
      if (context.state.selectedDataset !== "") {
        const query = `${context.state.singleBulkZNormUrl}${context.state.selectedDataset},${compQueryParam}&limit=${context.state.limit}`
        const response = await fetch(query);
        singleBulkZNormObject = await response.json();
      }
      context.commit("setSingleBulkZNormData", singleBulkZNormObject.data);
    },
    async queryBulkFile(context) {
      let bulkDataObject = [];
      let comparisons = {};
      if (context.state.selectedDataset !== "") {
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
    resetComparison(context) {
      context.commit("setSelectedComparison", context.state.defaultComparison);
    }

  },
});
