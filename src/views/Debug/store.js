import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        associations: bioIndex("associations"),
        topAssociations: bioIndex("top-associations"),
        variants: bioIndex("variants"),
    },
    state: {},
    mutations: {},
    actions: {}
});
