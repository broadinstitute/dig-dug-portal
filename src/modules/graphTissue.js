import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object
 * This module gets the list of tissue with their tissue id and tissue description
 * example call: /dccservices/graph/tissue/list/object
 * */

export default graphModule('tissue', {
    getters: {
        tissue(state) {
            return state.data.data;
        },
        tissueId(state) {
            return state.data.data.tissue_id;
        },
        tissueDescription(state) {
            return state.data.data.tissue;
        }
    },

    actions: {
        async list(context) {
            context.dispatch('query', { method: 'list' })
        }
    }
});
