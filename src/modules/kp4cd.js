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
        async getNewsFeed(context) {
            let json = await fetch(`http://kp4cd.org/rest/views/news2portals`)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewsFeed', json)
        },
        async getFrontContents(context) {
            let json = await fetch(`http://kp4cd.org/reset/views/portal_front?portal=md`)
                .then(resp => resp.json());
            // set the data
            context.commit('setFrontContents', json)
        },
        async getDatasetsInfo(context) {
            let json = await fetch(`http://kp4cd.org/rest/views/kpdatasets`)
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasetsInfo', json)
        },
    },
}
