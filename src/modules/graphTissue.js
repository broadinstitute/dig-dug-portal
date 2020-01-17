import graphModule from "./graphModule"

export default graphModule('tissue', {
    getters: {
        tissue(state) {
            return state.data.data;
        },
        tissueId(state) {
            return state.data.data.tissue_id;
        },
        tissueDescription(state) {
            return state.data.data.tissue;
        }
    },

    actions: {
        async list(context) {
            context.dispatch('query', { method: 'list' })
        }
    }
});
