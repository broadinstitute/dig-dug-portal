import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object
 * This module gets the list of phenotypes
 * example call: /dccservices/graph/phenotype/list/object
 * default limit to 4000; it does take an optional limit parameter as well, with max 5000
 * */

export default graphModule('phenotype', {
    getters: {
        phenotypes(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context) {
            context.dispatch('query', { method: 'list' })
        }
    }
});
