import graphModule from "./graphModule"

/*** 
 * This module overrides the base module (graphModule) with an extended object
 * This module returns the annotated regions for a given locus on a chromosome or given variant.
 * The input params for this call are -  chrom and position
 * example call: dccservices / graph / region / bylocus / object ? chrom = 8 & pos=118184783 
 * /dccservices/graph/region/variant/object?var_id=8_118184783_C_T

*/

export default graphModule('region', {
    getters: {
        regionByLocus(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output is object
        async bylocus(context, { chrom, position, fmt }) {
            context.dispatch('query', { method: 'bylocus', fmt: fmt, params: { 'chrom': chrom, 'pos': position } })
        },
        async byvariant(context, { var_id, fmt }) {
            context.dispatch('query', { output: 'variant', fmt: fmt, method: 'list', params: { var_id: var_id } })
        }
    }
});
