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
            newFeatures: [],
            resources: [],
            researchMethod: [],
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
        setResearchMethod(state, researchMethod) {
            state.researchMethod = researchMethod;
        },
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

            let json = await fetch('http://kp4cd.org/rest/views/' + query.page + '?portal=' + query.portal)
                .then(resp => resp.json());
            // set the data
            context.commit('setPageInfo', json)
        },

        async getNewFeatures(context, selectedDiseaseGroup) {

            let portal = selectedDiseaseGroup || 'md';

            let json = await fetch('http://kp4cd.org/rest/views/newfeatures?portal=' + selectedDiseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setNewFeatures', json)
        },
        async getResources(context, selectedDiseaseGroup) {

            let portal = selectedDiseaseGroup || 'md';

            let json = await fetch('http://kp4cd.org/rest/views/newresources?portal=' + selectedDiseaseGroup)
                .then(resp => resp.json());
            // set the data
            context.commit('setResources', json)
        },
        async getResearchMethod(context, methodFrom) {

            let json = await fetch('http://kp4cd.org/rest/views/eglmethod?from=' + methodFrom)
                .then(resp => resp.json());
            // set the data
            context.commit('setResearchMethod', json)
        },
    },
}
