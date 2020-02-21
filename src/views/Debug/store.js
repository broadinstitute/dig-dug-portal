import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        associations: bioIndex('Associations'),
        topAssociations: bioIndex('TopAssociations'),
        variants: bioIndex('Variants'),
    },
    state: {

    },
    mutations: {

    },
    actions: {

    }
});
