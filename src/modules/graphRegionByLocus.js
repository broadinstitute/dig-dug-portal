import graphModule from "./graphModule"

/*** 
 * This module overrides the base module (graphModule) with an extended object
 * This module returns the annotated regions for a given locus on a chromosome.
 * The input params for this call are -  chrom and position
 * example call: dccservices / graph / region / bylocus / object ? chrom = 8 & pos=118184783 
*/

export default graphModule('region', {
    getters: {
        regionByLocus(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output is object
        async object(context, { chrom, position }) {
            context.dispatch('query', { method: 'bylocus', params: { 'chrom': chrom, 'pos': position } })
        },
    }
});
