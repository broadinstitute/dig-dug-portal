import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        datasets: bioIndex("datasets")
    },
    state: {
    },
    mutations: {
    },
    getters: {
    },
    actions: {
    }
});
