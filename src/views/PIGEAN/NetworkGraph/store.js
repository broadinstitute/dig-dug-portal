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
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        phenotype: null,
        genesetSize: "small",
        selectedPhenotype: null,
    },
    mutations: {
        setGenesetSize(state, genesetSize) {
            state.genesetSize = genesetSize || state.genesetSize;
        },
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.state.phenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", { q: 1 });
        },
    },
    getters: {
        docDetails(state) {
            return {
                phenotype: state.phenotype,
                genesetSize: state.genesetSize,
            };
        },
    },
});
