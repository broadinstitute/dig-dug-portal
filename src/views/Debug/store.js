import Vue from "vue";
import Vuex from "vuex";

import graphPrioritizationVariant from "@/modules/graphPrioritizationVariant";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        variants: graphPrioritizationVariant,
    },
    state: {
        chrom: 8,
        start: 118184783,
        end: 219194783,
        phenotype: `T2D`,
    },
    mutations: {
       
    },
    actions: {
       
    }
});
