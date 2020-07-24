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
        config: ""
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
        }
    },
    getters: {},
    actions: {
        selectGene(context, gene) {
            context.commit("setGene", gene);
        },
        async fetchConfig(context, config) {
            let json = await fetch(`/data/${config}_config.json`).then(resp =>
                resp.json()
            );
            context.commit("setConfig", json);
        },
        async fetchData(context, dataset) {
            let json = await fetch(`/data/${dataset}_data.json`).then(resp =>
                resp.json()
            );
            context.commit("setTableData", json.data);
            context.commit("setFilteredData", json.data);
        },
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        }
    }
});
