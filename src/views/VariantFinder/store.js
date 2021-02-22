import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

import Alert, {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        globalAssociations: bioIndex("global-associations"),
    },
    state: {
        associations: [],
        phenotypes: [],
    },
    mutations: {
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;

            // drop associations that aren't in the list any more
            state.associations = state.associations.filter(r => {
                return phenotypes.indexOf(r.phenotype) >= 0;
            });
        },
        updateAssociations(state, { phenotype, data }) {
            state.phenotypes.push(phenotype);

            // append the data for this phenotype
            state.associations = state.associations.concat(data.map(r => {
                let alignment = r.alignment || 1;
                let alignedBeta = r.beta * alignment;

                return { ...r, alignment, alignedBeta };
            }));
        },
    },
    getters: {
        leadPhenotype(state) {
            return state.phenotypes.length > 0 ? state.phenotypes[0] : undefined;
        },
        leadAssociations(state) {
            return state.associations.filter(r => r.phenotype == state.phenotypes[0]);
        },
    },
    actions: {
        async fetchLeadPhenotypeAssociations(context, phenotypeName) {
            context.commit('setPhenotypes', []);

            // perform the fetch for the initial associations
            await context.dispatch('globalAssociations/query', { q: phenotypeName });

            // set the global list of associations
            context.commit('updateAssociations', {
                phenotype: phenotypeName,
                data: context.state.globalAssociations.data
            });
        },

        async fetchAssociationsMatrix(context, phenotypeName) {
            let lead = context.getters.leadPhenotype;

            if (!!lead) {
                let desc = context.state.bioPortal.phenotypeMap[phenotypeName].description;
                let alertId = postAlertNotice(`Loading association matrix for ${desc}...`);

                // download the association matrix for this pair
                let data = await query(`clumped-matrix`, `${lead},${phenotypeName}`);

                // update the phenoypes and associations
                context.commit('updateAssociations', {
                    phenotype: phenotypeName,
                    data,
                });

                // done loading
                closeAlert(alertId);
            }
        },
    }
});
