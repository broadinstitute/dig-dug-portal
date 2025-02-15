/**
 * This is the module that is used to pull the news feed for KPN website

 */

import Vue from "vue";
import VueCookies from "vue-cookies";
Vue.use(VueCookies);

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            researchMode: [],
            researchPage: [],
            researchMethod: [],
            researchMenu: [],
            researchData: [],
            genesInRegion: [],
            genesData: null,
            researchDataEmpty: null,
        };
    },

    // commit methods
    mutations: {
        setResearchMode(state, data) {
            state.researchMode = data;
        },
        setResearchPage(state, data) {
            state.researchPage = data;
        },
        setResearchMethod(state, data) {
            state.researchMethod = data;
        },
        setResearchMenu(state, data) {
            state.researchMenu = data;
        },
        setResearchData(state, data) {
            state.researchData = data;

            let parsedData = (typeof data == 'object') ? data : (data.charAt(0) == '{') ? JSON.parse(data) : data;

            if (typeof parsedData == 'object' && !!parsedData.data) {

                if (parsedData.data.length > 0) {
                    state.researchDataEmpty = false;
                } else if (parsedData.data.length == 0) {
                    state.researchDataEmpty = true;
                }
            }
        },
        setGenesInRegion(state, data) {
            state.genesInRegion = data;
        },
        setGenesData(state, data) {
            state.genesData = data;
        },
    },

    // dispatch methods
    actions: {
        async getResearchMode(context, param) {
            let json = await fetch(
                "https://hugeampkpncms.org/view/rest/get_research_page_access?pageid=" + param.pageID
            ).then(resp => resp.json());
            //check for cookie if dev mode
            if (!!json[0].field_page_mode && json[0].field_page_mode === 'dev') {
                const cookieCheck = Vue.$cookies.get(`KPN_${param.pageID}`);
                //login if cookie exists
                if (cookieCheck) context.dispatch("getResearchDevPage", { pageID: param.pageID, devID: cookieCheck.u, devPW: cookieCheck.p });
            }
            // set the data
            context.commit("setResearchMode", json);
        },
        async getResearchMethod(context, param) {

            let json = await fetch(
                "https://hugeampkpncms.org/view/rest/get_research_method?method=" + param.methodID
            ).then(resp => resp.json());
            // set the data
            context.commit("setResearchMethod", json);
        },
        async getResearchMenu(context, param) {

            let json = await fetch(
                "https://hugeampkpncms.org/view/rest/get_research_menu?menu=" + param.menuID
            ).then(resp => resp.json());
            context.commit("setResearchMenu", json);
        },
        async getResearchDevPage(context, param) {
            if (param.devID != "" && param.devPW != "") {
                let json = await fetch(
                    "https://hugeampkpncms.org/view/rest/get_research_page_dev?pageid=" + param.pageID + "&&devid=" + param.devID + "&&devpw=" + param.devPW
                ).then(resp => resp.json());
                //if login successful, and user wants to be remembered
                if (json.length > 0 && param.devCK) {
                    //set cookie for 14 days
                    const cookieValues = { u: param.devID, p: param.devPW };
                    Vue.$cookies.set(`KPN_${param.pageID}`, cookieValues, "14d");//14 days //30MIN
                }
                // set the data
                context.commit("setResearchPage", json);
            }

        },
        async getResearchPage(context, param) {
            let json = await fetch(
                "https://hugeampkpncms.org/view/rest/get_research_page?pageid=" + param.pageID
            ).then(resp => resp.json());
            // set the data
            context.commit("setResearchPage", json);
        },
        cancelResearchData(context) {
            context.commit("setResearchData", []);
        },
        async getResearchData(context, param) {

            let fetchUrl = (param.domain == "hugeampkpn") ? "https://hugeampkpncms.org/servedata/dataset?dataset=" + param.dataPoint : param.dataPoint;
            let csv = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

            context.commit("setResearchData", csv);
        },
        async getGenesInRegion(context, param) {

            let fetchUrl = "https://bioindex.hugeamp.org/api/bio/query/genes?q=" + param.region;
            let genes = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

            context.commit("setGenesInRegion", genes);
        },
        async getGenesData(context, param) {

            let fetchUrl = "https://portaldev.sph.umich.edu/api/v1/annotation/genes/?filter=source in 3 and gene_name in " + param.genes;
            let genesData = await fetch(fetchUrl).then(resp => resp.text(fetchUrl));

            context.commit("setGenesData", genesData);
        },

        directInputData(context, data) {
            context.commit("setResearchData", data);
        }
    }
};
