import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanFactor: bioIndex("pigean-factor"),
        pigeanGraph: bioIndex("pigean-graph"),
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        phenotype: null,
        selectedPhenotype: null,
        genesetSize: keyParams.genesetSize || "small",
        traitGroup: keyParams.traitGroup || "portal",
        traitGroupToQuery: null,
        phenotypesInSession: null,
    },
    mutations: {
        setGenesetSize(state, genesetSize) {
            state.genesetSize = genesetSize || state.genesetSize;
            keyParams.set({ genesetSize: state.genesetSize });
        },
        setTraitGroup(state, traitGroup) {
            state.traitGroup = traitGroup || state.traitGroup;
            keyParams.set({ traitGroup: state.traitGroup });
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setSelectedPhenotype(state, PHENOTYPE) {
            state.selectedPhenotype = PHENOTYPE;
            keyParams.set({ phenotype: PHENOTYPE.name });
            state.traitGroupToQuery = PHENOTYPE.trait_group;
            keyParams.set({ traitGroup: PHENOTYPE.trait_group });
        },
    },
    actions: {
        queryPhenotype(context) {
            if (!context.state.selectedPhenotype || !context.state.selectedPhenotype.name) {
                return;
            }
            context.state.phenotype = context.state.selectedPhenotype;
            let name = context.state.phenotype.name;
            let genesetSize = context.state.genesetSize;
            let traitGroup = context.state.traitGroupToQuery || context.state.traitGroup;
            context.commit("setGenesetSize", genesetSize);
            context.commit("setTraitGroup", traitGroup);

            let query = { q: `${name},${bioIndexUtils.DEFAULT_SIGMA},${genesetSize}`, limit: 1000 };
            context.dispatch("pigeanFactor/query", query);
            // Also query graph data
            context.dispatch("pigeanGraph/query", query);
        },
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", { q: 1 });
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        selectedPhenotype(context, PHENOTYPE) {
            context.commit("setSelectedPhenotype", PHENOTYPE);
            // Automatically trigger query after selecting phenotype
            context.dispatch("queryPhenotype");
        },
    },
});

