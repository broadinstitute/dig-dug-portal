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
        associations: bioIndex("phenotype-associations")
    },

    state: {
        newPhenotype: "",
        selectedPhenotypes: []
    },

    mutations: {
        setPhenotype(state, phenotype) {
            state.selectedPhenotypes.push(phenotype);
            state.newPhenotype = phenotype;
        },
        removePhenotype(state, index) {
            state.selectedPhenotypes.splice(index, 1);
        }
    },

    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            //keyParams.set({ phenotype: phenotype.name });
        },
        onPhenotypeRemove(context, index) {
            context.commit("removePhenotype", index);
            //set params
        },
        queryPhenotype(context) {
            let query = { q: context.state.newPhenotype.name };
            let assocQuery = { ...query, limit: 1000 };

            context.dispatch("associations/query", assocQuery);
            //context.dispatch("annotations/query", query);
            //context.dispatch("datasets/query", query);
        }
    }
});
