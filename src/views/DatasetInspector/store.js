import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";
import bioIndex from "@/modules/bioIndex";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        datasetAssociations: bioIndex('dataset-associations'),
    },
    state() {
        return {
            selectedDataset: null,
            selectedPhenotype: null,
        }
    },
    mutations: {
        setSelectedDataset(state, name) {
            state.selectedDataset = state.bioPortal.datasetMap[name];

            // if the selected dataset doesn't have the currently selected phenotype, clear it
            if (!state.selectedDataset) {
                state.selectedPhenotype = null;
            } else if (state.selectedPhenotype) {
                if (!state.selectedDataset.phenotypes.includes(state.selectedPhenotype.name)) {
                    state.selectedPhenotype = null;
                }
            }

            keyParams.set({ dataset: name, phenotype: state.selectedPhenotype && state.selectedPhenotype.name })
        },
        setSelectedPhenotype(state, name) {
            state.selectedPhenotype = state.bioPortal.phenotypeMap[name];
            keyParams.set({ phenotype: name })
        }
    },
    getters: {
    },
    actions: {
        async onPhenotypeChange(context, phenotype) {
            if (phenotype) {
                context.commit('setSelectedPhenotype', phenotype.name);
            }

            context.dispatch('queryAssociations');
        },
        async onDatasetChange(context, dataset) {
            if (dataset) {
                context.commit('setSelectedDataset', dataset.name);
                context.dispatch("kp4cd/getDatasetInfo", dataset.name);
            }

            context.dispatch('queryAssociations');
        },
        async queryAssociations(context) {
            let dataset = context.state.selectedDataset;
            let phenotype = context.state.selectedPhenotype;

            if (dataset && phenotype) {
                let q = `${dataset.name},${phenotype.name}`;
                context.dispatch('datasetAssociations/query', { q, limit: 500 });
            } else {
                context.dispatch('datasetAssociations/clear');
            }
        }
    },
});
