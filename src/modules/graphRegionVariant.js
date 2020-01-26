import graphModule from "./graphModule"

//graph/region/variant/object?var_id=8_118184783_C_T

export default graphModule('region', {
    getters: {
        region(state) {
            return state.data.data;
        }
    },

    actions: {
        async list(context, { var_id }) {
            context.dispatch('query', { output: 'variant', method: 'list', params: { var_id: var_id } })
        }
    }
});
