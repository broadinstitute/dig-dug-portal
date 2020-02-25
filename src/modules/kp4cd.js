/**
 * This is the module that is used to pull the news feed for KPN website

 */


export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            newsFeed: [],
            frontContents: [],
            datasetsInfo: [],
            portalID: {
                "md": "md",
                "cvd": "mi",
                "cd": "stroke",
                "t2d": "t2d",
                "sleep": "sleep"
            }
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
        }
    },

    // dispatch methods
    actions: {
        async getNewsFeed(context, selecteddiseaseGroup) {
            let diseaseGroup = (selecteddiseaseGroup == "md") ? "" : context.state.portalID[selecteddiseaseGroup];
            let json = await fetch(`http://kp4cd.org/rest/views/news2portals?portal=` + diseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewsFeed', json)
        },
        async getFrontContents(context, selecteddiseaseGroup) {
            let diseaseGroup = context.state.portalID[selecteddiseaseGroup];
            let json = await fetch(`http://kp4cd.org/reset/views/portal_front?portal=` + diseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setFrontContents', json)
        },
        async getDatasetsInfo(context, selecteddiseaseGroup) {
            let diseaseGroup = (selecteddiseaseGroup == "md") ? "" : context.state.portalID[selecteddiseaseGroup];
            let json = await fetch(`http://kp4cd.org/rest/views/kpdatasets?portal=` + diseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasetsInfo', json)
        },
    },
}
