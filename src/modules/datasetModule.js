export default {
  namespaced: true,
  state() {
    return { datasetList: null };
  },
  mutations: {
    updateDatasetList(state, datasetList) {
      state.datasetList = datasetList;
    }
  },
  actions: {
    async getDatasets(context, phenotype) {
      let json = await fetch(`/kb/getDatasets/${phenotype}`).then(resp =>
        resp.json()
      );
      context.commit("updateDatasetList", json);
    }
  }
};
