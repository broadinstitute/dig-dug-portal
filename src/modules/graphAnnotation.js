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
        annotationByRegion(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output format is object
        async byregion(context, { chrom, start, end, fmt, limit }) {
            context.dispatch('query', { method: 'byregion', fmt: fmt, params: { 'chrom': chrom, 'start_pos': start, 'end_pos': end, 'limit': limit } })
        },
    }
});
