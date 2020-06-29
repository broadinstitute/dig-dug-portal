import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        associations: bioIndex("phenotype-associations")
    },

    state: {
        newPhenotype: "",
        selectedPhenotypes: [],
        phenotypeAssociations: [],
        tableData: []
    },

    mutations: {
        setPhenotype(state, phenotype) {
            state.selectedPhenotypes.push(phenotype);
            state.newPhenotype = phenotype;
        },
        removePhenotype(state, index) {
            state.selectedPhenotypes.splice(index, 1);
        },
        setAssociation(state, association) {
            //state.phenotypeAssociations[association[0].phenotype] = association;
            state.phenotypeAssociations = state.phenotypeAssociations.concat(
                association
            );
        },
        removeAssociation(state, phenotype) {
            //delete state.phenotypeAssociations[phenotype];
            state.phenotypeAssociations = state.phenotypeAssociations.filter(
                a => a.phenotype != phenotype.name
            );
        },
        updateTableData(state, data) {
            state.tableData = data;
        },
        updateMplotData(state, data) {
            state.mplotData = data;
        }
    },

    actions: {
        onPhenotypeChange(context, phenotype) {
            context.commit("setPhenotype", phenotype);
            //keyParams.set({ phenotype: phenotype.name });
        },
        onPhenotypeRemove(context, { phenotype, index }) {
            // console.log("index", index);
            // console.log("ph", phenotype);
            context.commit("removePhenotype", index);
            context.commit("removeAssociation", phenotype);
            //set params
        },
        async queryAssociation(context, phenotype) {
            let query = { q: phenotype.name };
            let assocQuery = { ...query, limit: 1000 };

            context.dispatch("associations/query", assocQuery);

            //context.commit("setAssociation", context.state.associations.data);
            //context.dispatch("annotations/query", query);
            //context.dispatch("datasets/query", query);
        },
        onFiltered(context, data) {
            context.commit("updateTableData", data);
        },
        mplotData(context, data) {
            context.commit("updateMplotData", data);
        }
    }
});
