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
        ancestryGlobalAssoc: bioIndex("ancestry-global-associations"),
        clumpedMatrix: bioIndex("clumped-matrix"),
        ancestryClumpedMatrix: bioIndex("ancestry-clumped-matrix")
    },
    state: {
        associations: [],
        leadPositions: {},
        phenotypes: [],
        ancestry: "",
        selectedAncestry: "",
        phenotypesInSession: null,
        diseaseInSession: null,
        phenotypeCorrelation: null,
    },
    mutations: {
        setLeadPhenotype(state, phenotype) {
            state.phenotypes = [
                {
                    phenotype: phenotype,
                    associations: state.ancestry == "" ? state.globalAssociations.data : state.ancestryGlobalAssoc.data,
                    filter: x => true,
                    filterVisible: true
                }
            ];
        },
        setLeadPositions(state) {
            state.leadPositions = {};

            // get the lead SNP position for each clump
            if (state.ancestry == "") {
                state.globalAssociations.data.forEach(r => {
                    state.leadPositions[r.clump] = r.position;
                });
            } else {
                state.ancestryGlobalAssoc.data.forEach(r => {
                    state.leadPositions[r.clump] = r.position;
                });
            }
        },
        addPhenotype(state, phenotype) {
            let dataToAdd = state.ancestry == "" ? state.clumpedMatrix.data : state.ancestryClumpedMatrix.data;
            state.phenotypes.push({
                phenotype: phenotype,
                associations: dataToAdd.map(r => {
                    let alignment = r.alignment || 1;
                    let alignedBeta = r.beta * alignment;

                    // align the position so variants in the same clump line up
                    return {
                        ...r,

                        // calculate aligned effect direction
                        alignment,
                        alignedBeta,

                        // overwrite position w/ that of lead SNP
                        position: state.leadPositions[r.clump]
                    };
                }),
                filter: x => true,
                filterVisible: false
            });
        },
        removePhenotype(state, index) {
            if (index == 0) {
                state.phenotypes = []; // remove all
            } else {
                state.phenotypes = state.phenotypes.filter(
                    (p, i) => i != index
                );
            }
        },
        setPhenotypesInSession(state, PHENOTYPES) {
            state.phenotypesInSession = PHENOTYPES;
        },
        setDiseaseInSession(state, DISEASE) {
            state.diseaseInSession = DISEASE;
        },
        setPhenotypeCorrelation(state, Correlation) {
            state.phenotypeCorrelation = Correlation;
        },
    },
    getters: {
        leadPhenotype(state) {
            if (state.phenotypes.length > 0) {
                return state.phenotypes[0].phenotype;
            }
        },
        leadAssociations(state) {
            if (state.phenotypes.length > 0) {
                return state.phenotypes[0].associations.filter(
                    state.phenotypes[0].filter
                );
            }
        }
    },
    actions: {
        querySignalSifter(context) {
            context.state.ancestry = context.state.selectedAncestry;
        },
        async onPhenotypeChange(context, phenotype) {
            let i = context.state.phenotypes.indexOf(
                p => p.name == phenotype.name
            );

            // doesn't exist, so add it
            if (i < 0) {
                if (context.state.phenotypes.length == 0) {
                    context.dispatch(
                        "fetchLeadPhenotypeAssociations",
                        phenotype
                    );
                } else {
                    context.dispatch("fetchAssociationsMatrix", phenotype);
                }
            }
        },

        // fetch the lead (first) phenotype clumped associations
        async fetchLeadPhenotypeAssociations(context, phenotype) {
            if (context.state.ancestry == "") {
                await context.dispatch("globalAssociations/query", {
                    q: phenotype.name
                });
            } else {
                await context.dispatch("ancestryGlobalAssoc/query", {
                    q: `${phenotype.name},${context.state.ancestry}`
                });
            }

            // calculate lead positions
            context.commit("setLeadPhenotype", phenotype);
            context.commit("setLeadPositions");
        },

        // load secondary phenotype associations
        async fetchAssociationsMatrix(context, phenotype) {
            let lead = context.state.phenotypes[0].phenotype.name;

            if (context.state.ancestry == "") {
                // use the module to download
                await context.dispatch("clumpedMatrix/query", {
                    q: `${lead},${phenotype.name}`
                });
            } else {
                await context.dispatch("ancestryClumpedMatrix/query", {
                    q: `${lead},${phenotype.name},${context.state.ancestry}`
                });
            }

            // commit a copy of the data
            context.commit("addPhenotype", phenotype);
        },
        phenotypesInSession(context, PHENOTYPES) {
            context.commit("setPhenotypesInSession", PHENOTYPES);
        },
        diseaseInSession(context, DISEASE) {
            context.commit("setDiseaseInSession", DISEASE);
        },
        phenotypeCorrelation(context, DATA) {
            context.commit("setPhenotypeCorrelation", DATA);
        },
    }
});
