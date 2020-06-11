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
            datasetInfo: [],
            pageInfo: [],
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
        }
    },

    // dispatch methods
    actions: {
        async getNewsFeed(context, selectedDiseaseGroup) {

            let portal = selectedDiseaseGroup || 'md';

            let json = await fetch(`http://kp4cd.org/rest/views/news2vueportal?portal=` + portal)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewsFeed', json)
        },

        async getFrontContents(context, selectedDiseaseGroup) {
            let portal = selectedDiseaseGroup || 'md';
            let json = await fetch('http://kp4cd.org/reset/views/portal_front?portal=' + portal)
                .then(resp => resp.json());
            // set the data
            context.commit('setFrontContents', json)
        },

        async getDatasetsInfo(context, selectedDiseaseGroup) {

            let portal = (selectedDiseaseGroup == 'md') ? '' : selectedDiseaseGroup;
            let json = await fetch('http://kp4cd.org/rest/views/kpdatasets?portal=' + portal)
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasetsInfo', json)
        },

        async getDatasetInfo(context, datasetId) {

            let json = await fetch('http://kp4cd.org/rest/views/datasetinfo?datasetid=' + datasetId)
                .then(resp => resp.json());
            // set the data
            context.commit('setDatasetInfo', json)
        },

        async getPageInfo(context, query) {

            //let json = await fetch(`http://kp4cd.org/rest/views/staticpage/?page=` + page + `&portal=` + portal)
            //.then(resp => resp.json());

            let json = await fetch('http://kp4cd.org/rest/views/staticpage/?page=' + query.page + '&portal=' + query.portal)
                .then(resp => resp.json());
            // set the data
            context.commit('setPageInfo', json)
        },
    },
}
