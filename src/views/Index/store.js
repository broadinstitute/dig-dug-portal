import Vue from "vue";
import Vuex from "vuex";

//import { defaultGroup } from "@/modules/defaultPortal";
import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";
import diseaseGroup from "@/modules/diseaseGroup";


Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        kp4cd,
        diseaseGroup
    },
    state: {
        selectedPhenotype: null,
        phenotypes: null,
        newsIndex: []
    },
    mutations: {
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            window.location.href = "./manhattan.html?phenotype=" + selectedPhenotype.phenotype_id + '&group=' + this.state.diseaseGroup.id;
        }
    }
});
