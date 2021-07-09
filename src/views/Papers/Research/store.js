import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import hugeampkpncms from "@/modules/hugeampkpncms";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        hugeampkpncms,
    },
    state: {
        filteredData: "",
        genesInRegion: "",
    },
    mutations: {
        setFilteredData(state, data) {
            //console.log("called 2");
            state.filteredData = data;
        },
        setGenesInRegion(state, data) {
            //console.log("called 2");
            state.genesInRegion = data;
        },
    },
    getters: {},
    actions: {
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        },
        genesInRegion(context, genes) {
            context.commit("setGenesInRegion", genes);
        },
    }
});
