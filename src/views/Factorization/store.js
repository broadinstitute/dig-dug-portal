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
        pigeanFactor: [],
        geneFactor: [],
        genesetFactor: [],
        roundTripInputGenes: []
    },

    mutations: {
        setPigeanFactor(state, data){
            state.pigeanFactor = data || state.pigeanFactor;
        },
        setGeneFactor(state, data){
            state.geneFactor = data || state.geneFactor;
        },
        setGenesetFactor(state, data){
            state.genesetFactor = data || state.genesetFactor;
        },
        setRoundTripInputGenes(state, data){
            state.roundTripInputGenes = data || state.roundTripInputGenes;
        },
        clearAllData(state){
            state.pigeanFactor = [];
            state.geneFactor = [];
            state.genesetFactor = [];
        }
    },

    getters: {
    },

    actions: {
        async queryBayesGenes(context, genesList){
            context.commit("clearAllData");
            let address = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/pigean";
            let genesQuery = JSON.stringify({ "genes": genesList });
            let json = await fetch(address, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: genesQuery
            }).then(resp => resp.json());
            context.commit("setRoundTripInputGenes", json.input_genes);
            context.commit("setPigeanFactor", json["pigean-factor"].data);
            context.commit("setGeneFactor", json["gene-factor"]);
            context.commit("setGenesetFactor", json["gene-set-factor"]);
        },
    },
});
