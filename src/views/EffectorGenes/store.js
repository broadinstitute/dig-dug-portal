import Vue from "vue";
import Vuex from "vuex";

import effectorGenes from "@/modules/getEffectorGenes";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        effectorGenes
    },
    state: {
        selectedPhenotype: null
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
        }
    },
    actions: {
        onPhenotypeChange(state, phenotype) {
            console.log(phenotype);
            state.commit("setSelectedPhenotype", phenotype);
        }
    }
});
