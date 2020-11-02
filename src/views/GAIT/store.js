import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import ldServer from "@/modules/ldServer";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        ldServer,
        burden: bioIndex("burden")
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        gene: "slc30a8", //!static for test
        binID: "bin1_7" //!can move to data prop later
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setBurden(state, data) {
            state.burden = data;
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
            let geneQuery = { ...query, limit: 500 };

            context.dispatch("associations/query", assocQuery);
            context.dispatch("annotations/query", query);
            context.dispatch("genes/query", geneQuery);
        },

        queryBurden(context) {
            let gene = context.state.gene;
            let binID = context.state.binID;
            let q = `${gene},${binID}`;

            //TODO: set url params for bookmark
            context.dispatch("burden/query", { q });
        }
    }
});
