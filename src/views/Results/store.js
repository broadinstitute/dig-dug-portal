import Vue from "vue";
import Vuex from "vuex";
import bioIndex from "@/modules/bioIndex";
Vue.use(Vuex);

const indexes = [
    "genes",
    "associations",
    "variants",
    "regions",
];

export default new Vuex.Store({
    modules: {
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
