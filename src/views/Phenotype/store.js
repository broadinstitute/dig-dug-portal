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
        associations: bioIndex("gwas-associations"),
        annotations: bioIndex("global-enrichment")
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
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
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            let query = { q: context.state.phenotype.name };
            let assocQuery = { ...query, limit: 1000 };

            context.dispatch("associations/query", assocQuery);
            context.dispatch("annotations/query", query);
        }
    }
});
