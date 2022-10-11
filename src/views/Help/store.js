import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        page: keyParams.page,
    },
    mutations: {
        setPage(state, page) {
            state.page = page || state.page;
            keyParams.set({ page: state.page });
        },
    },
    getters: {
    },
    actions: {
        page(context, PAGE) {
            context.commit("setPage", PAGE);
        },
    }
});
