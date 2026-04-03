import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import dataConvert from "@/utils/dataConvert";
import BIO_INDEX_HOST from "@/utils/bioIndexUtils";
const PANKBASE_BIOINDEX = BIO_INDEX_HOST.BIO_INDEX_HOST.replace("hugeamp", "pankbase");


Vue.use(Vuex);


export default new Vuex.Store({
  modules: {
    bioPortal,
    kp4cd,
    singleBulkZNorm: bioIndex("single-cell-bulk-z-norm"),
    singleBulkMelted: bioIndex("single-cell-bulk-melted")

  },
  state: {
    dataset: keyParams.dataset || "functional_dataset_v1/",
    allTraits: null,
    gcg: null,
    ins: null,
    metadata: null

  },

  mutations: {
  },

  getters: {
  },

  actions: {
    async populateData(context, fileLocations){
        let rawFilesLocation = `${PANKBASE_BIOINDEX}/api/raw/file/functional_data/${context.state.dataset}/`;
        let files = Object.keys(fileLocations);
        for (let i = 0; i < files.length; i++){
            let file = files[i];
            let suffix = fileLocations[file];
            let url = rawFilesLocation.concat(suffix);
            const response = await fetch(url);
            const fileText = await response.text();
            console.log(file, fileText.slice(0,100));
        }
    }
  },
});
