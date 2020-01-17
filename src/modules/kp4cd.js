/**
 * This is the module that is used to pull the news feed for KPN website 
 
 */


export default {
    namespaced: true,

    // initial module state
    state() {
        return {
            newsFeed: [],
        };
    },

    // commit methods
    mutations: {
        setNewsFeed(state, newsFeed) {
            state.newsFeed = newsFeed;
        }
    },

    // dispatch methods
    actions: {
        async getNewsFeed(context) {
            let json = await fetch(`http://kp4cd.org/rest/views/news`)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewsFeed', json)
        },
    },
}
