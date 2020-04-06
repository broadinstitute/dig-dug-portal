import Vue from "vue";
import Vuex from "vuex";

import bioPortal from "@/modules/bioPortal";
import bioIndex from "@/modules/bioIndex";
import kp4cd from "@/modules/kp4cd";
import keyParams from "@/utils/keyParams";

Vue.use(Vuex);

// default to no registered phenotype modules
let phenotypeVariants = {};

// if there is a parameter, register modules
if (!!keyParams.phenotype) {
    keyParams.phenotype.split(',').forEach(p => {
        phenotypeVariants[`__assocs__${p}`] = bioIndex('phenotype-associations');
    });
}

export default new Vuex.Store({
    modules: {
        bioPortal,
        kp4cd,

        // for every phenotype at start, register a module for it
        ...phenotypeVariants,
    },
    state: {
    },
    mutations: {
    },
    actions: {
        loadAssociations(context) {
            let phenotypeModules = Object.keys(context.state).filter(m => m.startsWith('__assocs__'));

            // dispatch the query for each
            phenotypeModules.forEach(m => {
                context.dispatch(`${m}/query`, { q: m.substr(10), limit: 2500 });
            });
        }
    },
    getters: {
        associations(state) {
            let phenotypeModules = Object.keys(state).filter(m => m.startsWith('__assocs__'));
            let assocs = {};

            phenotypeModules.forEach(m => {
                assocs[m.substr(10)] = state[m].data
            });

            return assocs;
        },
    }
});
