import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import effectorGenes from "@/modules/effectorGenes";
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
        effectorGenes,
        hugeampkpncms
    },
    state: {
        geneName: "",
        tableData: "",
        filteredData: "",
        config: "",
        pageTitle: "",
        plotsConfig: ""
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
            let newTitle = configData["config"][configData["dataset"]]["title"];
            state.pageTitle = newTitle;
        },
        setPlotsConfig(state, configData) {
            let plotsConfig =
                configData["config"][configData["dataset"]]["plots"];
            state.plotsConfig = plotsConfig;
        }
    },
    getters: {},
    actions: {
        selectGene(context, gene) {
            context.commit("setGene", gene);
        },
        async fetchConfig(context, config) {
            /*
            let fetchUrl = (param.domain == "hugeampkpn") ? "https://hugeampkpncms.org/servedata/dataset?dataset=" + param.dataPoint : param.dataPoint;
            let csv = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));
            */
            /*let json = await fetch(
                `https://kp4cd.org/egldata/config?dataset=${config.dataset}`
            ).then(resp => resp.json());*/

            //let configUrl = 'https://hugeampkpncms.org/sites/default/files/users/user1/egl_data/'+config.dataset+

            let json = await fetch(
                `https://hugeampkpncms.org/servedata/dataset?dataset=https://hugeampkpncms.org/sites/default/files/users/user1/egl_data/${config.dataset}/${config.dataset}_config.json`
            ).then(resp => resp.json());



            let parsedJson = JSON.parse(json)

            context.commit("setConfig", parsedJson);
            context.commit("setPageTitle", {
                config: parsedJson,
                dataset: config.dataset
            });
            context.commit("setPlotsConfig", {
                config: parsedJson,
                dataset: config.dataset
            });
        },
        async fetchData(context, dataset) {

            /*let json = await fetch(
                `https://kp4cd.org/egldata/dataset?dataset=${dataset.dataset}&trait=${dataset.trait}`
            ).then(resp => resp.json());*/
            let json = await fetch(
                `https://hugeampkpncms.org/servedata/dataset?dataset=https://hugeampkpncms.org/sites/default/files/users/user1/egl_data/${dataset.dataset}/${dataset.dataset}_${dataset.trait}.json`
            ).then(resp => resp.json());

            let parsedJson = JSON.parse(json)

            context.commit("setTableData", parsedJson.data);
            context.commit("setFilteredData", parsedJson.data);
        },
        filteredData(context, filtered) {
            context.commit("setFilteredData", filtered);
        }
    }
});
