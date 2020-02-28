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
            portalID2OldID: {
                "md": "",
                "cvd": "mi",
                "cd": "stroke",
                "t2d": "t2d",
                "sleep": "sleep"
            },
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
        async getNewsFeed(context, selectedDiseaseGroup) {
            let diseaseGroup = context.state.portalID2OldID[selectedDiseaseGroup];
            let json = await fetch(`http://kp4cd.org/rest/views/news2vueportal?portal=` + diseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewsFeed', json)
        },
        async getFrontContents(context, selectedDiseaseGroup) {
            let json = await fetch(`http://kp4cd.org/reset/views/portal_front?portal=` + selectedDiseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setFrontContents', json)
        },
        async getDatasetsInfo(context, selectedDiseaseGroup) {
            let diseaseGroup = context.state.portalID2OldID[selectedDiseaseGroup];
            let json = await fetch(`http://kp4cd.org/rest/views/kpdatasets?portal=` + diseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasetsInfo', json)
        },
    },
}
