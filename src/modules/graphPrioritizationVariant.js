import graphModule from "./graphModule"


// This module overrides the base module (graphModule) with an extended object 
// This module gets the variants in prioritized order (ordered by p_value) 
// The input params for this call are - phenotype, chrom, start and end position 

export default graphModule('prioritizationVariant', {
    getters: {
        prioritizationVariants(state) {
            return state.data.data;
        }
    },

    actions: {
        async prioritizationVariant(context) {
            context.dispatch('query', { output: 'prioritization/variant' })
        },
        async object(context) {
            context.dispatch('query', { method: 'object' })
        }
    }
});
