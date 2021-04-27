/**
 * This is the module that is used to pull the news feed for KPN website

 */

export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            researchPage: [],
            researchMethod: [],
            researchMenu: [],
            researchData: [],
        };
    },

    // commit methods
    mutations: {
        setResearchPage(state, data) {
            state.researchPage = data;
        },
        setResearchMethod(state, data) {
            state.researchMethod = data;
        },
        setResearchMethod(state, data) {
            state.researchMenu = data;
        },
        setResearchData(state, data) {
            state.researchData = data;
        },
    },

    // dispatch methods
    actions: {
        async getResearchPage(context, param) {
            let json = await fetch(
                "http://hugeampkpncms.org/view/rest/get_research_page?pageid=" + param.pageID + "&&reviewerid=" + param.reviewerID + "&&reviewercode=" + param.reviewerCode
            ).then(resp => resp.json());
            // set the data
            context.commit("setResearchPage", json);
        },
        async getResearchData(context, targetDataPoint) {

            //console.log(targetDataPoint);
            let csv = await fetch("http://hugeampkpncms.org/servedata/dataset?dataset=" + targetDataPoint).then(resp => resp.text());

            //console.log(csv);

            context.commit("setResearchData", csv);
        },
    }
};
