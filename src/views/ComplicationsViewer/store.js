import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        primaryGeneFinder: bioIndex("gene-finder"),
        secondaryGeneFinder: bioIndex("gene-finder"),
    },
    state: {
        associations: [],
        condition: keyParams.condition,

    },
    mutations: {

        setMatchingGenes(state, genes) {
            state.matchingGenes = genes;
        },
        clearAssociations(state) {
            state.associations = [];
        },
        updateAssociations(state, data) {
            state.associations = state.associations.concat(data);
        },
        setCondition(state, condition) {
            state.condition = condition || keyParams.condition
            keyParams.set({ condition: condition });
        },
        setSecondaryPhenotype(state, secondaryPhenotype) {
            state.secondaryPhenotype = secondaryPhenotype
            keyParams.set({ secondaryPhenotype: secondaryPhenotype });
        }
    },
    actions: {
        async primaryGeneFinder(context, qOpts) {
            await context.dispatch('primaryGeneFinder/query', qOpts);
            context.commit('updateAssociations', context.state.primaryGeneFinder.data);
        },

        async secondaryGeneFinder(context, qOpts) {
            await context.dispatch('secondaryGeneFinder/query', qOpts);
            context.commit('updateAssociations', context.state.secondaryGeneFinder.data);
        },

        async findGenes(context, { primaryPhenotype, secondaryPhenotype, pValue }) {
            let limitWhile = record => record.pValue < pValue;
            let limit = 500;

            context.commit('clearAssociations');

            // update each set of genes
            context.dispatch('primaryGeneFinder', { q: primaryPhenotype, limit, limitWhile });
            context.dispatch('secondaryGeneFinder', { q: secondaryPhenotype, limit, limitWhile });
        }
    }
});
