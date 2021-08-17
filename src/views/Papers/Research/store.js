import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import hugeampkpncms from "@/modules/hugeampkpncms";
import umLdServer from "@/modules/umLdServer.js";

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
        umLdServer,
    },
    state: {
        filteredData: "",
        multiGroupsData: "",
        genesInRegion: "",
        variantCorrelations: "",
        bioIndexContinue: [],
        searchParameters: {},
        dataComparison: "newSearch",
    },
    mutations: {
        setFilteredData(state, data) {

            state.filteredData = data;
        },
        setMultiGroupsData(state, data) {

            state.multiGroupsData = data;
        },
        setGenesInRegion(state, data) {

            state.genesInRegion = data;
        },
        setVariantCorrelations(state, data) {

            state.variantCorrelations = data;
        },
        setBioIndexContinue(state, data) {
            state.bioIndexContinue.push(data);
        },
        setSearchParameters(state, data) {
            state.searchParameters = data;
        },
        setDataComparison(state, data) {
            state.dataComparison = data;
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
        variantCorrelations(context, ldData) {
            context.commit("setVariantCorrelations", ldData);
        },
        bioIndexContinue(context, moreData) {
            context.commit("setBioIndexContinue", moreData);
        },
        searchParameters(context, searchParameters) {
            context.commit("setSearchParameters", searchParameters);
        },

        dataComparison(context, dataComparison) {
            context.commit("setDataComparison", dataComparison);
        },
    }
});
