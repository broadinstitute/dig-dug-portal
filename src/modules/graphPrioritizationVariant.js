import graphModule from "./graphModule"


// This module overrides the base module (graphModule) with an extended object 
// This module gets the variants in prioritized order (ordered by p_value) 
// The input params for this call are - phenotype, chrom, start and end position 
// input - phenotype, chrom, start_pos, end_pos

export default graphModule('prioritization', {
    getters: {
        prioritizationVariants(state) {
            return state.data.data;
        }
    },

    actions: {
        async object(context, { phenotype, chrom, start, end, limit }) {
            context.dispatch('query', { method: 'variant', params: { 'phenotype': phenotype, 'chrom': chrom, 'start_pos': start, 'end_pos': end, 'limit': limit } })
        },
    }
});
