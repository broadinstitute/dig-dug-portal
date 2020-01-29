import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object
 * This module gets the list of gene annotation (default format is object)
 * example call /dccservices/graph/gene/list/object
 * default limit to 4000; it does take an optional limit parameter as well, with max 5000
 * */

export default graphModule('gene', {
    getters: {
        gene(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context) {
            context.dispatch('query', { method: 'list' })
        }
    }
});
