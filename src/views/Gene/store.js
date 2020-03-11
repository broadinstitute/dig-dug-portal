import Vue from "vue";
import Vuex from "vuex";

import keyParams from "@/utils/keyParams";
import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import ensembl from "@/utils/ensembl";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        genes: bioIndex("Genes"),
        associations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
    },
    state: {
        phenotypeParam: keyParams.phenotype,

        // user-entered locus
        chr: keyParams.chr,
        start: keyParams.start,
        end: keyParams.end,

        // current locus
        phenotype: null,
    },
    mutations: {
        setSelectedPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setPhenotypeByName(state, name) {
            state.phenotype = state.bioPortal.phenotypeMap[name];
        },
        setLocus(state) {
            keyParams.set({
                chr: state.chr,
                start: state.start,
                end: state.end,
            });
        },
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
        },
        region(state) {
            return `${state.chr}:${state.start}-${state.end}`;
        },
    },
    actions: {
        async queryRegion(context) {
            context.commit('setLocus');
            context.commit('setSelectedPhenotype', null);

            // find all the top associations and genes in the region
            context.dispatch('topAssociations/query', { q: context.getters.region });
            context.dispatch('genes/query', { q: context.getters.region });
            context.dispatch('getAssociations');
        },

        // fetches all the associations for the selected phenotype
        async getAssociations(context, phenotype) {
            if (phenotype) {
                let q = `${phenotype.name},${context.getters.region}`;

                // update the url with the new phenotype
                keyParams.set({ phenotype: phenotype.name });
                mdkp.utility.showHideElement("phenotypeSearchHolder");

                // get the associations for this phenotype in the region
                context.commit("setSelectedPhenotype", phenotype);
                context.dispatch('associations/query', { q });
            }
        },
    }
});
