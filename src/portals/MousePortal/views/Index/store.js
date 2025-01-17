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
    },
    state: {
    },

    mutations: {},

    getters: {
    },

    actions: {
    },
});
