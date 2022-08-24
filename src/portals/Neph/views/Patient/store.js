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
        patientDiagnosis: bioIndex("patient-diagnosis",{query_private:true}),
    },

    state: {
        patient: null,
        newPatientId: null
    },

    mutations: {
        setPatient(state, patient) {
            if (patient) {
                let patientId = patient.patientId;

                state.patient = patient;
                state.newPatientId =  patientId;

                keyParams.set({ variant: state.newPatientId });
            }
        },
    },

    actions: {
        async queryPatient(context, newPId) {
            
            newPId = await variantUtils.parseVariant(
                newPId || context.state.newPatientId
            );
            alert("action:"+newPId);
            //console.log("query variant:"+newVarId);
            
            if (!!newPId) {
                context.dispatch("patientDiagnosis/query", { q: newPId, query_private:true  });
            }
            
            
        }
    }
});
