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
        phenotypes: [],
        associations: [],
        leadPositions: {},
    },
    mutations: {
        setLeadPhenotype(state, phenotype) {
            if (state.phenotypes.length == 0) {
                state.phenotypes = [phenotype];
            } else {
                state.phenotypes[0] = phenotype;
            }
        },
        setLeadPositions(state) {
            state.leadPositions = {};

            // get the lead SNP position for each clump
            state.globalAssociations.data.forEach(r => {
                state.leadPositions[r.clump] = r.position;
            });
        },
        setPhenotypes(state, phenotypes) {
            state.phenotypes = phenotypes;

            // drop associations that aren't in the list any more
            state.associations = state.associations.filter(r => {
                return phenotypes.indexOf(r.phenotype) >= 0;
            });
        },
        updateAssociations(state, { phenotype, data }) {
            state.phenotypes.push(phenotype);

            // remove existing associations for this phenotype, then add
            state.associations = state.associations.concat(data.map(r => {
                let alignment = r.alignment || 1;
                let alignedBeta = r.beta * alignment;

                // align the position so variants in the same clump line up
                return {
                    ...r,

                    // calculate aligned effect direction
                    alignment,
                    alignedBeta,

                    // overwrite position w/ that of lead SNP
                    position: state.leadPositions[r.clump],
                };
            }));
        },
    },
    getters: {
        leadPhenotype(state) {
            return state.phenotypes.length > 0 ? state.phenotypes[0] : undefined;
        },
        leadAssociations(state) {
            return state.globalAssociations.data
                .map(r => {
                    return { ...r, alignment: 1, alignedBeta: r.beta };
                });
        },
        associations(state, getters) {
            return getters.leadAssociations.concat(state.associations);
        }
    },
    actions: {
        async fetchLeadPhenotypeAssociations(context, phenotypeName) {
            await context.dispatch('globalAssociations/query', { q: phenotypeName });

            // calculate lead positions
            context.commit('setLeadPositions');
            context.commit('setLeadPhenotype', phenotypeName);
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
