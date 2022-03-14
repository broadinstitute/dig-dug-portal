import Vue from "vue";
import Vuex from "vuex";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(Vuex);

export default new Vuex.Store({
    modules: {
    },
    state: {
        pkgData: {},
        pkgDataSelected: [],
    },
    mutations: {
        setPkgData(state, data) {
            state.pkgData = data;
        },
        setPkgDataSelected(state, data) {
            if (data.action == "add") {
                var tempObject = { type: null, id: null };
                tempObject.type = data.type;
                tempObject.id = data.id;
                state.pkgDataSelected.push(tempObject);
            }

            if (data.action == "remove") {
                let tempArray = [];
                state.pkgDataSelected.map(p => {
                    if (p.type != data.type || p.id != data.id) {
                        tempArray.push(p);
                    }
                })
                state.pkgDataSelected = tempArray;
            }
        },
    },
    getters: {},
    actions: {
        pkgData(context, pkgData) {
            context.commit("setPkgData", pkgData);
        },
        pkgDataSelected(context, data) {
            context.commit("setPkgDataSelected", data);
        },
    }
});
