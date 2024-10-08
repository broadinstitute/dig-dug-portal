import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndexUtils from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        pigeanGeneset: bioIndex("pigean-gene-set"),
    },
    state: {
    },

    mutations: {
    },

    getters: {
    },

    actions: {
        async queryBayesGenes(context, genesList){
            let address = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/pigean";
            let genesQuery = JSON.stringify({ "genes": genesList });
            let json = await fetch(address, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: genesQuery
            }).then(resp => resp.json());
            console.log(JSON.stringify(json));
        },
    },
});
