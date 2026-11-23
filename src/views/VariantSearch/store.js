import Vuex from "vuex";
import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        variants: bioIndex("gene-variants")
    }
});
