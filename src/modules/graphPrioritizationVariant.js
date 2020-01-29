import graphModule from "./graphModule"


/***
 * This module overrides the base module (graphModule) with an extended object 
 * This module gets the variants in prioritized order (ordered by p_value) 
 * The input params - phenotype, chrom, start and end position 
 * example call: /dccservices/graph/prioritization/variant/object?phenotype=T2D&chrom=8&start_pos=118184783&end_pos=219194783&limit=50
*/

export default graphModule('prioritization', {
    getters: {
        prioritizationVariants(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output is object
        async object(context, { phenotype, chrom, start, end, limit }) {
            context.dispatch('query', { method: 'variant', params: { 'phenotype': phenotype, 'chrom': chrom, 'start_pos': start, 'end_pos': end, 'limit': limit } })
        },
    }
});
