import graphModule from "./graphModule"

/***
 * This module overrides the base module (graphModule) with an extended object
 * This module gets the list of gene annotation (default format is object)
 * example call /dccservices/graph/gene/list/object
 * /dccservices/graph/gene/prediction/object?var_id= 8_118184783_C_T or ?gene= SLC30A8
 *  example call /dccservices/graph/gene/transcriptionfactor/object?var_id= 8_118184783_C_T or ?gene= SLC30A8
 * default limit to 4000; it does take an optional limit parameter as well, with max 5000
 * */

export default graphModule('gene', {
    getters: {
        gene(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context, { fmt }) {
            context.dispatch('query', { method: 'list', fmt: fmt })
        },
        async predictionbyVariant(context, { var_id, fmt }) {
            context.dispatch('query', { method: 'prediction', fmt: fmt, params: { 'var_id': var_id } })
        },
        async predictionbyGene(context, { gene, fmt }) {
            context.dispatch('query', { method: 'prediction', fmt: fmt, params: { 'gene': gene } })
        },
        /***
         * ???  byVariant 
         */
        // async object(context, { var_id }) {
        //     context.dispatch('query', { method: 'transcriptionfactor', params: { 'var_id': var_id } })
        // }
    }
});
