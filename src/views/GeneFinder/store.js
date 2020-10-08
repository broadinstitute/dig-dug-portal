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
        genes: bioIndex("gene-finder"),
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        primaryphenotype: null,
        secondaryPhenotype:[],
        newPhenotype: null
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        }
    },
    getters: {
        documentationMap(state) {
            return {
                phenotype: state.phenotype.description
            }
        }
    },
    actions: {
        onPrimaryPhenotypeChange(context, primaryphenotype) {
            context.commit("setPhenotype", primaryphenotype);
            keyParams.set({ primaryphenotype: primaryphenotype.name });
        },

        queryPhenotype(context) {
            let query = { q: context.state.phenotype.name };
            let geneQuery = { ...query, limit: 500 };
            context.dispatch("genes/query", geneQuery);
        }
    }
});
