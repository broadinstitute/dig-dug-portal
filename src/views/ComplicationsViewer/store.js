import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        geneFinder: bioIndex("gene-finder"),
    },
    state: {
        newPhenotype: null,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        geneFinderAssociations: {},
        phenotypelist: [],
        secondaryPhenotype: null,
        filterbadges: false,
        complicationsPhenotype:null
    },
    mutations: {
        setPrimaryPhenotypeData(state, d = {}) {
            let data = d.genefinderData
            let phenotype = d.phenotype
            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist = [phenotype];
        },
        setSecondaryPhenotypeData(state, d = {}) {
            let data = d.genefinderData
            let phenotype = d.phenotype

            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist.push(phenotype);
        },

        setPhenotypeGeneFinderAssociations() {
            state.geneFinderAssociations[phenotype] = data;
            state.phenotypelist.push(phenotype);
        },
        setPhenotype(state, phenotype) {
            state.phenotype = phenotype;
        },
        setFilterBadges(state, filterbadges) {
            state.filterbadges = filterbadges;
        },

        setSecondaryPhenotype(state, secondaryPhenotype) {
            //let secondaryPhenotypeList = []
            state.secondaryPhenotype = secondaryPhenotype
        },
        setPhenotypelist(state, phenotypelist) {
            state.phenotypelist = phenotypelist
        }


    },
    getters: {
        phenotypeGeneFinderData(state) {
            let phenotyped = state.phenotype;
            if (!!state.secondaryPhenotype) {
                phenotyped = state.secondaryPhenotype
            }
            let data = state.geneFinder.data
            let m = {}
            m[phenotyped] = data;
            return m;
        }


    },
    actions: {
        // async queryGeneFinder(context) {
        //     let phenotype = context.state.phenotype
        //     let response = await query(`gene-finder`, phenotype, { limit: 500 }).then(bioIndexData => {
        //         let data = {}
        //         data[phenotype] = bioIndexData
        //         context.commit("setPhenotype", phenotype);
        //         context.commit("setPrimaryPhenotypeData", { phenotype: phenotype, genefinderData: bioIndexData });
        //     })
        // // },
        // async secondaryGeneFinder(context, phenotype) {
        //     await query(`gene-finder`, phenotype, { limit: 500 }).then(bioIndexData => {
        //         let data = {}
        //         data[phenotype] = bioIndexData
        //         context.commit("setSecondaryPhenotype", phenotype);
        //         context.commit("setSecondaryPhenotypeData", { phenotype, genefinderData: bioIndexData });
        //     })
        // },

    }
});
