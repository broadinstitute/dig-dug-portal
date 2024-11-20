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
        genesetSize: keyParams.genesetSize || DEFAULT_GENESET_SIZE,
        genesetSizeToQuery: keyParams.genesetSize || DEFAULT_GENESET_SIZE,
        selectedPhenotype: null,
    },
    mutations: {
        setGenesetSize(state, genesetSize) {
            state.genesetSize = genesetSize || state.genesetSize;
        },
    },
    actions: {
        sendSearch(context, phenotype) {
            context.state.phenotype = phenotype;
            keyParams.set({ phenotype: phenotype.name });
            context.state.genesetSize = context.state.genesetSizeToQuery;
            keyParams.set({ genesetSize: context.state.genesetSize });
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
