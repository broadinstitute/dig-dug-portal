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
        pigeanAllPhenotypes: bioIndex("pigean-phenotypes"),
    },
    state: {
        pigeanFactor: [],
        geneFactor: [],
        geneScores: {},
        genesetFactor: [],
        roundTripInputGenes: [],
        genesetOptions: [],
        genesetPValues: [],
        genesetScores: {},
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
        setGeneScores(state, data){
            state.geneScores = data || state.geneScores;
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
        setGenesetScores(state, data){
            state.genesetScores = data || state.genesetScores;
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
            state.networkGraph = {nodes:[], edges:[]};
            state.phenotypeData = [];
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
            console.log(JSON.stringify(json.gene_set_scores));
            context.commit("setRoundTripInputGenes", json.input_genes);
            context.commit("setPigeanFactor", json["pigean-factor"].data);
            context.commit("setGeneFactor", json["gene-factor"]);
            context.commit("setGenesetFactor", json["gene-set-factor"]);
            context.commit("setGenesetPValues", json["gene_sets"]);
            context.commit("setGeneScores", json["gene_scores"]);
            context.commit("setGenesetScores", json["gene_set_scores"]);
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
        async getPigeanPhenotypes(context) {
            await context.dispatch("pigeanAllPhenotypes/query", {q:1});
        },
    },
});
