import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import cvdiBioIndex from "../utils/cvdiBioIndex";
import keyParams from "@/utils/keyParams";
import cvdiBioIndexUtils from "../utils/cvdiBioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanPhenotype: cvdiBioIndex("pigean-gene-phenotype"),
        genesetPhenotype: cvdiBioIndex("pigean-gene-set-phenotype"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: keyParams.phenotype,
        newPhenotype: null,
        phenotypesInSession: null,
        diseaseInSession: null,
        selectedPhenotype: null,
        manhattanPlotAvailable: false,
        traitGroup: keyParams.traitGroup,
        traitGroupToQuery: null,
    },
    mutations: {
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setSelectedPhenotype(state, PHENOTYPE) {
            state.selectedPhenotype = PHENOTYPE;
            //keyParams.set({ phenotype: PHENOTYPE.name });
            state.traitGroupToQuery = PHENOTYPE.trait_group;
            keyParams.set({ traitGroup: PHENOTYPE.trait_group});
        },
        setTraitGroup(state, traitGroup){
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
    },
    getters: {
        docDetails(state) {
            return {
                phenotype: state.phenotype.description,
            };
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.state.selectedPhenotype = phenotype;
            //keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            context.state.phenotype = context.state.selectedPhenotype;
            let name = keyParams.phenotype;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setTraitGroup", traitGroup);
            
            let query = { q: `${name},${cvdiBioIndexUtils.DEFAULT_MODEL}`, limit: 1000 };
            console.log(query.q);
            context.dispatch("pigeanPhenotype/query", query);
            context.dispatch("genesetPhenotype/query", query);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        selectedPhenotype(context, PHENOTYPE) {
            context.commit("setSelectedPhenotype", PHENOTYPE);
        },
    },
});
