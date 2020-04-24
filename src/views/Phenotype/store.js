import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        associations: bioIndex('phenotype-associations'),
        annotations: bioIndex('global-enrichment'),
        datasets: bioIndex('datasets')
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit('setPhenotype', phenotype);
        },

        queryPhenotype(context) {
            let query = { q: context.state.phenotype.name };
            let assocQuery = { ...query, limit: 1000 };

            context.dispatch('associations/query', assocQuery);
            context.dispatch('annotations/query', query);
            context.dispatch('datasets/query', query);
        }
    },
});
