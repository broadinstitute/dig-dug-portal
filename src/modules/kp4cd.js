/**
 * This is the module that is used to pull the news feed for KPN website

 */

// Fetch JSON from hugeampkpncms.org. A non-OK answer is an error; an empty array is a valid answer.
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

<<<<<<< HEAD
            let json = await fetch(
                `https://hugeampkpncms.org/rest/views/news2vueportal?portal=` + portal
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/news2vueportal?portal=` + portal
            );
>>>>>>> master
            // set the data
            context.commit("setNewsFeed", json);
        },

        async getFrontContents(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/reset/views/portal_front?portal=" + portal
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/reset/views/portal_front?portal=` + portal
            );
>>>>>>> master
            // set the data
            context.commit("setFrontContents", json);
        },

        async getDatasetsInfo(context, selectedDiseaseGroup) {
            let portal =
                selectedDiseaseGroup == "md" ? "" : selectedDiseaseGroup;
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/kpdatasets?portal=" + portal
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/kpdatasets?portal=` + portal
            );
>>>>>>> master
            // set the data
            context.commit("setDatasetsInfo", json);
        },

        async getDatasetInfo(context, datasetId) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/datasetinfo?datasetid=" +
                    datasetId
            ).then((resp) => resp.json());
            // set the data
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/datasetinfo?datasetid=` + datasetId
            );
            // set the dat
>>>>>>> master
            context.commit("setDatasetInfo", json);
        },

        async getPageInfo(context, query) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/" +
                    query.page +
                    "?portal=" +
                    query.portal
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/${query.page}?portal=${query.portal}`
            );
>>>>>>> master
            // set the data
            context.commit("setPageInfo", json);
        },

        async getNewFeatures(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/newfeatures?portal=" +
                    selectedDiseaseGroup
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/newfeatures?portal=` + selectedDiseaseGroup
            );
>>>>>>> master
            // set the data
            context.commit("setNewFeatures", json);
        },
        async getResources(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/newresources?portal=" +
                    selectedDiseaseGroup
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/newresources?portal=` + selectedDiseaseGroup
            );
>>>>>>> master
            // set the data
            context.commit("setResources", json);
        },
        async getResearchMethod(context, methodFrom) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/eglmethod?from=" + methodFrom
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/eglmethod?from=` + methodFrom
            );
>>>>>>> master
            // set the data
            context.commit("setResearchMethod", json);
        },
        async getEglSummaries(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/eglmethodsperportal?portal=" +
                    selectedDiseaseGroup
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/eglmethodsperportal?portal=` +
                selectedDiseaseGroup
            );
>>>>>>> master
            // set the data
            context.commit("setEglSummaries", json);
        },
        async getEglData(context, targetData) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/egldata/dataset?dataset=" +
                    targetData.dataset +
                    "&trait=" +
                    targetData.trait
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/egldata/dataset?dataset=` +
                targetData.dataset +
                "&trait=" +
                targetData.trait
            );
>>>>>>> master

            context.commit("setEglData", json);
        },
        async getResearchData(context, targetDataPoint) {
            let json = await fetch(targetDataPoint).then((resp) => resp.json());

            context.commit("setResearchData", json);
        },
        async getResearchDataPage(context, param) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/research_data?dataid=" +
                    param.pageID +
                    "&&reviewerid=" +
                    param.reviewerID +
                    "&&reviewercode=" +
                    param.reviewerCode
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/research_data?dataid=` +
                param.pageID +
                "&&reviewerid=" +
                param.reviewerID +
                "&&reviewercode=" +
                param.reviewerCode
            );
>>>>>>> master
            // set the data
            context.commit("setResearchDataPage", json);
        },
        async getEglConfig(context, targetData) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/egldata/config?dataset=" +
                    targetData.dataset +
                    "&trait=" +
                    targetData.trait
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/egldata/config?dataset=` +
                targetData.dataset +
                "&trait=" +
                targetData.trait
            );
>>>>>>> master

            context.commit("setEglConfig", json);
        },
        async getForestPlotData(context) {
            let json = await fetch(
                "https://raw.githubusercontent.com/statgen/locuszoom/develop/examples/data/phewas_forest.json"
            ).then((resp) => resp.json());

            context.commit("setForestPlotData", json);
        },
        async getStaticContent(context, page) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/static_content?field_page=" + page
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/static_content?field_page=` + page
            );
>>>>>>> master
            // set the data
            context.commit("setStaticContent", json);
        },
        async getPaperMenu(context, paperPage) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/paperheadermenu?paper=" +
                    paperPage
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/paperheadermenu?paper=` +
                paperPage
            );
>>>>>>> master
            // set the data
            context.commit("setPaperMenu", json);
        },
        async getPortals(context) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/a2f_community_kps"
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/a2f_community_kps`
            );
>>>>>>> master
            // set the data
            context.commit("setPortals", json);
        },
        async getHelpBook(context) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/help_book"
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/help_book`
            );
>>>>>>> master
            // set the data
            context.commit("setHelpBook", json);
        },
        async getContentByID(context, nid) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/content_by_id?nid=" + nid
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/content_by_id?nid=` + nid
            );
>>>>>>> master
            // set the data
            context.commit("setContentByID", json);
        },
        async getHelpBookSearch(context, searchKey) {
<<<<<<< HEAD
            let json = await fetch(
                "https://hugeampkpncms.org/rest/views/help_book_search?body=" +
                    searchKey
            ).then((resp) => resp.json());
=======
            let json = await fetchJson(
                `https://hugeampkpncms.org/rest/views/help_book_search?body=` +
                searchKey
            );
>>>>>>> master
            // set the data
            context.commit("setHelpBookSearch", json);
        },
    },
};
