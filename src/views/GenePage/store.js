import Vue from "vue";
import Vuex from "vuex";


import getAggregatedData from "@/modules/getAggregatedData";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        variants: getAggregatedData,
        phewas: getAggregatedData,
        phenotypes: getAggregatedData,
    },
    state: {
        mdv: "mdv41",
        chrom: "8",
        start: 117862462,
        end: 118289003,
        phenotype: "T2D",

    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;

        }

    },
    actions: {

    }
});
