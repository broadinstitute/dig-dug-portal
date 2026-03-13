import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";
import dataConvert from "@/utils/dataConvert";

const BIO_INDEX_HOST = "https://sysbio.hugeampkpnbi.org";

Vue.use(Vuex);


export default new Vuex.Store({
  modules: {
    bioPortal,
    kp4cd,
  },
  state: {
    limit: 20,
    bulkData19K: [],
    selectedDataset: keyParams.dataset || 'sysbio_v1',
    defaultComparison: "T001",
    selectedComparison: keyParams.comparison || "",
    selectedGene: keyParams.gene || "",
    bulkFileUrl: `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/`,
    currentComparisons: {},
    selectedAMP: ""
  },

  mutations: {
    setBulkData19K(state, data) {
      state.bulkData19K = data || state.bulkData19K;
    },
    setCurrentComparisons(state, data) {
      state.currentComparisons = data || state.currentComparisons;
      state.defaultComparison = Object.keys(state.currentComparisons)[0];
    },
    setSelectedComparison(state, comparison) {
      state.selectedComparison = comparison;
    },
    setSelectedGene(state, gene){
      state.selectedGene = gene;
    },

  },

  getters: {
  },

  actions: {
    async queryBulkFile(context) {
      let bulkDataObject = [];
      let comparisons = {};
      if (context.state.selectedDataset !== "") {
        let datasetFile = `${context.state.bulkFileUrl
          }${context.state.selectedDataset}/dea.tsv.gz`;
        const response = await fetch(datasetFile);
        const bulkDataText = await response.text();
        bulkDataObject = dataConvert.tsv2Json(bulkDataText);
        const compTypeFinder = /\((\w+)\)/g;
        bulkDataObject.forEach(b => {
          b.absoluteFoldChange = Math.abs(b.logFoldChange)
          let comp_id = b.comparison_id;
          if (!comparisons.comp_id && !!b.comparison){
            comparisons[comp_id] = {label: b.comparison};
          }
        });
        for (const [k, v] of Object.entries(comparisons)){
          let ampAndCellType = v.label.split(":");
          v.amp = ampAndCellType[0];
          v.cellType = ampAndCellType[1];
        }
      }
      context.commit("setBulkData19K", bulkDataObject);
      context.commit("setCurrentComparisons", comparisons);
    },
    resetComparison(context) {
      context.commit("setSelectedComparison", context.state.defaultComparison);
    },
  },
});
