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
        chrom: 10,
        start: 114552962,
        end: 114611504,
    },
    mutations: {},
    actions: {}
});
