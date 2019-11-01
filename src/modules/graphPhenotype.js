import graphModule from "./graphModule"

export default {
    ...graphModule('phenotype'),

    getters: {
        phenotypes(state) {
            return state.data.data;
        }
    }
}
