import Vue from "vue";
import Vuex from "vuex";

import bioIndex from "@/modules/bioIndex";
import querystring from "querystring";
import {BIO_INDEX_HOST} from "@/utils/bioIndexUtils";


Vue.use(Vuex);
export default new Vuex.Store({
    modules: {
        associations: bioIndex("Associations"),
        topAssociations: bioIndex("TopAssociations"),
        variants: bioIndex("Variants"),
        test: {
            namespaced: true,
            state: {
                data: null,
                format: 'c',
            },
            getters: {
                data(state) {
                    let data = state.data;
                    return state.data;
                },
            },
            mutations: {
                setData(state, data) {
                    state.data = data;
                },
            },
            actions: {
                async query(context, { q }) {
                    let qs = querystring.encode({ q });
                    let json = await fetch(`${BIO_INDEX_HOST}/api/query/${'Associations'}?${qs}`)
                        .then(resp => {
                            if (resp.status !== 200) {
                                throw Error(resp.status.toString());
                            }
                            return resp;
                        })
                        .then(resp => resp.json())
                        .then(json => context.commit('setData', json.data))
                        .catch(console.error);
                },
            },
        },
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
