/**
 * This is the module that is used to pull the news feed for KPN website

 */

const CONTENT_CMS_BASE_URL = "https://api-qa.hugeampkpnbi.org/api/cms"; // Git-backed CMS API
// const CONTENT_CMS_BASE_URL = "http://127.0.0.1:8787"; // Local Git-backed API

const LEGACY_CMS_HOSTS = new Set([
    "kp4cd.org",
    "www.kp4cd.org",
    "hugeampkpncms.org",
    "www.hugeampkpncms.org",
]);

function retargetLegacyCmsApi(url) {
    if (typeof url !== "string" || !url) return url;
    try {
        const parsed = new URL(url);
        if (!LEGACY_CMS_HOSTS.has(parsed.hostname.toLowerCase())) return url;
        if (!/^\/(rest|reset|egldata|servedata|view)(\/|$)/.test(parsed.pathname)) return url;
        return `${CONTENT_CMS_BASE_URL}${parsed.pathname}${parsed.search}`;
    } catch (error) {
        return url;
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
    }
    return response.json();
}

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            newsFeed: [],
            frontContents: [],
            datasetsInfo: [],
            datasetInfo: [],
            pageInfo: [],
            newFeatures: [],
            resources: [],
            researchMethod: [],
            eglSummaries: [],
            eglData: [],
            researchData: [],
            researchDataPage: [],
            eglConfig: [],
            paperMenu: [],
            forestPlotData: {},
            staticContent: [],
            portals: [],
            helpBook: [],
            helpBookSearch: [],
            contentByID: [],
        };
    },

    // commit methods
    mutations: {
        setNewsFeed(state, newsFeed) {
            state.newsFeed = newsFeed;
        },
        setFrontContents(state, frontContents) {
            state.frontContents = frontContents;
        },
        setDatasetsInfo(state, datasetsInfo) {
            state.datasetsInfo = datasetsInfo;
        },
        setDatasetInfo(state, datasetInfo) {
            state.datasetInfo = datasetInfo;
        },
        setPageInfo(state, pageInfo) {
            state.pageInfo = pageInfo;
        },
        setNewFeatures(state, newFeatures) {
            state.newFeatures = newFeatures;
        },
        setResources(state, resources) {
            state.resources = resources;
        },
        setEglSummaries(state, eglSummaries) {
            state.eglSummaries = eglSummaries;
        },
        setResearchMethod(state, researchMethod) {
            state.researchMethod = researchMethod;
        },
        setEglData(state, data) {
            state.eglData = data;
        },
        setResearchData(state, data) {
            state.researchData = data;
        },
        setResearchDataPage(state, data) {
            state.researchDataPage = data;
        },
        setEglConfig(state, config) {
            state.eglConfig = config;
        },
        setForestPlotData(state, data) {
            state.forestPlotData = data;
        },
        setStaticContent(state, data) {
            state.staticContent = data;
        },
        setPaperMenu(state, menu) {
            state.paperMenu = menu;
        },
        setPortals(state, portals) {
            state.portals = portals;
        },
        setHelpBook(state, book) {
            state.helpBook = book;
        },
        setHelpBookSearch(state, searchReturn) {
            state.helpBookSearch = searchReturn;
        },
        setContentByID(state, content) {
            state.contentByID = content;
        },
    },

    // dispatch methods
    actions: {
        async getNewsFeed(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/news2vueportal?portal=` + portal
            );
            context.commit("setNewsFeed", json);
        },

        async getFrontContents(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/reset/views/portal_front?portal=` + portal
            );
            context.commit("setFrontContents", json);
        },

        async getDatasetsInfo(context, selectedDiseaseGroup) {
            let portal =
                selectedDiseaseGroup == "md" ? "" : selectedDiseaseGroup;
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/kpdatasets?portal=` + portal
            );
            context.commit("setDatasetsInfo", json);
        },

        async getDatasetInfo(context, datasetId) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/datasetinfo?datasetid=` + datasetId
            );
            context.commit("setDatasetInfo", json);
        },

        async getPageInfo(context, query) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/${query.page}?portal=${query.portal}`
            );
            context.commit("setPageInfo", json);
        },

        async getNewFeatures(context, selectedDiseaseGroup) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/newfeatures?portal=` + selectedDiseaseGroup
            );
            context.commit("setNewFeatures", json);
        },
        async getResources(context, selectedDiseaseGroup) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/newresources?portal=` + selectedDiseaseGroup
            );
            context.commit("setResources", json);
        },
        async getResearchMethod(context, methodFrom) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/eglmethod?from=` + methodFrom
            );
            context.commit("setResearchMethod", json);
        },
        async getEglSummaries(context, selectedDiseaseGroup) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/eglmethodsperportal?portal=` +
                selectedDiseaseGroup
            );
            context.commit("setEglSummaries", json);
        },
        async getEglData(context, targetData) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/egldata/dataset?dataset=` +
                targetData.dataset +
                "&trait=" +
                targetData.trait
            );

            context.commit("setEglData", json);
        },
        async getResearchData(context, targetDataPoint) {
            let json = await fetchJson(retargetLegacyCmsApi(targetDataPoint));
            context.commit("setResearchData", json);
        },
        async getResearchDataPage(context, param) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/research_data?dataid=` +
                param.pageID +
                "&&reviewerid=" +
                param.reviewerID +
                "&&reviewercode=" +
                param.reviewerCode
            );
            context.commit("setResearchDataPage", json);
        },
        async getEglConfig(context, targetData) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/egldata/config?dataset=` +
                targetData.dataset +
                "&trait=" +
                targetData.trait
            );

            context.commit("setEglConfig", json);
        },
        async getForestPlotData(context) {
            let json = await fetch(
                "https://raw.githubusercontent.com/statgen/locuszoom/develop/examples/data/phewas_forest.json"
            ).then((resp) => resp.json());

            context.commit("setForestPlotData", json);
        },
        async getStaticContent(context, page) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/static_content?field_page=` + page
            );
            context.commit("setStaticContent", json);
        },
        async getPaperMenu(context, paperPage) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/paperheadermenu?paper=` +
                paperPage
            );
            context.commit("setPaperMenu", json);
        },
        async getPortals(context) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/a2f_community_kps`
            );
            context.commit("setPortals", json);
        },
        async getHelpBook(context) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/help_book`
            );
            context.commit("setHelpBook", json);
        },
        async getContentByID(context, nid) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/content_by_id?nid=` + nid
            );
            context.commit("setContentByID", json);
        },
        async getHelpBookSearch(context, searchKey) {
            let json = await fetchJson(
                `${CONTENT_CMS_BASE_URL}/rest/views/help_book_search?body=` +
                searchKey
            );
            context.commit("setHelpBookSearch", json);
        },
    },
};
