import graphModule from "./graphModule"


// This module overrides the base module (graphModule) with an extended object 
// This module gets the variants in prioritized order (ordered by p_value) 
// The input params for this call are - phenotype, chrom, start and end position 
// input - phenotype, chrom, start_pos, end_pos

export default graphModule('prioritizationVariant', {
    getters: {
        prioritizationVariants(state) {
            return state.data.data;
        }
    },

    actions: {
        async object(context, { chrom, start, end, phenotype, limit }) {
            context.dispatch('query', { output: 'prioritization/variant', qs: { 'chrom': chrom, 'start_pos': start, 'end_pos': end, 'phenotype': phenotype, 'limit': limit } })
        },

    }
});
