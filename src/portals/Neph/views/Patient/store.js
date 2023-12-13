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
        //patientDiagnosis: bioIndex("patient_diagnosis",{query_private:true}),
        //patientHomeMedicine: bioIndex("patient_home_medicine",{query_private:true}),
        //patientAdminMedicine: bioIndex("patient_admin_medicine",{query_private:true}),
        //patientVital: bioIndex("patient_vital",{query_private:true}),
        //patientLaboratory: bioIndex("patient_laboratory",{query_private:true}),
    },

    state: {
        patient: keyParams.patient,
        //newPatientId: null
    },

    mutations: {
        setPatient(state, patient) {
            if (patient) {
                //let patientId = patient.patientId;

                state.patient = patient;
                //state.newPatientId =  patient;

                keyParams.set({ patient: state.patient });
            }
        },
    },

    actions: {
        /*async queryPatient(context, newPId) {
            //alert("action:"+newPId+"|"+context.state.patient);
            newPId = newPId || context.state.patient;
            //alert("action:"+newPId);
            //console.log("query variant:"+newVarId);
            
            if (!!newPId) {
                context.dispatch("patientDiagnosis/query", { q: newPId, query_private:true  });
                context.dispatch("patientHomeMedicine/query", { q: newPId, query_private:true  });
                context.dispatch("patientAdminMedicine/query", { q: newPId, query_private:true  });
                context.dispatch("patientVital/query", { q: newPId, query_private:true  });
                context.dispatch("patientLaboratory/query", { q: newPId, query_private:true  });
            }
            
            
        }*/
    }
});
