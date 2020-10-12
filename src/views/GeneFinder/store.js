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
        geneFinder: bioIndex("gene-finder"),
    },
    state: {
        newPhenotype: null,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        geneFinderData: {},
        secondaryPhenotype: []
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },

        setSecondaryPhenotype(state, secondaryPhenotype) {
            state.secondaryPhenotype = secondaryPhenotype;
        },

        setGeneFinderData(state, geneFinderData) {
            state.geneFinderData = geneFinderData;
        },

    },
    getters: {



    },
    actions: {

        queryGeneFinder(context) {
            let query = { q: context.state.phenotype };
            let phenotypeQuery = { ...query, limit: 500 };
            context.commit("setPhenotype", context.state.phenotype);
            context.dispatch("geneFinder/query", phenotypeQuery);
        },

    }
});
