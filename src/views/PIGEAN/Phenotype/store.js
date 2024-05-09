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
        kp4cd,
        pigeanPhenotype: bioIndex("pigean-gene-phenotype"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        selectedPhenotype: null,
        manhattanPlotAvailable: false,
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setSelectedPhenotype(state, PHENOTYPE) {
            state.selectedPhenotype = PHENOTYPE;
            keyParams.set({ phenotype: PHENOTYPE.name });
        },
    },
    getters: {
        documentationMap(state) {
            return {
                phenotype: state.phenotype.description,
            };
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.state.selectedPhenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            context.state.phenotype = context.state.selectedPhenotype;
            let query = { q: context.state.phenotype.name, limit: 1000 };
            context.dispatch("pigeanPhenotype/query", query);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        selectedPhenotype(context, PHENOTYPE) {
            console.log("onState", PHENOTYPE);
            context.commit("setSelectedPhenotype", PHENOTYPE);
        },
    },
});
