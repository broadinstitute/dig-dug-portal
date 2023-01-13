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
        globalAssociations: bioIndex("global-associations",{query_private:true}),
        variantMatrix: bioIndex("variant-matrix",{query_private:true})
    },
    state: {
        associations: [],
        leadPositions: {},
        phenotypes: [],
        consequences: [],
        inheritances: [],
        selectedconsequence:'',
    },
    mutations: {
        setLeadPhenotype(state, phenotype) {
            state.globalAssociations.data.forEach(r => {
                if (r['HGVSc'].length>18){
                    r['HGVSc']=r['HGVSc'].substring(18);
                    r['HGVSp']=r['HGVSp'].substring(18);
                    r['HGVSp']=r['HGVSp'].replace("%3D","=");
                }
            });
            state.phenotypes = [
                {
                    phenotype: phenotype,
                    associations: state.globalAssociations.data,
                    filter: x => true,
                    filterVisible: true
                }
            ];
            //state.associations = state.globalAssociations.data;
        },
        setLeadPositions(state) {
            state.leadPositions = {};

            // get the lead SNP position for each clump
            state.globalAssociations.data.forEach(r => {
                state.leadPositions[r.clump] = r.position;
            });
        },
        addPhenotype(state, phenotype) {
            state.variantMatrix.data.forEach(r => {
                if (r['HGVSc'].length>18){
                    r['HGVSc']=r['HGVSc'].substring(18);
                    r['HGVSp']=r['HGVSp'].substring(18);
                    r['HGVSp']=r['HGVSp'].replace("%3D","=");
                }
                r['phenotype'] = r['phenotype2'];
                r['allelecount'] = r['allelecount2'];
                r['allelenumber'] = r['allelenumber2'];
                r['allelefrequency'] = r['allelefrequency2'];
            });
            state.phenotypes.push({
                phenotype: phenotype,
                associations: state.variantMatrix.data,
                filter: x => true,
                filterVisible: false
            });
            //state.associations=state.variantMatrix.data;
        },
        removePhenotype(state, index) {
            if (index == 0) {
                state.phenotypes = []; // remove all
                //state.associations = [];
            } else {
                state.phenotypes = state.phenotypes.filter(
                    (p, i) => i != index
                );
                //state.associations = state.globalAssociations.data;
            }
        }
    },
    getters: {
        leadPhenotype(state) {
            if (state.phenotypes.length > 0) {
                return state.phenotypes[0].phenotype;
            }
        },
        leadAssociations(state) {
            if (state.phenotypes.length > 0) {
                console.log("store: "+ state.phenotypes[0].filter);
                return state.phenotypes[0].associations.filter(
                    state.phenotypes[0].filter
                );
            }
        }
    },
    actions: {
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

        async onFilterChange(context) {
            console.log(context.state.selectedconsequence);
        },

        // fetch the lead (first) phenotype clumped associations
        async fetchLeadPhenotypeAssociations(context, phenotype) {
            await context.dispatch("globalAssociations/query", {
                q: phenotype.name
            });

            // calculate lead positions
            context.commit("setLeadPhenotype", phenotype);
            context.commit("setLeadPositions");
        },

        // load secondary phenotype associations
        async fetchAssociationsMatrix(context, phenotype) {
            let lead = context.state.phenotypes[0].phenotype.name;

            // use the module to download
            await context.dispatch("variantMatrix/query", {
                q: `${lead},${phenotype.name}`
            });

            // commit a copy of the data
            context.commit("addPhenotype", phenotype);
        }
    }
});
