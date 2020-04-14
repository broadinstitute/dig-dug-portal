import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotypes: [],
        newPhenotype: null,
    },
    mutations: {
        setNewPhenotype(state, phenotype) {
            if (!state.phenotypes.find(p => p.name == phenotype.name)) {
                state.phenotypes.push(phenotype);
            }
        },

        removePhenotype(state, phenotypeName) {
            state.phenotypes = state.phenotypes.filter(p => p.name !== phenotypeName);
            state.newPhenotype = null;
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit('setNewPhenotype', phenotype);
        },
    },
});
