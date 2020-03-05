import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        associations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
        variants: bioIndex("Variants"),
    },
    state: {
        chrom: 8,
        start: 10000,
        end: 20000,
    },
    mutations: {},
    actions: {}
});
