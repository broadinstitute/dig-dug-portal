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
        searchKey: null,
        searchedKey: null,
    },
    mutations: {
        setPage(state, page) {
            state.page = page || state.page;
            keyParams.set({ page: state.page });
        },

        setSearchedKey(state, KEY) {
            state.searchedKey = KEY;
        },
    },
    getters: {
    },
    actions: {
        page(context, PAGE) {
            context.commit("setPage", PAGE);
        },
        searchedKey(context, KEY) {
            context.commit("setSearchedKey", KEY);
        }
    }
});
