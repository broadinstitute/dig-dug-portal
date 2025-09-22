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
        searchParametersArr: [],
        dataComparison: "newSearch",
        initialSearch: 1,
        pkgData: {},
        pkgDataSelected: [],
        sharedPlotXpos: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
        /// muti-sections use
        capturedData: [],
        topLevelLDData: null,
        topLevelLDServer: null,
        selectedSplice: null,
        ///
    },
    mutations: {
        /// multi-sections use
        setCapturedData(state, data) {
            switch (data.action) {

                case "add":
                    delete data.action;
                    state.capturedData.push(data);
                    break;

                case "remove":

                    state.capturedData = [...new Set(state.capturedData.filter(d => d.title != data.title))];

                    break;
            }

            console.log("state.capturedData", state.capturedData);
        },
        ///
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
        setSearchParametersArr(state, data) {

            switch (data.action) {

                case "add":
                    state.searchParametersArr.push(data.data);
                    break;

                case "reset":
                    state.searchParametersArr = [];
                    state.searchParametersArr.push(data.data);
                    break;
            }

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
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        },
        setTopLevelLDData(state, DATA){
            state.topLevelLDData = DATA;
        },
        setTopLevelLDServer(state, DATA){
            state.topLevelLDServer = DATA;
        },
        setSelectedSplice(state, DATA){
            state.selectedSplice = DATA;
        }
    },
    getters: {},
    actions: {
        /// multi-sections use
        capturedData(context, data) {
            context.commit("setCapturedData", data);
        },
        ///
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
        searchParametersArr(context, data) {

            context.commit("setSearchParametersArr", data);
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
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
        sendLDData(context, DATA){
            context.commit("setTopLevelLDData", DATA.data);
            context.commit("setTopLevelLDServer", DATA.server);
        },
        selectSplice(context, DATA){
            context.commit("setSelectedSplice", DATA);
        }
    }
});
