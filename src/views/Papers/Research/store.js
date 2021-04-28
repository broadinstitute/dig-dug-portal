import Vue from "vue";
import Vuex from "vuex";

import uiUtils from "@/utils/uiUtils";
import formatters from "@/utils/formatters";
import hugeampkpncms from "@/modules/hugeampkpncms";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        hugeampkpncms,
        ...uiUtils,
        ...formatters,
    },
    state: {

    },
    mutations: {
    },
    getters: {},
    actions: {
    }
});
