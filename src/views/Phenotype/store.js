import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        associations: bioIndex("phenotype-associations")
    },
    state: {
        phenotypeName: keyParams.phenotype,
        phenotypes: null
    },
    mutations: {
        setPhenotypeName(state, name) {
            state.phenotypeName = name;
        }
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            keyParams.set({ phenotype: phenotype });
            context.commit("setPhenotypeName", phenotype);
        }
    }
});
