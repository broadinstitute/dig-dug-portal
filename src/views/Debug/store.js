import Vue from "vue";
import Vuex from "vuex";

import graphAnnotationByRegion from "@/modules/graphAnnotationByRegion";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        graphAnnotationByRegion,
    },
    state: {
        chrom: 8,
        start: 118184783,
        end: 219194783,
    },
    mutations: {

    },
    actions: {

    }
});
