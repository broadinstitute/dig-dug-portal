export default {
  namespaced: true,
  state() {
    return { phenotypeMap: null };
  },
  mutations: {
    setPhenotypeMap(state, map) {
      state.phenotypeMap = map;
    }
  },
  actions: {
    async getPhenotypes(context) {
      console.log("inside something here");
      let json = await fetch("/kb/getPhenotypes").then(resp => resp.json());
      context.commit("setPhenotypeMap", json);
    }
  }
};
