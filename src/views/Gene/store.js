import Vue from "vue";
import Vuex from "vuex";

import keyParams from "@/utils/keyParams";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        genes: bioIndex("Genes"),
        associations: bioIndex("Associations"),
        phewasAssociations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
    },
    state: {
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,
        phenotype: null,

        // user-entered locus
        newChr: keyParams.chr || '',
        newStart: keyParams.start || '',
        newEnd: keyParams.end || '',
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },

        // redirects the page, which re-runs with the new locus
        setLocus(state) {
            keyParams.set({
                chr: state.newChr,
                start: state.newStart,
                end: state.newEnd,
            });
        }
    },
    getters: {
        // The phenotype is a getter because it depends on the bioPortal
        // having loaded all the phenotype objects from the database.
        phenotype(state) {
            for (let i in state.bioPortal.phenotypes) {
                let phenotype = state.bioPortal.phenotypes[i];

                if (phenotype.name === keyParams.phenotype) {
                    return phenotype;
                }
            }

            // not set or not found
            return null;
        }
    },
    actions: {
        onPhenotypeChange(state, phenotype) {
            mdkp.utility.showHideElement("phenotypeSearchHolder");
            state.commit("setSelectedPhenotype", phenotype);
            keyParams.set({ phenotype: phenotype.name });
        }
    }
});
