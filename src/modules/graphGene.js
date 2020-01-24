import graphModule from "./graphModule"

//graph/gene/list/object

export default graphModule('gene', {
    getters: {
        gene(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context) {
            context.dispatch('query', { method: 'list' })
        }
    }
});
