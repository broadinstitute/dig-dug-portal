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
        onPhenotypeChange(context, phenotype) {
            //console.log(phenotype);
            context.commit("setSelectedPhenotype", phenotype);
            context.dispatch("getData");
        },
        getData(context) {
            let phenotype = context.state.selectedPhenotype;
            context.dispatch("effectorGenes/getGeneData", phenotype);
        }
    }
});
