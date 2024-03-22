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
        variantMatrix: bioIndex("clumped-matrix",{query_private:true}),
        //phenotype: bioIndex("phenotypes",{query_private:true}),
    },
    state: {
        associations: [],
        leadPositions: {},
        phenotypes: [],
        phenotypes_hg38: ['HP-0000009','HP-0000020','HP-0000079','HP-0000095','HP-0000118','HP-0000119','HP-0000152','HP-0000359',
            'HP-0000407','HP-0000478','HP-0000486','HP-0000598','HP-0000707','HP-0000709','HP-0000716','HP-0000717','HP-0000725',
            'HP-0000738','HP-0000769','HP-0000787','HP-0000795','HP-0000818','HP-0000826','HP-0001197','HP-0001388','HP-0001507',
            'HP-0001574','HP-0001608','HP-0001622','HP-0001626','HP-0001679','HP-0001699','HP-0001871','HP-0001877','HP-0001903',
            'HP-0001939','HP-0001945','HP-0002028','HP-0002032','HP-0002086','HP-0002088','HP-0002110','HP-0002186','HP-0002197',
            'HP-0002533','HP-0002589','HP-0002664','HP-0002715','HP-0002836','HP-0003011','HP-0004322','HP-0004386','HP-0005341',
            'HP-0005528','HP-0007018','HP-0008373','HP-0008443','HP-0009826','HP-0011035','HP-0012639','HP-0020110','HP-0025031',
            'HP-0025142','HP-0025354','HP-0031263','HP-0033127','HP-0040064','HP-0040069','HP-0045027','HP-0100021','HP-0100280',
            'HP-0100820','HP-0200134'],
        consequences: [],
        inheritances: [],
        selectedconsequence:'',
    },
    mutations: {
        setLeadPhenotype(state, phenotype) {
            state.globalAssociations.data.forEach(r => {
                if (r['hgvsc'].length>18){
                    r['hgvsc']=r['hgvsc'].substring(18);
                    r['hgvsp']=r['hgvsp'].substring(18);
                    r['hgvsp']=r['hgvsp'].replace("%3D","=");
                }
            });
            //console.log("store, setLeadPhenotype:"+ state.globalAssociations.data.length);
            state.phenotypes = [
                {
                    phenotype: phenotype,
                    associations: state.globalAssociations.data,
                    filter: x => true,
                    filterVisible: true
                }
            ];
            //console.log("setLeadPhenotype done.");
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
                if (r['hgvsc'].length>18){
                    r['hgvsc']=r['hgvsc'].substring(18);
                    r['hgvsp']=r['hgvsp'].substring(18);
                    r['hgvsp']=r['hgvsp'].replace("%3D","=");
                }
                //r['phenotype'] = r['phenotype2'];
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
                //console.log("store: "+ state.phenotypes[0].filter);
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
            //console.log("fetchLeadPhenotypeAssocications:"+phenotype.name);
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
