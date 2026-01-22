/**
 * This is the module that is used to pull the news feed for KPN website

 */

// Helper function to fetch with fallback: try hugeampkpncms.org first, fallback to kp4cd.org on error
async function fetchWithFallback(url) {
    // Replace kp4cd.org with hugeampkpncms.org for the first attempt
    const primaryUrl = url.replace('https://kp4cd.org', 'https://hugeampkpncms.org');
    const fallbackUrl = url;

    let response;
    try {
        response = await fetch(primaryUrl);
        // Check if response is ok (status 200-299)
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        // Network error or other fetch failure - will try fallback below
        console.log(`Primary URL (${primaryUrl}) failed with error: ${error.message}, trying fallback...`);
    }

    // If we get here, primary either returned non-OK status or threw an error
    // Try fallback URL
    if (response && !response.ok) {
        console.log(`Primary URL (${primaryUrl}) returned ${response.status}, trying fallback (${fallbackUrl})...`);
    }

    try {
        const fallbackResponse = await fetch(fallbackUrl);
        if (!fallbackResponse.ok) {
            throw new Error(`Fallback URL (${fallbackUrl}) returned ${fallbackResponse.status}`);
        }
        console.log(`Fallback URL (${fallbackUrl}) succeeded`);
        return await fallbackResponse.json();
    } catch (fallbackError) {
        // If fallback also fails, throw the error
        console.error(`Fallback URL (${fallbackUrl}) also failed: ${fallbackError.message}`);
        throw fallbackError;
    }
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

            let json = await fetchWithFallback(
                `https://kp4cd.org/rest/views/news2vueportal?portal=` + portal
            );
            // set the data
            context.commit("setNewsFeed", json);
        },

        async getFrontContents(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";
            let json = await fetchWithFallback(
                "https://kp4cd.org/reset/views/portal_front?portal=" + portal
            );
            // set the data
            context.commit("setFrontContents", json);
        },

        async getDatasetsInfo(context, selectedDiseaseGroup) {
            let portal =
                selectedDiseaseGroup == "md" ? "" : selectedDiseaseGroup;
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/kpdatasets?portal=" + portal
            );
            // set the data
            context.commit("setDatasetsInfo", json);
        },

        async getDatasetInfo(context, datasetId) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/datasetinfo?datasetid=" +
                datasetId
            );
            // set the data
            context.commit("setDatasetInfo", json);
        },

        async getPageInfo(context, query) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/" +
                query.page +
                "?portal=" +
                query.portal
            );
            // set the data
            context.commit("setPageInfo", json);
        },

        async getNewFeatures(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/newfeatures?portal=" +
                selectedDiseaseGroup
            );
            // set the data
            context.commit("setNewFeatures", json);
        },
        async getResources(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/newresources?portal=" +
                selectedDiseaseGroup
            );
            // set the data
            context.commit("setResources", json);
        },
        async getResearchMethod(context, methodFrom) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/eglmethod?from=" + methodFrom
            );
            // set the data
            context.commit("setResearchMethod", json);
        },
        async getEglSummaries(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || "md";

            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/eglmethodsperportal?portal=" +
                selectedDiseaseGroup
            );
            // set the data
            context.commit("setEglSummaries", json);
        },
        async getEglData(context, targetData) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/egldata/dataset?dataset=" +
                targetData.dataset +
                "&trait=" +
                targetData.trait
            );

            context.commit("setEglData", json);
        },
        async getResearchData(context, targetDataPoint) {
            // If it's a kp4cd.org URL, use fallback logic; otherwise fetch directly
            let json;
            if (targetDataPoint && targetDataPoint.includes('kp4cd.org')) {
                json = await fetchWithFallback(targetDataPoint);
            } else {
                json = await fetch(targetDataPoint).then((resp) => resp.json());
            }

            context.commit("setResearchData", json);
        },
        async getResearchDataPage(context, param) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/research_data?dataid=" +
                param.pageID +
                "&&reviewerid=" +
                param.reviewerID +
                "&&reviewercode=" +
                param.reviewerCode
            );
            // set the data
            context.commit("setResearchDataPage", json);
        },
        async getEglConfig(context, targetData) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/egldata/config?dataset=" +
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
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/static_content?field_page=" + page
            );
            // set the data
            context.commit("setStaticContent", json);
        },
        async getPaperMenu(context, paperPage) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/paperheadermenu?paper=" +
                paperPage
            );
            // set the data
            context.commit("setPaperMenu", json);
        },
        async getPortals(context) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/a2f_community_kps"
            );
            // set the data
            context.commit("setPortals", json);
        },
        async getHelpBook(context) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/help_book"
            );
            // set the data
            context.commit("setHelpBook", json);
        },
        async getContentByID(context, nid) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/content_by_id?nid=" + nid
            );
            // set the data
            context.commit("setContentByID", json);
        },
        async getHelpBookSearch(context, searchKey) {
            let json = await fetchWithFallback(
                "https://kp4cd.org/rest/views/help_book_search?body=" +
                searchKey
            );
            // set the data
            context.commit("setHelpBookSearch", json);
        },
    },
};
