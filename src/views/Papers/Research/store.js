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
        multiGroupsData: "",
        genesInRegion: "",
        bioIndexContinue: [],
    },
    mutations: {
        setFilteredData(state, data) {
            //console.log("called 2");
            state.filteredData = data;
        },
        setMultiGroupsData(state, data) {
            //console.log("called 2");
            state.multiGroupsData = data;
        },
        setGenesInRegion(state, data) {
            //console.log("called 2");
            state.genesInRegion = data;
        },
        setBioIndexContinue(state, data) {
            state.bioIndexContinue.push(data);
        },
    },
    getters: {},
    actions: {
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        },
        multiGroupsData(context, data) {
            context.commit("setMultiGroupsData", data);
        },
        genesInRegion(context, genes) {
            context.commit("setGenesInRegion", genes);
        },
        bioIndexContinue(context, moreData) {
            context.commit("setBioIndexContinue", moreData);
        }
    }
});
