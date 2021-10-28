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
        unfilteredData: "",
        searchingRegion: null,
        genesInRegion: null,
        codingGenesData: null,
        variantCorrelations: "",
        bioIndexContinue: [],
        searchParameters: null,
        dataComparison: "newSearch",
        initialSearch: 1,
    },
    mutations: {
        setFilteredData(state, data) {
            state.filteredData = data;
        },
        setUnfilteredData(state, data) {

            state.unfilteredData = data;
        },
        setSearchingRegion(state, data) {

            state.searchingRegion = data;
        },
        setGenesInRegion(state, data) {

            state.genesInRegion = data;
        },
        setCodingGenesData(state, data) {

            state.codingGenesData = data;
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
            console.log("called");
            context.commit("setFilteredData", filtered);
        },
        unfilteredData(context, unfiltered) {
            context.commit("setUnfilteredData", unfiltered);
        },
        genesInRegion(context, genes) {
            context.commit("setGenesInRegion", genes);
        },
        searchingRegion(context, region) {
            context.commit("setSearchingRegion", region);
        },
        codingGenesData(context, setCodingGenesData) {
            context.commit("setCodingGenesData", setCodingGenesData);
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
