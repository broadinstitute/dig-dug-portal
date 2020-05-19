import Vue from "vue";
import Vuex from "vuex";

import effectorGenes from "@/modules/getEffectorGenes";
import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        effectorGenes,
        bioPortal,
        kp4cd
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
            context.dispatch("getTop20Data");
        },
        getData(context) {
            let phenotype = context.state.selectedPhenotype;
            context.dispatch("effectorGenes/getGeneData", phenotype);
        },
        getTop20Data(context) {
            let phenotype = context.state.selectedPhenotype;
            context.dispatch("effectorGenes/getTop20Data", phenotype);
        }
    }
});
