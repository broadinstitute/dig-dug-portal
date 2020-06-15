import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    },

    state: {
        phenotypes: []
    },

    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotypes.push(phenotype);
        },
        removePhenotype(state, index) {
            state.phenotypes.splice(index, 1);
        }
    },

    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            //keyParams.set({ phenotype: phenotype.name });
        },
        onPhenotypeRemove(context, index) {
            context.commit("removePhenotype", index);
            //set params
        }
    }
});
