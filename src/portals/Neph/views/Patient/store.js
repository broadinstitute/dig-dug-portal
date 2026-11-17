import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import variantUtils from "@/utils/variantUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
    },

    state: {
        patient: keyParams.patient,
    },

    mutations: {
        setPatient(state, patient) {
            if (patient) {

                state.patient = patient;

                keyParams.set({ patient: state.patient });
            }
        },
    },

    actions: {
    }
});
