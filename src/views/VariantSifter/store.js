import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

import Alert, {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        annotation: bioIndex("annotated-regions"),
        credibleSets: bioIndex("credible-sets"),
        credibleVariants: bioIndex("credible-variants"),
        globalEnrichment: bioIndex("global-enrichment"),
        documentation: bioIndex("documentation"),
    },
    state: {
        phenotype: null,
        filteredData: "",
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setFilteredData(state, data) {
            //console.log("called 2");
            state.filteredData = data;
        },

    },
    getters: {

    },
    actions: {
        async onPhenotypeChange(context, phenotype) {
            context.commit('setPhenotype', phenotype);
            //this.$parent.phenotype = phenotype.name;
        },
        filteredData(context, filtered) {
            //console.log("called 1");
            context.commit("setFilteredData", filtered);
        },
    }
});
