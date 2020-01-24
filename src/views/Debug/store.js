import Vue from "vue";
import Vuex from "vuex";

import graphPrioritizationVariant from "@/modules/graphPrioritizationVariant";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        graphPrioritizationVariant,
    },
    state: {
        phenotype: `T2D`,
        chrom: 8,
        start: 118184783,
        end: 219194783,
    },
    mutations: {

    },
    actions: {

    }
});
