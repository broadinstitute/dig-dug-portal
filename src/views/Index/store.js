import Vue from "vue";
import Vuex from "vuex";

//import { defaultGroup } from "@/modules/defaultPortal";
import metadataModule from "@/modules/metadataModule";
import graphPhenotype from "@/modules/graphPhenotype";
import kp4cd from "@/modules/kp4cd";


Vue.use(Vuex);

var url = new URL(document.URL);
let keyParam = {};
var c = url.searchParams.forEach((value, key) => {
    keyParam[key] = value;
});

keyParam.group = (keyParam.group == null) ? 'md' : keyParam.group;

export default new Vuex.Store({
    modules: {
        metadataModule,
        graphPhenotype,
        kp4cd,
    },
    state: {
        selectedPhenotype: null,
        phenotypes: null,
        diseaseGroup: keyParam.group,
        newsItems: kp4cd.newsFeed,
        newsIndex: [],
    },
    mutations: {
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;
        },
        setselectedDiseaseGroup(state, selectedDiseaseGroup) {
            state.diseaseGroup = selectedDiseaseGroup;
        }
    },
    actions: {
        onPhenotypeChange(context, selectedPhenotype) {
            window.location.href = "./manhattan.html?phenotype=" + selectedPhenotype.phenotype_id + '&group=' + this.state.diseaseGroup;
        },
        onDiseaseGroupChange(context, selectedDiseaseGroup) {
            //context.commit("setselectedDiseaseGroup", selectedDiseaseGroup);
            window.location.href = "./?group=" + selectedDiseaseGroup;
        },
    }
});
