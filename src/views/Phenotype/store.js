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
        associations: bioIndex("global-associations"),
        annotations: bioIndex("global-enrichment"),
        genes: bioIndex("gene-finder"),
        ancestryGlobalAssoc: bioIndex("ancestry-global-associations"),
        geneticCorrelation: bioIndex("genetic-correlation")
    },
    state: {
        // phenotypes needs to be an array so colors don't change!
        phenotype: null,
        newPhenotype: null,
        ancestry: !!keyParams.ancestry ? keyParams.ancestry : "",
        selectedAncestry: !!keyParams.ancestry ? keyParams.ancestry : "",
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        }
    },
    getters: {
        documentationMap(state) {
            return {
                phenotype: state.phenotype.description,
                ancestry: state.ancestry
            }
        }
    },
    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            keyParams.set({ phenotype: phenotype.name });
        },

        queryPhenotype(context) {
            context.state.ancestry = context.state.selectedAncestry;
            let query = { q: context.state.phenotype.name };
            let assocQuery = { ...query, limit: 1000 };
            let geneQuery = { ...query, limitWhile: r => r.pValue <= 0.05, limit: 1000 };
            let ancestryQuery = {q: `${context.state.phenotype.name},${context.state.ancestry}`};
            let ancestryAssocQuery = { ...ancestryQuery, limit: 1000 };
            if (context.state.ancestry == "" || context.state.ancestry == null) {
                context.dispatch("associations/query", assocQuery);
            } else {
                context.dispatch("ancestryGlobalAssoc/query", ancestryAssocQuery);
            }
            context.dispatch("annotations/query", query);
            context.dispatch("genes/query", geneQuery);
            let gcQuery = !context.state.ancestry ? query : ancestryQuery; 
            context.dispatch("geneticCorrelation/query", gcQuery);
        }
    }
});
