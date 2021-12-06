import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import hugeampkpncms from "@/modules/hugeampkpncms";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        bioIndex,
        hugeampkpncms
    },
    state: {
        associationData: null,
        assoDataContinuation: null,
        selectedPhenotypes: ["t2d", "cad"],
    },
    mutations: {
        setAssociationData(state, data) {
            let massagedData = [];
            data.data.map(variant => {
                variant["nLog10P"] = -Math.log10(variant.pValue);
                variant["ldVarID"] = variant.chromosome + ":" + variant.position + "_" + variant.reference + "/" + variant.alt;
                let ldPopulationArr = Object.keys(variant.af);
                variant["ldPopulation"] = ldPopulationArr.length > 1 ? 'ALL' : ldPopulationArr.length == 1 ? ldPopulationArr[0] : null;
                massagedData.push(variant);
            })

            state.associationData = massagedData;
            state.assoDataContinuation = data.continuation != null ? data.continuation : 'complete';
        },
        setMoreAssociationData(state, data) {
            let massagedData = [];
            data.data.map(variant => {
                variant["nLog10P"] = -Math.log10(variant.pValue);
                variant["ldVarID"] = variant.chromosome + ":" + variant.position + "_" + variant.reference + "/" + variant.alt;
                let ldPopulationArr = Object.keys(variant.af);
                variant["ldPopulation"] = ldPopulationArr.length > 1 ? 'ALL' : ldPopulationArr.length == 1 ? ldPopulationArr[0] : null;
                massagedData.push(variant);
            })
            state.associationData = state.associationData.concat(massagedData);
            state.assoDataContinuation = data.continuation != null ? data.continuation : 'complete';
        },
    },
    actions: {
        associationData(context, data) {
            context.commit("setAssociationData", data);
        },
        moreAssociationData(context, data) {
            context.commit("setMoreAssociationData", data);
        },
    }
});
