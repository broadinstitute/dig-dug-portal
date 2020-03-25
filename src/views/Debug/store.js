import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";
import {BIO_INDEX_HOST} from "@/utils/bioIndexUtils";


Vue.use(Vuex);
export default new Vuex.Store({
    modules: {
        phenotypeAssociations: bioIndex("phenotypeAssociations"),
        associations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
        variants: bioIndex("Variants"),
    },
    state: {
        chrom: 8,
        start: 117962623,
        end: 117962723,
    },
    getters: {

    },
    mutations: {},
    actions: {}
});
