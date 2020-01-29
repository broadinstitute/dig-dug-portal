import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object
 * This module returns the annotated regions for a variant.
 * The input params for this call are -  var_id
 * example call: /dccservices/graph/region/variant/object?var_id=8_118184783_C_T
*/

export default graphModule('region', {
    getters: {
        region(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context, { var_id }) {
            context.dispatch('query', { output: 'variant', method: 'list', params: { var_id: var_id } })
        }
    }
});
