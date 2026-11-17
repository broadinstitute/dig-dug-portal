import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

// Variant data (gene carriers, samples, HPO context) is loaded by the page
// itself via ./geneState.js, which reuses the GeneResult data sources.
export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd
    }
});
