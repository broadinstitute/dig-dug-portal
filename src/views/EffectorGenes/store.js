import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        filteredData: "",
        unfilteredData: "",
    },
    mutations: {
        setFilteredData(state, data) {
            state.filteredData = data;
        },
        setUnfilteredData(state, data) {

            state.unfilteredData = data;
        },
    },
    getters: {
    },
    actions: {
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        },
        unfilteredData(context, unfiltered) {
            context.commit("setUnfilteredData", unfiltered);
        },
    }
});
