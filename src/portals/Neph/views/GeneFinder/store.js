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
        geneFinder: bioIndex("gene-finder",{query_private:true}),
        //phenotype: bioIndex("phenotypes",{query_private:true}),
    },
    state: {
        newPhenotype: null,
        phenotype: { "name": "T2D", "description": "Type 2 Diabetes" },
        phenotypes_hg38: ['HP-0000009','HP-0000020','HP-0000079','HP-0000095','HP-0000118','HP-0000119','HP-0000152','HP-0000359',
            'HP-0000407','HP-0000478','HP-0000486','HP-0000598','HP-0000707','HP-0000709','HP-0000716','HP-0000717','HP-0000725',
            'HP-0000738','HP-0000769','HP-0000787','HP-0000795','HP-0000818','HP-0000826','HP-0001197','HP-0001388','HP-0001507',
            'HP-0001574','HP-0001608','HP-0001622','HP-0001626','HP-0001679','HP-0001699','HP-0001871','HP-0001877','HP-0001903',
            'HP-0001939','HP-0001945','HP-0002028','HP-0002032','HP-0002086','HP-0002088','HP-0002110','HP-0002186','HP-0002197',
            'HP-0002533','HP-0002589','HP-0002664','HP-0002715','HP-0002836','HP-0003011','HP-0004322','HP-0004386','HP-0005341',
            'HP-0005528','HP-0007018','HP-0008373','HP-0008443','HP-0009826','HP-0011035','HP-0012639','HP-0020110','HP-0025031',
            'HP-0025142','HP-0025354','HP-0031263','HP-0033127','HP-0040064','HP-0040069','HP-0045027','HP-0100021','HP-0100280',
            'HP-0100820','HP-0200134'],
        geneFinderAssociations: {},
        phenotypelist: [],
        secondaryPhenotype: null,
        filterbadges: false
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


    }
});
