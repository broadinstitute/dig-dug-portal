import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import { postAlertError } from "@/components/Alert.vue";
import { match } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({

    modules: {
        bioPortal,
        kp4cd,
    },
    state: {
    },
    mutations: {
    },

    actions: {
        onPhenotypeChange(context, phenotype) {

        },
    },

});
