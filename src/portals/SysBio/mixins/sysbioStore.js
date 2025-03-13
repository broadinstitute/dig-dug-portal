import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    bioPortal,
  },
});