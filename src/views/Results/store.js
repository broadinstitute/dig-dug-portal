import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import kp4cd from "@/modules/kp4cd";
import bioIndex from "@/modules/bioIndex";

import { BIOINDEX_SCHEMA } from "./utils/resultsUtils"

Vue.use(Vuex);

const indexes = BIOINDEX_SCHEMA.data.map(schema => schema.index);

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,
        genes: bioIndex("genes"),
        associations: bioIndex("associations"),
        variants: bioIndex("variants"),
        regions: bioIndex("regions"),
    },
    state: {
        queries: [],
        indexes,
    },
    mutations: {

    },
    getters: {

    },
    actions: {

    },
});
