import Vuex from "vuex";
import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
export default new Vuex.Store({
    modules: { bioPortal, kp4cd },
    state: {
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
    },
});
