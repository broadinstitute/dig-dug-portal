import Vue from "vue";
import Vuex from "vuex";

import bioIndexAssociations from "@/modules/bioIndexAssociations";
import bioIndexTopAssociations from "@/modules/bioIndexTopAssociations";
import bioIndexVariants from "@/modules/bioIndexVariants";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        associations: bioIndexAssociations,
        bioIndexTopAssociations,
        variants: bioIndexVariants,
    },
    state: {

    },
    mutations: {

    },
    actions: {

    }
});
