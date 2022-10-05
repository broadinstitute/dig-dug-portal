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
        searchingPhenotype: null,
        searchingAncestry: null,
        genesInRegion: null,
        codingGenesData: null,
        variantCorrelations: "",
        bioIndexContinue: [],
        searchParameters: null,
        dataComparison: "newSearch",
        initialSearch: 1,
        pkgData: {},
        pkgDataSelected: [],
        sharedPlotXpos: null,
        phenotypesInSession: null,
        diseaseInSession: null,
    },
    mutations: {
        setSharedPlotXpos(state, XPOS) {
            state.sharedPlotXpos = XPOS;
        },
        setFilteredData(state, data) {
            state.filteredData = data;
        },
        setUnfilteredData(state, data) {

            state.unfilteredData = data;
        },
        setSearchingRegion(state, data) {

            state.searchingRegion = data;
        },
        setSearchingPhenotype(state, data) {

            state.searchingPhenotype = data;
        },
        setSearchingAncestry(state, data) {

            state.searchingAncestry = data;
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
        setPkgData(state, data) {
            state.pkgData = data;
        },
        setPkgDataSelected(state, data) {
            if (data.action == "add") {
                var tempObject = { type: null, id: null };
                tempObject.type = data.type;
                tempObject.id = data.id;
                state.pkgDataSelected.push(tempObject);
            }

            if (data.action == "remove") {
                let tempArray = [];
                state.pkgDataSelected.map(p => {
                    if (p.type != data.type || p.id != data.id) {
                        tempArray.push(p);
                    }
                })
                state.pkgDataSelected = tempArray;
            }
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        }
    },
    getters: {},
    actions: {
        sharedPlotXpos(context, XPOS) {
            context.commit("setSharedPlotXpos", XPOS);
        },
        filteredData(context, filtered) {
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
        searchingPhenotype(context, phenotype) {
            context.commit("setSearchingPhenotype", phenotype);
        },
        searchingAncestry(context, ancestry) {
            context.commit("setSearchingAncestry", ancestry);
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
        pkgData(context, pkgData) {
            context.commit("setPkgData", pkgData);
        },
        pkgDataSelected(context, data) {
            context.commit("setPkgDataSelected", data);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
    }
});
