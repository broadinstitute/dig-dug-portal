import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object 
 * This module gets the gene annotation for a given region 
 * The input params for this call are - chrom, start and end position
 * example call /dccservices/graph/annotation/byregion/object?chrom=8&start_pos=10000000&end_pos=14000000
 * default limit to 4000; it does take an optional limit parameter as well, with max 5000
 * */

export default graphModule('annotation', {
    getters: {
        geneAnnotationByRegion(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output is object
        async object(context, { chrom, start, end, limit }) {
            context.dispatch('query', { method: 'byregion', params: { 'chrom': chrom, 'start_pos': start, 'end_pos': end, 'limit': limit } })
        },
    }
});
