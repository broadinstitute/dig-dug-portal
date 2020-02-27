import Vue from "vue";
import Vuex from "vuex";
import vsm from "vue-state-machine";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";

Vue.use(Vuex);

const extend = ({
    actions: {
        async SETUP(context) {
            context.commit("setAbort", false);
            context.commit("setLoading", true);
        },
        async START(context, payloadQuery) {
            context.dispatch("count", payloadQuery);
            context.dispatch("query", payloadQuery);
        },
        async ABORT(context) {
            context.commit('setAbort', true);
            context.commit("setLoading", false);
        },
        async CANCEL(context) {
            // using the dispatch for code reuse, but:
            // only case where I would want to force an await since
            await context.dispatch("ABORT");
            context.commit('clearTIterableQuery');
        },
        async PAUSE(context) {
            context.commit('setLoading', false)
        },
        async CONTINUE(context, payloadQuery) {
            context.commit('setLoading', true);
            context.dispatch('query', payloadQuery);
        },
        async RESTART(context, payloadQuery) {
            context.commit('clearData');
            context.dispatch('START', payloadQuery);
        },
    },
});

export default new Vuex.Store({
    modules: {
        associations: bioIndex("Associations", extend),
        topAssociations: bioIndex("TopAssociations", extend),
        variants: bioIndex("Variants", extend)
    },
    state: {},
    mutations: {},
    actions: {}
});
