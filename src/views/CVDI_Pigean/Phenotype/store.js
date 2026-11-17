import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import cvdiBioIndexUtils from "../utils/cvdiBioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanPhenotype: bioIndex("pigean-gene-phenotype", undefined, {
            host: cvdiBioIndexUtils.BIO_INDEX_HOST,
        }),
        genesetPhenotype: bioIndex("pigean-gene-set-phenotype", undefined, {
            host: cvdiBioIndexUtils.BIO_INDEX_HOST,
        }),
        // Use shared PIGEAN phenotype index for search suggestions.
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: keyParams.phenotype,
        newPhenotype: null,
        diseaseInSession: null,
        selectedPhenotype: null,
        traitGroup: keyParams.traitGroup,
        traitGroupToQuery: null,
    },
    mutations: {
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setSelectedPhenotype(state, PHENOTYPE) {
            state.selectedPhenotype = PHENOTYPE;
            keyParams.set({ phenotype: PHENOTYPE.name });
            state.traitGroupToQuery = PHENOTYPE.trait_group;
            keyParams.set({ traitGroup: PHENOTYPE.trait_group });
        },
        setTraitGroup(state, traitGroup) {
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
        },

        queryPhenotype(context) {
            context.state.phenotype = context.state.selectedPhenotype;
            let name = context.state?.phenotype?.phenotype;

            if (!name) {
                return;
            }

            let traitGroup =
                context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setTraitGroup", traitGroup);

            let query = {
                q: `${name},${cvdiBioIndexUtils.DEFAULT_MODEL}`,
                limit: 1000,
            };
            context.dispatch("pigeanPhenotype/query", query);
            context.dispatch("genesetPhenotype/query", query);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        selectedPhenotype(context, PHENOTYPE) {
            context.commit("setSelectedPhenotype", PHENOTYPE);
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", { q: 1 });
        },
    },
});
