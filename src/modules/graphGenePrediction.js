import graphModule from "./graphModule"


// This module overrides the base module (graphModule) with an extended object 
// This module gets the gene annotation for a given region 
// here is the example call // dccservices/graph/gene/prediction/object?var_id= 8_118184783_C_T or dccservices/graph/gene/prediction/object?gene= SLC30A8
// The input params for this call are - gene or var_id



export default graphModule('gene', {
    getters: {
        genePrediction(state) {
            return state.data.data;
        }
    },

    actions: {
        //by default the output is object
        async object(context, { var_id }) {
            context.dispatch('query', { method: 'prediction', params: { 'var_id': var_id } })
        },
    }
});
