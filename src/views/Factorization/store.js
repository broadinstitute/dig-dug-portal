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
        roundTripInputGenes: [],
        genesetOptions: [],
        genesetPValues: [],
        networkGraph: {nodes:[], edges:[]},
        phenotypeData: [],
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
        setGenesetOptions(state, data){
            state.genesetOptions = data || state.genesetOptions;
        },
        setGenesetPValues(state, data){
            state.genesetPValues = data || state.genesetPValues;
        },
        setNetworkGraph(state, data){
            state.networkGraph = data || state.networkGraph;
        },
        setPhenotypeData(state, data){
            state.phenotypeData = data || state.phenotypeData;
        },
        clearAllData(state){
            state.pigeanFactor = [];
            state.geneFactor = [];
            state.genesetFactor = [];
            state.roundTripInputGenes = [];
            state.genesetPValues = [];
        }
    },

    getters: {
    },

    actions: {
        async queryBayesGenes(context, queryString){
            context.commit("clearAllData");
            let address = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/pigean";
            let json = await fetch(address, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: queryString
            }).then(resp => resp.json());
            context.commit("setRoundTripInputGenes", json.input_genes);
            context.commit("setPigeanFactor", json["pigean-factor"].data);
            context.commit("setGeneFactor", json["gene-factor"]);
            context.commit("setGenesetFactor", json["gene-set-factor"]);
            context.commit("setGenesetPValues", json["gene_sets"]);
            //Network graph is a single item array
            context.commit("setNetworkGraph", json["network_graph"][0])
        },
        async queryBayesPhenotypes(context, queryString){
            let address = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/phenotypes";
            let json = await fetch(address, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: queryString
            }).then(resp => resp.json());
            context.commit("setPhenotypeData", json["phenotypes"]);
        },
        async queryGenesetOptions(context){
            let address = "https://translator.broadinstitute.org/genetics_provider/bayes_gene/heartbeat";
            let json = await fetch(address, {
                method: "GET",
                headers: {
                    'Content-Type': "application/json"
                }
            }).then(resp => resp.json());
            context.commit("setGenesetOptions", json.gene_sets);
        },
    },
});
