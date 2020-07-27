import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import effectorGenes from "@/modules/effectorGenes";

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
        effectorGenes
    },
    state: {
        geneName: "",
        tableData: "",
        filteredData: "",
        config: "",
        pageTitle: ""
    },
    mutations: {
        setGene(state, gene) {
            state.geneName = gene;
        },
        setTableData(state, data) {
            state.tableData = data;
        },
        setFilteredData(state, data) {
            state.filteredData = data;
        },
        setConfig(state, config) {
            state.config = config;
        },
        setPageTitle(state, configData) {
            //console.log(configData["config"][configData["dataset"]]["title"]);

            let newTitle = configData["config"][configData["dataset"]]["title"];
            state.pageTitle = newTitle;
        },
    },
    getters: {},
    actions: {
        selectGene(context, gene) {
            context.commit("setGene", gene);
        },
        async fetchConfig(context, config) {
            let json = await fetch(
                `http://kp4cd.org/egldata/config?dataset=${config.dataset}`
            ).then(resp => resp.json());
            context.commit("setConfig", json);
            context.commit("setPageTitle", { config: json, dataset: config.dataset });
        },
        async fetchData(context, dataset) {
            let json = await fetch(
                `http://kp4cd.org/egldata/dataset?dataset=${dataset.dataset}&trait=${dataset.trait}`
            ).then(resp => resp.json());
            context.commit("setTableData", json.data);
            context.commit("setFilteredData", json.data);
        },
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        }
    }
});
