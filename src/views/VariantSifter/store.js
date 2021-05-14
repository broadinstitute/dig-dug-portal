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
        kp4cd
    },
    state: {
        phenotype: null
    },
    mutations: {
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        }

    },
    getters: {

    },
    actions: {
        async onPhenotypeChange(context, phenotype) {
            context.commit('setPhenotype', phenotype);
        },
    }
});
