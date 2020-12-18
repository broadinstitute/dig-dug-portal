import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";
import ldServer from "@/modules/ldServer";
import keyParams from "@/utils/keyParams";
import { query } from "@/utils/bioIndexUtils";
import { uniqBy } from "lodash";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        ldServer,
        gene: bioIndex("gene"),
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        geneAssociations52k: bioIndex("gene-associations-52k"),
    },
    state: {
        associationsData: {},
        variants: []

    },
    mutations: {
        setAssociationsData(state, associationsData) {
            state.associationsData = associationsData
        },
    },
    getters: {

    },
    actions: {
        async getEGLData(context, phen) {
            let dataset = "mccarthy";
            let trait = phen.toLowerCase();
            context.dispatch("kp4cd/getEglData", { dataset, trait });
        },

        async get52KAssociationData(context, gene) {
            context.dispatch('geneAssociations52k/query', { q: gene });
        }





    }
});
