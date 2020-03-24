import Vue from "vue";
import Vuex from "vuex";

import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import diseaseGroup from "@/modules/diseaseGroup";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        manhattan: bioIndex("PhenotypeAssociations"),
        table: bioIndex("PhenotypeAssociations"),
        metadataModule,
        graphPhenotype,
        kp4cd,
        diseaseGroup
    },
    state: {
        selectedPhenotype: null,
        phenotypes: null,
        phenotypeName: "Select a phenotype",
        datasetName: "Select a dataset",
    },
    mutations: {
        setPhenotypeName(state, phenotypeName) {
            state.phenotypeName = phenotypeName;
        },
        setSelectedPhenotype(state, phenotype) {
            state.selectedPhenotype = phenotype;
            state.phenotypeName = phenotype.name;
            mdkp.utility.showHideElement('phenotypeSearchHolder');
        },
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            context.commit("setSelectedPhenotype", selectedPhenotype);
            context.dispatch("performGetData");
        },
        performGetData(context) {
            let phenotype = context.state.selectedPhenotype.phenotype_id;
            context.dispatch("table/query", { q: phenotype, limit: 100 });
            context.dispatch("manhattan/query", { q: phenotype, limit: 2000 });
        },
    },

});
